/**
 * Verify and Activate 2FA Use Case for User
 * 
 * Verifies the TOTP code from authenticator app and activates 2FA.
 */

import { UserRepository } from '../../domain/UserRepository';
import { TOTPService } from '../../../_shared/services/TOTPService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface Verify2FADeps {
    userRepository: UserRepository;
}

export interface Verify2FAInput {
    userId: string;
    totpCode: string;
}

export interface Verify2FAResult {
    success: boolean;
    message: string;
}

export type Verify2FA = (input: Verify2FAInput) => Promise<Verify2FAResult>;

export const makeVerify2FA = ({ userRepository }: Verify2FADeps): Verify2FA => {
    return async (input) => {
        if (!input.totpCode || input.totpCode.length !== 6) {
            throw new ValidationError('Invalid TOTP code format');
        }

        const user = await userRepository.findById(input.userId);
        if (!user) {
            throw new AuthError('User not found');
        }

        if (!user.twoFactorSecret) {
            throw new AuthError('2FA setup not initiated. Please enable 2FA first.');
        }

        if (user.twoFactorEnabled) {
            throw new AuthError('2FA is already active');
        }

        // Verify the TOTP code
        const isValid = TOTPService.verifyTOTP(user.twoFactorSecret, input.totpCode);
        
        if (!isValid) {
            await sendLog({
                type: 'warning',
                message: `2FA verification failed for user: ${user.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid TOTP code. Please try again.');
        }

        // Activate 2FA
        await userRepository.update(user.id, {
            twoFactorEnabled: true,
        });

        await sendLog({
            type: 'success',
            message: `2FA activated for user: ${user.email}`,
            source: 'auth-service',
        });

        return {
            success: true,
            message: '2FA has been successfully activated',
        };
    };
};
