/**
 * Event Controller
 * 
 * HTTP layer for event operations.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthError } from '@packages/error-handler';

// Use Cases
import { createEvent, editEvent } from '../../application/useCases';

// Queries
import { getAllEvents, getFilteredEvents, getMyEvents } from '../../application/queries';

/**
 * Event Controller
 */
export const eventController = {
    /**
     * Create an event from an existing product
     * POST /api/create-events
     */
    async create(req: any, res: Response, next: NextFunction) {
        try {
            if (!req.seller?.shop?.id) {
                return next(new AuthError('You need to be a seller with a shop to create events'));
            }

            const event = await createEvent({
                productId: req.body.productId,
                shopId: req.seller.shop.id,
                starting_date: req.body.starting_date,
                ending_date: req.body.ending_date,
                sale_price: req.body.sale_price,
            });

            return res.status(200).json({ success: true, event });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Edit an existing event
     * PUT /api/edit-event/:productId
     */
    async edit(req: any, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params;

            if (!req.seller?.shop?.id) {
                return next(new AuthError('You need to be a seller with a shop to edit events'));
            }

            const event = await editEvent({
                productId,
                shopId: req.seller.shop.id,
                starting_date: req.body.starting_date,
                ending_date: req.body.ending_date,
                sale_price: req.body.sale_price,
            });

            return res.status(200).json({ success: true, event });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get all events with pagination
     * GET /api/get-all-events
     */
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = parseInt((req.query.limit as string) || '20', 10);

            const result = await getAllEvents({ page, limit });

            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get filtered events
     * GET /api/get-filtered-offers
     */
    async getFiltered(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await getFilteredEvents({
                priceRange: req.query.priceRange as string,
                categories: req.query.categories as string | string[],
                colors: req.query.colors as string | string[],
                sizes: req.query.sizes as string | string[],
                page: parseInt((req.query.page as string) || '1', 10),
                limit: parseInt((req.query.limit as string) || '12', 10),
            });

            return res.json(result);
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get seller's own events
     * GET /api/get-my-events
     */
    async getMy(req: any, res: Response, next: NextFunction) {
        try {
            if (!req.seller?.shop?.id) {
                return next(new AuthError('Please login as seller to view shop events'));
            }

            const events = await getMyEvents({
                shopId: req.seller.shop.id,
            });

            return res.status(200).json({ success: true, events });
        } catch (error) {
            return next(error);
        }
    },
};
