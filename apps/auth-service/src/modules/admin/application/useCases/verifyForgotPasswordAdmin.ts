/**
 * Verify Forgot Password Admin Use Case
 * 
 * Verifies OTP for admin password reset flow.
 */

import { OtpService } from '../../../_shared/services/OtpService';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';

export interface VerifyForgotPasswordAdminInput {
    email: string;
    otp: string;
}

export type VerifyForgotPasswordAdmin = (input: VerifyForgotPasswordAdminInput) => Promise<{ message: string }>;

export const makeVerifyForgotPasswordAdmin = (): VerifyForgotPasswordAdmin => {
    return async (input: VerifyForgotPasswordAdminInput) => {
        // 1. Validate input
        if (!input.email?.trim() || !input.otp?.trim()) {
            throw new ValidationError('Email and OTP are required');
        }

        // 2. Verify OTP
        await OtpService.verify(input.email, input.otp);

        return { message: 'OTP verified successfully. You can now reset your password.' };
    };
};
