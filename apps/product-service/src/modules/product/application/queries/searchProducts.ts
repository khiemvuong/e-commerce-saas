/**
 * Search Products Query
 * 
 * Searches products by keyword with filters.
 */

import prisma from '@packages/libs/prisma';

/**
 * Input for searching products
 */
export interface SearchProductsInput {
    keyword: string;
    page?: number;
    limit?: number;
}

/**
 * Output type for searchProducts
 */
export interface SearchProductsOutput {
    products: any[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
    };
}

/**
 * Search products by keyword
 */
export const searchProducts = async (
    input: SearchProductsInput
): Promise<SearchProductsOutput> => {
    const { keyword, page = 1, limit = 12 } = input;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    // Build search filters
    const filters: Record<string, any> = {
        AND: [
            { isDeleted: false },
            { starting_date: null },
            { ending_date: null },
        ],
        OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { short_description: { contains: keyword, mode: 'insensitive' } },
            { tags: { has: keyword } },
            { brand: { contains: keyword, mode: 'insensitive' } },
        ],
    };

    // Execute queries
    const [products, total] = await Promise.all([
        prisma.products.findMany({
            where: filters,
            skip,
            take: parsedLimit,
            select: {
                id: true,
                title: true,
                slug: true,
                sale_price: true,
                regular_price: true,
                rating: true,
                stock: true,
                totalSales: true,
                cash_on_delivery: true,
                colors: true,
                sizes: true,
                custom_properties: true,
                images: { take: 2, select: { file_url: true } },
                Shop: { select: { id: true, name: true } },
            },
            orderBy: { totalSales: 'desc' },
        }),
        prisma.products.count({ where: filters }),
    ]);

    return {
        products,
        pagination: {
            total,
            page: parsedPage,
            totalPages: Math.ceil(total / parsedLimit),
        },
    };
};
