/**
 * Disable 2FA Use Case for Admin
 * 
 * Disables 2FA for an admin after password verification.
 */

import prisma from '@packages/libs/prisma';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface Disable2FAInput {
    adminId: string;
    password: string;
}

export interface Disable2FAResult {
    success: boolean;
    message: string;
}

export type Disable2FA = (input: Disable2FAInput) => Promise<Disable2FAResult>;

export const makeDisable2FA = (): Disable2FA => {
    return async (input) => {
        if (!input.password) {
            throw new ValidationError('Password is required to disable 2FA');
        }

        const admin = await prisma.users.findUnique({ 
            where: { id: input.adminId } 
        });
        
        if (!admin || admin.role !== 'admin') {
            throw new AuthError('Admin not found');
        }

        if (!admin.twoFactorEnabled) {
            throw new AuthError('2FA is not enabled');
        }

        // Verify password
        const isPasswordValid = await PasswordService.compare(input.password, admin.password!);
        if (!isPasswordValid) {
            await sendLog({
                type: 'warning',
                message: `2FA disable attempt failed (wrong password) for admin: ${admin.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid password');
        }

        // Disable 2FA and clear secrets
        await prisma.users.update({
            where: { id: admin.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                backupCodes: [],
            },
        });

        await sendLog({
            type: 'info',
            message: `2FA disabled for admin: ${admin.email}`,
            source: 'auth-service',
        });

        return {
            success: true,
            message: '2FA has been disabled',
        };
    };
};
