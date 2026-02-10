/**
 * Intent Detector Tests
 * 
 * Test suite for Phase 1: Intent Detection
 * Run with: npx jest intent-detector.test.ts
 */

import { detectIntent, detectAllIntents, matchesIntent } from '../core/intent-detector';
import { Intent } from '../config/intents.config';

describe('IntentDetector', () => {
  describe('Phase 1 - Round 1: Basic Intent Detection', () => {
    // SEARCH_PRODUCT intent tests
    describe('SEARCH_PRODUCT intent', () => {
      const searchCases = [
        { input: 'Looking for running shoes', expected: Intent.SEARCH_PRODUCT },
        { input: 'Do you have Nike sneakers', expected: Intent.SEARCH_PRODUCT },
        { input: 'Find me a leather jacket', expected: Intent.SEARCH_PRODUCT },
        { input: 'I want to buy a watch', expected: Intent.SEARCH_PRODUCT },
        { input: 'Show me laptops', expected: Intent.SEARCH_PRODUCT },
        { input: 'I need a new phone', expected: Intent.SEARCH_PRODUCT },
        { input: 'Search for headphones', expected: Intent.SEARCH_PRODUCT },
      ];

      test.each(searchCases)('should detect SEARCH_PRODUCT: "$input"', ({ input, expected }) => {
        const result = detectIntent(input);
        expect(result.intent).toBe(expected);
        expect(result.confidence).toBeGreaterThan(0);
      });

      test('should extract product keywords', () => {
        const result = detectIntent('Looking for running shoes');
        expect(result.extractedText).toContain('running shoes');
      });
    });

    // ASK_PRICE intent tests
    describe('ASK_PRICE intent', () => {
      const priceCases = [
        { input: 'How much is this', expected: Intent.ASK_PRICE },
        { input: "What's the price", expected: Intent.ASK_PRICE },
        { input: 'How much does it cost', expected: Intent.ASK_PRICE },
        { input: 'Price of this item', expected: Intent.ASK_PRICE },
      ];

      test.each(priceCases)('should detect ASK_PRICE: "$input"', ({ input, expected }) => {
        const result = detectIntent(input);
        expect(result.intent).toBe(expected);
      });
    });

    // RECOMMEND intent tests
    describe('RECOMMEND intent', () => {
      const recommendCases = [
        { input: 'Can you recommend something', expected: Intent.RECOMMEND },
        { input: 'What should I buy', expected: Intent.RECOMMEND },
        { input: 'Suggest products for me', expected: Intent.RECOMMEND },
        { input: 'Best products for gaming', expected: Intent.RECOMMEND },
        { input: 'Top picks for summer', expected: Intent.RECOMMEND },
      ];

      test.each(recommendCases)('should detect RECOMMEND: "$input"', ({ input, expected }) => {
        const result = detectIntent(input);
        expect(result.intent).toBe(expected);
      });
    });

    // ASK_STOCK intent tests
    describe('ASK_STOCK intent', () => {
      const stockCases = [
        { input: 'Is this in stock', expected: Intent.ASK_STOCK },
        { input: 'Is it available', expected: Intent.ASK_STOCK },
        { input: 'How many left', expected: Intent.ASK_STOCK },
        { input: 'Out of stock?', expected: Intent.ASK_STOCK },
      ];

      test.each(stockCases)('should detect ASK_STOCK: "$input"', ({ input, expected }) => {
        const result = detectIntent(input);
        expect(result.intent).toBe(expected);
      });
    });

    // COMPARE intent tests
    describe('COMPARE intent', () => {
      const compareCases = [
        { input: 'Compare Nike vs Adidas', expected: Intent.COMPARE },
        { input: 'What is the difference between iPhone and Samsung', expected: Intent.COMPARE },
        { input: 'Which is better', expected: Intent.COMPARE },
        { input: 'MacBook or Dell laptop?', expected: Intent.COMPARE },
      ];

      test.each(compareCases)('should detect COMPARE: "$input"', ({ input, expected }) => {
        const result = detectIntent(input);
        expect(result.intent).toBe(expected);
      });
    });

    // GREETING intent tests
    describe('GREETING intent', () => {
      const greetingCases = [
        { input: 'Hello', expected: Intent.GREETING },
        { input: 'Hi', expected: Intent.GREETING },
        { input: 'Hey', expected: Intent.GREETING },
        { input: 'Good morning', expected: Intent.GREETING },
      ];

      test.each(greetingCases)('should detect GREETING: "$input"', ({ input, expected }) => {
        const result = detectIntent(input);
        expect(result.intent).toBe(expected);
      });
    });

    // Edge cases
    describe('Edge cases', () => {
      test('should return UNKNOWN for empty input', () => {
        const result = detectIntent('');
        expect(result.intent).toBe(Intent.UNKNOWN);
        expect(result.confidence).toBe(0);
      });

      test('should return UNKNOWN for gibberish', () => {
        const result = detectIntent('abc xyz 123');
        expect(result.intent).toBe(Intent.UNKNOWN);
      });

      test('should return UNKNOWN for random text', () => {
        const result = detectIntent('asdfghjkl');
        expect(result.intent).toBe(Intent.UNKNOWN);
      });

      test('should handle whitespace-only input', () => {
        const result = detectIntent('   ');
        expect(result.intent).toBe(Intent.UNKNOWN);
      });
    });
  });

  describe('Phase 1 - Round 2: Variations and Edge Cases', () => {
    // Case insensitivity
    test('should be case insensitive', () => {
      expect(detectIntent('LOOKING FOR SHOES').intent).toBe(Intent.SEARCH_PRODUCT);
      expect(detectIntent('looking for shoes').intent).toBe(Intent.SEARCH_PRODUCT);
      expect(detectIntent('Looking For Shoes').intent).toBe(Intent.SEARCH_PRODUCT);
    });

    // Minor typos (fuzzy not implemented yet, but patterns should be somewhat flexible)
    test('should handle variations', () => {
      expect(detectIntent('I want buy shoes').intent).toBe(Intent.SEARCH_PRODUCT);
      expect(detectIntent('searching for bags').intent).toBe(Intent.SEARCH_PRODUCT);
    });

    // Complex sentences
    test('should detect intent in complex sentences', () => {
      const result = detectIntent('Hey, I am looking for a good laptop under $1000');
      expect(result.intent).toBe(Intent.SEARCH_PRODUCT);
    });
  });

  describe('Phase 1 - Round 3: Response Quality', () => {
    test('should return quick replies for each intent', () => {
      const result = detectIntent('Looking for shoes');
      expect(result.quickReplies).toBeDefined();
      expect(result.quickReplies.length).toBeGreaterThan(0);
    });

    test('should return response templates', () => {
      const result = detectIntent('Hello');
      expect(result.responseTemplate).toBeDefined();
      expect(result.responseTemplate.length).toBeGreaterThan(0);
    });

    test('should have confidence score', () => {
      const result = detectIntent('Looking for running shoes');
      expect(result.confidence).toBeGreaterThan(30);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('Utility Functions', () => {
    test('matchesIntent should correctly identify intents', () => {
      expect(matchesIntent('Looking for shoes', Intent.SEARCH_PRODUCT)).toBe(true);
      expect(matchesIntent('Looking for shoes', Intent.ASK_PRICE)).toBe(false);
    });

    test('detectAllIntents should return sorted results', () => {
      const results = detectAllIntents('Can you recommend something for me to buy');
      expect(results.length).toBeGreaterThan(0);
      // Should be sorted by confidence
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].confidence).toBeGreaterThanOrEqual(results[i].confidence);
      }
    });
  });
});

// Accuracy calculation helper
describe('Accuracy Metrics', () => {
  test('overall accuracy should be >= 85%', () => {
    const testCases = [
      { input: 'Looking for running shoes', expected: Intent.SEARCH_PRODUCT },
      { input: 'Do you have Nike sneakers', expected: Intent.SEARCH_PRODUCT },
      { input: 'Find me a leather jacket', expected: Intent.SEARCH_PRODUCT },
      { input: 'I want to buy a watch', expected: Intent.SEARCH_PRODUCT },
      { input: 'How much is this', expected: Intent.ASK_PRICE },
      { input: "What's the price", expected: Intent.ASK_PRICE },
      { input: 'Can you recommend something', expected: Intent.RECOMMEND },
      { input: 'What should I buy', expected: Intent.RECOMMEND },
      { input: 'Is this in stock', expected: Intent.ASK_STOCK },
      { input: 'Is it available', expected: Intent.ASK_STOCK },
      { input: 'Compare Nike vs Adidas', expected: Intent.COMPARE },
      { input: 'Hello', expected: Intent.GREETING },
      { input: 'Hi', expected: Intent.GREETING },
      { input: '', expected: Intent.UNKNOWN },
      { input: 'abc xyz', expected: Intent.UNKNOWN },
    ];

    let correct = 0;
    testCases.forEach(({ input, expected }) => {
      const result = detectIntent(input);
      if (result.intent === expected) correct++;
    });

    const accuracy = (correct / testCases.length) * 100;
    console.log(`Intent Detection Accuracy: ${accuracy.toFixed(1)}% (${correct}/${testCases.length})`);
    expect(accuracy).toBeGreaterThanOrEqual(85);
  });
});
