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
 * Updated to support both old and new schema
 */
export const getDealsOfTheDay = async (input: GetDealsOfTheDayInput = {}) => {
    const { limit = 6 } = input;

    // Get products with sale_price or price (discounted products)
    const products = await prisma.products.findMany({
        take: 50,
        where: {
            AND: [
                { isDeleted: false },
                {
                    OR: [
                        { isPublic: true },
                        { isPublic: null },
                    ],
                },
                { starting_date: null },
                { ending_date: null },
                {
                    OR: [
                        { sale_price: { gt: 0 } },
                        { price: { gt: 0 } },
                    ],
                },
                { stock: { gt: 0 } },
            ],
        },
        orderBy: { updatedAt: 'desc' },
        select: {
            ...PRODUCT_CARD_SELECT,
            short_description: true,
            compareAtPrice: true,
            price: true,
        },
    });

    // Calculate discount percentage and sort
    const productsWithDiscount = products
        .map(product => {
            // Support both old and new field names
            const salePrice = product.sale_price || product.price || 0;
            const regularPrice = product.regular_price || product.compareAtPrice || salePrice;
            
            const discountPercentage = salePrice && regularPrice > salePrice
                ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
                : 0;

            return {
                ...product,
                discountPercentage,
            };
        })
        .filter(p => p.discountPercentage > 0)
        .sort((a, b) => b.discountPercentage - a.discountPercentage);
    
    const topDeals = productsWithDiscount.slice(0, limit);

    return { products: topDeals };
};
