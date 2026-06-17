/**
 * Verify 2FA During Login Use Case
 *
 * Verifies the TOTP code during login and completes authentication.
 * Falls back to backup code verification if TOTP fails.
 */

import { Response } from 'express';
import { Seller } from '../../domain/Seller';
import { SellerRepository } from '../../domain/SellerRepository';
import { TokenService } from '../../../_shared/services/TokenService';
import { TOTPService } from '../../../_shared/services/TOTPService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface VerifyLoginWith2FADeps {
    sellerRepository: SellerRepository;
}

export interface VerifyLoginWith2FAInput {
    sellerId: string;
    totpCode: string;
}

export interface VerifyLoginWith2FAResult {
    message: string;
    seller: Seller.PublicType;
}

export type VerifyLoginWith2FA = (
    input: VerifyLoginWith2FAInput,
    res: Response
) => Promise<VerifyLoginWith2FAResult>;

export const makeVerifyLoginWith2FA = ({ sellerRepository }: VerifyLoginWith2FADeps): VerifyLoginWith2FA => {
    return async (input, res) => {
        // Accept 6-digit TOTP codes or 9-char backup codes (format: XXXX-XXXX)
        const isValidFormat = /^\d{6}$/.test(input.totpCode) || /^[A-F0-9]{4}-[A-F0-9]{4}$/i.test(input.totpCode);
        if (!input.totpCode || !isValidFormat) {
            throw new ValidationError('Invalid code format. Enter your 6-digit TOTP or backup code.');
        }

        const seller = await sellerRepository.findById(input.sellerId);
        if (!seller) {
            throw new AuthError('Seller not found');
        }

        if (!seller.twoFactorEnabled || !seller.twoFactorSecret) {
            throw new AuthError('2FA is not enabled for this account');
        }

        // Step 1: Verify the TOTP code
        let isValid = TOTPService.verifyTOTP(seller.twoFactorSecret, input.totpCode);
        let isBackupCode = false;

        // Step 2: Fallback — verify backup code if TOTP fails
        if (!isValid) {
            const storedBackupCodes = seller.backupCodes ?? [];
            const backupCodeIndex = TOTPService.verifyBackupCode(input.totpCode, storedBackupCodes);

            if (backupCodeIndex !== -1) {
                isValid = true;
                isBackupCode = true;
                // Consume the backup code — one-time use only
                const remainingCodes = storedBackupCodes.filter((_, i) => i !== backupCodeIndex);
                await sellerRepository.update(seller.id, { backupCodes: remainingCodes });

                await sendLog({
                    type: 'warning',
                    message: `Seller logged in with backup code: ${seller.email}. ${remainingCodes.length} backup codes remaining.`,
                    source: 'auth-service',
                });
            }
        }

        if (!isValid) {
            await sendLog({
                type: 'warning',
                message: `2FA login verification failed for seller: ${seller.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid TOTP code or backup code. Please try again.');
        }

        // Clear user cookies
        TokenService.clearUserCookies(res);

        // Generate tokens and set cookies
        const tokens = TokenService.generateTokenPair(seller.id, 'seller');
        TokenService.setSellerCookies(res, tokens);

        await sendLog({
            type: 'success',
            message: `Seller logged in successfully with ${isBackupCode ? 'backup code' : '2FA'}: ${seller.email}`,
            source: 'auth-service',
        });

        return {
            message: 'Login successful',
            seller: Seller.toPublic(seller),
        };
    };
};
