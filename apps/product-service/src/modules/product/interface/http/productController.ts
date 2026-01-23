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

import {
    getProductDetails,
    getMyProducts,
    // Use cached versions for public-facing endpoints
    getAllProductsCached,
    getFilteredProductsCached,
    searchProductsCached,
    getBestSellersCached,
    getFeaturedProductsCached,
    getDealsOfTheDayCached,
    invalidateProductCaches,
    // Enhanced search with fuzzy matching
    enhancedSearchProducts,
    getSearchSuggestions,
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

            // Invalidate product caches so new product appears in lists
            await invalidateProductCaches();

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

            // Invalidate product caches so updated product reflects in lists
            await invalidateProductCaches();

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

            // Invalidate product caches so deleted product is removed from lists
            await invalidateProductCaches();

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

            // Using cached version for performance
            const result = await getAllProductsCached({
                page,
                limit,
                type: type === 'latest' ? 'latest' : 'topSales',
            });

            // Include cache info in response for monitoring
            return res.status(200).json({
                ...result,
                _fromCache: result._cacheInfo.fromCache,
            });
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
            // Using cached version for performance
            const result = await getFilteredProductsCached({
                search: req.query.search as string,
                priceRange: req.query.priceRange as string,
                categories: req.query.categories as string | string[],
                colors: req.query.colors as string | string[],
                sizes: req.query.sizes as string | string[],
                page: parseInt((req.query.page as string) || '1', 10),
                limit: parseInt((req.query.limit as string) || '12', 10),
            });

            return res.json({
                ...result,
                _fromCache: result._cacheInfo.fromCache,
            });
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

            // Using cached version for performance
            const result = await searchProductsCached({ keyword, page, limit });

            return res.json({
                ...result,
                _fromCache: result._cacheInfo.fromCache,
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get best sellers
     * GET /api/best-sellers
     */
    async getBestSellers(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = parseInt((req.query.limit as string) || '8', 10);
            // Using cached version for performance
            const result = await getBestSellersCached({ limit });
            return res.status(200).json({
                ...result,
                _fromCache: result._cacheInfo.fromCache,
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get featured products (highest rated)
     * GET /api/featured-products
     */
    async getFeaturedProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = parseInt((req.query.limit as string) || '8', 10);
            // Using cached version for performance
            const result = await getFeaturedProductsCached({ limit });
            return res.status(200).json({
                ...result,
                _fromCache: result._cacheInfo.fromCache,
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get deals of the day
     * GET /api/deals-of-the-day
     */
    async getDealsOfTheDay(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = parseInt((req.query.limit as string) || '6', 10);
            // Using cached version for performance
            const result = await getDealsOfTheDayCached({ limit });
            return res.status(200).json({
                ...result,
                _fromCache: result._cacheInfo.fromCache,
            });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Enhanced search with fuzzy matching
     * GET /api/enhanced-search
     * Supports typo tolerance, suggestions, and "did you mean?"
     */
    async enhancedSearch(req: Request, res: Response, next: NextFunction) {
        try {
            const keyword = (req.query.keyword as string) || '';
            const page = parseInt((req.query.page as string) || '1', 10);
            const limit = parseInt((req.query.limit as string) || '12', 10);

            if (!keyword.trim()) {
                return res.json({
                    products: [],
                    suggestions: [],
                    didYouMean: null,
                    pagination: { total: 0, page: 1, totalPages: 0 },
                    searchMeta: {
                        originalKeyword: '',
                        matchedVariations: [],
                        fuzzyMatchCount: 0,
                        exactMatchCount: 0,
                    },
                });
            }

            const result = await enhancedSearchProducts({ keyword, page, limit });
            return res.json(result);
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get search suggestions (autocomplete)
     * GET /api/search-suggestions
     * For real-time search-as-you-type functionality
     */
    async getSuggestions(req: Request, res: Response, next: NextFunction) {
        try {
            const keyword = (req.query.keyword as string) || '';
            const limit = parseInt((req.query.limit as string) || '8', 10);

            const result = await getSearchSuggestions(keyword, limit);
            return res.json({
                success: true,
                ...result,
            });
        } catch (error) {
            return next(error);
        }
    },
};
