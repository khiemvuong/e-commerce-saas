import { Response, CookieOptions } from 'express';

export const setCookie = (res: Response, name: string, value: string, options: CookieOptions = {}) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(name, value, {
        httpOnly: true,
        secure: isProd, // Only secure in production
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/', // Ensure consistent path for proper clearing
        ...options
    });
};