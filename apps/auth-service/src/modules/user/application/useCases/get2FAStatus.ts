/**
 * Get 2FA Status Use Case for User
 * 
 * Returns the current 2FA status for a user.
 */

import { UserRepository } from '../../domain/UserRepository';
import { AuthError } from '../../../../_lib/errors/AuthErrors';

export interface Get2FAStatusDeps {
    userRepository: UserRepository;
}

export interface Get2FAStatusInput {
    userId: string;
}

export interface Get2FAStatusResult {
    enabled: boolean;
    hasBackupCodes: boolean;
}

export type Get2FAStatus = (input: Get2FAStatusInput) => Promise<Get2FAStatusResult>;

export const makeGet2FAStatus = ({ userRepository }: Get2FAStatusDeps): Get2FAStatus => {
    return async (input) => {
        const user = await userRepository.findById(input.userId);
        if (!user) {
            throw new AuthError('User not found');
        }

        return {
            enabled: user.twoFactorEnabled ?? false,
            hasBackupCodes: (user.backupCodes?.length ?? 0) > 0,
        };
    };
};
