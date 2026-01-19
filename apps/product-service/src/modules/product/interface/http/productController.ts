/**
 * Product Controller
 * 
 * HTTP layer - handles requests, validates input, calls use cases/queries,
 * and formats responses.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthError, ValidationError } from '@packages/error-handler';

// Use Cases
import { 
    makeCreateProduct,
    makeEditProduct,
    makeDeleteProduct,
    makeRestoreProduct,
} from '../../application/useCases';

// Queries
import {
    getProductDetails,
    getAllProducts,
    getFilteredProducts,
    getMyProducts,
    searchProducts,
} from '../../application/queries';

// Infrastructure
import { getProductRepository } from '../../infrastructure/PrismaProductRepository';

// Initialize repository and use cases
const productRepository = getProductRepository();
const createProduct = makeCreateProduct({ productRepository });
const editProduct = makeEditProduct({ productRepository });
const deleteProduct = makeDeleteProduct({ productRepository });
const restoreProduct = makeRestoreProduct({ productRepository });

/**
 * Product Controller
 */
export const productController = {
    /**
     * Create a new product
     * POST /api/create-product
     */
    async create(req: any, res: Response, next: NextFunction) {
        try {
            // Check seller authentication
            if (!req.seller?.id) {
                return next(new AuthError('Only sellers can create products'));
            }

            if (!req.seller.shop?.id) {
                return next(new ValidationError('You don\'t have a shop. Please create a shop first'));
            }

            const product = await createProduct({
                ...req.body,
                shopId: req.seller.shop.id,
            });

            return res.status(201).json({ success: true, newProduct: product });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Edit an existing product
     * PUT /api/edit-product/:id
     */
    async update(req: any, res: Response, next: NextFunction) {
        try {
            // Support both :id and :productId params for backward compatibility
            const productId = req.params.id || req.params.productId;

            if (!req.seller?.shop?.id) {
                return next(new AuthError('Please login as seller'));
            }

            const product = await editProduct({
                productId,
                shopId: req.seller.shop.id,
                ...req.body,
            });

            return res.status(200).json({ success: true, product });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Delete a product (soft delete)
     * DELETE /api/delete-product/:productId
     */
    async delete(req: any, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params;

            if (!req.seller?.shop?.id) {
                return next(new AuthError('Please login as seller'));
            }

            const result = await deleteProduct({
                productId,
                shopId: req.seller.shop.id,
            });

            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Restore a deleted product
     * POST /api/restore-product/:productId
     */
    async restore(req: any, res: Response, next: NextFunction) {
        try {
            const { productId } = req.params;

            if (!req.seller?.shop?.id) {
                return next(new AuthError('Please login as seller'));
            }

            const result = await restoreProduct({
                productId,
                shopId: req.seller.shop.id,
            });

            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get product details by slug
     * GET /api/product/:slug
     */
    async getDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params;

            const product = await getProductDetails({ slug });

            return res.status(200).json({ success: true, product });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get all products with pagination
     * GET /api/get-products
     */
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = parseInt((req.query.limit as string) || '20', 10);
            const type = (req.query.type as string) || 'topSales';

            const result = await getAllProducts({
                page,
                limit,
                type: type === 'latest' ? 'latest' : 'topSales',
            });

            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get filtered products
     * GET /api/get-filtered-products
     */
    async getFiltered(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await getFilteredProducts({
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
     * Get seller's own products
     * GET /api/get-my-products
     */
    async getMy(req: any, res: Response, next: NextFunction) {
        try {
            if (!req.seller?.id) {
                return next(new AuthError('Please login as seller to view shop products'));
            }

            if (!req.seller.shop?.id) {
                return next(new ValidationError('You don\'t have a shop. Please create a shop first'));
            }

            const products = await getMyProducts({
                shopId: req.seller.shop.id,
            });

            return res.status(200).json({ success: true, products });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Search products
     * GET /api/search-products
     */
    async search(req: Request, res: Response, next: NextFunction) {
        try {
            const keyword = (req.query.keyword as string) || '';
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = parseInt((req.query.limit as string) || '12', 10);

            if (!keyword.trim()) {
                return res.json({ products: [], pagination: { total: 0, page: 1, totalPages: 0 } });
            }

            const result = await searchProducts({ keyword, page, limit });

            return res.json(result);
        } catch (error) {
            return next(error);
        }
    },
};
