    /**
 * Get Featured Products Query
 * 
 * Fetches products with highest ratings for featured display.
 */

import prisma from '@packages/libs/prisma';
import { PRODUCT_CARD_SELECT } from '../../../../constants/productSelect';

/**
 * Input for getting featured products
 */
export interface GetFeaturedProductsInput {
    limit?: number;
}

/**
 * Get featured products (highest rated)
 * Updated to include isPublic filter
 */
export const getFeaturedProducts = async (input: GetFeaturedProductsInput = {}) => {
    const { limit = 8 } = input;

    const products = await prisma.products.findMany({
        take: limit,
        where: {
            isDeleted: false,
            OR: [
                { isPublic: true },
                { isPublic: null },
            ],
            starting_date: null,
            ending_date: null,
            rating: { gte: 4 },
        },
        orderBy: [
            { rating: 'desc' },
            { totalSales: 'desc' },
            { createdAt: 'desc' }, // Newer products appear for same rating/sales
        ],
        select: {
            ...PRODUCT_CARD_SELECT,
            short_description: true,
        },
    });

    return { products };
};
