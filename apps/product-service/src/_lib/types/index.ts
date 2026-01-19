/**
 * Shared Types for Product Service
 * 
 * Common type definitions used across multiple modules
 */

// ============================================
// Pagination Types
// ============================================

export interface PaginationOptions {
    page?: number;
    limit?: number;
}

export interface PaginationResult {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationResult;
}

// ============================================
// Common Query Options
// ============================================

export interface QueryOptions extends PaginationOptions {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeDeleted?: boolean;
}

export interface FilterOptions {
    categories?: string[];
    priceMin?: number;
    priceMax?: number;
    colors?: string[];
    sizes?: string[];
    rating?: number;
    inStock?: boolean;
}

// ============================================
// Image Types
// ============================================

export interface ProductImage {
    id: string;
    file_url: string;
    fileId: string;
}

export interface ImageUploadResult {
    file_url: string;
    fileId: string;
    thumbnailUrl?: string;
}

// ============================================
// Response Types
// ============================================

export interface SuccessResponse<T = any> {
    success: true;
    data?: T;
    message?: string;
}

export interface ErrorResponse {
    success: false;
    error: string;
    code?: string;
    details?: any;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// ============================================
// Entity Base Types
// ============================================

export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SoftDeletableEntity extends BaseEntity {
    deleted: boolean;
    deletedAt?: Date;
}

// ============================================
// Shop Types (Shared)
// ============================================

export interface ShopReference {
    id: string;
    name: string;
    avatar?: string;
}

// ============================================
// Seller Types (Shared)
// ============================================

export interface SellerContext {
    id: string;
    shopId: string;
    name: string;
    email: string;
}

// ============================================
// Price Types
// ============================================

export interface PriceRange {
    min: number;
    max: number;
}

// ============================================
// Variant Types
// ============================================

export interface ProductVariant {
    color?: string;
    size?: string;
    stock: number;
    price?: number;
}

// ============================================
// Category Types
// ============================================

export interface CategoryInfo {
    category: string;
    subCategory?: string;
}

// ============================================
// Stock Batch Types
// ============================================

export interface StockBatchInfo {
    id: string;
    quantity: number;
    batchNumber: string;
    expirationDate?: Date;
    notes?: string;
}

// ============================================
// Utility Types
// ============================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Makes all properties of T optional recursively
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract the return type of a promise
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;
