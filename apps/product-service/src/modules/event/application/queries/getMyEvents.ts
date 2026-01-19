/**
 * Get My Events Query
 * 
 * Fetches events belonging to a specific seller's shop.
 */

import prisma from '@packages/libs/prisma';
import { PRODUCT_FULL_SELECT } from '../../../../constants/productSelect';

/**
 * Input for getting seller's events
 */
export interface GetMyEventsInput {
    shopId: string;
}

/**
 * Get seller's own events
 */
export const getMyEvents = async (input: GetMyEventsInput) => {
    const { shopId } = input;

    const events = await prisma.products.findMany({
        where: {
            shopId,
            starting_date: { not: null },
            ending_date: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        select: PRODUCT_FULL_SELECT,
    });

    return events;
};
