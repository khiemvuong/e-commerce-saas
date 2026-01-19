/**
 * Product Domain Entity
 * 
 * Defines the Product entity structure, validation rules, and factory functions.
 * This is the core business entity - pure domain logic, no dependencies on infrastructure.
 */

import { ProductValidationError } from '../../../_lib/errors/ProductErrors';

export namespace Product {
    /**
     * Full Product entity type (from database)
     */
    export interface Type {
        id: string;
        title: string;
        slug: string;
        short_description: string;
        detailed_description: string;
        warranty?: string;
        brand?: string;
        video_url?: string;
        category: string;
        sub_category?: string;
        tags: string[];
        colors: string[];
        sizes: string[];
        custom_properties: any[];
        custom_specifications: any;
        stock: number;
        sale_price: number;
        regular_price: number;
        rating?: number;
        totalSales?: number;
        cash_on_delivery?: string;
        discount_codes: string[];
        shopId: string;
        images: ProductImage[];
        isDeleted: boolean;
        deletedAt?: Date | null;
        starting_date?: Date | null;
        ending_date?: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }

    export interface ProductImage {
        id?: string;
        file_url: string;
        fileId: string;
    }

    /**
     * Input for creating a new product
     */
    export interface CreateInput {
        title: string;
        short_description: string;
        detailed_description: string;
        slug?: string; // Optional - will be auto-generated from title if not provided
        category: string;
        stock: number;
        sale_price: number;
        regular_price: number;
        shopId: string;
        warranty?: string;
        brand?: string;
        video_url?: string;
        sub_category?: string;
        tags?: string[];
        colors?: string[];
        sizes?: string[];
        custom_properties?: any[];
        custom_specifications?: any;
        cash_on_delivery?: string;
        discount_codes?: string[];
        images?: ProductImage[];
    }

    /**
     * Input for updating an existing product
     */
    export interface UpdateInput {
        id: string;
        title?: string;
        short_description?: string;
        detailed_description?: string;
        slug?: string; // Will be auto-updated if title changes
        category?: string;
        sub_category?: string;
        stock?: number;
        sale_price?: number;
        regular_price?: number;
        warranty?: string;
        brand?: string;
        video_url?: string;
        tags?: string[];
        colors?: string[];
        sizes?: string[];
        custom_properties?: any[];
        custom_specifications?: any;
        cash_on_delivery?: string;
        discount_codes?: string[];
        images?: ProductImage[];
    }

    /**
     * Filter options for querying products
     */
    export interface FilterOptions {
        categories?: string[];
        priceMin?: number;
        priceMax?: number;
        colors?: string[];
        sizes?: string[];
        includeDeleted?: boolean;
        excludeEvents?: boolean;
    }

    /**
     * Validates product creation input
     * @throws ProductValidationError if validation fails
     */
    export const validateCreate = (input: CreateInput): void => {
        const errors: string[] = [];

        if (!input.title?.trim()) {
            errors.push('Title is required');
        }

        if (!input.short_description?.trim()) {
            errors.push('Short description is required');
        }

        if (!input.detailed_description?.trim()) {
            errors.push('Detailed description is required');
        }

        // Slug removed - will be auto-generated

        if (!input.category?.trim()) {
            errors.push('Category is required');
        }

        if (input.stock === undefined || input.stock < 0) {
            errors.push('Stock must be a non-negative number');
        }

        if (!input.sale_price || input.sale_price <= 0) {
            errors.push('Sale price must be a positive number');
        }

        if (!input.regular_price || input.regular_price <= 0) {
            errors.push('Regular price must be a positive number');
        }

        if (!input.images || input.images.length === 0) {
            errors.push('At least one image is required');
        }

        if (!input.shopId) {
            errors.push('Shop ID is required');
        }

        if (errors.length > 0) {
            throw new ProductValidationError('Validation failed', errors);
        }
    };

    /**
     * Validates product update input
     * @throws ProductValidationError if validation fails
     */
    export const validateUpdate = (input: UpdateInput): void => {
        const errors: string[] = [];

        if (!input.id) {
            errors.push('Product ID is required');
        }

        if (input.stock !== undefined && input.stock < 0) {
            errors.push('Stock must be a non-negative number');
        }

        if (input.sale_price !== undefined && input.sale_price <= 0) {
            errors.push('Sale price must be a positive number');
        }

        if (input.regular_price !== undefined && input.regular_price <= 0) {
            errors.push('Regular price must be a positive number');
        }

        if (errors.length > 0) {
            throw new ProductValidationError('Validation failed', errors);
        }
    };

    /**
     * Converts Vietnamese characters to ASCII equivalents
     */
    const vietnameseMap: Record<string, string> = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
        'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
        'đ': 'd',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
        'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    };

    const removeVietnameseTones = (str: string): string => {
        return str.split('').map(char => vietnameseMap[char] || char).join('');
    };

    /**
     * Generates a URL-friendly slug from a title (supports Vietnamese)
     */
    export const generateSlug = (title: string): string => {
        return removeVietnameseTones(title)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
            .replace(/\s+/g, '-')          // Replace spaces with hyphens
            .replace(/-+/g, '-')           // Replace multiple hyphens with single hyphen
            .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
    };

    /**
     * Parses tags input (can be string or array)
     */
    export const parseTags = (tags: string | string[] | undefined): string[] => {
        if (!tags) return [];
        if (Array.isArray(tags)) return tags;
        return tags.split(',').map(tag => tag.trim()).filter(Boolean);
    };

    /**
     * Checks if a product is an event (has start and end dates)
     */
    export const isEvent = (product: Type): boolean => {
        return product.starting_date !== null && product.ending_date !== null;
    };

    /**
     * Checks if a product is deleted
     */
    export const isDeleted = (product: Type): boolean => {
        return product.isDeleted === true;
    };

    /**
     * Calculates discount percentage
     */
    export const getDiscountPercentage = (product: Type): number => {
        if (product.regular_price <= 0) return 0;
        return Math.round((1 - product.sale_price / product.regular_price) * 100);
    };
}
