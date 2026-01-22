/**
 * Refresh Token Use Case
 * 
 * Handles token refresh for all roles (user, seller, admin).
 */

import { Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '@packages/libs/prisma';
import { TokenService } from '../../../_shared/services/TokenService';
import { ValidationError, AuthError } from '../../../../_lib/errors/AuthErrors';
import { COOKIE_NAMES } from '../../../../_lib/types';

export interface RefreshTokenInput {
    cookies: Record<string, string>;
    authHeader?: string;
}

export interface RefreshTokenResult {
    success: true;
    message: string;
    role: string;
}

export type RefreshToken = (
    input: RefreshTokenInput,
    res: Response
) => Promise<RefreshTokenResult>;

export const makeRefreshToken = (): RefreshToken => {
    return async (input, res) => {
        // 1. Get refresh token from cookies or header
        const refreshToken =
            input.cookies[COOKIE_NAMES.USER_REFRESH] ||
            input.cookies[COOKIE_NAMES.SELLER_REFRESH] ||
            input.cookies[COOKIE_NAMES.ADMIN_REFRESH] ||
            input.authHeader?.split(' ')[1];

        if (!refreshToken) {
            throw new ValidationError('Unauthorized! No refresh token provided');
        }

        // 2. Verify token
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET as string
        ) as { id: string; role: string };

        if (!decoded?.id || !decoded?.role) {
            throw new AuthError('Forbidden! Invalid refresh token.');
        }

        // 3. Find account based on role
        let account;
        if (decoded.role === 'user' || decoded.role === 'admin') {
            account = await prisma.users.findUnique({
                where: { id: decoded.id },
                select: { id: true },
            });
        } else if (decoded.role === 'seller') {
            account = await prisma.sellers.findUnique({
                where: { id: decoded.id },
                select: { id: true, shop: { select: { id: true } } },
            });
        }

        if (!account) {
            throw new AuthError('Forbidden! Account not found');
        }

        // 4. Generate new access token
        const newAccessToken = TokenService.generateAccessToken(decoded.id, decoded.role as any);

        // 5. Set cookie based on role
        if (decoded.role === 'user') {
            res.cookie(COOKIE_NAMES.USER_ACCESS, newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000, // 15 minutes
            });
        } else if (decoded.role === 'seller') {
            res.cookie(COOKIE_NAMES.SELLER_ACCESS, newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000,
            });
        } else if (decoded.role === 'admin') {
            res.cookie(COOKIE_NAMES.ADMIN_ACCESS, newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000,
            });
        }

        return { success: true, message: 'Access token refreshed', role: decoded.role };
    };
};
