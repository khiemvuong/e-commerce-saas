/**
 * Product Routes
 * 
 * Defines HTTP routes for product endpoints.
 */

import { Router } from 'express';
import { productController } from './productController';
import isAuthenticated from '@packages/middleware/isAuthenticated';

const router = Router();

// ==========================================
// Public Routes (no authentication required)
// ==========================================

/**
 * @route GET /api/get-all-products
 * @desc Get all products with pagination
 * @access Public
 */
router.get('/get-all-products', productController.getAll);

/**
 * @route GET /api/get-product/:slug
 * @desc Get product details by slug
 * @access Public
 */
router.get('/get-product/:slug', productController.getDetails);

/**
 * @route GET /api/get-filtered-products
 * @desc Get filtered products
 * @access Public
 */
router.get('/get-filtered-products', productController.getFiltered);

/**
 * @route GET /api/search-products
 * @desc Search products by keyword
 * @access Public
 */
router.get('/search-products', productController.search);

// ==========================================
// Protected Routes (seller authentication required)
// ==========================================



/**
 * @route POST /api/create-product
 * @desc Create a new product
 * @access Private (Seller)
 */
router.post('/create-product', isAuthenticated, productController.create);

/**
 * @route PUT /api/edit-product/:id
 * @desc Update an existing product
 * @access Private (Seller)
 */
router.put('/edit-product/:id', isAuthenticated, productController.update);

/**
 * @route DELETE /api/delete-product/:productId
 * @desc Soft delete a product
 * @access Private (Seller)
 */
router.delete('/delete-product/:productId', isAuthenticated, productController.delete);

/**
 * @route PUT /api/restore-product/:productId
 * @desc Restore a soft-deleted product
 * @access Private (Seller)
 */
router.put('/restore-product/:productId', isAuthenticated, productController.restore);

/**
 * @route GET /api/get-shop-products
 * @desc Get seller's shop products
 * @access Private (Seller)
 */
router.get('/get-shop-products', isAuthenticated, productController.getMy);

export { router as productRoutes };

