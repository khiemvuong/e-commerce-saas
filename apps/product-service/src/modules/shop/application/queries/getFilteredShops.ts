/**
 * Get Filtered Shops Query
 */

import prisma from '@packages/libs/prisma';

/**
 * Input for filtering shops
 */
export interface GetFilteredShopsInput {
    search?: string;
    categories?: string | string[];
    countries?: string | string[];
    page?: number;
    limit?: number;
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
 * Get filtered shops with pagination
 */
export const getFilteredShops = async (input: GetFilteredShopsInput = {}) => {
    const {
        search,
        categories,
        countries,
        page = 1,
        limit = 12,
    } = input;

    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 12;
    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {};

    if (search) {
        filters.name = {
            contains: search,
            mode: 'insensitive',
        };
    }

    const parsedCategories = parseArrayInput(categories);
    if (parsedCategories.length > 0) {
        filters.category = { in: parsedCategories };
    }

    // Filter by seller's country
    const parsedCountries = parseArrayInput(countries);
    const sellerFilters: Record<string, any> = {};
    if (parsedCountries.length > 0) {
        sellerFilters.country = { in: parsedCountries };
    }

    const [shops, total] = await Promise.all([
        prisma.shops.findMany({
            where: {
                ...filters,
                ...(Object.keys(sellerFilters).length > 0 && {
                    sellers: {
                        country: sellerFilters.country
                    }
                })
            },
            skip,
            take: parsedLimit,
            include: {
                sellers: {
                    select: {
                        id: true,
                        name: true,
                        country: true,
                    }
                },
                products: {
                    take: 4,
                    where: { isDeleted: false },
                    select: {
                        id: true,
                        images: {
                            take: 1,
                            select: { file_url: true }
                        }
                    }
                },
                _count: {
                    select: { products: true }
                },
                images: {
                    where: {
                        type: { in: ['avatar', 'cover'] }
                    },
                    select: {
                        file_url: true,
                        type: true
                    }
                }
            }
        }),
        prisma.shops.count({
            where: {
                ...filters,
                ...(Object.keys(sellerFilters).length > 0 && {
                    sellers: {
                        country: sellerFilters.country
                    }
                })
            }
        })
    ]);

    return {
        shops,
        pagination: {
            total,
            page: parsedPage,
            totalPages: Math.ceil(total / parsedLimit)
        }
    };
};
