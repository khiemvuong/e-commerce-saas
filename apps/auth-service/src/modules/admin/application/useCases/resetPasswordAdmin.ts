/**
 * Reset Password Admin Use Case
 * 
 * Handles admin password reset after OTP verification.
 */

import prisma from '@packages/libs/prisma';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { ValidationError, AuthError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface ResetPasswordAdminInput {
    email: string;
    otp: string;
    newPassword: string;
}

export type ResetPasswordAdmin = (input: ResetPasswordAdminInput) => Promise<{ message: string }>;

export const makeResetPasswordAdmin = (): ResetPasswordAdmin => {
    return async (input: ResetPasswordAdminInput) => {
        // 1. Validate input
        if (!input.email?.trim()) {
            throw new ValidationError('Email is required');
        }
        if (!input.newPassword?.trim()) {
            throw new ValidationError('New password is required');
        }
        if (input.newPassword.length < 6) {
            throw new ValidationError('Password must be at least 6 characters long');
        }

        // 2. Find admin
        const admin = await prisma.users.findUnique({
            where: { email: input.email.trim().toLowerCase() }
        });

        if (!admin) {
            throw new ValidationError("Admin doesn't exist!");
        }

        // 3. Verify this is an admin account
        if (admin.role !== 'admin') {
            throw new AuthError("This email is not associated with an admin account");
        }

        // 4. Check if new password is same as old
        const isSamePassword = await PasswordService.compare(input.newPassword, admin.password!);
        if (isSamePassword) {
            throw new ValidationError('New password must be different from the old password');
        }

        // 5. Hash new password
        const hashedPassword = await PasswordService.hash(input.newPassword);

        // 6. Update password
        await prisma.users.update({
            where: { id: admin.id },
            data: { password: hashedPassword }
        });

        // 7. Log success
        await sendLog({
            type: 'success',
            message: `Password reset successfully for admin: ${input.email}`,
            source: 'auth-service',
        });

        return { message: 'Password reset successfully' };
    };
};
