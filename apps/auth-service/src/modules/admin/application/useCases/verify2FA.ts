/**
 * Verify and Activate 2FA Use Case for Admin
 * 
 * Verifies the TOTP code from authenticator app and activates 2FA.
 */

import prisma from '@packages/libs/prisma';
import { TOTPService } from '../../../_shared/services/TOTPService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface Verify2FAInput {
    adminId: string;
    totpCode: string;
}

export interface Verify2FAResult {
    success: boolean;
    message: string;
}

export type Verify2FA = (input: Verify2FAInput) => Promise<Verify2FAResult>;

export const makeVerify2FA = (): Verify2FA => {
    return async (input) => {
        if (!input.totpCode || input.totpCode.length !== 6) {
            throw new ValidationError('Invalid TOTP code format');
        }

        const admin = await prisma.users.findUnique({ 
            where: { id: input.adminId } 
        });
        
        if (!admin || admin.role !== 'admin') {
            throw new AuthError('Admin not found');
        }

        if (!admin.twoFactorSecret) {
            throw new AuthError('2FA setup not initiated. Please enable 2FA first.');
        }

        if (admin.twoFactorEnabled) {
            throw new AuthError('2FA is already active');
        }

        // Verify the TOTP code
        const isValid = TOTPService.verifyTOTP(admin.twoFactorSecret, input.totpCode);
        
        if (!isValid) {
            await sendLog({
                type: 'warning',
                message: `2FA verification failed for admin: ${admin.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid TOTP code. Please try again.');
        }

        // Activate 2FA
        await prisma.users.update({
            where: { id: admin.id },
            data: { twoFactorEnabled: true },
        });

        await sendLog({
            type: 'success',
            message: `2FA activated for admin: ${admin.email}`,
            source: 'auth-service',
        });

        return {
            success: true,
            message: '2FA has been successfully activated',
        };
    };
};
