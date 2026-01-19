/**
 * Category Controller
 */

import { Request, Response, NextFunction } from 'express';
import { getCategories, getCategoriesWithImages } from '../../application/queries';

/**
 * Category Controller
 */
export const categoryController = {
    /**
     * Get all categories
     * GET /api/get-categories
     */
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await getCategories();

            if (!result.categories.length) {
                return res.status(404).json({ message: 'Categories not found' });
            }

            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get categories with images
     * GET /api/get-categories-with-images
     */
    async getWithImages(req: Request, res: Response, next: NextFunction) {
        try {
            const categories = await getCategoriesWithImages();

            return res.status(200).json({ success: true, categories });
        } catch (error) {
            return next(error);
        }
    },
};
