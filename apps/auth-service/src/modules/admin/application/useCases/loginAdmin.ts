/**
 * Login Admin Use Case
 */

import { Response } from 'express';
import prisma from '@packages/libs/prisma';
import { TokenService } from '../../../_shared/services/TokenService';
import { PasswordService } from '../../../_shared/services/PasswordService';
import { AuthError, ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface LoginAdminInput {
    email: string;
    password: string;
}

export type LoginAdmin = (input: LoginAdminInput, res: Response) => Promise<{
    message: string;
    user: { id: string; name: string; email: string; role: string };
}>;

export const makeLoginAdmin = (): LoginAdmin => {
    return async (input, res) => {
        if (!input.email || !input.password) {
            throw new ValidationError('Email and password are required');
        }

        const user = await prisma.users.findUnique({ where: { email: input.email } });
        if (!user) {
            throw new AuthError("Admin doesn't exist!");
        }

        const isMatch = await PasswordService.compare(input.password, user.password!);
        if (!isMatch) {
            throw new AuthError('Invalid password');
        }

        if (user.role !== 'admin') {
            sendLog({
                type: 'error',
                message: `Unauthorized admin login attempt for email: ${input.email}`,
                source: 'auth-service',
            });
            throw new AuthError('Unauthorized! Not an admin');
        }

        sendLog({
            type: 'success',
            message: `Admin logged in successfully with email: ${input.email}`,
            source: 'auth-service',
        });

        TokenService.clearSellerCookies(res);

        const tokens = TokenService.generateTokenPair(user.id, 'admin');
        TokenService.setUserCookies(res, tokens);

        return {
            message: 'Admin logged in successfully',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        };
    };
};
