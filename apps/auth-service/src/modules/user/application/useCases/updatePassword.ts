/**
 * Update Password Use Case
 * 
 * Handles password change for logged-in user.
 */

import { User } from '../../domain/User';
import { UserRepository } from '../../domain/UserRepository';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';

export interface UpdatePasswordDeps {
    userRepository: UserRepository;
}

export interface UpdatePasswordInput extends User.UpdatePasswordInput {
    userId: string;
}

export type UpdatePassword = (input: UpdatePasswordInput) => Promise<{ success: true; message: string }>;

export const makeUpdatePassword = ({ userRepository }: UpdatePasswordDeps): UpdatePassword => {
    return async (input: UpdatePasswordInput) => {
        // 1. Validate input
        User.validateUpdatePassword(input);

        // 2. Find user
        const user = await userRepository.findById(input.userId);
        if (!user || !user.password) {
            throw new AuthError('User not found or password not set');
        }

        // 3. Verify current password
        const isPasswordCorrect = await PasswordService.compare(input.currentPassword, user.password);
        if (!isPasswordCorrect) {
            throw new ValidationError('Current password is incorrect');
        }

        // 4. Hash new password
        const hashedNewPassword = await PasswordService.hash(input.newPassword);

        // 5. Update password
        await userRepository.update(input.userId, { password: hashedNewPassword });

        return { success: true, message: 'Password updated successfully' };
    };
};
