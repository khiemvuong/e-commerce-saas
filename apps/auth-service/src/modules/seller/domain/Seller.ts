/**
 * Seller Domain Entity
 * 
 * Defines the Seller entity structure, validation rules, and factory functions.
 * Pure domain logic - no dependencies on infrastructure.
 */

import { SellerValidationError } from '../../../_lib/errors/AuthErrors';
import { VALIDATION_PATTERNS } from '../../../_lib/types';

export namespace Seller {
    /**
     * Full Seller entity type (from database)
     */
    export interface Type {
        id: string;
        name: string;
        email: string;
        password: string;
        phone_number: string;
        country: string;
        stripeId?: string | null;
        // 2FA fields
        twoFactorEnabled: boolean;
        twoFactorSecret?: string | null;
        backupCodes: string[];
        createdAt: Date;
        updatedAt: Date;
    }

    /**
     * Seller with shop info
     */
    export interface WithShop extends Type {
        shop?: {
            id: string;
            name: string;
        } | null;
    }

    /**
     * Seller response (safe to return to client)
     */
    export interface PublicType {
        id: string;
        name: string;
        email: string;
        phone_number: string;
        country: string;
        stripeId: string | null;
    }

    /**
     * Input for seller registration (OTP step)
     */
    export interface RegisterInput {
        name: string;
        email: string;
    }

    /**
     * Input for verifying seller and creating account
     */
    export interface VerifyInput {
        name: string;
        email: string;
        password: string;
        phone_number: string;
        country: string;
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
            throw new SellerValidationError('Missing required fields for registration', errors);
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
        }

        if (!input.phone_number?.trim()) {
            errors.push('Phone number is required');
        }

        if (!input.country?.trim()) {
            errors.push('Country is required');
        }

        if (!input.otp?.trim()) {
            errors.push('OTP is required');
        }

        if (errors.length > 0) {
            throw new SellerValidationError('All fields are required', errors);
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
            throw new SellerValidationError('Email and password are required', errors);
        }
    };

    /**
     * Convert to public format (safe for client)
     */
    export const toPublic = (seller: Type): PublicType => {
        return {
            id: seller.id,
            name: seller.name,
            email: seller.email,
            phone_number: seller.phone_number,
            country: seller.country,
            stripeId: seller.stripeId || null,
        };
    };
}
