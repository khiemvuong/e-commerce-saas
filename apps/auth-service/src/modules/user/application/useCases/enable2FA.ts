/**
 * Enable 2FA Use Case for User
 * 
 * Generates a new TOTP secret and returns QR code URI for authenticator apps.
 */

import { UserRepository } from '../../domain/UserRepository';
import { TOTPService } from '../../../_shared/services/TOTPService';
import { AuthError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface Enable2FADeps {
    userRepository: UserRepository;
}

export interface Enable2FAInput {
    userId: string;
}

export interface Enable2FAResult {
    secret: string;
    qrCodeUri: string;
    backupCodes: string[];
}

export type Enable2FA = (input: Enable2FAInput) => Promise<Enable2FAResult>;

export const makeEnable2FA = ({ userRepository }: Enable2FADeps): Enable2FA => {
    return async (input) => {
        const user = await userRepository.findById(input.userId);
        if (!user) {
            throw new AuthError('User not found');
        }

        if (user.twoFactorEnabled) {
            throw new AuthError('2FA is already enabled');
        }

        // Generate new TOTP secret
        const secret = TOTPService.generateSecret();
        
        // Generate QR code URI for authenticator apps
        const qrCodeUri = TOTPService.generateOtpAuthUri(secret, user.email, 'ILAN Shop');
        
        // Generate backup codes
        const backupCodes = TOTPService.generateBackupCodes(10);
        const hashedBackupCodes = backupCodes.map(code => TOTPService.hashBackupCode(code));

        // Save secret (but don't enable yet - requires verification)
        await userRepository.update(user.id, {
            twoFactorSecret: secret,
            backupCodes: hashedBackupCodes,
        });

        await sendLog({
            type: 'info',
            message: `2FA setup initiated for user: ${user.email}`,
            source: 'auth-service',
        });

        return {
            secret,
            qrCodeUri,
            backupCodes, // Return plain backup codes to show user once
        };
    };
};
