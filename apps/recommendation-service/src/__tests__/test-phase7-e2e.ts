/**
 * Phase 7 End-to-End Integration Test
 * Run with: npx ts-node --transpile-only src/__tests__/test-phase7-e2e.ts
 * 
 * Tests the complete flow from user input to product recommendations
 */

import {
  startConversation,
  processMessage,
  getConversationHistory,
  getAccumulatedKeywords,
  clearAllConversations,
} from '../core/chat-service';
import { UserContext, ProductForScoring } from '../core/recommendation-engine';

// Realistic mock products
const PRODUCT_CATALOG: ProductForScoring[] = [
  {
    id: 'shoe-001',
    title: 'Nike Air Max 270 Running Shoes',
    category: 'shoes',
    brand: 'Nike',
    tags: ['running', 'sports', 'athletic', 'comfortable', 'lightweight'],
    colors: ['white', 'black', 'red'],
    price: 150,
    rating: 4.7,
    totalSales: 500,
    views: 10000,
    cartAdds: 1200,
    purchases: 500,
  },
  {
    id: 'shoe-002',
    title: 'Adidas Ultraboost Running Shoes',
    category: 'shoes',
    brand: 'Adidas',
    tags: ['running', 'sports', 'premium', 'boost'],
    colors: ['black', 'white', 'blue'],
    price: 180,
    rating: 4.8,
    totalSales: 400,
    views: 8000,
    cartAdds: 900,
    purchases: 400,
  },
  {
    id: 'shirt-001',
    title: 'Nike Dri-FIT Training T-Shirt',
    category: 'clothing',
    brand: 'Nike',
    tags: ['training', 'workout', 'gym', 'moisture-wicking'],
    colors: ['white', 'black', 'gray'],
    price: 45,
    rating: 4.5,
    totalSales: 800,
    views: 15000,
    cartAdds: 2000,
    purchases: 800,
  },
  {
    id: 'bag-001',
    title: 'Nike Brasilia Training Backpack',
    category: 'bags',
    brand: 'Nike',
    tags: ['training', 'gym', 'backpack', 'storage'],
    colors: ['black', 'gray'],
    price: 65,
    rating: 4.6,
    totalSales: 300,
    views: 5000,
    cartAdds: 600,
    purchases: 300,
  },
];

// Mock user with purchase history
const RETURNING_USER: UserContext = {
  userId: 'user-returning-123',
  chatKeywords: [],
  chatCategories: [],
  chatBrands: [],
  viewedProductIds: ['shoe-001', 'shoe-002'],
  viewedCategories: ['shoes'],
  cartProductIds: ['shirt-001'],
  cartBrands: ['Nike'],
  wishlistProductIds: [],
  preferredColors: ['black', 'white'],
  priceRange: { min: 50, max: 200 },
};

