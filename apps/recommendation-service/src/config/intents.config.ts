/**
 * Intent Detection Configuration
 * 
 * Rule-based patterns for detecting user intent from chat messages.
 * English-only patterns as per requirements.
 * 
 * IMPORTANT: Every quick-reply text MUST match at least one pattern here.
 */

export enum Intent {
  SEARCH_PRODUCT = 'SEARCH_PRODUCT',
  ASK_PRICE = 'ASK_PRICE',
  ASK_STOCK = 'ASK_STOCK',
  RECOMMEND = 'RECOMMEND',
  COMPARE = 'COMPARE',
  GREETING = 'GREETING',
  HELP = 'HELP',
  ORDER_STATUS = 'ORDER_STATUS',
  BROWSE = 'BROWSE',
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
    intent: Intent.ORDER_STATUS,
    priority: 105,
    patterns: [
      /(?:check|track|where(?:'s| is))?\s*(?:my\s+)?order/i,
      /order\s+status/i,
      /delivery\s+status/i,
      /where(?:'s| is)\s+my\s+(?:package|shipment)/i,
      /shipping\s+status/i,
    ],
  },
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
      /^search\s*products?$/i,
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
      /filter(?:ing)?\s+by\s+price/i,
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
      /check\s+availability/i,
      /notify\s+(?:me\s+)?when\s+available/i,
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
      /best\s+(?:products?|items?|options?|sellers?)/i,
      /popular\s+(?:products?|items?)/i,
      /top\s+(?:products?|items?|picks?|rated|sellers?)/i,
      /new\s+arrivals?/i,
      /trending/i,
      /^get\s+recommendations?$/i,
      /featured/i,
      /what(?:'s| is)\s+(?:hot|trending|new)/i,
      /show\s+(?:me\s+)?more/i,
      /more\s+options?/i,
      /see\s+(?:similar|alternatives)/i,
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
      /see\s+details/i,
    ],
  },
  {
    intent: Intent.BROWSE,
    priority: 70,
    patterns: [
      /browse\s+(.+)/i,
      /^browse\s*(?:categories|products)?$/i,
      /categories/i,
      /show\s+(?:all\s+)?categories/i,
      /what\s+(?:do you|categories)/i,
      /different\s+category/i,
    ],
  },
  {
    intent: Intent.HELP,
    priority: 60,
    patterns: [
      /^help$/i,
      /^get help$/i,
      /^need help$/i,
      /how\s+(?:can|do)\s+(?:i|you)/i,
      /what\s+can\s+you\s+do/i,
      /how\s+does\s+this\s+work/i,
      /what\s+(?:are\s+)?(?:your\s+)?(?:features|capabilities)/i,
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
      /^yo$/i,
      /^what'?s?\s+up$/i,
    ],
  },
];

/**
 * Quick reply suggestions based on intent.
 * 
 * RULE: Every quick reply text MUST be recognizable by at least one pattern above.
 */
export const QUICK_REPLIES: Record<Intent, string[]> = {
  [Intent.SEARCH_PRODUCT]: ['Show me more', 'Filter by price', 'Different category'],
  [Intent.ASK_PRICE]: ['Show me more', 'See similar', 'Check availability'],
  [Intent.ASK_STOCK]: ['Notify when available', 'See alternatives', 'Search products'],
  [Intent.RECOMMEND]: ['Top rated', 'Best sellers', 'New arrivals'],
  [Intent.COMPARE]: ['See details', 'Show me more', 'More options'],
  [Intent.GREETING]: ['Search products', 'Get recommendations', 'Browse categories'],
  [Intent.HELP]: ['Search products', 'Get recommendations', 'Browse categories'],
  [Intent.ORDER_STATUS]: ['Search products', 'Get recommendations', 'Get help'],
  [Intent.BROWSE]: ['Search products', 'Get recommendations', 'Top rated'],
  [Intent.UNKNOWN]: ['Search products', 'Get recommendations', 'Browse categories'],
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
    "I can help you with:\n• **Search products** — tell me what you're looking for\n• **Get recommendations** — I'll suggest popular items\n• **Check prices** — ask about any product's cost\n• **Browse categories** — explore shoes, clothing, electronics & more\n\nJust type naturally, like \"show me Nike shoes under $100\"!",
  ],
  [Intent.ORDER_STATUS]: [
    "To check your order status, please visit your **Account → Orders** page. I can help you find products or get recommendations while you're here!",
  ],
  [Intent.BROWSE]: [
    "We have several categories to explore:\n• 👟 Shoes & Sneakers\n• 👕 Clothing & Apparel\n• 👜 Bags & Accessories\n• 📱 Electronics\n• 🏋️ Sports & Fitness\n• 💄 Beauty & Skincare\n• 🏠 Home & Living\n\nWhat interests you? Tell me a category or just describe what you need!",
  ],
  [Intent.UNKNOWN]: [
    "I'm not sure I understand. Try asking me things like:\n• \"Show me Nike shoes\"\n• \"I need a laptop under $1000\"\n• \"Recommend popular bags\"\n\nOr tap one of the quick replies below!",
  ],
};
