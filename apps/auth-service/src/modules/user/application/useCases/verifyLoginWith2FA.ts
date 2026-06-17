/**
 * Verify 2FA During Login Use Case for User
 *
 * Verifies the TOTP code during login and completes authentication.
 * Falls back to backup code verification if TOTP fails.
 */

import { Response } from 'express';
import { UserRepository } from '../../domain/UserRepository';
import { TokenService } from '../../../_shared/services/TokenService';
import { TOTPService } from '../../../_shared/services/TOTPService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface VerifyLoginWith2FADeps {
    userRepository: UserRepository;
}

export interface VerifyLoginWith2FAInput {
    userId: string;
    totpCode: string;
}

export interface VerifyLoginWith2FAResult {
    message: string;
    user: { id: string; name: string; email: string };
}

export type VerifyLoginWith2FA = (
    input: VerifyLoginWith2FAInput,
    res: Response
) => Promise<VerifyLoginWith2FAResult>;

export const makeVerifyLoginWith2FA = ({ userRepository }: VerifyLoginWith2FADeps): VerifyLoginWith2FA => {
    return async (input, res) => {
        // Accept 6-digit TOTP codes or 9-char backup codes (format: XXXX-XXXX)
        const isValidFormat = /^\d{6}$/.test(input.totpCode) || /^[A-F0-9]{4}-[A-F0-9]{4}$/i.test(input.totpCode);
        if (!input.totpCode || !isValidFormat) {
            throw new ValidationError('Invalid code format. Enter your 6-digit TOTP or backup code.');
        }

        const user = await userRepository.findById(input.userId);
        if (!user) {
            throw new AuthError('User not found');
        }

        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new AuthError('2FA is not enabled for this account');
        }

        // Step 1: Verify the TOTP code
        let isValid = TOTPService.verifyTOTP(user.twoFactorSecret, input.totpCode);
        let isBackupCode = false;

        // Step 2: Fallback — verify backup code if TOTP fails
        if (!isValid) {
            const storedBackupCodes = user.backupCodes ?? [];
            const backupCodeIndex = TOTPService.verifyBackupCode(input.totpCode, storedBackupCodes);

            if (backupCodeIndex !== -1) {
                isValid = true;
                isBackupCode = true;
                // Consume the backup code — one-time use only
                const remainingCodes = storedBackupCodes.filter((_, i) => i !== backupCodeIndex);
                await userRepository.update(user.id, { backupCodes: remainingCodes });

                await sendLog({
                    type: 'warning',
                    message: `User logged in with backup code: ${user.email}. ${remainingCodes.length} backup codes remaining.`,
                    source: 'auth-service',
                });
            }
        }

        if (!isValid) {
            await sendLog({
                type: 'warning',
                message: `2FA login verification failed for user: ${user.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid TOTP code or backup code. Please try again.');
        }

        // Clear seller cookies
        TokenService.clearSellerCookies(res);

        // Generate tokens and set cookies
        const tokens = TokenService.generateTokenPair(user.id, 'user');
        TokenService.setUserCookies(res, tokens);

        await sendLog({
            type: 'success',
            message: `User logged in successfully with ${isBackupCode ? 'backup code' : '2FA'}: ${user.email}`,
            source: 'auth-service',
        });

        return {
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email },
        };
    };
};
