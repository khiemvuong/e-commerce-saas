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

    // Add isPublic filter
    andConditions.push({
        OR: [
            { isPublic: true },
            { isPublic: null }, // For old products without isPublic field
        ],
    });

    // When searching, include both products and events
    // When browsing without search, only show regular products (not events)
    // Note: We don't filter by starting_date/ending_date anymore because:
    // 1. Many products don't have these fields (they're not events)
    // 2. Products without these fields should still be shown

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

    // Price range filter - support both old and new field names
    if (priceRange && typeof priceRange === 'string' && priceRange.length > 0) {
        const [min, max] = priceRange.split(',').map(Number);
        if (!isNaN(min) && !isNaN(max)) {
            // Check for either sale_price or price
            andConditions.push({
                OR: [
                    { sale_price: { gte: min, lte: max } },
                    { price: { gte: min, lte: max } },
                ],
            });
        }
    }

    // Categories filter - Case-insensitive to handle both "clothing" and "Clothing"
    const parsedCategories = parseArrayInput(categories);
    if (parsedCategories.length > 0) {
        andConditions.push({
            OR: parsedCategories.map(cat => ({
                category: { equals: cat, mode: 'insensitive' }
            }))
        });
    }

    // Colors filter
    const parsedColors = parseArrayInput(colors);
    if (parsedColors.length > 0) {
        andConditions.push({
            colors: { hasSome: parsedColors },
        });
    }

    // Sizes filter
    const parsedSizes = parseArrayInput(sizes);
    if (parsedSizes.length > 0) {
        andConditions.push({
            sizes: { hasSome: parsedSizes },
        });
    }

    // Build final filter
    const filters: Record<string, any> = {
        AND: andConditions,
    };

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
