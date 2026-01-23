/**
 * Forgot Password Admin Use Case
 * 
 * Handles sending OTP for admin password reset.
 */

import prisma from '@packages/libs/prisma';
import { OtpService } from '../../../_shared/services/OtpService';
import { ValidationError, AuthError } from '../../../../_lib/errors/AuthErrors';

export interface ForgotPasswordAdminInput {
    email: string;
}

export type ForgotPasswordAdmin = (input: ForgotPasswordAdminInput) => Promise<{ message: string }>;

export const makeForgotPasswordAdmin = (): ForgotPasswordAdmin => {
    return async (input: ForgotPasswordAdminInput) => {
        // 1. Validate input
        if (!input.email?.trim()) {
            throw new ValidationError('Email is required');
        }

        // 2. Find admin user
        const admin = await prisma.users.findUnique({
            where: { email: input.email.trim().toLowerCase() }
        });

        if (!admin) {
            throw new ValidationError("Admin not found with this email");
        }

        // 3. Verify this is an admin account
        if (admin.role !== 'admin') {
            throw new AuthError("This email is not associated with an admin account");
        }

        // 4. Check OTP restrictions
        await OtpService.checkRestrictions(input.email);

        // 5. Track OTP request
        await OtpService.trackRequest(input.email);

        // 6. Send OTP with admin template
        await OtpService.send(admin.name, input.email, 'forgot-password-admin-mail');

        return { message: 'OTP sent to email. Please check your email.' };
    };
};
