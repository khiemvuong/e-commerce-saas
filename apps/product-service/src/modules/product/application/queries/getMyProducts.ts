/**
 * Get My Products Query
 * 
 * Fetches products belonging to a specific seller's shop.
 * Excludes events (products with starting_date and ending_date).
 */

import prisma from '@packages/libs/prisma';
import { PRODUCT_FULL_SELECT } from '../../../../constants/productSelect';

/**
 * Input for getting seller's products
 */
export interface GetMyProductsInput {
    shopId: string;
}

/**
 * Get seller's own products (excludes events)
 */
export const getMyProducts = async (input: GetMyProductsInput) => {
    const { shopId } = input;

    const products = await prisma.products.findMany({
        where: {
            shopId,
            // Exclude events - only return standard products
            OR: [
                { starting_date: null },
                { ending_date: null },
            ],
        },
        orderBy: { createdAt: 'desc' },
        select: PRODUCT_FULL_SELECT,
    });

    return products;
};
