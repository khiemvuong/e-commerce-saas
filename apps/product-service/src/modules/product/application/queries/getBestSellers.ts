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
 */
export const getBestSellers = async (input: GetBestSellersInput = {}) => {
    const { limit = 8 } = input;

    const products = await prisma.products.findMany({
        take: limit,
        where: {
            isDeleted: false,
            starting_date: null,
            ending_date: null,
            totalSales: { gt: 0 },
        },
        orderBy: { totalSales: 'desc' },
        select: {
            ...PRODUCT_CARD_SELECT,
            short_description: true,
        },
    });

    return { products };
};
