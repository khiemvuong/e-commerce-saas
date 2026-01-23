/**
 * Verify 2FA During Login Use Case for User
 * 
 * Verifies the TOTP code during login and completes authentication.
 */

import { Response } from 'express';
import { User } from '../../domain/User';
import { UserRepository } from '../../domain/UserRepository';
import { TokenService } from '../../../_shared/services/TokenService';
import { TOTPService } from '../../../_shared/services/TOTPService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface VerifyLoginWith2FADeps {
    userRepository: UserRepository;
}

export interface VerifyLoginWith2FAInput {
    userId: string;
    totpCode: string;
}

export interface VerifyLoginWith2FAResult {
    message: string;
    user: { id: string; name: string; email: string };
}

export type VerifyLoginWith2FA = (
    input: VerifyLoginWith2FAInput,
    res: Response
) => Promise<VerifyLoginWith2FAResult>;

export const makeVerifyLoginWith2FA = ({ userRepository }: VerifyLoginWith2FADeps): VerifyLoginWith2FA => {
    return async (input, res) => {
        if (!input.totpCode || input.totpCode.length !== 6) {
            throw new ValidationError('Invalid TOTP code format');
        }

        const user = await userRepository.findById(input.userId);
        if (!user) {
            throw new AuthError('User not found');
        }

        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new AuthError('2FA is not enabled for this account');
        }

        // Verify the TOTP code
        const isValid = TOTPService.verifyTOTP(user.twoFactorSecret, input.totpCode);
        
        if (!isValid) {
            await sendLog({
                type: 'warning',
                message: `2FA login verification failed for user: ${user.email}`,
                source: 'auth-service',
            });
            throw new ValidationError('Invalid TOTP code. Please try again.');
        }

        // Clear seller cookies
        TokenService.clearSellerCookies(res);

        // Generate tokens and set cookies
        const tokens = TokenService.generateTokenPair(user.id, 'user');
        TokenService.setUserCookies(res, tokens);

        await sendLog({
            type: 'success',
            message: `User logged in successfully with 2FA: ${user.email}`,
            source: 'auth-service',
        });

        return {
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email },
        };
    };
};
