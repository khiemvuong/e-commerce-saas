/**
 * Phase 4 Recommendation Engine Test
 * Run with: npx ts-node --transpile-only src/__tests__/test-phase4.ts
 */

import {
  scoreProducts,
  getTopRecommendations,
  buildUserContextFromActions,
  UserContext,
  ProductForScoring,
} from '../core/recommendation-engine';
import { extractKeywords } from '../core/keyword-extractor';

// Mock products data
const MOCK_PRODUCTS: ProductForScoring[] = [
  {
    id: 'p1',
    title: 'Nike Air Max Running Shoes',
    category: 'shoes',
    brand: 'Nike',
    tags: ['running', 'sports', 'athletic', 'comfortable'],
    colors: ['white', 'black'],
    price: 150,
    rating: 4.7,
    totalSales: 120,
    views: 5000,
    cartAdds: 500,
    purchases: 120,
  },
  {
    id: 'p2',
    title: 'Adidas Ultraboost Sneakers',
    category: 'shoes',
    brand: 'Adidas',
    tags: ['running', 'sports', 'premium'],
    colors: ['black', 'blue'],
    price: 180,
    rating: 4.5,
    totalSales: 80,
    views: 3000,
    cartAdds: 300,
    purchases: 80,
  },
  {
    id: 'p3',
    title: 'Nike Dry-Fit T-Shirt',
    category: 'clothing',
    brand: 'Nike',
    tags: ['sports', 'workout', 'comfortable'],
    colors: ['white', 'gray'],
    price: 45,
    rating: 4.3,
    totalSales: 200,
    views: 8000,
    cartAdds: 1000,
    purchases: 200,
  },
  {
    id: 'p4',
    title: 'Budget Running Shoes',
    category: 'shoes',
    brand: 'Generic',
    tags: ['running', 'affordable', 'basic'],
    colors: ['black'],
    price: 50,
    rating: 3.5,
    totalSales: 30,
    views: 500,
    cartAdds: 50,
    purchases: 30,
  },
  {
    id: 'p5',
    title: 'Premium Leather Jacket',
    category: 'clothing',
    brand: 'Gucci',
    tags: ['luxury', 'leather', 'fashion'],
    colors: ['brown', 'black'],
    price: 2000,
    rating: 4.9,
    totalSales: 15,
    views: 2000,
    cartAdds: 100,
    purchases: 15,
  },
];

