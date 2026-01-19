/**
 * Discount Code Domain Types
 */

export namespace DiscountCode {
    /**
     * Discount Code type
     */
    export interface Type {
        id: string;
        public_name: string;
        discountType: string;
        discountValue: number;
        discountCode: string;
        sellerId: string;
        createdAt?: Date;
        updatedAt?: Date;
    }

    /**
     * Input for creating a discount code
     */
    export interface CreateInput {
        public_name: string;
        discountType: string;
        discountValue: number | string;
        discountCode: string;
        sellerId: string;
    }

    /**
     * Validate discount code creation input
     */
    export const validate = (input: CreateInput): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!input.public_name?.trim()) {
            errors.push('Public name is required');
        }

        if (!input.discountType) {
            errors.push('Discount type is required');
        }

        if (!input.discountValue) {
            errors.push('Discount value is required');
        }

        if (!input.discountCode?.trim()) {
            errors.push('Discount code is required');
        }

        if (!input.sellerId) {
            errors.push('Seller ID is required');
        }

        // Validate discount value based on type
        const value = parseFloat(String(input.discountValue));
        if (input.discountType === 'percentage' && (value < 0 || value > 100)) {
            errors.push('Percentage discount must be between 0 and 100');
        }
        if (input.discountType === 'fixed' && value < 0) {
            errors.push('Fixed discount must be positive');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    };
}
