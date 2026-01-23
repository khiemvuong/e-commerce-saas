/**
 * Disable 2FA Use Case
 * 
 * Disables 2FA for a seller after password verification.
 */

import { SellerRepository } from '../../domain/SellerRepository';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface Disable2FADeps {
    sellerRepository: SellerRepository;
}

export interface Disable2FAInput {
    sellerId: string;
    password: string;
}

export interface Disable2FAResult {
    success: boolean;
    message: string;
}

export type Disable2FA = (input: Disable2FAInput) => Promise<Disable2FAResult>;

export const makeDisable2FA = ({ sellerRepository }: Disable2FADeps): Disable2FA => {
    return async (input) => {
        if (!input.password) {
            throw new ValidationError('Password is required to disable 2FA');
        }

        const seller = await sellerRepository.findById(input.sellerId);
        if (!seller) {
            throw new AuthError('Seller not found');
        }

        if (!seller.twoFactorEnabled) {
            throw new AuthError('2FA is not enabled');
        }

        // Verify password
        const isPasswordValid = await PasswordService.compare(input.password, seller.password);
        if (!isPasswordValid) {
            await sendLog({
                type: 'warning',
                message: `2FA disable attempt failed (wrong password) for seller: ${seller.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid password');
        }

        // Disable 2FA and clear secrets
        await sellerRepository.update(seller.id, {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            backupCodes: [],
        });

        await sendLog({
            type: 'info',
            message: `2FA disabled for seller: ${seller.email}`,
            source: 'auth-service',
        });

        return {
            success: true,
            message: '2FA has been disabled',
        };
    };
};
