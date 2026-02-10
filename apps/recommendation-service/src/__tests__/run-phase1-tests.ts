/**
 * Phase 1 Test Runner
 * 
 * Standalone test script that can run without Jest
 * Run with: npx ts-node src/__tests__/run-phase1-tests.ts
 */

import { detectIntent } from '../core/intent-detector';
import { Intent } from '../config/intents.config';

interface TestCase {
  input: string;
  expected: Intent;
}

interface TestResult {
  passed: boolean;
  input: string;
  expected: Intent;
  actual: Intent;
  confidence: number;
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(color: string, message: string) {
  console.log(`${color}${message}${colors.reset}`);
}

// Test cases from implementation plan
const ROUND_1_TESTS: TestCase[] = [
  // SEARCH_PRODUCT intent
  { input: 'Looking for running shoes', expected: Intent.SEARCH_PRODUCT },
  { input: 'Do you have Nike sneakers', expected: Intent.SEARCH_PRODUCT },
  { input: 'Find me a leather jacket', expected: Intent.SEARCH_PRODUCT },
  { input: 'I want to buy a watch', expected: Intent.SEARCH_PRODUCT },
  { input: 'Show me laptops', expected: Intent.SEARCH_PRODUCT },
  { input: 'I need a new phone', expected: Intent.SEARCH_PRODUCT },
  { input: 'Search for headphones', expected: Intent.SEARCH_PRODUCT },

  // ASK_PRICE intent
  { input: 'How much is this', expected: Intent.ASK_PRICE },
  { input: "What's the price", expected: Intent.ASK_PRICE },
  { input: 'How much does it cost', expected: Intent.ASK_PRICE },

  // RECOMMEND intent
  { input: 'Can you recommend something', expected: Intent.RECOMMEND },
  { input: 'What should I buy', expected: Intent.RECOMMEND },
  { input: 'Suggest products for me', expected: Intent.RECOMMEND },

  // ASK_STOCK intent
  { input: 'Is this in stock', expected: Intent.ASK_STOCK },
  { input: 'Is it available', expected: Intent.ASK_STOCK },
  { input: 'How many left', expected: Intent.ASK_STOCK },

  // COMPARE intent
  { input: 'Compare Nike vs Adidas', expected: Intent.COMPARE },
  { input: 'What is the difference', expected: Intent.COMPARE },

  // GREETING intent
  { input: 'Hello', expected: Intent.GREETING },
  { input: 'Hi', expected: Intent.GREETING },
  { input: 'Good morning', expected: Intent.GREETING },

  // Edge cases
  { input: 'abc xyz', expected: Intent.UNKNOWN },
  { input: '', expected: Intent.UNKNOWN },
];

const ROUND_2_TESTS: TestCase[] = [
  // Case sensitivity
  { input: 'LOOKING FOR SHOES', expected: Intent.SEARCH_PRODUCT },
  { input: 'looking for shoes', expected: Intent.SEARCH_PRODUCT },
  
  // Variations
  { input: 'searching for bags', expected: Intent.SEARCH_PRODUCT },
  { input: 'Any laptops available', expected: Intent.SEARCH_PRODUCT },
  
  // Complex sentences
  { input: 'Hey, I am looking for a good laptop', expected: Intent.SEARCH_PRODUCT },
];

function runTestRound(name: string, tests: TestCase[]): { passed: number; failed: number; results: TestResult[] } {
  log(colors.cyan, `\n${'='.repeat(50)}`);
  log(colors.bold, `📋 ${name}`);
  log(colors.cyan, `${'='.repeat(50)}\n`);

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = detectIntent(test.input);
    const isPassed = result.intent === test.expected;
    
    results.push({
      passed: isPassed,
      input: test.input,
      expected: test.expected,
      actual: result.intent,
      confidence: result.confidence,
    });

    if (isPassed) {
      passed++;
      log(colors.green, `  ✅ "${test.input}"`);
      console.log(`     → ${result.intent} (confidence: ${result.confidence}%)`);
    } else {
      failed++;
      log(colors.red, `  ❌ "${test.input}"`);
      console.log(`     Expected: ${test.expected}`);
      console.log(`     Actual: ${result.intent} (confidence: ${result.confidence}%)`);
    }
  }

  const accuracy = ((passed / tests.length) * 100).toFixed(1);
  console.log('');
  log(colors.yellow, `📊 Results: ${passed}/${tests.length} passed (${accuracy}%)`);
  
  return { passed, failed, results };
}

function runAllTests() {
  console.log('\n');
  log(colors.bold, '🧪 Phase 1: Intent Detection Testing');
  log(colors.cyan, '━'.repeat(50));

  const round1 = runTestRound('Round 1: Basic Intent Detection', ROUND_1_TESTS);
  const round2 = runTestRound('Round 2: Variations & Edge Cases', ROUND_2_TESTS);

  // Summary
  const totalPassed = round1.passed + round2.passed;
  const totalTests = ROUND_1_TESTS.length + ROUND_2_TESTS.length;
  const overallAccuracy = ((totalPassed / totalTests) * 100).toFixed(1);

  log(colors.cyan, `\n${'='.repeat(50)}`);
  log(colors.bold, '📈 OVERALL SUMMARY');
  log(colors.cyan, `${'='.repeat(50)}`);
  console.log(`\n  Total Tests: ${totalTests}`);
  console.log(`  Passed: ${totalPassed}`);
  console.log(`  Failed: ${totalTests - totalPassed}`);
  
  const accuracyColor = parseFloat(overallAccuracy) >= 85 ? colors.green : colors.red;
  log(accuracyColor, `\n  Accuracy: ${overallAccuracy}%`);
  
  if (parseFloat(overallAccuracy) >= 85) {
    log(colors.green, '\n  ✅ Phase 1 PASSED - Accuracy meets 85% threshold');
  } else {
    log(colors.red, '\n  ❌ Phase 1 FAILED - Accuracy below 85% threshold');
  }

  // Response time test
  console.log('\n');
  log(colors.bold, '⏱️ Performance Test');
  const startTime = performance.now();
  for (let i = 0; i < 1000; i++) {
    detectIntent('Looking for running shoes');
  }
  const endTime = performance.now();
  const avgTime = ((endTime - startTime) / 1000).toFixed(3);
  
  const timeColor = parseFloat(avgTime) < 50 ? colors.green : colors.red;
  log(timeColor, `  Average response time: ${avgTime}ms (target: <50ms)`);
  
  console.log('\n');
}

// Run tests
runAllTests();
