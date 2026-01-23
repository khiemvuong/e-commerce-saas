/**
 * Verify 2FA During Login Use Case for Admin
 * 
 * Verifies the TOTP code during login and completes authentication.
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
        if (!input.totpCode || input.totpCode.length !== 6) {
            throw new ValidationError('Invalid TOTP code format');
        }

        const admin = await prisma.users.findUnique({ 
            where: { id: input.adminId } 
        });
        
        if (!admin || admin.role !== 'admin') {
            throw new AuthError('Admin not found');
        }

        if (!admin.twoFactorEnabled || !admin.twoFactorSecret) {
            throw new AuthError('2FA is not enabled for this account');
        }

        // Verify the TOTP code
        const isValid = TOTPService.verifyTOTP(admin.twoFactorSecret, input.totpCode);
        
        if (!isValid) {
            await sendLog({
                type: 'warning',
                message: `2FA login verification failed for admin: ${admin.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid TOTP code. Please try again.');
        }

        // Clear other cookies
        TokenService.clearSellerCookies(res);
        TokenService.clearUserCookies(res);

        // Generate tokens and set admin cookies
        const tokens = TokenService.generateTokenPair(admin.id, 'admin');
        TokenService.setAdminCookies(res, tokens);

        await sendLog({
            type: 'success',
            message: `Admin logged in successfully with 2FA: ${admin.email}`,
            source: 'auth-service',
        });

        return {
            message: 'Login successful',
            user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
        };
    };
};
