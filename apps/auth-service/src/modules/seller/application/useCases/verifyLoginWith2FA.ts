/**
 * Verify 2FA During Login Use Case
 * 
 * Verifies the TOTP code during login and completes authentication.
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
        if (!input.totpCode || input.totpCode.length !== 6) {
            throw new ValidationError('Invalid TOTP code format');
        }

        const seller = await sellerRepository.findById(input.sellerId);
        if (!seller) {
            throw new AuthError('Seller not found');
        }

        if (!seller.twoFactorEnabled || !seller.twoFactorSecret) {
            throw new AuthError('2FA is not enabled for this account');
        }

        // Verify the TOTP code
        const isValid = TOTPService.verifyTOTP(seller.twoFactorSecret, input.totpCode);
        
        if (!isValid) {
            await sendLog({
                type: 'warning',
                message: `2FA login verification failed for seller: ${seller.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid TOTP code. Please try again.');
        }

        // Clear user cookies
        TokenService.clearUserCookies(res);

        // Generate tokens and set cookies
        const tokens = TokenService.generateTokenPair(seller.id, 'seller');
        TokenService.setSellerCookies(res, tokens);

        await sendLog({
            type: 'success',
            message: `Seller logged in successfully with 2FA: ${seller.email}`,
            source: 'auth-service',
        });

        return {
            message: 'Login successful',
            seller: Seller.toPublic(seller),
        };
    };
};
