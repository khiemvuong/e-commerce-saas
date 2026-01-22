/**
 * Token Service
 * 
 * Handles JWT token generation, verification, and cookie management.
 */

import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { Response } from 'express';
import { setCookie } from '../../../utils/cookies/setCookie';
import { TokenPayload, TokenPair, COOKIE_NAMES, UserRole } from '../../../_lib/types';

// Token configuration (expiresIn in seconds)
const TOKEN_CONFIG = {
    ACCESS_EXPIRY: 15 * 60,   // 15 minutes in seconds
    REFRESH_EXPIRY: 7 * 24 * 60 * 60, // 7 days in seconds
};

/**
 * Generate access token
 */
export const generateAccessToken = (id: string, role: UserRole): string => {
    return jwt.sign(
        { id, role } as TokenPayload,
        process.env.ACCESS_TOKEN_SECRET as string,
        { expiresIn: TOKEN_CONFIG.ACCESS_EXPIRY }
    );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (id: string, role: UserRole): string => {
    return jwt.sign(
        { id, role } as TokenPayload,
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: TOKEN_CONFIG.REFRESH_EXPIRY }
    );
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (id: string, role: UserRole): TokenPair => {
    return {
        accessToken: generateAccessToken(id, role),
        refreshToken: generateRefreshToken(id, role),
    };
};

/**
 * Verify refresh token and return payload
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as TokenPayload;
    
    if (!decoded || !decoded.id || !decoded.role) {
        throw new JsonWebTokenError('Forbidden! Invalid refresh token.');
    }

    return decoded;
};

/**
 * Set user authentication cookies
 */
export const setUserCookies = (res: Response, tokens: TokenPair): void => {
    setCookie(res, COOKIE_NAMES.USER_ACCESS, tokens.accessToken);
    setCookie(res, COOKIE_NAMES.USER_REFRESH, tokens.refreshToken);
};

/**
 * Set seller authentication cookies
 */
export const setSellerCookies = (res: Response, tokens: TokenPair): void => {
    setCookie(res, COOKIE_NAMES.SELLER_ACCESS, tokens.accessToken);
    setCookie(res, COOKIE_NAMES.SELLER_REFRESH, tokens.refreshToken);
};

/**
 * Set admin authentication cookies
 */
export const setAdminCookies = (res: Response, tokens: TokenPair): void => {
    setCookie(res, COOKIE_NAMES.ADMIN_ACCESS, tokens.accessToken);
    setCookie(res, COOKIE_NAMES.ADMIN_REFRESH, tokens.refreshToken);
};

/**
 * Clear user cookies
 */
export const clearUserCookies = (res: Response): void => {
    res.clearCookie(COOKIE_NAMES.USER_ACCESS);
    res.clearCookie(COOKIE_NAMES.USER_REFRESH);
};

/**
 * Clear seller cookies
 */
export const clearSellerCookies = (res: Response): void => {
    res.clearCookie(COOKIE_NAMES.SELLER_ACCESS);
    res.clearCookie(COOKIE_NAMES.SELLER_REFRESH);
};

/**
 * Clear admin cookies
 */
export const clearAdminCookies = (res: Response): void => {
    res.clearCookie(COOKIE_NAMES.ADMIN_ACCESS);
    res.clearCookie(COOKIE_NAMES.ADMIN_REFRESH);
};

// Export as TokenService object for convenience
export const TokenService = {
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
    verifyRefreshToken,
    setUserCookies,
    setSellerCookies,
    setAdminCookies,
    clearUserCookies,
    clearSellerCookies,
    clearAdminCookies,
};
