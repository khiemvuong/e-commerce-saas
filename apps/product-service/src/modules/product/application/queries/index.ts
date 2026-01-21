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

// Cached versions of queries (with Redis caching)
export {
    getAllProductsCached,
    getFilteredProductsCached,
    searchProductsCached,
    getProductDetailsCached,
    getBestSellersCached,
    getFeaturedProductsCached,
    getDealsOfTheDayCached,
    invalidateProductCaches,
    invalidateProductCache,
} from './cachedQueries';

// Enhanced search with fuzzy matching
export {
    enhancedSearchProducts,
    getSearchSuggestions,
    type EnhancedSearchInput,
    type EnhancedSearchOutput,
} from './enhancedSearch';


