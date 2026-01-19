/**
 * Create Discount Code Use Case
 */

import prisma from '@packages/libs/prisma';
import { DiscountCode } from '../../domain/DiscountCode';
import { ProductValidationError, DuplicateProductError } from '../../../../_lib/errors/ProductErrors';

/**
 * Input for creating a discount code
 */
export interface CreateDiscountCodeInput {
    public_name: string;
    discountType: string;
    discountValue: number | string;
    discountCode: string;
    sellerId: string;
}

/**
 * Create a new discount code
 */
export const createDiscountCode = async (input: CreateDiscountCodeInput) => {
    const { public_name, discountType, discountValue, discountCode, sellerId } = input;

    // 1. Validate input
    const validation = DiscountCode.validate({
        public_name,
        discountType,
        discountValue,
        discountCode,
        sellerId,
    });

    if (!validation.valid) {
        throw new ProductValidationError(validation.errors.join(', '));
    }

    // 2. Check if discount code already exists
    const existingCode = await prisma.discount_codes.findUnique({
        where: { discountCode }
    });

    if (existingCode) {
        throw new DuplicateProductError('discountCode', discountCode);
    }

    // 3. Create the discount code
    const newDiscountCode = await prisma.discount_codes.create({
        data: {
            public_name,
            discountType,
            discountValue: parseFloat(String(discountValue)),
            discountCode,
            sellerId,
        }
    });

    return newDiscountCode;
};
