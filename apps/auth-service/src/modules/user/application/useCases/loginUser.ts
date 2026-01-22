/**
 * Login User Use Case
 * 
 * Handles user authentication and token generation.
 */

import { Response } from 'express';
import { User } from '../../domain/User';
import { UserRepository } from '../../domain/UserRepository';
import { TokenService } from '../../../_shared/services/TokenService';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { AuthError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface LoginUserDeps {
    userRepository: UserRepository;
}

export interface LoginUserResult {
    message: string;
    user: { id: string; name: string; email: string };
}

export type LoginUser = (
    input: User.LoginInput,
    res: Response
) => Promise<LoginUserResult>;

export const makeLoginUser = ({ userRepository }: LoginUserDeps): LoginUser => {
    return async (input: User.LoginInput, res: Response) => {
        // 1. Validate input
        User.validateLogin(input);

        // 2. Find user
        const user = await userRepository.findByEmail(input.email);
        if (!user) {
            await sendLog({
                type: 'warning',
                message: `Login failed: User not found for email ${input.email}`,
                source: 'auth-service',
            });
            throw new AuthError("User doesn't exists!");
        }

        // 3. Verify password
        const isMatch = await PasswordService.compare(input.password, user.password);
        if (!isMatch) {
            await sendLog({
                type: 'warning',
                message: `Login failed: Invalid password for user ${input.email}`,
                source: 'auth-service',
            });
            throw new AuthError('Invalid email or password');
        }

        // 4. Clear seller cookies (if any)
        TokenService.clearSellerCookies(res);

        // 5. Generate tokens
        const tokens = TokenService.generateTokenPair(user.id, 'user');

        // 6. Set cookies
        TokenService.setUserCookies(res, tokens);

        // 7. Log success
        await sendLog({
            type: 'success',
            message: `User logged in successfully: ${input.email}`,
            source: 'auth-service',
        });

        return {
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email },
        };
    };
};
