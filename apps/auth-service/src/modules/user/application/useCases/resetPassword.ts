/**
 * Reset Password Use Case
 * 
 * Handles password reset after OTP verification.
 */

import { User } from '../../domain/User';
import { UserRepository } from '../../domain/UserRepository';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface ResetPasswordDeps {
    userRepository: UserRepository;
}

export type ResetPassword = (input: User.ResetPasswordInput) => Promise<{ message: string }>;

export const makeResetPassword = ({ userRepository }: ResetPasswordDeps): ResetPassword => {
    return async (input: User.ResetPasswordInput) => {
        // 1. Validate input
        User.validateResetPassword(input);

        // 2. Find user
        const user = await userRepository.findByEmail(input.email);
        if (!user) {
            throw new ValidationError("User doesn't exists!");
        }

        // 3. Check if new password is same as old
        const isSamePassword = await PasswordService.compare(input.newPassword, user.password);
        if (isSamePassword) {
            throw new ValidationError('New password must be different from the old password');
        }

        // 4. Hash new password
        const hashedPassword = await PasswordService.hash(input.newPassword);

        // 5. Update password
        await userRepository.update(user.id, { password: hashedPassword });

        // 6. Log success
        await sendLog({
            type: 'success',
            message: `Password reset successfully for user: ${input.email}`,
            source: 'auth-service',
        });

        return { message: 'Password reset successfully' };
    };
};
