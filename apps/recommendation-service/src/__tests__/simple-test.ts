/**
 * Simple Phase 1 Test Runner
 * Run with: npx ts-node --transpile-only src/__tests__/simple-test.ts
 */

import { detectIntent } from '../core/intent-detector';
import { Intent } from '../config/intents.config';

interface TestCase {
  input: string;
  expected: Intent;
}

const TEST_CASES: TestCase[] = [
  // SEARCH_PRODUCT
  { input: 'Looking for running shoes', expected: Intent.SEARCH_PRODUCT },
  { input: 'Do you have Nike sneakers', expected: Intent.SEARCH_PRODUCT },
  { input: 'Find me a leather jacket', expected: Intent.SEARCH_PRODUCT },
  { input: 'I want to buy a watch', expected: Intent.SEARCH_PRODUCT },
  { input: 'Show me laptops', expected: Intent.SEARCH_PRODUCT },
  { input: 'I need a new phone', expected: Intent.SEARCH_PRODUCT },
  { input: 'Search for headphones', expected: Intent.SEARCH_PRODUCT },

  // ASK_PRICE
  { input: 'How much is this', expected: Intent.ASK_PRICE },
  { input: "What's the price", expected: Intent.ASK_PRICE },
  { input: 'How much does it cost', expected: Intent.ASK_PRICE },

  // RECOMMEND
  { input: 'Can you recommend something', expected: Intent.RECOMMEND },
  { input: 'What should I buy', expected: Intent.RECOMMEND },
  { input: 'Suggest products for me', expected: Intent.RECOMMEND },

  // ASK_STOCK
  { input: 'Is this in stock', expected: Intent.ASK_STOCK },
  { input: 'Is it available', expected: Intent.ASK_STOCK },
  { input: 'How many left', expected: Intent.ASK_STOCK },

  // COMPARE
  { input: 'Compare Nike vs Adidas', expected: Intent.COMPARE },
  { input: 'What is the difference', expected: Intent.COMPARE },

  // GREETING
  { input: 'Hello', expected: Intent.GREETING },
  { input: 'Hi', expected: Intent.GREETING },
  { input: 'Good morning', expected: Intent.GREETING },

  // UNKNOWN
  { input: 'abc xyz', expected: Intent.UNKNOWN },
  { input: '', expected: Intent.UNKNOWN },

  // ROUND 2: Variations
  { input: 'LOOKING FOR SHOES', expected: Intent.SEARCH_PRODUCT },
  { input: 'searching for bags', expected: Intent.SEARCH_PRODUCT },
  { input: 'Any laptops available', expected: Intent.SEARCH_PRODUCT },
];

function runTests() {
  console.log('\n=== PHASE 1: INTENT DETECTION TEST ===\n');
  
  let passed = 0;
  let failed = 0;

  for (const test of TEST_CASES) {
    const result = detectIntent(test.input);
    if (result.intent === test.expected) {
      passed++;
      console.log(`[PASS] "${test.input}" => ${result.intent} (${result.confidence}%)`);
    } else {
      failed++;
      console.log(`[FAIL] "${test.input}"`);
      console.log(`       Expected: ${test.expected}, Got: ${result.intent}`);
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(`Total: ${TEST_CASES.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  const accuracy = ((passed / TEST_CASES.length) * 100).toFixed(1);
  console.log(`Accuracy: ${accuracy}%`);
  console.log(`Target: >= 85%`);
  console.log(`Status: ${parseFloat(accuracy) >= 85 ? 'PASSED' : 'FAILED'}`);

  // Performance test
  console.log('\n=== PERFORMANCE TEST ===');
  const start = Date.now();
  for (let i = 0; i < 1000; i++) {
    detectIntent('Looking for running shoes');
  }
  const avgTime = (Date.now() - start) / 1000;
  console.log(`Avg response time: ${avgTime.toFixed(3)}ms (target: <50ms)`);
  console.log(`Status: ${avgTime < 50 ? 'PASSED' : 'FAILED'}\n`);
}

runTests();
