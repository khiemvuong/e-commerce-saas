/**
 * Product Fetcher
 * 
 * Fetches products from the product-service for AI recommendation scoring.
 * Falls back to a curated demo catalog if the product-service is unavailable.
 */

import { ProductForScoring } from './recommendation-engine';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:6002';

/** Cache for fetched products */
let cachedProducts: ProductForScoring[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch products from the product-service REST API
 */
async function fetchFromProductService(keyword?: string): Promise<ProductForScoring[]> {
  try {
    const endpoint = keyword
      ? `${PRODUCT_SERVICE_URL}/api/search-products?keyword=${encodeURIComponent(keyword)}&limit=20`
      : `${PRODUCT_SERVICE_URL}/api/get-all-products?limit=40`;

    const res = await fetch(endpoint, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (!res.ok) throw new Error(`Product service returned ${res.status}`);

    const data: any = await res.json();
    const rawProducts = data.products || data.data?.products || data.data || [];

    return rawProducts.map((p: any) => ({
      id: p._id || p.id || '',
      title: p.title || p.name || '',
      category: p.category || '',
      subCategory: p.subCategory || '',
      brand: p.brand || '',
      tags: p.tags || [],
      colors: p.colors || [],
      price: p.price || p.sale_price || p.regular_price || 0,
      rating: p.rating || p.ratings || 0,
      totalSales: p.totalSales || p.sold_out || 0,
      views: p.views || 0,
      cartAdds: p.cartAdds || 0,
      purchases: p.purchases || 0,
    }));
  } catch (err) {
    console.log('[ProductFetcher] Product service unavailable, using demo catalog');
    return [];
  }
}

/**
 * Demo product catalog — used when product-service is not running.
 * Provides realistic data so the chatbot can demonstrate its capabilities.
 */
const DEMO_PRODUCTS: ProductForScoring[] = [
  {
    id: 'demo-1', title: 'Nike Air Max 270 Running Shoes', category: 'shoes', subCategory: 'running',
    brand: 'Nike', tags: ['running', 'athletic', 'air max'], colors: ['black', 'white'],
    price: 150, rating: 4.7, totalSales: 2400, views: 8500, cartAdds: 620, purchases: 2400,
  },
  {
    id: 'demo-2', title: 'Adidas Ultraboost 22 Sneakers', category: 'shoes', subCategory: 'running',
    brand: 'Adidas', tags: ['running', 'boost', 'sneakers'], colors: ['white', 'black', 'blue'],
    price: 180, rating: 4.8, totalSales: 1800, views: 7200, cartAdds: 540, purchases: 1800,
  },
  {
    id: 'demo-3', title: 'Classic Leather Handbag', category: 'bags', subCategory: 'handbag',
    brand: 'Coach', tags: ['leather', 'handbag', 'designer'], colors: ['brown', 'black'],
    price: 295, rating: 4.5, totalSales: 950, views: 4800, cartAdds: 320, purchases: 950,
  },
  {
    id: 'demo-4', title: 'Samsung Galaxy S24 Ultra', category: 'electronics', subCategory: 'phone',
    brand: 'Samsung', tags: ['smartphone', 'android', 'galaxy'], colors: ['black', 'gray', 'purple'],
    price: 1199, rating: 4.6, totalSales: 5200, views: 25000, cartAdds: 3100, purchases: 5200,
  },
  {
    id: 'demo-5', title: 'Apple MacBook Pro 14" M3', category: 'electronics', subCategory: 'laptop',
    brand: 'Apple', tags: ['laptop', 'macbook', 'pro'], colors: ['silver', 'black'],
    price: 1999, rating: 4.9, totalSales: 3600, views: 18000, cartAdds: 2800, purchases: 3600,
  },
  {
    id: 'demo-6', title: "Levi's 501 Original Fit Jeans", category: 'clothing', subCategory: 'jeans',
    brand: "Levi's", tags: ['jeans', 'denim', 'casual'], colors: ['blue', 'black'],
    price: 69, rating: 4.4, totalSales: 8500, views: 12000, cartAdds: 4200, purchases: 8500,
  },
  {
    id: 'demo-7', title: 'Nike Dri-FIT Running T-Shirt', category: 'clothing', subCategory: 't-shirt',
    brand: 'Nike', tags: ['running', 'dri-fit', 'athletic'], colors: ['black', 'white', 'red', 'blue'],
    price: 35, rating: 4.3, totalSales: 12000, views: 15000, cartAdds: 5600, purchases: 12000,
  },
  {
    id: 'demo-8', title: 'Ray-Ban Aviator Classic Sunglasses', category: 'accessories', subCategory: 'sunglasses',
    brand: 'Ray-Ban', tags: ['sunglasses', 'aviator', 'polarized'], colors: ['gold', 'black', 'silver'],
    price: 163, rating: 4.7, totalSales: 6800, views: 14000, cartAdds: 3800, purchases: 6800,
  },
  {
    id: 'demo-9', title: 'Puma RS-X3 Puzzle Sneakers', category: 'shoes', subCategory: 'sneakers',
    brand: 'Puma', tags: ['sneakers', 'retro', 'puzzle'], colors: ['white', 'multicolor'],
    price: 110, rating: 4.2, totalSales: 1200, views: 5500, cartAdds: 420, purchases: 1200,
  },
  {
    id: 'demo-10', title: 'Sony WH-1000XM5 Headphones', category: 'electronics', subCategory: 'headphones',
    brand: 'Sony', tags: ['headphones', 'noise-cancelling', 'wireless'], colors: ['black', 'silver'],
    price: 348, rating: 4.8, totalSales: 4500, views: 20000, cartAdds: 2900, purchases: 4500,
  },
  {
    id: 'demo-11', title: 'Casio G-Shock Digital Watch', category: 'accessories', subCategory: 'watch',
    brand: 'Casio', tags: ['watch', 'digital', 'rugged'], colors: ['black', 'green', 'red'],
    price: 99, rating: 4.6, totalSales: 9200, views: 11000, cartAdds: 4100, purchases: 9200,
  },
  {
    id: 'demo-12', title: 'North Face Puffer Jacket', category: 'clothing', subCategory: 'jacket',
    brand: 'North Face', tags: ['jacket', 'winter', 'puffer'], colors: ['black', 'navy', 'red'],
    price: 229, rating: 4.5, totalSales: 3200, views: 9800, cartAdds: 1800, purchases: 3200,
  },
  {
    id: 'demo-13', title: 'Converse Chuck Taylor All Star', category: 'shoes', subCategory: 'sneakers',
    brand: 'Converse', tags: ['sneakers', 'classic', 'canvas'], colors: ['white', 'black', 'red'],
    price: 60, rating: 4.4, totalSales: 15000, views: 22000, cartAdds: 7800, purchases: 15000,
  },
  {
    id: 'demo-14', title: 'Calvin Klein Slim Fit Dress Shirt', category: 'clothing', subCategory: 'shirt',
    brand: 'Calvin Klein', tags: ['shirt', 'dress', 'formal', 'slim fit'], colors: ['white', 'blue', 'black'],
    price: 79, rating: 4.3, totalSales: 4100, views: 7600, cartAdds: 2200, purchases: 4100,
  },
  {
    id: 'demo-15', title: 'Adidas Originals Backpack', category: 'bags', subCategory: 'backpack',
    brand: 'Adidas', tags: ['backpack', 'school', 'sports'], colors: ['black', 'navy', 'white'],
    price: 55, rating: 4.1, totalSales: 6700, views: 8900, cartAdds: 3400, purchases: 6700,
  },
];

/**
 * Get products for scoring.
 * Tries product-service first, falls back to demo catalog.
 */
export async function getProductsForChat(keyword?: string): Promise<ProductForScoring[]> {
  const now = Date.now();

  // If we have a specific keyword search, always try live first
  if (keyword) {
    const liveProducts = await fetchFromProductService(keyword);
    if (liveProducts.length > 0) return liveProducts;
    // Fallback: filter demo products by keyword
    const kw = keyword.toLowerCase();
    return DEMO_PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(kw) ||
        p.category.toLowerCase().includes(kw) ||
        p.brand?.toLowerCase().includes(kw) ||
        p.tags.some((t) => t.toLowerCase().includes(kw))
    );
  }

  // For general browsing, use cache
  if (cachedProducts.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedProducts;
  }

  const liveProducts = await fetchFromProductService();
  if (liveProducts.length > 0) {
    cachedProducts = liveProducts;
    lastFetchTime = now;
    return cachedProducts;
  }

  // Use demo catalog
  cachedProducts = DEMO_PRODUCTS;
  lastFetchTime = now;
  return DEMO_PRODUCTS;
}

/**
 * Clear cache (for testing)
 */
export function clearProductCache(): void {
  cachedProducts = [];
  lastFetchTime = 0;
}
