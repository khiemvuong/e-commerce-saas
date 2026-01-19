/**
 * Use Cases Index
 * 
 * Re-exports all product use cases
 */

export { makeCreateProduct, type CreateProduct, type CreateProductInput, type CreateProductDeps } from './createProduct';
export { makeEditProduct, type EditProduct, type EditProductInput, type EditProductDeps } from './editProduct';
export { makeDeleteProduct, type DeleteProduct, type DeleteProductInput, type DeleteProductDeps, type DeleteProductResult } from './deleteProduct';
export { makeRestoreProduct, type RestoreProduct, type RestoreProductInput, type RestoreProductDeps, type RestoreProductResult } from './restoreProduct';
