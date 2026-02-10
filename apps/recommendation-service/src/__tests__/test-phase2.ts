/**
 * Phase 2 Keyword Extraction Test
 * Run with: npx ts-node --transpile-only src/__tests__/test-phase2.ts
 */

import { extractKeywords, buildSearchQuery } from '../core/keyword-extractor';

interface TestCase {
  input: string;
  expected: {
    categories?: string[];
    brands?: string[];
    colors?: string[];
    sizes?: string[];
    priceRange?: { min?: number; max?: number };
    priceModifier?: 'cheap' | 'mid' | 'expensive';
    gender?: 'men' | 'women' | 'unisex' | 'kids';
  };
}

const TEST_CASES: TestCase[] = [
  {
    input: 'Looking for Nike shoes under $200',
    expected: {
      categories: ['shoes'],
      brands: ['nike'],
      priceRange: { max: 200 },
    },
  },
  {
    input: 'White t-shirt size M',
    expected: {
      categories: ['clothing'],
      colors: ['white'],
      sizes: ['M'],
    },
  },
  {
    input: "Men's jeans between $50 and $100",
    expected: {
      categories: ['clothing'],
      gender: 'men',
      priceRange: { min: 50, max: 100 },
    },
  },
  {
    input: 'Red running shoes size 10',
    expected: {
      categories: ['shoes', 'sports'],
      colors: ['red'],
      sizes: ['10'],
    },
  },
  {
    input: 'Cheap laptop bags',
    expected: {
      categories: ['bags', 'electronics'],
      priceModifier: 'cheap',
    },
  },
  {
    input: 'Adidas black sneakers for women',
    expected: {
      categories: ['shoes'],
      brands: ['adidas'],
      colors: ['black'],
      gender: 'women',
    },
  },
  {
    input: 'Premium leather wallet',
    expected: {
      categories: ['bags'],
      priceModifier: 'expensive',
    },
  },
  {
    input: 'Samsung phone under $500',
    expected: {
      categories: ['electronics'],
      brands: ['samsung'],
      priceRange: { max: 500 },
    },
  },
];

function runTests() {
  console.log('\n=== PHASE 2: KEYWORD EXTRACTION TEST ===\n');
  
  let totalChecks = 0;
  let passedChecks = 0;

  for (const test of TEST_CASES) {
    const result = extractKeywords(test.input);
    console.log(`Input: "${test.input}"`);
    console.log(`Result:`, JSON.stringify(result, null, 2).substring(0, 200) + '...');
    
    // Check categories
    if (test.expected.categories) {
      for (const cat of test.expected.categories) {
        totalChecks++;
        if (result.categories.includes(cat)) {
          passedChecks++;
          console.log(`  [PASS] Category: ${cat}`);
        } else {
          console.log(`  [FAIL] Category: expected ${cat}, got ${result.categories}`);
        }
      }
    }
    
    // Check brands
    if (test.expected.brands) {
      for (const brand of test.expected.brands) {
        totalChecks++;
        if (result.brands.includes(brand)) {
          passedChecks++;
          console.log(`  [PASS] Brand: ${brand}`);
        } else {
          console.log(`  [FAIL] Brand: expected ${brand}, got ${result.brands}`);
        }
      }
    }
    
    // Check colors
    if (test.expected.colors) {
      for (const color of test.expected.colors) {
        totalChecks++;
        if (result.colors.includes(color)) {
          passedChecks++;
          console.log(`  [PASS] Color: ${color}`);
        } else {
          console.log(`  [FAIL] Color: expected ${color}, got ${result.colors}`);
        }
      }
    }
    
    // Check sizes
    if (test.expected.sizes) {
      for (const size of test.expected.sizes) {
        totalChecks++;
        if (result.sizes.includes(size)) {
          passedChecks++;
          console.log(`  [PASS] Size: ${size}`);
        } else {
          console.log(`  [FAIL] Size: expected ${size}, got ${result.sizes}`);
        }
      }
    }
    
    // Check price range
    if (test.expected.priceRange) {
      totalChecks++;
      const priceMatch = 
        result.priceRange?.min === test.expected.priceRange.min &&
        result.priceRange?.max === test.expected.priceRange.max;
      if (priceMatch) {
        passedChecks++;
        console.log(`  [PASS] PriceRange: ${JSON.stringify(result.priceRange)}`);
      } else {
        console.log(`  [FAIL] PriceRange: expected ${JSON.stringify(test.expected.priceRange)}, got ${JSON.stringify(result.priceRange)}`);
      }
    }
    
    // Check price modifier
    if (test.expected.priceModifier) {
      totalChecks++;
      if (result.priceModifier === test.expected.priceModifier) {
        passedChecks++;
        console.log(`  [PASS] PriceModifier: ${result.priceModifier}`);
      } else {
        console.log(`  [FAIL] PriceModifier: expected ${test.expected.priceModifier}, got ${result.priceModifier}`);
      }
    }
    
    // Check gender
    if (test.expected.gender) {
      totalChecks++;
      if (result.gender === test.expected.gender) {
        passedChecks++;
        console.log(`  [PASS] Gender: ${result.gender}`);
      } else {
        console.log(`  [FAIL] Gender: expected ${test.expected.gender}, got ${result.gender}`);
      }
    }
    
    console.log('');
  }

  console.log('=== RESULTS ===');
  console.log(`Total checks: ${totalChecks}`);
  console.log(`Passed: ${passedChecks}`);
  console.log(`Failed: ${totalChecks - passedChecks}`);
  const accuracy = ((passedChecks / totalChecks) * 100).toFixed(1);
  console.log(`Accuracy: ${accuracy}%`);
  console.log(`Target: >= 80%`);
  console.log(`Status: ${parseFloat(accuracy) >= 80 ? 'PASSED' : 'FAILED'}`);
  
  // Test buildSearchQuery
  console.log('\n=== BUILD SEARCH QUERY TEST ===');
  const testKeywords = extractKeywords('Looking for Nike red shoes under $200');
  const query = buildSearchQuery(testKeywords);
  console.log(`Input: "Looking for Nike red shoes under $200"`);
  console.log(`Search query: "${query}"`);
  console.log('');
}

runTests();
