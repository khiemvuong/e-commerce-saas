/**
 * Image Routes
 */

import { Router } from 'express';
import { imageController } from './imageController';
import isAuthenticated from '@packages/middleware/isAuthenticated';

const router = Router();

/**
 * @route POST /api/upload-product-image
 * @desc Upload a product image to ImageKit
 * @access Private (Seller)
 */
router.post('/upload-product-image', isAuthenticated, imageController.upload);

/**
 * @route DELETE /api/delete-product-image
 * @desc Delete a product image from ImageKit
 * @access Private (Seller)
 */
router.delete('/delete-product-image', isAuthenticated, imageController.delete);

export { router as imageRoutes };
