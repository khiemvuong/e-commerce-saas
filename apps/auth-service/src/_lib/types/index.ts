/**
 * Auth Service Shared Types
 */

// Common response types
export interface SuccessResponse<T = any> {
    success: true;
    message?: string;
    data?: T;
}

export interface ErrorResponse {
    success: false;
    message: string;
    errors?: string[];
}

// Token types
export interface TokenPayload {
    id: string;
    role: 'user' | 'seller' | 'admin';
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

// Cookie names
export const COOKIE_NAMES = {
    USER_ACCESS: 'access_token',
    USER_REFRESH: 'refresh_token',
    SELLER_ACCESS: 'seller-access-token',
    SELLER_REFRESH: 'seller-refresh-token',
    ADMIN_ACCESS: 'admin-access-token',
    ADMIN_REFRESH: 'admin-refresh-token',
} as const;

// Role types
export type UserRole = 'user' | 'seller' | 'admin';

// Common validation patterns
export const VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
} as const;
