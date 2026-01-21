/**
 * Get Deals of The Day Query
 * 
 * Fetches products with the highest discount percentage for deals section.
 */

import prisma from '@packages/libs/prisma';
import { PRODUCT_CARD_SELECT } from '../../../../constants/productSelect';

/**
 * Input for getting deals of the day
 */
export interface GetDealsOfTheDayInput {
    limit?: number;
}

/**
 * Get deals of the day (products with best discounts)
 */
export const getDealsOfTheDay = async (input: GetDealsOfTheDayInput = {}) => {
    const { limit = 6 } = input;

    // Get products with sale_price (discounted products)
    const products = await prisma.products.findMany({
        take: limit * 2, // Get more to filter
        where: {
            isDeleted: false,
            starting_date: null,
            ending_date: null,
            sale_price: { gt: 0 },
            stock: { gt: 0 },
        },
        orderBy: { updatedAt: 'desc' },
        select: {
            ...PRODUCT_CARD_SELECT,
            short_description: true,
        },
    });

    // Calculate discount percentage and sort
    const productsWithDiscount = products
        .map(product => ({
            ...product,
            discountPercentage: product.sale_price 
                ? Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)
                : 0,
        }))
        .filter(p => p.discountPercentage > 0)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)
        .slice(0, limit);

    return { products: productsWithDiscount };
};
