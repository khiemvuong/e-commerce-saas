/**
 * Restore Product Use Case
 * 
 * Handles the business logic for restoring a soft-deleted product.
 */

import { ProductRepository } from '../../domain/ProductRepository';
import { 
    ProductNotFoundError, 
    ProductAuthorizationError,
    ProductValidationError 
} from '../../../../_lib/errors/ProductErrors';

/**
 * Dependencies required by this use case
 */
export interface RestoreProductDeps {
    productRepository: ProductRepository;
}

/**
 * Input for restoring a product
 */
export interface RestoreProductInput {
    productId: string;
    shopId: string; // For authorization check
}

/**
 * Result of restore operation
 */
export interface RestoreProductResult {
    success: boolean;
    message: string;
}

/**
 * Restore Product Use Case Type
 */
export type RestoreProduct = (input: RestoreProductInput) => Promise<RestoreProductResult>;

/**
 * Factory function to create the use case
 */
export const makeRestoreProduct = ({ productRepository }: RestoreProductDeps): RestoreProduct => {
    return async (input: RestoreProductInput): Promise<RestoreProductResult> => {
        const { productId, shopId } = input;

        // 1. Find the existing product (including deleted ones)
        const existingProduct = await productRepository.findById(productId);
        if (!existingProduct) {
            throw new ProductNotFoundError(productId);
        }

        // 2. Check authorization
        if (existingProduct.shopId !== shopId) {
            throw new ProductAuthorizationError('You are not authorized to restore this product');
        }

        // 3. Check if product is actually deleted
        if (!existingProduct.isDeleted) {
            throw new ProductValidationError('Product is not in deleted state');
        }

        // 4. Restore the product
        await productRepository.restore(productId);

        return {
            success: true,
            message: 'Product restored successfully',
        };
    };
};