function runTests() {
  console.log('\n=== PHASE 4: RECOMMENDATION ENGINE TEST ===\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Score based on chat keywords
  console.log('--- Test 1: Chat-based Scoring ---');
  const keywords1 = extractKeywords('Looking for Nike running shoes under $200');
  const emptyContext: UserContext = {
    chatKeywords: [],
    chatCategories: [],
    chatBrands: [],
    viewedProductIds: [],
    viewedCategories: [],
    cartProductIds: [],
    cartBrands: [],
    wishlistProductIds: [],
    preferredColors: [],
  };
  
  const scored1 = scoreProducts(MOCK_PRODUCTS, emptyContext, keywords1);
  const top1 = scored1[0];
  
  if (top1.product.id === 'p1' && top1.product.brand === 'Nike') {
    console.log('[PASS] Nike shoes ranked first for "Nike running shoes under $200"');
    console.log(`  Score: ${top1.score}, Reasons: ${top1.matchReasons.join(', ')}`);
    passed++;
  } else {
    console.log('[FAIL] Expected Nike shoes to rank first');
    console.log(`  Got: ${top1.product.title} (score: ${top1.score})`);
    failed++;
  }
  
  // Test 2: Behavior-based scoring
  console.log('\n--- Test 2: Behavior-based Scoring ---');
  const contextWithHistory: UserContext = {
    ...emptyContext,
    viewedCategories: ['shoes'],
    cartBrands: ['Nike'],
    viewedProductIds: ['p2'], // viewed Adidas
  };
  
  const scored2 = scoreProducts(MOCK_PRODUCTS, contextWithHistory);
  const nikeProducts = scored2.filter(s => s.product.brand === 'Nike');
  
  if (nikeProducts.every(np => np.score > scored2.find(s => s.product.brand === 'Generic')!.score)) {
    console.log('[PASS] Nike products score higher when user has Nike in cart');
    console.log(`  Nike T-Shirt score: ${nikeProducts.find(p => p.product.id === 'p3')?.score}`);
    passed++;
  } else {
    console.log('[FAIL] Nike products should score higher with cart history');
    failed++;
  }
  
  // Test 3: Popularity scoring
  console.log('\n--- Test 3: Popularity Scoring ---');
  const scored3 = scoreProducts(MOCK_PRODUCTS, emptyContext);
  const popularProduct = scored3.find(s => s.product.id === 'p1');
  const unpopularProduct = scored3.find(s => s.product.id === 'p4');
  
  if (popularProduct!.scoreBreakdown.popularityScore > unpopularProduct!.scoreBreakdown.popularityScore) {
    console.log('[PASS] Popular products score higher on popularity');
    console.log(`  Nike Air Max popularity: ${popularProduct?.scoreBreakdown.popularityScore}`);
    console.log(`  Budget shoes popularity: ${unpopularProduct?.scoreBreakdown.popularityScore}`);
    passed++;
  } else {
    console.log('[FAIL] Popular products should have higher popularity scores');
    failed++;
  }
  
  // Test 4: Price filtering
  console.log('\n--- Test 4: Price Range Filtering ---');
  const keywords4 = extractKeywords('Shoes under $100');
  const scored4 = scoreProducts(MOCK_PRODUCTS, emptyContext, keywords4);
  const affordableShoes = scored4.filter(s => 
    s.product.category === 'shoes' && s.product.price <= 100
  );
  
  if (affordableShoes.length > 0 && affordableShoes[0].matchReasons.includes('Within your budget')) {
    console.log('[PASS] "Within your budget" reason added for matching price');
    console.log(`  Product: ${affordableShoes[0].product.title}, Price: $${affordableShoes[0].product.price}`);
    passed++;
  } else {
    console.log('[FAIL] Price-matched products should have budget reason');
    failed++;
  }
  
  // Test 5: getTopRecommendations
  console.log('\n--- Test 5: Top Recommendations ---');
  const top3 = getTopRecommendations(scored1, 3, 20);
  
  if (top3.length <= 3 && top3.every(p => p.score >= 20)) {
    console.log(`[PASS] getTopRecommendations returns correct count and minScore`);
    console.log(`  Top 3: ${top3.map(p => p.product.title).join(', ')}`);
    passed++;
  } else {
    console.log('[FAIL] getTopRecommendations not working correctly');
    failed++;
  }
  
  // Test 6: Build context from actions
  console.log('\n--- Test 6: Build User Context from Actions ---');
  const productLookup = new Map([
    ['p1', { category: 'shoes', brand: 'Nike', colors: ['white', 'black'], price: 150 }],
    ['p3', { category: 'clothing', brand: 'Nike', colors: ['white'], price: 45 }],
  ]);
  
  const actions = [
    { action: 'product_view', productId: 'p1' },
    { action: 'add_to_cart', productId: 'p1' },
    { action: 'product_view', productId: 'p3' },
  ];
  
  const builtContext = buildUserContextFromActions(actions, productLookup);
  
  if (
    builtContext.viewedProductIds?.includes('p1') &&
    builtContext.cartProductIds?.includes('p1') &&
    builtContext.viewedCategories?.includes('shoes')
  ) {
    console.log('[PASS] Context built correctly from actions');
    console.log(`  Viewed: ${builtContext.viewedProductIds?.join(', ')}`);
    console.log(`  Cart: ${builtContext.cartProductIds?.join(', ')}`);
    passed++;
  } else {
    console.log('[FAIL] Context building failed');
    failed++;
  }
  
  // Summary
  console.log('\n=== RESULTS ===');
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  const accuracy = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(`Accuracy: ${accuracy}%`);
  console.log(`Target: >= 80%`);
  console.log(`Status: ${parseFloat(accuracy) >= 80 ? 'PASSED' : 'FAILED'}\n`);
}

runTests();
