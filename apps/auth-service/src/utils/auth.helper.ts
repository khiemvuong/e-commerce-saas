import crypto from 'crypto';
import redis from '../../../../packages/libs/redis';

import { ValidationError } from '../../../../packages/error-handler';
import { sendEmail } from './sendMail';
import { NextFunction } from 'express';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (data: any, userType: "user" | "seller") => {
    const { name, email, password, phone_number, country } = data;

    if(!name || !email || !password ||(userType === "seller" && !phone_number || !country)){
        throw new ValidationError("Missing required fields for registration");
    }

    if(!emailRegex.test(email)){
        throw new ValidationError("Invalid email format");
    }
};
export const checkOtpRestrictions = async (email: string, next: NextFunction) => {
    if(await redis.get('otp_lock:${email}')){
        return next(
            new ValidationError(
                "Account locked due to multiple failed attempts! Try again after 30 minutes."
            )
        );
    }
    if(await redis.get('otp_spam_lock:${email}')){
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
    const otpRequestKey = 'otp_requests:${email}';
    let otpRequests = parseInt(await redis.get(otpRequestKey) || '0');

    if(otpRequests >=2){
        await redis.set('otp_spam_lock:${email}', 'true', 'EX', 3600); // 60 minutes
        return next(
            new ValidationError(
                "Too many OTP requests! Try again after 60 minutes."
            )
        );
    }

    await redis.set(otpRequestKey, (otpRequests + 1).toString(), 'EX', 3600); // Reset count after 60 minutes
}

export const sendOtp = async (name: string, email:string, template: string) => {
    const otp = crypto.randomInt(1000, 9999).toString();
    // Simulate sending OTP via email
    await sendEmail(email,"Verify Your Email", template ,{name, otp})
    await redis.set(`otp:${email}`, otp, 'EX', 300); // OTP valid for 5 minutes
    await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60); // Cooldown of 1 minute

}

