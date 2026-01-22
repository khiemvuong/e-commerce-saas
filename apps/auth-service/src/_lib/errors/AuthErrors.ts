/**
 * Auth Service Custom Errors
 * 
 * Custom error types for authentication and authorization operations.
 */

import { ValidationError, AuthError } from '@packages/error-handler';

/**
 * User validation error with field-specific messages
 */
export class UserValidationError extends ValidationError {
    public readonly fields: string[];

    constructor(message: string, fields: string[] = []) {
        super(message);
        this.name = 'UserValidationError';
        this.fields = fields;
    }
}

/**
 * Seller validation error
 */
export class SellerValidationError extends ValidationError {
    public readonly fields: string[];

    constructor(message: string, fields: string[] = []) {
        super(message);
        this.name = 'SellerValidationError';
        this.fields = fields;
    }
}

/**
 * OTP related errors
 */
export class OtpError extends ValidationError {
    public readonly attemptsLeft?: number;

    constructor(message: string, attemptsLeft?: number) {
        super(message);
        this.name = 'OtpError';
        this.attemptsLeft = attemptsLeft;
    }
}

/**
 * Rate limit error for OTP requests
 */
export class OtpRateLimitError extends ValidationError {
    public readonly retryAfterMinutes: number;

    constructor(message: string, retryAfterMinutes: number) {
        super(message);
        this.name = 'OtpRateLimitError';
        this.retryAfterMinutes = retryAfterMinutes;
    }
}

/**
 * Account locked error
 */
export class AccountLockedError extends AuthError {
    public readonly unlockAfterMinutes: number;

    constructor(message: string, unlockAfterMinutes: number) {
        super(message);
        this.name = 'AccountLockedError';
        this.unlockAfterMinutes = unlockAfterMinutes;
    }
}

// Re-export base errors for convenience
export { ValidationError, AuthError };
