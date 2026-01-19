/**
 * Create Product Use Case
 * 
 * Handles the business logic for creating a new product.
 */

import { Product } from '../../domain/Product';
import { ProductRepository } from '../../domain/ProductRepository';

/**
 * Dependencies required by this use case
 */
export interface CreateProductDeps {
    productRepository: ProductRepository;
}

/**
 * Input for creating a product
 */
export interface CreateProductInput {
    title: string;
    short_description: string;
    detailed_description: string;
    category: string;
    stock: number | string;
    sale_price: number | string;
    regular_price: number | string;
    shopId: string;
    warranty?: string;
    custom_specifications?: any;
    brand?: string;
    video_url?: string;
    sub_category?: string;
    tags?: string | string[];
    colors?: string[];
    sizes?: string[];
    custom_properties?: any[];
    cash_on_delivery?: string;
    discountCodes?: string[];
    images?: Product.ProductImage[];
}

/**
 * Create Product Use Case Type
 */
export type CreateProduct = (input: CreateProductInput) => Promise<Product.Type>;

/**
 * Generates a unique slug by appending a number if slug exists
 */
const generateUniqueSlug = async (
    baseSlug: string,
    productRepository: ProductRepository
): Promise<string> => {
    let slug = baseSlug;
    let counter = 2;

    // Check if slug exists, if yes, append number
    while (await productRepository.slugExists(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
};

/**
 * Factory function to create the use case
 */
export const makeCreateProduct = ({ productRepository }: CreateProductDeps): CreateProduct => {
    return async (input: CreateProductInput): Promise<Product.Type> => {
        // 1. Generate slug from title
        const baseSlug = Product.generateSlug(input.title);
        const uniqueSlug = await generateUniqueSlug(baseSlug, productRepository);

        // 2. Parse and normalize input
        const normalizedInput: Product.CreateInput = {
            title: input.title,
            short_description: input.short_description,
            detailed_description: input.detailed_description,
            slug: uniqueSlug, // Use auto-generated unique slug
            category: input.category,
            stock: parseInt(String(input.stock)),
            sale_price: parseFloat(String(input.sale_price)),
            regular_price: parseFloat(String(input.regular_price)),
            shopId: input.shopId,
            warranty: input.warranty,
            custom_specifications: input.custom_specifications,
            brand: input.brand,
            video_url: input.video_url,
            sub_category: input.sub_category,
            tags: Product.parseTags(input.tags),
            colors: input.colors || [],
            sizes: input.sizes || [],
            custom_properties: input.custom_properties || [],
            cash_on_delivery: input.cash_on_delivery,
            discount_codes: input.discountCodes || [],
            images: input.images || [],
        };

        // 3. Validate input
        Product.validateCreate(normalizedInput);

        // 4. Create the product
        const product = await productRepository.create(normalizedInput);

        return product;
    };
};
