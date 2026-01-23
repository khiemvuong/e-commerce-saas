/**
 * OTP Service
 * 
 * Handles OTP generation, sending, verification, and rate limiting.
 */

import crypto from 'crypto';
import redis from '@packages/libs/redis';
import { sendEmail } from '../../../utils/sendMail';
import { OtpError, OtpRateLimitError, AccountLockedError } from '../../../_lib/errors/AuthErrors';

// OTP Configuration
const OTP_CONFIG = {
    EXPIRY_SECONDS: 300,        // 5 minutes
    COOLDOWN_SECONDS: 60,       // 1 minute between requests
    MAX_REQUESTS_PER_HOUR: 5,   // Max OTP requests per hour
    MAX_FAILED_ATTEMPTS: 5,     // Max failed verification attempts
    LOCK_DURATION_SECONDS: 1800, // 30 min lock after max failures
    SPAM_LOCK_SECONDS: 300,     // 5 min lock for spam
};

// Redis key prefixes
const REDIS_KEYS = {
    otp: (email: string) => `otp:${email}`,
    otpCooldown: (email: string) => `otp_cooldown:${email}`,
    otpRequests: (email: string) => `otp_requests:${email}`,
    otpAttempts: (email: string) => `otp_attempts:${email}`,
    otpLock: (email: string) => `otp_lock:${email}`,
    otpSpamLock: (email: string) => `otp_spam_lock:${email}`,
};

/**
 * Check if user is restricted from requesting OTP
 */
export const checkOtpRestrictions = async (email: string): Promise<void> => {
    // Check account lock
    if (await redis.get(REDIS_KEYS.otpLock(email))) {
        throw new AccountLockedError(
            'Account locked due to multiple failed attempts! Try again after 30 minutes.',
            30
        );
    }

    // Check spam lock
    if (await redis.get(REDIS_KEYS.otpSpamLock(email))) {
        throw new OtpRateLimitError('Too many OTP requests! Try again after 5 minutes.', 5);
    }

    // Check cooldown
    if (await redis.get(REDIS_KEYS.otpCooldown(email))) {
        throw new OtpRateLimitError('OTP recently sent! Please wait 1 minute before requesting again.', 1);
    }
};

/**
 * Track OTP requests and apply rate limiting
 */
export const trackOtpRequest = async (email: string): Promise<void> => {
    const spamLockKey = REDIS_KEYS.otpSpamLock(email);
    const requestsKey = REDIS_KEYS.otpRequests(email);

    // Check if spam locked
    if (await redis.get(spamLockKey)) {
        throw new OtpRateLimitError('Too many OTP requests! Try again after 5 minutes.', 5);
    }

    // Get current request count
    const requestCount = parseInt((await redis.get(requestsKey)) || '0');

    if (requestCount >= OTP_CONFIG.MAX_REQUESTS_PER_HOUR) {
        await redis.set(spamLockKey, 'true', { ex: OTP_CONFIG.SPAM_LOCK_SECONDS });
        throw new OtpRateLimitError('Too many OTP requests! Try again after 5 minutes.', 5);
    }

    // Increment request count
    await redis.set(requestsKey, (requestCount + 1).toString(), { ex: 3600 });
};

/**
 * Generate and send OTP via email
 */
export const sendOtp = async (
    name: string,
    email: string,
    template: string
): Promise<void> => {
    // Generate 4-digit OTP
    const otp = crypto.randomInt(1000, 9999).toString();

    // Send email
    await sendEmail(email, 'Verify Your Email', template, { name, otp });

    // Store OTP in Redis
    await redis.set(REDIS_KEYS.otp(email), otp, { ex: OTP_CONFIG.EXPIRY_SECONDS });

    // Set cooldown
    await redis.set(REDIS_KEYS.otpCooldown(email), 'true', { ex: OTP_CONFIG.COOLDOWN_SECONDS });
};

/**
 * Verify OTP
 */
export const verifyOtp = async (email: string, providedOtp: string): Promise<void> => {
    const storedOtpRaw = await redis.get(REDIS_KEYS.otp(email));
    const storedOtp = (storedOtpRaw ?? '').toString().trim();
    const normalizedOtp = String(providedOtp).trim();

    if (!storedOtp) {
        throw new OtpError('Invalid or expired OTP');
    }

    const failedAttemptsKey = REDIS_KEYS.otpAttempts(email);
    const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || '0');

    if (storedOtp !== normalizedOtp) {
        // Check if max attempts reached
        if (failedAttempts >= OTP_CONFIG.MAX_FAILED_ATTEMPTS) {
            await redis.set(REDIS_KEYS.otpLock(email), 'true', { ex: OTP_CONFIG.LOCK_DURATION_SECONDS });
            await redis.del(REDIS_KEYS.otp(email), failedAttemptsKey);
            throw new AccountLockedError(
                'Account locked due to multiple failed attempts! Try again after 30 minutes.',
                30
            );
        }

        // Increment failed attempts
        await redis.set(failedAttemptsKey, (failedAttempts + 1).toString(), { ex: OTP_CONFIG.EXPIRY_SECONDS });
        
        const attemptsLeft = OTP_CONFIG.MAX_FAILED_ATTEMPTS - failedAttempts - 1;
        throw new OtpError(`Incorrect OTP. ${attemptsLeft} attempts left.`, attemptsLeft);
    }

    // OTP verified - clear all related keys
    await redis.del(REDIS_KEYS.otp(email), failedAttemptsKey);
};

// Export all functions as OtpService object for convenience
export const OtpService = {
    checkRestrictions: checkOtpRestrictions,
    trackRequest: trackOtpRequest,
    send: sendOtp,
    verify: verifyOtp,
};
