/**
 * Queries Index
 * 
 * Re-exports all product queries
 */

export { getProductDetails, type GetProductDetailsInput } from './getProductDetails';
export { getAllProducts, type GetAllProductsInput, type GetAllProductsOutput } from './getAllProducts';
export { getFilteredProducts, type GetFilteredProductsInput, type GetFilteredProductsOutput } from './getFilteredProducts';
export { getMyProducts, type GetMyProductsInput } from './getMyProducts';
export { searchProducts, type SearchProductsInput, type SearchProductsOutput } from './searchProducts';
export { getBestSellers, type GetBestSellersInput } from './getBestSellers';
export { getFeaturedProducts, type GetFeaturedProductsInput } from './getFeaturedProducts';
export { getDealsOfTheDay, type GetDealsOfTheDayInput } from './getDealsOfTheDay';
