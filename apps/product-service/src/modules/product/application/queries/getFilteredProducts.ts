/**
 * Get Filtered Products Query
 * 
 * Fetches products with various filter options.
 */

import prisma from '@packages/libs/prisma';
import { PRODUCT_CARD_SELECT } from '../../../../constants/productSelect';

/**
 * Input for filtering products
 */
export interface GetFilteredProductsInput {
    priceRange?: string; // "min,max" format
    categories?: string | string[];
    colors?: string | string[];
    sizes?: string | string[];
    search?: string; // Search keyword
    page?: number;
    limit?: number;
}

/**
 * Output type for getFilteredProducts
 */
export interface GetFilteredProductsOutput {
    products: any[];
    pagination: {
        total: number;
        page: number;
        totalPages: number;
    };
}

/**
 * Helper to parse array input
 */
const parseArrayInput = (input: string | string[] | undefined): string[] => {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    return String(input).split(',').filter(Boolean);
};

/**
 * Get filtered products with pagination
 */
export const getFilteredProducts = async (
    input: GetFilteredProductsInput = {}
): Promise<GetFilteredProductsOutput> => {
    const {
        priceRange,
        categories,
        colors,
        sizes,
        search,
        page = 1,
        limit = 12,
    } = input;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    // Build filters
    const andConditions: Record<string, any>[] = [
        { isDeleted: false },
    ];

    // When searching, include both products and events
    // When browsing without search, only show regular products (not events)
    if (!search || search.trim().length === 0) {
        andConditions.push(
            { starting_date: null },
            { ending_date: null },
        );
    }

    // Search keyword filter - search in title, description, tags, brand
    if (search && search.trim().length > 0) {
        const searchTerm = search.trim();
        andConditions.push({
            OR: [
                { title: { contains: searchTerm, mode: 'insensitive' } },
                { short_description: { contains: searchTerm, mode: 'insensitive' } },
                { tags: { has: searchTerm } },
                { brand: { contains: searchTerm, mode: 'insensitive' } },
                { category: { contains: searchTerm, mode: 'insensitive' } },
            ],
        });
    }

    const filters: Record<string, any> = {
        AND: andConditions,
    };

    // Price range filter
    if (priceRange && typeof priceRange === 'string' && priceRange.length > 0) {
        const [min, max] = priceRange.split(',').map(Number);
        if (!isNaN(min) && !isNaN(max)) {
            filters.sale_price = { gte: min, lte: max };
        }
    }

    // Categories filter
    const parsedCategories = parseArrayInput(categories);
    if (parsedCategories.length > 0) {
        filters.category = { in: parsedCategories };
    }

    // Colors filter
    const parsedColors = parseArrayInput(colors);
    if (parsedColors.length > 0) {
        filters.colors = { hasSome: parsedColors };
    }

    // Sizes filter
    const parsedSizes = parseArrayInput(sizes);
    if (parsedSizes.length > 0) {
        filters.sizes = { hasSome: parsedSizes };
    }

    // Execute queries
    const [products, total] = await Promise.all([
        prisma.products.findMany({
            where: filters,
            skip,
            take: parsedLimit,
            select: {
                ...PRODUCT_CARD_SELECT,
                short_description: true,
            },
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
