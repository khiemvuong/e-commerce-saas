/**
 * Product Repository Interface
 * 
 * Defines the contract for product data access.
 * This is a domain-level abstraction - implementations live in infrastructure layer.
 */

import { Product } from './Product';
import { PaginationOptions, PaginatedResponse } from '../../../_lib/types';

/**
 * Query options for finding products
 */
export interface ProductQueryOptions extends PaginationOptions {
    sortBy?: 'createdAt' | 'totalSales' | 'rating' | 'sale_price';
    sortOrder?: 'asc' | 'desc';
    includeDeleted?: boolean;
    excludeEvents?: boolean;
}

/**
 * Product Repository Interface
 */
export interface ProductRepository {
    /**
     * Find a product by its ID
     */
    findById(id: string): Promise<Product.Type | null>;

    /**
     * Find a product by its slug
     */
    findBySlug(slug: string): Promise<Product.Type | null>;

    /**
     * Find all products by shop ID
     */
    findByShopId(shopId: string, options?: ProductQueryOptions): Promise<Product.Type[]>;

    /**
     * Find products with pagination
     */
    findMany(
        filters: Product.FilterOptions,
        options?: ProductQueryOptions
    ): Promise<PaginatedResponse<Product.Type>>;

    /**
     * Check if a slug already exists
     */
    slugExists(slug: string, excludeId?: string): Promise<boolean>;

    /**
     * Create a new product
     */
    create(input: Product.CreateInput): Promise<Product.Type>;

    /**
     * Update an existing product
     */
    update(input: Product.UpdateInput): Promise<Product.Type>;

    /**
     * Permanently delete a product
     */
    delete(id: string): Promise<void>;

    /**
     * Soft delete a product (mark as deleted)
     */
    softDelete(id: string): Promise<Product.Type>;

    /**
     * Restore a soft-deleted product
     */
    restore(id: string): Promise<Product.Type>;

    /**
     * Count products matching filters
     */
    count(filters: Product.FilterOptions): Promise<number>;
}