// New user with no history
const NEW_USER: UserContext = {
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

function runE2ETests() {
  console.log('\n=== PHASE 7: END-TO-END INTEGRATION TEST ===\n');
  
  let passed = 0;
  let failed = 0;
  clearAllConversations();
  
  // ========================================
  // Scenario 1: New User Complete Flow
  // ========================================
  console.log('=== Scenario 1: New User Complete Flow ===\n');
  
  const newUserConv = startConversation('new-user-001');
  console.log(`Started conversation: ${newUserConv.conversationId}`);
  
  // Step 1: Greeting
  console.log('\n[User]: Hello');
  const greeting = processMessage(newUserConv.conversationId, 'Hello', PRODUCT_CATALOG, NEW_USER);
  console.log(`[AI]: ${greeting.message}`);
  console.log(`[Intent]: ${greeting.intent}`);
  
  if (greeting.intent === 'GREETING') {
    console.log('[PASS] Greeting detected');
    passed++;
  } else {
    console.log('[FAIL] Greeting not detected');
    failed++;
  }
  
  // Step 2: Product search
  console.log('\n[User]: Looking for Nike running shoes under $200');
  const search = processMessage(newUserConv.conversationId, 'Looking for Nike running shoes under $200', PRODUCT_CATALOG, NEW_USER);
  console.log(`[AI]: ${search.message.substring(0, 100)}...`);
  console.log(`[Intent]: ${search.intent}`);
  console.log(`[Recommendations]: ${search.recommendations?.length || 0} products`);
  
  if (search.intent === 'SEARCH_PRODUCT' && search.recommendations && search.recommendations.length > 0) {
    const topRec = search.recommendations[0];
    console.log(`[Top Match]: ${topRec.product.title} (Score: ${topRec.score})`);
    console.log(`[Reasons]: ${topRec.matchReasons.join(', ')}`);
    
    if (topRec.product.brand === 'Nike' && topRec.product.category === 'shoes') {
      console.log('[PASS] Correct product recommended');
      passed++;
    } else {
      console.log('[FAIL] Wrong product recommended');
      failed++;
    }
  } else {
    console.log('[FAIL] Search not processed correctly');
    failed++;
  }
  
  // Step 3: Refinement
  console.log('\n[User]: Show me black ones');
  const refine = processMessage(newUserConv.conversationId, 'Show me black ones', PRODUCT_CATALOG, NEW_USER);
  const accumulated = getAccumulatedKeywords(newUserConv.conversationId);
  
  if (accumulated?.colors.includes('black') && accumulated?.brands.includes('nike')) {
    console.log('[PASS] Keywords accumulated across messages');
    console.log(`[Accumulated]: brands=${accumulated.brands.join(',')}, colors=${accumulated.colors.join(',')}`);
    passed++;
  } else {
    console.log('[FAIL] Keyword accumulation not working');
    failed++;
  }
  
  // ========================================
  // Scenario 2: Returning User with History
  // ========================================
  console.log('\n\n=== Scenario 2: Returning User with History ===\n');
  
  const returningConv = startConversation('returning-user-123');
  
  // Step 1: Get recommendations based on history
  console.log('[User]: Recommend something for me');
  const recommend = processMessage(returningConv.conversationId, 'Recommend something for me', PRODUCT_CATALOG, RETURNING_USER);
  console.log(`[AI]: ${recommend.message.substring(0, 100)}...`);
  console.log(`[Intent]: ${recommend.intent}`);
  
  if (recommend.recommendations && recommend.recommendations.length > 0) {
    // Check if Nike products are prioritized (user has Nike in cart)
    const nikeProducts = recommend.recommendations.filter(r => r.product.brand === 'Nike');
    console.log(`[Nike products in top 5]: ${nikeProducts.length}`);
    
    if (nikeProducts.length >= 2) {
      console.log('[PASS] User history influences recommendations');
      passed++;
    } else {
      console.log('[FAIL] User history not considered');
      failed++;
    }
  } else {
    console.log('[FAIL] No recommendations returned');
    failed++;
  }
  
  // ========================================
  // Scenario 3: Price and Stock Queries
  // ========================================
  console.log('\n\n=== Scenario 3: Price and Stock Queries ===\n');
  
  const priceConv = startConversation('price-check-user');
  
  console.log('[User]: How much is the Nike Air Max?');
  const priceQuery = processMessage(priceConv.conversationId, 'How much is the Nike Air Max?', PRODUCT_CATALOG, NEW_USER);
  
  if (priceQuery.intent === 'ASK_PRICE') {
    console.log('[PASS] Price intent detected');
    console.log(`[Response]: ${priceQuery.message.substring(0, 80)}...`);
    passed++;
  } else {
    console.log('[FAIL] Price intent not detected');
    failed++;
  }
  
  // ========================================
  // Scenario 4: Conversation History
  // ========================================
  console.log('\n\n=== Scenario 4: Conversation History ===\n');
  
  const history = getConversationHistory(newUserConv.conversationId, 10);
  console.log(`[Messages in history]: ${history.length}`);
  
  const userMessages = history.filter(m => m.senderType === 'user');
  const aiMessages = history.filter(m => m.senderType === 'ai');
  
  if (userMessages.length === 3 && aiMessages.length === 3) {
    console.log('[PASS] Complete conversation history maintained');
    console.log(`[User messages]: ${userMessages.length}, [AI messages]: ${aiMessages.length}`);
    passed++;
  } else {
    console.log(`[FAIL] History incomplete: user=${userMessages.length}, ai=${aiMessages.length}`);
    failed++;
  }
  
  // ========================================
  // Performance Test
  // ========================================
  console.log('\n\n=== Performance Test ===\n');
  
  const perfStart = Date.now();
  const perfConv = startConversation('perf-user');
  for (let i = 0; i < 10; i++) {
    processMessage(perfConv.conversationId, 'Looking for Nike shoes', PRODUCT_CATALOG, NEW_USER);
  }
  const perfTime = Date.now() - perfStart;
  const avgTime = perfTime / 10;
  
  console.log(`[10 messages processed in]: ${perfTime}ms`);
  console.log(`[Average response time]: ${avgTime.toFixed(1)}ms`);
  
  if (avgTime < 100) {
    console.log('[PASS] Response time under 100ms');
    passed++;
  } else {
    console.log('[FAIL] Response time too slow');
    failed++;
  }
  
  // ========================================
  // Summary
  // ========================================
  console.log('\n\n==========================================');
  console.log('=== END-TO-END TEST RESULTS ===');
  console.log('==========================================\n');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  const accuracy = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(`Success Rate: ${accuracy}%`);
  console.log(`\nOverall Status: ${parseFloat(accuracy) >= 90 ? 'PASSED' : 'FAILED'}\n`);
  
  // Test coverage summary
  console.log('Coverage:');
  console.log('  - Intent Detection: TESTED');
  console.log('  - Keyword Extraction: TESTED');
  console.log('  - Recommendation Engine: TESTED');
  console.log('  - Chat History: TESTED');
  console.log('  - Context Accumulation: TESTED');
  console.log('  - Performance: TESTED\n');
  
  clearAllConversations();
}

runE2ETests();
