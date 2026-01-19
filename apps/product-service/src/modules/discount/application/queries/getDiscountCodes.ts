/**
 * Get Discount Codes Query
 */

import prisma from '@packages/libs/prisma';

/**
 * Input for getting discount codes
 */
export interface GetDiscountCodesInput {
    sellerId: string;
}

/**
 * Get all discount codes for a seller
 */
export const getDiscountCodes = async (input: GetDiscountCodesInput) => {
    const { sellerId } = input;

    const discountCodes = await prisma.discount_codes.findMany({
        where: { sellerId }
    });

    return discountCodes;
};
