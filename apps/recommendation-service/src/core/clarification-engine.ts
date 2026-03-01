/**
 * Clarification Engine
 * 
 * Phase 3: Determines when the chatbox should ask clarifying questions
 * instead of immediately returning products.
 * 
 * Rules:
 * 1. SEARCH_PRODUCT with only category (no brand, price, color) AND >20 results → ask brand/price
 * 2. RECOMMEND with no specific keywords → ask what type of product
 * 3. ASK_PRICE with too-generic product name → ask which specific product
 * 4. Already clarified 2+ times in session → stop clarifying, show results
 * 5. User provided ≥3 filters → never clarify, show results immediately
 */

import { Intent } from '../config/intents.config';
import { BRAND_KEYWORDS } from '../config/keywords.config';
import { ExtractedKeywords } from './keyword-extractor';
import { ChatMessage } from './chat-service';

// ========== Types ==========

export interface ClarOption {
  label: string;        // Display text: "Nike", "Under $50"
  value: string;        // The keyword value to search with
  type: 'brand' | 'price_range' | 'category' | 'style' | 'color';
}

export interface ClarificationResult {
  /** Whether we should ask for clarification */
  needsClarification: boolean;
  /** What type of clarification */
  clarificationType?: 'brand' | 'price' | 'category' | 'style' | 'multiple';
  /** The question to ask */
  question?: string;
  /** Selectable options for the user */
  options?: ClarOption[];
  /** Optionally still show 1-2 preview products */
  showPreview?: boolean;
  /** Number of preview products to show */
  previewCount?: number;
}

// ========== Helper: Count Clarifications in Session ==========

function countClarificationsInSession(messages: ChatMessage[]): number {
  let count = 0;
  for (const msg of messages) {
    if (msg.senderType !== 'ai') continue;
    const content = msg.content || '';
    // Match against actual clarification templates and generated questions
    if (
      content.includes('Could you tell me more') ||
      content.includes('narrow things down') ||
      content.includes('I have a quick question') ||
      content.includes('To find the perfect one') ||
      content.includes('What type of product') ||
      content.includes('Which') && content.includes('product specifically')
    ) {
      count++;
    }
  }
  return count;
}

// ========== Helper: Get Popular Brands for Category ==========

function getPopularBrandsForCategory(category: string): string[] {
  const categoryBrandMap: Record<string, string[]> = {
    shoes: ['Nike', 'Adidas', 'Puma', 'New Balance', 'Converse'],
    clothing: ['Zara', 'H&M', 'Uniqlo', 'Nike', 'Adidas'],
    bags: ['Gucci', 'Louis Vuitton', 'Prada', 'Zara', 'H&M'],
    electronics: ['Apple', 'Samsung', 'Sony', 'Dell', 'HP'],
    accessories: ['Rolex', 'Casio', 'Ray-Ban', 'Fossil', 'Oakley'],
    sports: ['Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour'],
    beauty: ['Chanel', 'Gucci', 'Prada', 'Zara', 'H&M'],
    home: ['IKEA', 'Zara Home', 'H&M Home'],
  };

  return categoryBrandMap[category.toLowerCase()] || BRAND_KEYWORDS.slice(0, 5).map(
    b => b.charAt(0).toUpperCase() + b.slice(1)
  );
}

// ========== Main Logic ==========

/**
 * Determine if clarification is needed for this query.
 * 
 * @param intent - The detected intent
 * @param keywords - Extracted keywords from the current message
 * @param accumulatedKeywords - All accumulated keywords from the session
 * @param messages - Conversation history
 * @param estimatedResultCount - Rough estimate of how many products match (optional)
 */
