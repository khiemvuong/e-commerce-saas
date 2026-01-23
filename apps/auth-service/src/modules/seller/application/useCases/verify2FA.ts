/**
 * Verify and Activate 2FA Use Case
 * 
 * Verifies the TOTP code from authenticator app and activates 2FA.
 */

import { SellerRepository } from '../../domain/SellerRepository';
import { TOTPService } from '../../../_shared/services/TOTPService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface Verify2FADeps {
    sellerRepository: SellerRepository;
}

export interface Verify2FAInput {
    sellerId: string;
    totpCode: string;
}

export interface Verify2FAResult {
    success: boolean;
    message: string;
}

export type Verify2FA = (input: Verify2FAInput) => Promise<Verify2FAResult>;

export const makeVerify2FA = ({ sellerRepository }: Verify2FADeps): Verify2FA => {
    return async (input) => {
        if (!input.totpCode || input.totpCode.length !== 6) {
            throw new ValidationError('Invalid TOTP code format');
        }

        const seller = await sellerRepository.findById(input.sellerId);
        if (!seller) {
            throw new AuthError('Seller not found');
        }

        if (!seller.twoFactorSecret) {
            throw new AuthError('2FA setup not initiated. Please enable 2FA first.');
        }

        if (seller.twoFactorEnabled) {
            throw new AuthError('2FA is already active');
        }

        // Verify the TOTP code
        const isValid = TOTPService.verifyTOTP(seller.twoFactorSecret, input.totpCode);
        
        if (!isValid) {
            await sendLog({
                type: 'warning',
                message: `2FA verification failed for seller: ${seller.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid TOTP code. Please try again.');
        }

        // Activate 2FA
        await sellerRepository.update(seller.id, {
            twoFactorEnabled: true,
        });

        await sendLog({
            type: 'success',
            message: `2FA activated for seller: ${seller.email}`,
            source: 'auth-service',
        });

        return {
            success: true,
            message: '2FA has been successfully activated',
        };
    };
};
