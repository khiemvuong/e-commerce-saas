/**
 * Category Routes
 */

import { Router } from 'express';
import { categoryController } from './categoryController';

const router = Router();

/**
 * @route GET /api/get-categories
 * @desc Get all categories
 * @access Public
 */
router.get('/get-categories', categoryController.getAll);

/**
 * @route GET /api/get-categories-with-images
 * @desc Get categories with product images
 * @access Public
 */
router.get('/get-categories-with-images', categoryController.getWithImages);

export { router as categoryRoutes };