export function shouldClarify(
  intent: Intent,
  keywords: ExtractedKeywords,
  accumulatedKeywords: ExtractedKeywords,
  messages: ChatMessage[],
  estimatedResultCount?: number,
): ClarificationResult {
  const NO_CLARIFICATION: ClarificationResult = { needsClarification: false };

  // Rule 4: Already clarified 2+ times → stop
  const prevClarifications = countClarificationsInSession(messages);
  if (prevClarifications >= 2) {
    return NO_CLARIFICATION;
  }

  // Rule 5: User provided ≥3 filters → don't clarify
  // Deduplicate: if same filter in both, count once
  const effectiveFilters = new Set<string>();
  if (keywords.categories.length > 0 || accumulatedKeywords.categories.length > 0) effectiveFilters.add('category');
  if (keywords.brands.length > 0 || accumulatedKeywords.brands.length > 0) effectiveFilters.add('brand');
  if (keywords.colors.length > 0 || accumulatedKeywords.colors.length > 0) effectiveFilters.add('color');
  if (keywords.sizes.length > 0 || accumulatedKeywords.sizes.length > 0) effectiveFilters.add('size');
  if (keywords.priceRange || accumulatedKeywords.priceRange) effectiveFilters.add('price');
  if (keywords.priceModifier || accumulatedKeywords.priceModifier) effectiveFilters.add('pricemod');
  if (keywords.gender || accumulatedKeywords.gender) effectiveFilters.add('gender');

  if (effectiveFilters.size >= 3) {
    return NO_CLARIFICATION;
  }

  // Rule 1: SEARCH_PRODUCT with only category → ask brand + price
  if (intent === Intent.SEARCH_PRODUCT) {
    const hasCategory = keywords.categories.length > 0 || accumulatedKeywords.categories.length > 0;
    const hasBrand = keywords.brands.length > 0 || accumulatedKeywords.brands.length > 0;
    const hasPrice = !!keywords.priceRange || !!keywords.priceModifier || !!accumulatedKeywords.priceRange || !!accumulatedKeywords.priceModifier;
    const hasColor = keywords.colors.length > 0 || accumulatedKeywords.colors.length > 0;

    if (hasCategory && !hasBrand && !hasPrice && !hasColor) {
      const category = keywords.categories[0] || accumulatedKeywords.categories[0];
      const popularBrands = getPopularBrandsForCategory(category);

      const options: ClarOption[] = [
        ...popularBrands.map(b => ({ label: b, value: b.toLowerCase(), type: 'brand' as const })),
        { label: 'Any brand', value: '', type: 'brand' as const },
      ];

      const priceOptions: ClarOption[] = [
        { label: 'Under $50', value: 'under 50', type: 'price_range' },
        { label: '$50 - $100', value: '50 to 100', type: 'price_range' },
        { label: '$100 - $200', value: '100 to 200', type: 'price_range' },
        { label: '$200+', value: 'over 200', type: 'price_range' },
        { label: 'Any price', value: '', type: 'price_range' },
      ];

      return {
        needsClarification: true,
        clarificationType: 'multiple',
        question: `Great choice! I have lots of **${category}**. To find the perfect one for you:`,
        options: [...options, ...priceOptions],
        showPreview: true,
        previewCount: 2,
      };
    }
  }

  // Rule 2: RECOMMEND with no specific keywords → ask category
  if (intent === Intent.RECOMMEND) {
    const hasAnySpecific =
      keywords.categories.length > 0 ||
      keywords.brands.length > 0 ||
      keywords.rawKeywords.length > 0 ||
      accumulatedKeywords.categories.length > 0 ||
      accumulatedKeywords.brands.length > 0;

    if (!hasAnySpecific) {
      const categoryOptions: ClarOption[] = [
        { label: '👟 Shoes', value: 'shoes', type: 'category' },
        { label: '👕 Clothing', value: 'clothing', type: 'category' },
        { label: '📱 Electronics', value: 'electronics', type: 'category' },
        { label: '👜 Bags', value: 'bags', type: 'category' },
        { label: '🏋️ Sports', value: 'sports', type: 'category' },
        { label: '💄 Beauty', value: 'beauty', type: 'category' },
      ];

      return {
        needsClarification: true,
        clarificationType: 'category',
        question: "I'd love to help! What type of product are you interested in?",
        options: categoryOptions,
        showPreview: false,
      };
    }
  }

  // Rule 3: ASK_PRICE with very generic query
  if (intent === Intent.ASK_PRICE) {
    const hasSpecificProduct = keywords.brands.length > 0 || keywords.rawKeywords.length > 1;
    if (!hasSpecificProduct && keywords.categories.length > 0) {
      const category = keywords.categories[0];
      return {
        needsClarification: true,
        clarificationType: 'brand',
        question: `Which **${category}** product specifically? Here are popular brands:`,
        options: getPopularBrandsForCategory(category).map(b => ({
          label: b,
          value: b.toLowerCase(),
          type: 'brand' as const,
        })),
        showPreview: true,
        previewCount: 3,
      };
    }
  }

  return NO_CLARIFICATION;
}

/**
 * Check if a user message is a clarification response (clicked option or typed a brief answer).
 * If so, return the extracted filter value.
 */
export function parseClarificationResponse(
  message: string,
  previousOptions?: ClarOption[],
): { isClarificationResponse: boolean; value?: string; type?: ClarOption['type'] } {
  if (!previousOptions || previousOptions.length === 0) {
    return { isClarificationResponse: false };
  }

  const lower = message.toLowerCase().trim();

  // Check if message matches any option label or value
  for (const option of previousOptions) {
    if (
      lower === option.label.toLowerCase() ||
      lower === option.value.toLowerCase() ||
      // Handle emoji-prefixed labels like "👟 Shoes"
      lower === option.label.replace(/^[^\w\s]+\s*/, '').toLowerCase()
    ) {
      return {
        isClarificationResponse: true,
        value: option.value,
        type: option.type,
      };
    }
  }

  return { isClarificationResponse: false };
}
