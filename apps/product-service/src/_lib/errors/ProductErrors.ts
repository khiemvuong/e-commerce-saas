/**
 * Custom Error Classes for Product Service
 * 
 * These errors extend the base error handling from @packages/error-handler
 * and provide more specific error types for the product domain.
 */

import { ValidationError, notFoundError, AuthError } from '@packages/error-handler';

// Re-export common errors
export { ValidationError, notFoundError, AuthError };

/**
 * Product-specific errors
 */
export class ProductNotFoundError extends Error {
    public statusCode = 404;
    public code = 'PRODUCT_NOT_FOUND';

    constructor(identifier: string) {
        super(`Product not found: ${identifier}`);
        this.name = 'ProductNotFoundError';
    }
}

export class ProductValidationError extends Error {
    public statusCode = 400;
    public code = 'PRODUCT_VALIDATION_ERROR';
    public errors: string[];

    constructor(message: string, errors: string[] = []) {
        super(message);
        this.name = 'ProductValidationError';
        this.errors = errors;
    }
}

export class ProductAuthorizationError extends Error {
    public statusCode = 403;
    public code = 'PRODUCT_UNAUTHORIZED';

    constructor(message: string = 'You are not authorized to perform this action') {
        super(message);
        this.name = 'ProductAuthorizationError';
    }
}

export class DuplicateProductError extends Error {
    public statusCode = 409;
    public code = 'DUPLICATE_PRODUCT';

    constructor(field: string, value: string) {
        super(`A product with ${field} "${value}" already exists`);
        this.name = 'DuplicateProductError';
    }
}

export class InsufficientStockError extends Error {
    public statusCode = 400;
    public code = 'INSUFFICIENT_STOCK';

    constructor(productId: string, requested: number, available: number) {
        super(`Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`);
        this.name = 'InsufficientStockError';
    }
}

export class DiscountCodeNotFoundError extends Error {
    public statusCode = 404;
    public code = 'DISCOUNT_NOT_FOUND';

    constructor(code: string) {
        super(`Discount code not found: ${code}`);
        this.name = 'DiscountCodeNotFoundError';
    }
}

export class DiscountCodeExpiredError extends Error {
    public statusCode = 400;
    public code = 'DISCOUNT_EXPIRED';

    constructor(code: string) {
        super(`Discount code has expired: ${code}`);
        this.name = 'DiscountCodeExpiredError';
    }
}

export class ShopNotFoundError extends Error {
    public statusCode = 404;
    public code = 'SHOP_NOT_FOUND';

    constructor(identifier: string) {
        super(`Shop not found: ${identifier}`);
        this.name = 'ShopNotFoundError';
    }
}

export class ImageUploadError extends Error {
    public statusCode = 500;
    public code = 'IMAGE_UPLOAD_FAILED';

    constructor(message: string = 'Failed to upload image') {
        super(message);
        this.name = 'ImageUploadError';
    }
}

/**
 * Helper function to create a not found error
 */
export const createNotFoundError = (entity: string, identifier: string) => {
    return new notFoundError(`${entity} with identifier "${identifier}" not found`);
};

/**
 * Helper function to create a validation error
 */
export const createValidationError = (message: string, errors?: string[]) => {
    return new ProductValidationError(message, errors);
};
