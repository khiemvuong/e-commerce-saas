/**
 * Get 2FA Status Use Case for Admin
 * 
 * Returns the current 2FA status for an admin.
 */

import prisma from '@packages/libs/prisma';
import { AuthError } from '../../../../_lib/errors/AuthErrors';

export interface Get2FAStatusInput {
    adminId: string;
}

export interface Get2FAStatusResult {
    enabled: boolean;
    hasBackupCodes: boolean;
}

export type Get2FAStatus = (input: Get2FAStatusInput) => Promise<Get2FAStatusResult>;

export const makeGet2FAStatus = (): Get2FAStatus => {
    return async (input) => {
        const admin = await prisma.users.findUnique({ 
            where: { id: input.adminId } 
        });
        
        if (!admin || admin.role !== 'admin') {
            throw new AuthError('Admin not found');
        }

        return {
            enabled: admin.twoFactorEnabled ?? false,
            hasBackupCodes: (admin.backupCodes?.length ?? 0) > 0,
        };
    };
};
