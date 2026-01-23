/**
 * Login Seller Use Case
 */

import { Response } from 'express';
import { Seller } from '../../domain/Seller';
import { SellerRepository } from '../../domain/SellerRepository';
import { TokenService } from '../../../_shared/services/TokenService';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface LoginSellerDeps {
    sellerRepository: SellerRepository;
}

export interface LoginSellerResult {
    message: string;
    seller?: Seller.PublicType;
    requiresTwoFactor?: boolean;
    sellerId?: string;
}

export type LoginSeller = (input: Seller.LoginInput, res: Response) => Promise<LoginSellerResult>;

export const makeLoginSeller = ({ sellerRepository }: LoginSellerDeps): LoginSeller => {
    return async (input, res) => {
        Seller.validateLogin(input);

        const seller = await sellerRepository.findByEmail(input.email);
        if (!seller) {
            await sendLog({
                type: 'warning',
                message: `Seller login failed: Email not found ${input.email}`,
                source: 'auth-service',
            });
            throw new AuthError("Seller doesn't exists!");
        }

        const isMatch = await PasswordService.compare(input.password, seller.password);
        if (!isMatch) {
            await sendLog({
                type: 'warning',
                message: `Seller login failed: Invalid password for ${input.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid email or password');
        }

        // Check if 2FA is enabled
        if (seller.twoFactorEnabled) {
            await sendLog({
                type: 'info',
                message: `2FA required for seller: ${input.email}`,
                source: 'auth-service',
            });

            return {
                message: '2FA verification required',
                requiresTwoFactor: true,
                sellerId: seller.id,
            };
        }

        // Clear user cookies
        TokenService.clearUserCookies(res);

        // Generate tokens and set cookies
        const tokens = TokenService.generateTokenPair(seller.id, 'seller');
        TokenService.setSellerCookies(res, tokens);

        await sendLog({
            type: 'success',
            message: `Seller logged in successfully: ${input.email}`,
            source: 'auth-service',
        });

        return {
            message: 'Login successful',
            seller: Seller.toPublic(seller),
        };
    };
};
