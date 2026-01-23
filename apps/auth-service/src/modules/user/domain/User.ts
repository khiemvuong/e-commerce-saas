/**
 * User Domain Entity
 * 
 * Defines the User entity structure, validation rules, and factory functions.
 * Pure domain logic - no dependencies on infrastructure.
 */

import { UserValidationError } from '../../../_lib/errors/AuthErrors';
import { VALIDATION_PATTERNS } from '../../../_lib/types';

export namespace User {
    /**
     * Full User entity type (from database)
     */
    export interface Type {
        id: string;
        name: string;
        email: string;
        password: string;
        role: string;
        avatar?: UserAvatar | null;
        // 2FA fields
        twoFactorEnabled?: boolean;
        twoFactorSecret?: string | null;
        backupCodes?: string[];
        createdAt: Date;
        updatedAt: Date;
    }

    export interface UserAvatar {
        file_url: string;
        fileId: string;
    }

    /**
     * User response (safe to return to client)
     */
    export interface PublicType {
        id: string;
        name: string;
        email: string;
        role: string;
        avatar: string | null;
        twoFactorEnabled?: boolean;
    }

    /**
     * Input for user registration (OTP step)
     */
    export interface RegisterInput {
        name: string;
        email: string;
    }

    /**
     * Input for verifying user and creating account
     */
    export interface VerifyInput {
        name: string;
        email: string;
        password: string;
        otp: string;
    }

    /**
     * Input for login
     */
    export interface LoginInput {
        email: string;
        password: string;
    }

    /**
     * Input for updating profile
     */
    export interface UpdateProfileInput {
        name?: string;
        avatar?: UserAvatar;
    }

    /**
     * Input for updating password
     */
    export interface UpdatePasswordInput {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }

    /**
     * Input for forgot password
     */
    export interface ForgotPasswordInput {
        email: string;
    }

    /**
     * Input for reset password
     */
    export interface ResetPasswordInput {
        email: string;
        otp: string;
        newPassword: string;
    }

    /**
     * Validate registration input
     */
    export const validateRegister = (input: RegisterInput): void => {
        const errors: string[] = [];

        if (!input.name?.trim()) {
            errors.push('Name is required');
        }

        if (!input.email?.trim()) {
            errors.push('Email is required');
        } else if (!VALIDATION_PATTERNS.EMAIL.test(input.email)) {
            errors.push('Invalid email format');
        }

        if (errors.length > 0) {
            throw new UserValidationError('Validation failed', errors);
        }
    };

    /**
     * Validate verify input (full registration)
     */
    export const validateVerify = (input: VerifyInput): void => {
        const errors: string[] = [];

        if (!input.name?.trim()) {
            errors.push('Name is required');
        }

        if (!input.email?.trim()) {
            errors.push('Email is required');
        }

        if (!input.password?.trim()) {
            errors.push('Password is required');
        } else if (input.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }

        if (!input.otp?.trim()) {
            errors.push('OTP is required');
        }

        if (errors.length > 0) {
            throw new UserValidationError('All fields are required', errors);
        }
    };

    /**
     * Validate login input
     */
    export const validateLogin = (input: LoginInput): void => {
        const errors: string[] = [];

        if (!input.email?.trim()) {
            errors.push('Email is required');
        }

        if (!input.password?.trim()) {
            errors.push('Password is required');
        }

        if (errors.length > 0) {
            throw new UserValidationError('Email and password are required', errors);
        }
    };

    /**
     * Validate update password input
     */
    export const validateUpdatePassword = (input: UpdatePasswordInput): void => {
        const errors: string[] = [];

        if (!input.currentPassword?.trim()) {
            errors.push('Current password is required');
        }

        if (!input.newPassword?.trim()) {
            errors.push('New password is required');
        }

        if (!input.confirmPassword?.trim()) {
            errors.push('Confirm password is required');
        }

        if (input.newPassword !== input.confirmPassword) {
            errors.push('New password and confirm password do not match');
        }

        if (input.currentPassword === input.newPassword) {
            errors.push('New password must be different from current password');
        }

        if (errors.length > 0) {
            throw new UserValidationError(errors[0], errors);
        }
    };

    /**
     * Validate reset password input
     */
    export const validateResetPassword = (input: ResetPasswordInput): void => {
        const errors: string[] = [];

        if (!input.email?.trim()) {
            errors.push('Email is required');
        }

        if (!input.otp?.trim()) {
            errors.push('OTP is required');
        }

        if (!input.newPassword?.trim()) {
            errors.push('New password is required');
        }

        if (errors.length > 0) {
            throw new UserValidationError('All fields are required', errors);
        }
    };

    /**
     * Convert database user to public format (safe for client)
     */
    export const toPublic = (user: Type & { avatar?: { file_url: string }[] }): PublicType => {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: Array.isArray(user.avatar) && user.avatar.length > 0 
                ? user.avatar[0].file_url 
                : null,
        };
    };
}
