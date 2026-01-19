/**
 * Get All Products Query
 * 
 * Fetches paginated list of all products with optional sorting.
 */

import prisma from '@packages/libs/prisma';
import { PRODUCT_CARD_SELECT } from '../../../../constants/productSelect';

/**
 * Input for getting all products
 */
export interface GetAllProductsInput {
    page?: number;
    limit?: number;
    type?: 'latest' | 'topSales';
}

/**
 * Output type for getAllProducts
 */
export interface GetAllProductsOutput {
    products: any[];
    top10By: string;
    top10Products: any[];
    total: number;
    currentPage: number;
    totalPages: number;
}

/**
 * Get all products with pagination
 */
export const getAllProducts = async (input: GetAllProductsInput = {}): Promise<GetAllProductsOutput> => {
    const { page = 1, limit = 20, type = 'topSales' } = input;

    const skip = Math.max(0, (page - 1) * limit);

    // Base filter: exclude deleted products and events
    const baseFilter = {
        AND: [
            { isDeleted: false },
            { starting_date: null },
            { ending_date: null },
        ],
    };

    // Order by based on type
    const orderBy = type === 'latest' ? { createdAt: 'desc' as const } : { totalSales: 'desc' as const };

    // Execute queries in parallel
    const [products, total, top10Products] = await Promise.all([
        prisma.products.findMany({
            skip,
            take: limit,
            where: baseFilter,
            orderBy,
            select: {
                ...PRODUCT_CARD_SELECT,
                short_description: true,
            },
        }),
        prisma.products.count({ where: baseFilter }),
        prisma.products.findMany({
            take: 10,
            where: baseFilter,
            orderBy,
            select: {
                id: true,
                title: true,
                slug: true,
                sale_price: true,
                regular_price: true,
                rating: true,
                totalSales: true,
                images: { take: 1, select: { file_url: true } },
            },
        }),
    ]);

    return {
        products,
        top10By: type === 'latest' ? 'latest' : 'topSales',
        top10Products,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    };
};
