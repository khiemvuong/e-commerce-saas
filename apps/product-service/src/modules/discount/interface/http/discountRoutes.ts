/**
 * Discount Routes
 */

import { Router } from 'express';
import { discountController } from './discountController';
import isAuthenticated from '@packages/middleware/isAuthenticated';

const router = Router();

/**
 * @route POST /api/create-discount-code
 * @desc Create a new discount code
 * @access Private (Seller)
 */
router.post('/create-discount-code', isAuthenticated, discountController.create);

/**
 * @route GET /api/get-discount-codes
 * @desc Get all discount codes for the seller
 * @access Private (Seller)
 */
router.get('/get-discount-codes', isAuthenticated, discountController.getAll);

/**
 * @route DELETE /api/delete-discount-code/:id
 * @desc Delete a discount code
 * @access Private (Seller)
 */
router.delete('/delete-discount-code/:id', isAuthenticated, discountController.delete);

export { router as discountRoutes };
