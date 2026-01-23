/**
 * Verify Forgot Password Use Case
 * 
 * Verifies OTP for password reset flow.
 */

import { OtpService } from '../../../_shared/services/OtpService';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';

export interface VerifyForgotPasswordInput {
    email: string;
    otp: string;
}

export type VerifyForgotPassword = (input: VerifyForgotPasswordInput) => Promise<{ message: string }>;

export const makeVerifyForgotPassword = (): VerifyForgotPassword => {
    return async (input: VerifyForgotPasswordInput) => {
        // 1. Validate input
        if (!input.email?.trim() || !input.otp?.trim()) {
            throw new ValidationError('Email and OTP are required');
        }

        // 2. Verify OTP
        await OtpService.verify(input.email, input.otp);

        return { message: 'OTP verified successfully. You can now reset your password.' };
    };
};
