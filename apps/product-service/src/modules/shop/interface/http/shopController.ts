/**
 * Shop Controller
 */

import { Request, Response, NextFunction } from 'express';
import { getFilteredShops, getTopShops } from '../../application/queries';

/**
 * Shop Controller
 */
export const shopController = {
    /**
     * Get filtered shops
     * GET /api/get-filtered-shops
     */
    async getFiltered(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await getFilteredShops({
                search: req.query.search as string,
                categories: req.query.categories as string | string[],
                countries: req.query.countries as string | string[],
                page: parseInt((req.query.page as string) || '1', 10),
                limit: parseInt((req.query.limit as string) || '12', 10),
            });

            return res.json(result);
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get top shops
     * GET /api/top-shops
     */
    async getTop(req: Request, res: Response, next: NextFunction) {
        try {
            const shops = await getTopShops();

            return res.status(200).json({ shops });
        } catch (error) {
            return next(error);
        }
    },
};
