/**
 * Get All Events Query
 * 
 * Fetches paginated list of all events.
 */

import prisma from '@packages/libs/prisma';
import { EVENT_CARD_SELECT } from '../../../../constants/productSelect';

/**
 * Input for getting all events
 */
export interface GetAllEventsInput {
    page?: number;
    limit?: number;
}

/**
 * Output type for getAllEvents
 */
export interface GetAllEventsOutput {
    events: any[];
    top10BySales: any[];
    total: number;
    currentPage: number;
    totalPages: number;
}

/**
 * Get all events with pagination
 */
export const getAllEvents = async (input: GetAllEventsInput = {}): Promise<GetAllEventsOutput> => {
    const { page = 1, limit = 20 } = input;
    const skip = Math.max(0, (page - 1) * limit);

    // Base filter: only events (products with both dates set) that aren't deleted
    const baseFilter = {
        AND: [
            { starting_date: { not: null } },
            { ending_date: { not: null } },
            { OR: [
                { isDeleted: false },
                { isDeleted: null }
            ]}
        ],
    };

    const [events, total, top10BySales] = await Promise.all([
        prisma.products.findMany({
            where: baseFilter,
            skip,
            take: limit,
            select: {
                ...EVENT_CARD_SELECT,
                short_description: true,
            },
            orderBy: { totalSales: 'desc' },
        }),
        prisma.products.count({ where: baseFilter }),
        prisma.products.findMany({
            where: baseFilter,
            take: 10,
            orderBy: { totalSales: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                sale_price: true,
                regular_price: true,
                rating: true,
                totalSales: true,
                starting_date: true,
                ending_date: true,
                images: { take: 1, select: { file_url: true } },
            },
        }),
    ]);

    return {
        events,
        top10BySales,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
    };
};
