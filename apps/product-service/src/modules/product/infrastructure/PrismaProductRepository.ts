/**
 * Prisma Product Repository Implementation
 * 
 * Implements the ProductRepository interface using Prisma ORM.
 * This is the infrastructure layer - handles all database operations.
 */

import prisma from '@packages/libs/prisma';
import { Product } from '../domain/Product';
import { ProductRepository, ProductQueryOptions } from '../domain/ProductRepository';
import { PaginatedResponse } from '../../../_lib/types';
import { PRODUCT_FULL_SELECT } from '../../../constants/productSelect';

// Extended select to include shopId and updatedAt for full type compatibility
const PRODUCT_REPOSITORY_SELECT = {
    ...PRODUCT_FULL_SELECT,
    shopId: true,
    updatedAt: true,
};

/**
 * Factory function to create a Prisma-based Product Repository
 */
export const makePrismaProductRepository = (): ProductRepository => {
    return {
        async findById(id: string): Promise<Product.Type | null> {
            const product = await prisma.products.findUnique({
                where: { id },
                select: PRODUCT_REPOSITORY_SELECT,
            });
            return product as unknown as Product.Type | null;
        },

        async findBySlug(slug: string): Promise<Product.Type | null> {
            const product = await prisma.products.findUnique({
                where: { slug },
                select: PRODUCT_REPOSITORY_SELECT,
            });
            return product as unknown as Product.Type | null;
        },

        async findByShopId(shopId: string, options: ProductQueryOptions = {}): Promise<Product.Type[]> {
            const {
                page = 1,
                limit = 50,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                includeDeleted = false,
                excludeEvents = true,
            } = options;

            const skip = (page - 1) * limit;

            const where: any = {
                shopId,
                ...(includeDeleted ? {} : { isDeleted: false }),
            };

            // Exclude events (products with both starting_date and ending_date)
            if (excludeEvents) {
                where.OR = [
                    { starting_date: null },
                    { ending_date: null },
                ];
            }

            const products = await prisma.products.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: PRODUCT_REPOSITORY_SELECT,
            });

            return products as unknown as Product.Type[];
        },

        async findMany(
            filters: Product.FilterOptions,
            options: ProductQueryOptions = {}
        ): Promise<PaginatedResponse<Product.Type>> {
            const {
                page = 1,
                limit = 12,
                sortBy = 'createdAt',
                sortOrder = 'desc',
                includeDeleted = false,
                excludeEvents = true,
            } = options;

            const skip = (page - 1) * limit;

            // Build where clause
            const where: any = {
                ...(includeDeleted ? {} : { isDeleted: false }),
            };

            // Exclude events
            if (excludeEvents) {
                where.AND = [
                    { starting_date: null },
                    { ending_date: null },
                ];
            }

            // Apply filters
            if (filters.categories && filters.categories.length > 0) {
                where.category = { in: filters.categories };
            }

            if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
                where.sale_price = {};
                if (filters.priceMin !== undefined) {
                    where.sale_price.gte = filters.priceMin;
                }
                if (filters.priceMax !== undefined) {
                    where.sale_price.lte = filters.priceMax;
                }
            }

            if (filters.colors && filters.colors.length > 0) {
                where.colors = { hasSome: filters.colors };
            }

            if (filters.sizes && filters.sizes.length > 0) {
                where.sizes = { hasSome: filters.sizes };
            }

            // Execute queries in parallel
            const [products, total] = await Promise.all([
                prisma.products.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { [sortBy]: sortOrder },
                    select: PRODUCT_REPOSITORY_SELECT,
                }),
                prisma.products.count({ where }),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                data: products as unknown as Product.Type[],
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            };
        },

        async slugExists(slug: string, excludeId?: string): Promise<boolean> {
            const count = await prisma.products.count({
                where: {
                    slug,
                    ...(excludeId ? { id: { not: excludeId } } : {}),
                },
            });
            return count > 0;
        },

        async create(input: Product.CreateInput): Promise<Product.Type> {
            const {
                images = [],
                tags = [],
                colors = [],
                sizes = [],
                custom_properties = [],
                custom_specifications = {},
                discount_codes = [],
                sub_category,
                slug,
                ...productData
            } = input;

            const product = await prisma.products.create({
                data: {
                    ...productData,
                    slug: slug || Product.generateSlug(input.title), // Ensure slug is always a string
                    sub_category: sub_category || '',
                    tags: Array.isArray(tags) ? tags : Product.parseTags(tags as any),
                    colors: colors || [],
                    sizes: sizes || [],
                    custom_properties: custom_properties || [],
                    custom_specifications: custom_specifications || {},
                    discount_codes: discount_codes || [],
                    starting_date: null,
                    ending_date: null,
                    images: {
                        create: images
                            .filter((img: any) => img && img.file_url && img.fileId)
                            .map((img: any) => ({
                                file_url: img.file_url,
                                fileId: img.fileId,
                            })),
                    },
                },
                include: { images: true },
            });

            return product as unknown as Product.Type;
        },

        async update(input: Product.UpdateInput): Promise<Product.Type> {
            const { id, images, tags, ...updateData } = input;

            // Build update data
            const data: any = { ...updateData };

            // Handle tags
            if (tags !== undefined) {
                data.tags = Array.isArray(tags) ? tags : Product.parseTags(tags as any);
            }

            // Handle image updates if provided
            if (images !== undefined) {
                // Delete existing images (use productsId as per Prisma schema)
                await prisma.images.deleteMany({
                    where: { productsId: id },
                });

                // Create new images
                data.images = {
                    create: images
                        .filter((img: any) => img && img.file_url && img.fileId)
                        .map((img: any) => ({
                            file_url: img.file_url,
                            fileId: img.fileId,
                        })),
                };
            }

            const product = await prisma.products.update({
                where: { id },
                data,
                include: { images: true },
            });

            return product as unknown as Product.Type;
        },

        async delete(id: string): Promise<void> {
            // Delete associated images first (use productsId as per Prisma schema)
            await prisma.images.deleteMany({
                where: { productsId: id },
            });

            // Delete the product
            await prisma.products.delete({
                where: { id },
            });
        },

        async softDelete(id: string): Promise<Product.Type> {
            const product = await prisma.products.update({
                where: { id },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                },
                select: PRODUCT_REPOSITORY_SELECT,
            });

            return product as unknown as Product.Type;
        },

        async restore(id: string): Promise<Product.Type> {
            const product = await prisma.products.update({
                where: { id },
                data: {
                    isDeleted: false,
                    deletedAt: null,
                },
                select: PRODUCT_REPOSITORY_SELECT,
            });

            return product as unknown as Product.Type;
        },

        async count(filters: Product.FilterOptions): Promise<number> {
            const where: any = {
                ...(filters.includeDeleted ? {} : { isDeleted: false }),
            };

            if (filters.excludeEvents) {
                where.AND = [
                    { starting_date: null },
                    { ending_date: null },
                ];
            }

            if (filters.categories && filters.categories.length > 0) {
                where.category = { in: filters.categories };
            }

            return prisma.products.count({ where });
        },
    };
};

/**
 * Singleton instance of the repository
 */
let repositoryInstance: ProductRepository | null = null;

/**
 * Get or create the product repository instance
 */
export const getProductRepository = (): ProductRepository => {
    if (!repositoryInstance) {
        repositoryInstance = makePrismaProductRepository();
    }
    return repositoryInstance;
};
