/**
 * Shop Routes
 */

import { Router } from 'express';
import { shopController } from './shopController';

const router = Router();

/**
 * @route GET /api/get-filtered-shops
 * @desc Get filtered shops with pagination
 * @access Public
 */
router.get('/get-filtered-shops', shopController.getFiltered);

/**
 * @route GET /api/top-shops
 * @desc Get top 10 shops by sales
 * @access Public
 */
router.get('/top-shops', shopController.getTop);

export { router as shopRoutes };
