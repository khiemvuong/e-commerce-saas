/**
 * Event Routes
 * 
 * Defines HTTP routes for event endpoints.
 */

import { Router } from 'express';
import { eventController } from './eventController';
import isAuthenticated from '@packages/middleware/isAuthenticated';

const router = Router();

// ==========================================
// Public Routes (no authentication required)
// ==========================================

/**
 * @route GET /api/get-all-events
 * @desc Get all events with pagination
 * @access Public
 */
router.get('/get-all-events', eventController.getAll);

/**
 * @route GET /api/get-filtered-offers
 * @desc Get filtered events
 * @access Public
 */
router.get('/get-filtered-offers', eventController.getFiltered);

// ==========================================
// Protected Routes (seller authentication required)
// ==========================================

/**
 * @route GET /api/get-my-events
 * @desc Get seller's own events
 * @access Private (Seller)
 */
router.get('/get-shop-events', isAuthenticated, eventController.getMy);

/**
 * @route POST /api/create-events
 * @desc Convert a product to an event
 * @access Private (Seller)
 */
router.post('/create-events', isAuthenticated, eventController.create);

/**
 * @route PUT /api/edit-event/:productId
 * @desc Edit an existing event
 * @access Private (Seller)
 */
router.put('/edit-event/:productId', isAuthenticated, eventController.edit);

export { router as eventRoutes };
