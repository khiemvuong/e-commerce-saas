/**
 * Get Best Sellers Query
 * 
 * Fetches top selling products for homepage display.
 */

import prisma from '@packages/libs/prisma';
import { PRODUCT_CARD_SELECT } from '../../../../constants/productSelect';

/**
 * Input for getting best sellers
 */
export interface GetBestSellersInput {
    limit?: number;
}

/**
 * Get best selling products
 * Updated to support both old and new schema, and include products with zero sales
 */
export const getBestSellers = async (input: GetBestSellersInput = {}) => {
    const { limit = 8 } = input;

    const products = await prisma.products.findMany({
        take: limit,
        where: {
            isDeleted: false,
            OR: [
                { isPublic: true },
                { isPublic: null }, // For old products without isPublic field
            ],
            starting_date: null,
            ending_date: null,
            // Removed totalSales > 0 requirement to include new products
        },
        orderBy: [
            { totalSales: 'desc' },
            { createdAt: 'desc' }, // Newer products appear first for same sales
        ],
        select: {
            ...PRODUCT_CARD_SELECT,
            short_description: true,
        },
    });

    return { products };
};
