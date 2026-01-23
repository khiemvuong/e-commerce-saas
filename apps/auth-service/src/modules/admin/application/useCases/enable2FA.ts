/**
 * Enable 2FA Use Case for Admin
 * 
 * Generates a new TOTP secret and returns QR code URI for authenticator apps.
 */

import prisma from '@packages/libs/prisma';
import { TOTPService } from '../../../_shared/services/TOTPService';
import { AuthError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface Enable2FAInput {
    adminId: string;
}

export interface Enable2FAResult {
    secret: string;
    qrCodeUri: string;
    backupCodes: string[];
}

export type Enable2FA = (input: Enable2FAInput) => Promise<Enable2FAResult>;

export const makeEnable2FA = (): Enable2FA => {
    return async (input) => {
        const admin = await prisma.users.findUnique({ 
            where: { id: input.adminId } 
        });
        
        if (!admin || admin.role !== 'admin') {
            throw new AuthError('Admin not found');
        }

        if (admin.twoFactorEnabled) {
            throw new AuthError('2FA is already enabled');
        }

        // Generate new TOTP secret
        const secret = TOTPService.generateSecret();
        
        // Generate QR code URI for authenticator apps
        const qrCodeUri = TOTPService.generateOtpAuthUri(secret, admin.email, 'ILAN Shop Admin');
        
        // Generate backup codes
        const backupCodes = TOTPService.generateBackupCodes(10);
        const hashedBackupCodes = backupCodes.map(code => TOTPService.hashBackupCode(code));

        // Save secret (but don't enable yet - requires verification)
        await prisma.users.update({
            where: { id: admin.id },
            data: {
                twoFactorSecret: secret,
                backupCodes: hashedBackupCodes,
            },
        });

        await sendLog({
            type: 'info',
            message: `2FA setup initiated for admin: ${admin.email}`,
            source: 'auth-service',
        });

        return {
            secret,
            qrCodeUri,
            backupCodes, // Return plain backup codes to show user once
        };
    };
};
