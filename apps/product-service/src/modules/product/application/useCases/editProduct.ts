/**
 * Edit Product Use Case
 * 
 * Handles the business logic for updating an existing product.
 */

import { Product } from '../../domain/Product';
import { ProductRepository } from '../../domain/ProductRepository';
import { 
    ProductNotFoundError, 
    ProductAuthorizationError,
} from '../../../../_lib/errors/ProductErrors';

/**
 * Dependencies required by this use case
 */
export interface EditProductDeps {
    productRepository: ProductRepository;
}

/**
 * Input for editing a product
 */
export interface EditProductInput {
    productId: string;
    shopId: string; // For authorization check
    title?: string;
    short_description?: string;
    detailed_description?: string;
    category?: string;
    sub_category?: string;
    stock?: number | string;
    sale_price?: number | string;
    regular_price?: number | string;
    warranty?: string;
    custom_specifications?: any;
    brand?: string;
    video_url?: string;
    tags?: string | string[];
    colors?: string[];
    sizes?: string[];
    custom_properties?: any[];
    cash_on_delivery?: string;
    discount_codes?: string[];
    images?: Product.ProductImage[];
}

/**
 * Edit Product Use Case Type
 */
export type EditProduct = (input: EditProductInput) => Promise<Product.Type>;

/**
 * Generates a unique slug by appending a number if slug exists
 */
const generateUniqueSlug = async (
    baseSlug: string,
    productId: string,
    productRepository: ProductRepository
): Promise<string> => {
    let slug = baseSlug;
    let counter = 2;

    // Check if slug exists (excluding current product), if yes, append number
    while (await productRepository.slugExists(slug, productId)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
};

/**
 * Factory function to create the use case
 */
export const makeEditProduct = ({ productRepository }: EditProductDeps): EditProduct => {
    return async (input: EditProductInput): Promise<Product.Type> => {
        const { productId, shopId, ...updateFields } = input;

        // 1. Find the existing product
        const existingProduct = await productRepository.findById(productId);
        if (!existingProduct) {
            throw new ProductNotFoundError(productId);
        }

        // 2. Check authorization
        if (existingProduct.shopId !== shopId) {
            throw new ProductAuthorizationError('You are not authorized to edit this product');
        }

        // 3. Build update input
        const updateInput: Product.UpdateInput = {
            id: productId,
        };

        // Auto-update slug if title changes
        if (updateFields.title !== undefined && updateFields.title !== existingProduct.title) {
            const baseSlug = Product.generateSlug(updateFields.title);
            const uniqueSlug = await generateUniqueSlug(baseSlug, productId, productRepository);
            updateInput.slug = uniqueSlug;
            updateInput.title = updateFields.title;
        }

        // Only include fields that are provided
        if (updateFields.short_description !== undefined) updateInput.short_description = updateFields.short_description;
        if (updateFields.detailed_description !== undefined) updateInput.detailed_description = updateFields.detailed_description;
        if (updateFields.category !== undefined) updateInput.category = updateFields.category;
        if (updateFields.sub_category !== undefined) updateInput.sub_category = updateFields.sub_category;
        if (updateFields.stock !== undefined) updateInput.stock = parseInt(String(updateFields.stock));
        if (updateFields.sale_price !== undefined) updateInput.sale_price = parseFloat(String(updateFields.sale_price));
        if (updateFields.regular_price !== undefined) updateInput.regular_price = parseFloat(String(updateFields.regular_price));
        if (updateFields.warranty !== undefined) updateInput.warranty = updateFields.warranty;
        if (updateFields.custom_specifications !== undefined) updateInput.custom_specifications = updateFields.custom_specifications;
        if (updateFields.brand !== undefined) updateInput.brand = updateFields.brand;
        if (updateFields.video_url !== undefined) updateInput.video_url = updateFields.video_url;
        if (updateFields.tags !== undefined) updateInput.tags = Product.parseTags(updateFields.tags);
        if (updateFields.colors !== undefined) updateInput.colors = updateFields.colors;
        if (updateFields.sizes !== undefined) updateInput.sizes = updateFields.sizes;
        if (updateFields.custom_properties !== undefined) updateInput.custom_properties = updateFields.custom_properties;
        if (updateFields.cash_on_delivery !== undefined) updateInput.cash_on_delivery = updateFields.cash_on_delivery;
        if (updateFields.discount_codes !== undefined) updateInput.discount_codes = updateFields.discount_codes;
        if (updateFields.images !== undefined) updateInput.images = updateFields.images;

        // 4. Validate update input
        Product.validateUpdate(updateInput);

        // 5. Update the product
        const updatedProduct = await productRepository.update(updateInput);

        return updatedProduct;
    };
};
