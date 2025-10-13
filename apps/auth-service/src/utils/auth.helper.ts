import crypto from 'crypto';
import redis from '../../../../packages/libs/redis';

import { ValidationError } from '../../../../packages/error-handler';
import { sendEmail } from './sendMail';
import { NextFunction } from 'express';
import prisma from '@packages/libs/prisma';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (data: any, userType: "user" | "seller") => {
    const { name, email, password, phone_number, country } = data;

    if(!name || !email || !password ||(userType === "seller" && (!phone_number || !country))
){
        throw new ValidationError("Missing required fields for registration");
    }

    if(!emailRegex.test(email)){
        throw new ValidationError("Invalid email format");
    }
};
export const checkOtpRestrictions = async (email: string, next: NextFunction) => {
    if(await redis.get(`otp_lock:${email}`)){
        return next(
            new ValidationError(
                "Account locked due to multiple failed attempts! Try again after 30 minutes."
            )
        );
    }
    if(await redis.get(`otp_spam_lock:${email}`)){
        return next(
            new ValidationError(
                "Too many OTP requests! Try again after 60 minutes."
            )
        );
    }
    if(await redis.get(`otp_cooldown:${email}`)){
        return next(
            new ValidationError(
                "Please wait 1 minutes before requesting a new OTP"
            )
        );
    }
}

export const trackOtpRequest = async (email: string, next: NextFunction) => {
const otpRequestKey = `otp_requests:${email}`;
const spamLockKey = `otp_spam_lock:${email}`;

  // Nếu đang bị khóa spam
if (await redis.get(spamLockKey)) {
    return next(new ValidationError("Too many OTP requests! Try again after 5 minutes."));
}

let otpRequests = parseInt((await redis.get(otpRequestKey)) || '0');

  if (otpRequests >= 5) {  // ví dụ: max 5 lần / 60 phút
    await redis.set(spamLockKey, 'true', { ex: 300 }); // khóa 60 phút
    return next(new ValidationError("Too many OTP requests! Try again after 5 minutes."));
}

  await redis.set(otpRequestKey, (otpRequests + 1).toString(), { ex: 3600 }); // reset count sau 60 phút
};

export const sendOtp = async (name: string, email:string, template: string) => {
    const otp = crypto.randomInt(1000, 9999).toString();
    // Simulate sending OTP via email
    await sendEmail(email,"Verify Your Email", template ,{name, otp})
    await redis.set(`otp:${email}`, otp, {ex:300}); // OTP valid for 5 minutes
    await redis.set(`otp_cooldown:${email}`, 'true', {ex:60}); // Cooldown of 1 minute

}

export const verifyOtp = async (email: string, otp: string, next: NextFunction) => {
const storedOtpRaw = await redis.get(`otp:${email}`);
    // ép chắc chắn về string, loại null
const storedOtp = (storedOtpRaw ?? "").toString().trim();
// ép OTP nhận từ client cũng về string
const providedOtp = String(otp).trim();
    if (!storedOtp) {
        throw new ValidationError("Invalid or expired OTP");
    }
    const failedAttemptsKey = `otp_attempts:${email}`;
    const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || '0');
    if (storedOtp !== providedOtp) {
        if (failedAttempts >= 5) {
            await redis.set(`otp_lock:${email}`, 'true', { ex: 1800 });
            await redis.del(`otp:${email}`, failedAttemptsKey);
            throw new ValidationError("Account locked due to multiple failed attempts! Try again after 30 minutes."
            );
            
        }
        await redis.set(failedAttemptsKey, failedAttempts + 1, { ex: 300 });

        throw new ValidationError(`Incorrect OTP. ${5 - failedAttempts} attempts left. Please try again.`);
    }
    await redis.del(`otp:${email}`, failedAttemptsKey);
};

export const handleForgotPassword = async (req: any, res: any, next: NextFunction, userType: "user" | "seller") => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new ValidationError("Email is required");
        }
        // Find user/seller in DB
        const user = userType === "user" ? (await prisma.users.findUnique({ where: { email } })) : (await prisma.sellers.findUnique({ where: { email } }));
        if (!user) {
            throw new ValidationError(`${userType} not found with this email`);
        }

        //Check otp request restrictions
        await checkOtpRestrictions(email, next);

        //Track otp request
        await trackOtpRequest(email, next);

        //Generate and send otp
        await sendOtp(user.name, email, userType ==="user" ? `forgot-password-user-mail` : `forgot-password-seller-mail`);

        res.status(200).json({
            message: "OTP sent to email. Please check your email."
        });
    } catch (error) {
        next(error);
    }
}

export const verifyForgotPasswordOtp = async (req: any, res: any, next: NextFunction) => {
    try {
        const {email,otp} = req.body;
        if(!email || !otp){
            throw new ValidationError("Email and OTP are required");
        }
        await verifyOtp(email, otp, next);
        res.status(200).json({
            message: "OTP verified successfully. You can now reset your password."
        });
    } catch (error) {
        next(error);
        
    }
}