/**
 * Intent Detection Configuration
 * 
 * Rule-based patterns for detecting user intent from chat messages.
 * English-only patterns as per requirements.
 */

export enum Intent {
  SEARCH_PRODUCT = 'SEARCH_PRODUCT',
  ASK_PRICE = 'ASK_PRICE',
  ASK_STOCK = 'ASK_STOCK',
  RECOMMEND = 'RECOMMEND',
  COMPARE = 'COMPARE',
  GREETING = 'GREETING',
  HELP = 'HELP',
  UNKNOWN = 'UNKNOWN',
}

export interface IntentPattern {
  intent: Intent;
  patterns: RegExp[];
  priority: number; // Higher = checked first
}

/**
 * Intent patterns ordered by priority
 * More specific patterns have higher priority
 */
export const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: Intent.SEARCH_PRODUCT,
    priority: 100,
    patterns: [
      /looking for\s+(.+)/i,
      /find me\s+(.+)/i,
      /search(?:ing)?\s+(?:for\s+)?(.+)/i,
      /(?:i\s+)?want(?:\s+to)?\s+buy\s+(.+)/i,
      /do you have\s+(.+)/i,
      /show me\s+(.+)/i,
      /(?:i\s+)?need\s+(.+)/i,
      /any\s+(.+)\s+available/i,
    ],
  },
  {
    intent: Intent.ASK_PRICE,
    priority: 90,
    patterns: [
      /how much/i,
      /what(?:'s| is) the price/i,
      /price of/i,
      /cost(?:s)?\s+(?:of)?/i,
      /how expensive/i,
      /what do(?:es)? .+ cost/i,
    ],
  },
  {
    intent: Intent.ASK_STOCK,
    priority: 85,
    patterns: [
      /(?:is|are)\s+(?:it|this|they|these)\s+(?:in\s+)?stock/i,
      /(?:is|are)\s+(?:it|this|they|these)\s+available/i,
      /out of stock/i,
      /how many\s+(?:are\s+)?left/i,
      /(?:do you|any)\s+have\s+(?:any\s+)?(?:in\s+)?stock/i,
      /availability/i,
    ],
  },
  {
    intent: Intent.RECOMMEND,
    priority: 80,
    patterns: [
      /recommend/i,
      /suggest/i,
      /what should(?:\s+i)?\s+(?:buy|get|choose)/i,
      /help(?:\s+me)?\s+choose/i,
      /best\s+(?:products?|items?|options?)/i,
      /popular\s+(?:products?|items?)/i,
      /top\s+(?:products?|items?|picks?)/i,
    ],
  },
  {
    intent: Intent.COMPARE,
    priority: 75,
    patterns: [
      /compare/i,
      /difference(?:s)?\s+between/i,
      /(.+)\s+vs\.?\s+(.+)/i,
      /which\s+(?:is|are)\s+better/i,
      /(.+)\s+or\s+(.+)\s*\?/i,
    ],
  },
  {
    intent: Intent.HELP,
    priority: 60,
    patterns: [
      /^help$/i,
      /how\s+(?:can|do)\s+(?:i|you)/i,
      /what\s+can\s+you\s+do/i,
      /how\s+does\s+this\s+work/i,
    ],
  },
  {
    intent: Intent.GREETING,
    priority: 50,
    patterns: [
      /^hi$/i,
      /^hello$/i,
      /^hey$/i,
      /^good\s+(morning|afternoon|evening)/i,
      /^howdy$/i,
    ],
  },
];

/**
 * Quick reply suggestions based on intent
 */
export const QUICK_REPLIES: Record<Intent, string[]> = {
  [Intent.SEARCH_PRODUCT]: ['Show more', 'Filter by price', 'Different category'],
  [Intent.ASK_PRICE]: ['Add to cart', 'See similar products', 'Check availability'],
  [Intent.ASK_STOCK]: ['Notify when available', 'See alternatives', 'Add to wishlist'],
  [Intent.RECOMMEND]: ['Top rated', 'Best sellers', 'New arrivals'],
  [Intent.COMPARE]: ['See details', 'Add both to cart', 'More options'],
  [Intent.GREETING]: ['Browse products', 'Get recommendations', 'Need help?'],
  [Intent.HELP]: ['Search products', 'Get recommendations', 'Check my orders'],
  [Intent.UNKNOWN]: ['Search products', 'Get help', 'Browse categories'],
};

/**
 * Response templates
 */
export const RESPONSE_TEMPLATES: Record<Intent, string[]> = {
  [Intent.SEARCH_PRODUCT]: [
    "Here are some products matching your search:",
    "I found these products for you:",
    "Check out these results:",
  ],
  [Intent.ASK_PRICE]: [
    "Here's the pricing information:",
    "The price for this product is:",
  ],
  [Intent.ASK_STOCK]: [
    "Here's the availability status:",
    "Stock information:",
  ],
  [Intent.RECOMMEND]: [
    "Based on your preferences, I recommend:",
    "Here are my top picks for you:",
    "You might like these products:",
  ],
  [Intent.COMPARE]: [
    "Here's a comparison:",
    "Let me compare these for you:",
  ],
  [Intent.GREETING]: [
    "Hello! How can I help you today?",
    "Hi there! Looking for something specific?",
    "Welcome! I'm here to help you find great products.",
  ],
  [Intent.HELP]: [
    "I can help you with:\n- Searching for products\n- Getting recommendations\n- Checking prices and availability\n- Comparing products",
  ],
  [Intent.UNKNOWN]: [
    "I'm not sure I understand. Could you try rephrasing?",
    "I didn't quite get that. Try asking about products, prices, or recommendations!",
  ],
};
