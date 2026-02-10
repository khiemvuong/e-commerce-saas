/**
 * Phase 5 Chat History Integration Test
 * Run with: npx ts-node --transpile-only src/__tests__/test-phase5.ts
 */

import {
  startConversation,
  processMessage,
  getConversationHistory,
  getAccumulatedKeywords,
  clearAllConversations,
} from '../core/chat-service';
import { UserContext, ProductForScoring } from '../core/recommendation-engine';

// Mock products
const MOCK_PRODUCTS: ProductForScoring[] = [
  {
    id: 'p1',
    title: 'Nike Air Max Running Shoes',
    category: 'shoes',
    brand: 'Nike',
    tags: ['running', 'sports'],
    colors: ['white', 'black'],
    price: 150,
    rating: 4.7,
    totalSales: 120,
  },
  {
    id: 'p2',
    title: 'Adidas Ultraboost',
    category: 'shoes',
    brand: 'Adidas',
    tags: ['running'],
    colors: ['black'],
    price: 180,
    rating: 4.5,
    totalSales: 80,
  },
  {
    id: 'p3',
    title: 'Nike T-Shirt',
    category: 'clothing',
    brand: 'Nike',
    tags: ['sports', 'workout'],
    colors: ['white'],
    price: 45,
    rating: 4.3,
    totalSales: 200,
  },
];

// Empty user context
const EMPTY_CONTEXT: UserContext = {
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

function runTests() {
  console.log('\n=== PHASE 5: CHAT HISTORY INTEGRATION TEST ===\n');
  
  let passed = 0;
  let failed = 0;
  
  // Clean up
  clearAllConversations();
  
  // Test 1: Start conversation
  console.log('--- Test 1: Start Conversation ---');
  const conv = startConversation('user123');
  
  if (conv.conversationId && conv.userId === 'user123') {
    console.log('[PASS] Conversation started successfully');
    console.log(`  ID: ${conv.conversationId}`);
    passed++;
  } else {
    console.log('[FAIL] Failed to start conversation');
    failed++;
  }
  
  // Test 2: Process greeting message
  console.log('\n--- Test 2: Process Greeting ---');
  const greeting = processMessage(conv.conversationId, 'Hello', MOCK_PRODUCTS, EMPTY_CONTEXT);
  
  if (greeting.intent === 'GREETING' && greeting.message.length > 0) {
    console.log('[PASS] Greeting processed correctly');
    console.log(`  Intent: ${greeting.intent}`);
    console.log(`  Response: ${greeting.message.substring(0, 50)}...`);
    passed++;
  } else {
    console.log('[FAIL] Greeting not processed correctly');
    failed++;
  }
  
  // Test 3: Process search message with recommendations
  console.log('\n--- Test 3: Search with Recommendations ---');
  const search = processMessage(
    conv.conversationId, 
    'Looking for Nike shoes', 
    MOCK_PRODUCTS, 
    EMPTY_CONTEXT
  );
  
  if (search.intent === 'SEARCH_PRODUCT' && search.recommendations && search.recommendations.length > 0) {
    console.log('[PASS] Search processed with recommendations');
    console.log(`  Intent: ${search.intent}`);
    console.log(`  Recommendations: ${search.recommendations.length}`);
    console.log(`  Top match: ${search.recommendations[0].product.title}`);
    passed++;
  } else {
    console.log('[FAIL] Search not processed correctly');
    console.log(`  Intent: ${search.intent}, Recs: ${search.recommendations?.length}`);
    failed++;
  }
  
  // Test 4: Keyword accumulation
  console.log('\n--- Test 4: Keyword Accumulation ---');
  processMessage(conv.conversationId, 'Show me white shoes under $200', MOCK_PRODUCTS, EMPTY_CONTEXT);
  const accumulated = getAccumulatedKeywords(conv.conversationId);
  
  if (accumulated && 
      accumulated.brands.includes('nike') && 
      accumulated.colors.includes('white')) {
    console.log('[PASS] Keywords accumulated across messages');
    console.log(`  Brands: ${accumulated.brands.join(', ')}`);
    console.log(`  Colors: ${accumulated.colors.join(', ')}`);
    console.log(`  Categories: ${accumulated.categories.join(', ')}`);
    passed++;
  } else {
    console.log('[FAIL] Keyword accumulation not working');
    console.log(`  Accumulated: ${JSON.stringify(accumulated)}`);
    failed++;
  }
  
  // Test 5: Conversation history
  console.log('\n--- Test 5: Conversation History ---');
  const history = getConversationHistory(conv.conversationId);
  
  if (history.length >= 6) { // 3 user + 3 AI messages
    console.log('[PASS] Conversation history maintained');
    console.log(`  Messages: ${history.length}`);
    console.log(`  First: ${history[0].senderType} - "${history[0].content.substring(0, 30)}..."`);
    console.log(`  Last: ${history[history.length-1].senderType}`);
    passed++;
  } else {
    console.log('[FAIL] Conversation history incomplete');
    console.log(`  Messages: ${history.length}`);
    failed++;
  }
  
  // Test 6: Quick replies returned
  console.log('\n--- Test 6: Quick Replies ---');
  
  if (search.quickReplies && search.quickReplies.length > 0) {
    console.log('[PASS] Quick replies returned');
    console.log(`  Options: ${search.quickReplies.join(', ')}`);
    passed++;
  } else {
    console.log('[FAIL] Quick replies not returned');
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
  
  // Cleanup
  clearAllConversations();
}

runTests();
