/**
 * Disable 2FA Use Case for User
 * 
 * Disables 2FA for a user after password verification.
 */

import { UserRepository } from '../../domain/UserRepository';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface Disable2FADeps {
    userRepository: UserRepository;
}

export interface Disable2FAInput {
    userId: string;
    password: string;
}

export interface Disable2FAResult {
    success: boolean;
    message: string;
}

export type Disable2FA = (input: Disable2FAInput) => Promise<Disable2FAResult>;

export const makeDisable2FA = ({ userRepository }: Disable2FADeps): Disable2FA => {
    return async (input) => {
        if (!input.password) {
            throw new ValidationError('Password is required to disable 2FA');
        }

        const user = await userRepository.findById(input.userId);
        if (!user) {
            throw new AuthError('User not found');
        }

        if (!user.twoFactorEnabled) {
            throw new AuthError('2FA is not enabled');
        }

        // Verify password
        const isPasswordValid = await PasswordService.compare(input.password, user.password);
        if (!isPasswordValid) {
            await sendLog({
                type: 'warning',
                message: `2FA disable attempt failed (wrong password) for user: ${user.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid password');
        }

        // Disable 2FA and clear secrets
        await userRepository.update(user.id, {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            backupCodes: [],
        });

        await sendLog({
            type: 'info',
            message: `2FA disabled for user: ${user.email}`,
            source: 'auth-service',
        });

        return {
            success: true,
            message: '2FA has been disabled',
        };
    };
};
