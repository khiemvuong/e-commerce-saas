/**
 * Delete Product Use Case
 * 
 * Handles the business logic for soft-deleting a product.
 * Products are not permanently deleted, just marked as deleted.
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
export interface DeleteProductDeps {
    productRepository: ProductRepository;
}

/**
 * Input for deleting a product
 */
export interface DeleteProductInput {
    productId: string;
    shopId: string; // For authorization check
}

/**
 * Result of delete operation
 */
export interface DeleteProductResult {
    success: boolean;
    message: string;
    deletedAt: Date | null;
}

/**
 * Delete Product Use Case Type
 */
export type DeleteProduct = (input: DeleteProductInput) => Promise<DeleteProductResult>;

/**
 * Factory function to create the use case
 */
export const makeDeleteProduct = ({ productRepository }: DeleteProductDeps): DeleteProduct => {
    return async (input: DeleteProductInput): Promise<DeleteProductResult> => {
        const { productId, shopId } = input;

        // 1. Find the existing product
        const existingProduct = await productRepository.findById(productId);
        if (!existingProduct) {
            throw new ProductNotFoundError(productId);
        }

        // 2. Check authorization
        if (existingProduct.shopId !== shopId) {
            throw new ProductAuthorizationError('You are not authorized to delete this product');
        }

        // 3. Check if already deleted
        if (existingProduct.isDeleted) {
            throw new ProductValidationError('Product is already deleted');
        }

        // 4. Soft delete the product
        const deletedProduct = await productRepository.softDelete(productId);

        return {
            success: true,
            message: 'Product deletion status updated successfully',
            deletedAt: deletedProduct.deletedAt || null,
        };
    };
};
