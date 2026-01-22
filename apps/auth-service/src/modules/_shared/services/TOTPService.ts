/**
 * TOTP (Time-based One-Time Password) Service
 * 
 * Handles 2FA authentication using TOTP algorithm.
 * Compatible with Google Authenticator, Authy, etc.
 */

import crypto from 'crypto';

// TOTP Configuration
const TOTP_CONFIG = {
    DIGITS: 6,
    STEP: 30, // Time step in seconds
    WINDOW: 1, // Allow 1 step before/after for clock drift
    ALGORITHM: 'sha1' as const,
};

/**
 * Generate a random secret key for TOTP
 * Returns base32 encoded secret
 */
export const generateSecret = (length = 20): string => {
    const buffer = crypto.randomBytes(length);
    return base32Encode(buffer);
};

/**
 * Base32 encoding (RFC 4648)
 */
const base32Encode = (buffer: Buffer): string => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;

        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31];
    }

    return output;
};

/**
 * Base32 decoding
 */
const base32Decode = (encoded: string): Buffer => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const cleanInput = encoded.toUpperCase().replace(/=+$/, '');
    
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (const char of cleanInput) {
        const index = alphabet.indexOf(char);
        if (index === -1) continue;

        value = (value << 5) | index;
        bits += 5;

        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }

    return Buffer.from(output);
};

/**
 * Generate HMAC-based OTP
 */
const generateHOTP = (secret: string, counter: bigint): string => {
    const secretBuffer = base32Decode(secret);
    
    // Convert counter to 8-byte buffer (big-endian)
    const counterBuffer = Buffer.alloc(8);
    for (let i = 7; i >= 0; i--) {
        counterBuffer[i] = Number(counter & 0xffn);
        counter >>= 8n;
    }

    // Generate HMAC
    const hmac = crypto.createHmac(TOTP_CONFIG.ALGORITHM, secretBuffer);
    hmac.update(counterBuffer);
    const hash = hmac.digest();

    // Dynamic truncation
    const offset = hash[hash.length - 1] & 0x0f;
    const binary =
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

    // Generate OTP
    const otp = binary % Math.pow(10, TOTP_CONFIG.DIGITS);
    return otp.toString().padStart(TOTP_CONFIG.DIGITS, '0');
};

/**
 * Generate current TOTP code
 */
export const generateTOTP = (secret: string, timestamp?: number): string => {
    const time = timestamp ?? Math.floor(Date.now() / 1000);
    const counter = BigInt(Math.floor(time / TOTP_CONFIG.STEP));
    return generateHOTP(secret, counter);
};

/**
 * Verify TOTP code with time window tolerance
 */
export const verifyTOTP = (secret: string, token: string, timestamp?: number): boolean => {
    const time = timestamp ?? Math.floor(Date.now() / 1000);
    const counter = Math.floor(time / TOTP_CONFIG.STEP);

    // Check current time step and window before/after
    for (let i = -TOTP_CONFIG.WINDOW; i <= TOTP_CONFIG.WINDOW; i++) {
        const expectedToken = generateHOTP(secret, BigInt(counter + i));
        if (timingSafeEqual(token, expectedToken)) {
            return true;
        }
    }

    return false;
};

/**
 * Timing-safe string comparison to prevent timing attacks
 */
const timingSafeEqual = (a: string, b: string): boolean => {
    if (a.length !== b.length) return false;
    
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    
    return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Generate otpauth:// URI for QR code
 * This URI can be displayed as QR code for authenticator apps
 */
export const generateOtpAuthUri = (
    secret: string,
    accountName: string,
    issuer = 'ILAN Shop'
): string => {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);
    
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_CONFIG.DIGITS}&period=${TOTP_CONFIG.STEP}`;
};

/**
 * Generate backup codes for 2FA recovery
 */
export const generateBackupCodes = (count = 10): string[] => {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
        // Generate 8-character alphanumeric code
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }
    
    return codes;
};

/**
 * Hash backup codes for secure storage
 */
export const hashBackupCode = (code: string): string => {
    return crypto.createHash('sha256').update(code.replace('-', '')).digest('hex');
};

/**
 * Verify backup code against stored hashes
 */
export const verifyBackupCode = (code: string, hashedCodes: string[]): number => {
    const hashedInput = hashBackupCode(code);
    return hashedCodes.findIndex(hashed => hashed === hashedInput);
};

// Export as TOTPService object
export const TOTPService = {
    generateSecret,
    generateTOTP,
    verifyTOTP,
    generateOtpAuthUri,
    generateBackupCodes,
    hashBackupCode,
    verifyBackupCode,
};
