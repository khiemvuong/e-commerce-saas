/**
 * Get Filtered Events Query
 * 
 * Fetches events with filter options.
 */

import prisma from '@packages/libs/prisma';
import { EVENT_CARD_SELECT } from '../../../../constants/productSelect';

/**
 * Input for filtering events
 */
export interface GetFilteredEventsInput {
    priceRange?: string;
    categories?: string | string[];
    colors?: string | string[];
    sizes?: string | string[];
    page?: number;
    limit?: number;
}

/**
 * Output type for getFilteredEvents
 */
export interface GetFilteredEventsOutput {
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
 * Get filtered events with pagination
 */
export const getFilteredEvents = async (
    input: GetFilteredEventsInput = {}
): Promise<GetFilteredEventsOutput> => {
    const {
        priceRange,
        categories,
        colors,
        sizes,
        page = 1,
        limit = 12,
    } = input;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    // Build filters - only include events
    const filters: Record<string, any> = {
        AND: {
            starting_date: { not: null },
            ending_date: { not: null },
            isDeleted: false,
        },
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
                ...EVENT_CARD_SELECT,
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
