/**
 * Product Module Index
 * 
 * Main entry point for the product module.
 * Re-exports all public APIs from this module.
 */

// Domain
export { Product } from './domain/Product';
export type { ProductRepository, ProductQueryOptions } from './domain/ProductRepository';

// Use Cases
export {
    makeCreateProduct,
    makeEditProduct,
    makeDeleteProduct,
    makeRestoreProduct,
} from './application/useCases';

// Queries
export {
    getProductDetails,
    getAllProducts,
    getFilteredProducts,
    getMyProducts,
    searchProducts,
} from './application/queries';

// Infrastructure
export { makePrismaProductRepository, getProductRepository } from './infrastructure/PrismaProductRepository';

// Interface
export { productController } from './interface/http/productController';
export { productRoutes } from './interface/http/productRoutes';
