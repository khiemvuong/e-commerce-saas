/**
 * Enable 2FA Use Case
 * 
 * Generates a new TOTP secret and returns QR code URI for authenticator apps.
 */

import { SellerRepository } from '../../domain/SellerRepository';
import { TOTPService } from '../../../_shared/services/TOTPService';
import { AuthError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface Enable2FADeps {
    sellerRepository: SellerRepository;
}

export interface Enable2FAInput {
    sellerId: string;
}

export interface Enable2FAResult {
    secret: string;
    qrCodeUri: string;
    backupCodes: string[];
}

export type Enable2FA = (input: Enable2FAInput) => Promise<Enable2FAResult>;

export const makeEnable2FA = ({ sellerRepository }: Enable2FADeps): Enable2FA => {
    return async (input) => {
        const seller = await sellerRepository.findById(input.sellerId);
        if (!seller) {
            throw new AuthError('Seller not found');
        }

        if (seller.twoFactorEnabled) {
            throw new AuthError('2FA is already enabled');
        }

        // Generate new TOTP secret
        const secret = TOTPService.generateSecret();
        
        // Generate QR code URI for authenticator apps
        const qrCodeUri = TOTPService.generateOtpAuthUri(secret, seller.email, 'ILAN Shop Seller');
        
        // Generate backup codes
        const backupCodes = TOTPService.generateBackupCodes(10);
        const hashedBackupCodes = backupCodes.map(code => TOTPService.hashBackupCode(code));

        // Save secret (but don't enable yet - requires verification)
        await sellerRepository.update(seller.id, {
            twoFactorSecret: secret,
            backupCodes: hashedBackupCodes,
        });

        await sendLog({
            type: 'info',
            message: `2FA setup initiated for seller: ${seller.email}`,
            source: 'auth-service',
        });

        return {
            secret,
            qrCodeUri,
            backupCodes, // Return plain backup codes to show user once
        };
    };
};
