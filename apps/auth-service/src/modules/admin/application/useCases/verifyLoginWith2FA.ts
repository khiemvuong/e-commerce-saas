/**
 * Verify 2FA During Login Use Case for Admin
 *
 * Verifies the TOTP code during login and completes authentication.
 * Falls back to backup code verification if TOTP fails.
 */

import { Response } from 'express';
import prisma from '@packages/libs/prisma';
import { TokenService } from '../../../_shared/services/TokenService';
import { TOTPService } from '../../../_shared/services/TOTPService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface VerifyLoginWith2FAInput {
    adminId: string;
    totpCode: string;
}

export interface VerifyLoginWith2FAResult {
    message: string;
    user: { id: string; name: string; email: string; role: string };
}

export type VerifyLoginWith2FA = (
    input: VerifyLoginWith2FAInput,
    res: Response
) => Promise<VerifyLoginWith2FAResult>;

export const makeVerifyLoginWith2FA = (): VerifyLoginWith2FA => {
    return async (input, res) => {
        // Accept 6-digit TOTP codes or 9-char backup codes (format: XXXX-XXXX)
        const isValidFormat = /^\d{6}$/.test(input.totpCode) || /^[A-F0-9]{4}-[A-F0-9]{4}$/i.test(input.totpCode);
        if (!input.totpCode || !isValidFormat) {
            throw new ValidationError('Invalid code format. Enter your 6-digit TOTP or backup code.');
        }

        const admin = await prisma.users.findUnique({
            where: { id: input.adminId },
        });

        if (!admin || admin.role !== 'admin') {
            throw new AuthError('Admin not found');
        }

        if (!admin.twoFactorEnabled || !admin.twoFactorSecret) {
            throw new AuthError('2FA is not enabled for this account');
        }

        // Step 1: Verify the TOTP code
        let isValid = TOTPService.verifyTOTP(admin.twoFactorSecret, input.totpCode);
        let isBackupCode = false;

        // Step 2: Fallback — verify backup code if TOTP fails
        if (!isValid) {
            const storedBackupCodes = admin.backupCodes ?? [];
            const backupCodeIndex = TOTPService.verifyBackupCode(input.totpCode, storedBackupCodes);

            if (backupCodeIndex !== -1) {
                isValid = true;
                isBackupCode = true;
                // Consume the backup code — one-time use only
                const remainingCodes = storedBackupCodes.filter((_, i) => i !== backupCodeIndex);
                await prisma.users.update({
                    where: { id: admin.id },
                    data: { backupCodes: remainingCodes },
                });

                await sendLog({
                    type: 'warning',
                    message: `Admin logged in with backup code: ${admin.email}. ${remainingCodes.length} backup codes remaining.`,
                    source: 'auth-service',
                });
            }
        }

        if (!isValid) {
            await sendLog({
                type: 'warning',
                message: `2FA login verification failed for admin: ${admin.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid TOTP code or backup code. Please try again.');
        }

        // Clear other cookies
        TokenService.clearSellerCookies(res);
        TokenService.clearUserCookies(res);

        // Generate tokens and set admin cookies
        const tokens = TokenService.generateTokenPair(admin.id, 'admin');
        TokenService.setAdminCookies(res, tokens);

        await sendLog({
            type: 'success',
            message: `Admin logged in successfully with ${isBackupCode ? 'backup code' : '2FA'}: ${admin.email}`,
            source: 'auth-service',
        });

        return {
            message: 'Login successful',
            user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
        };
    };
};
