/**
 * Comparison Engine
 * 
 * Phase 2: Handles COMPARE intent — side-by-side product comparison.
 * 
 * Flows:
 * - "compare Nike Air Max vs Adidas Ultraboost" → extract 2 subjects, load best match each, compare
 * - "compare Nike and Adidas shoes" → compare brands within category
 * - "which is better X or Y?" → same as compare
 * - Single subject → ask "Compare with what?"
 */

import { ProductForScoring } from './recommendation-engine';
import { loadProducts } from '../data/product-loader';
import { extractKeywords } from './keyword-extractor';

// ========== Types ==========

export interface ComparisonField {
  field: string;           // "Price", "Rating", "Brand", etc.
  values: (string | number)[];  // Value per product
  winner?: number;         // Index of the better product for this field (0-based), undefined if tie
  icon?: string;           // Emoji icon
}

export interface ComparisonResult {
  /** Products being compared (2-4) */
  products: ProductForScoring[];
  /** Side-by-side comparison fields */
  comparisonTable: ComparisonField[];
  /** AI-generated verdict/summary */
  verdict: string;
  /** Whether comparison was successful */
  success: boolean;
  /** Error/info message when comparison isn't possible */
  message: string;
  /** Quick replies specific to comparison context */
  quickReplies: string[];
}

// ========== Subject Extraction ==========

/**
 * Extract comparison subjects from a message.
 * Handles patterns like:
 * - "X vs Y", "X versus Y"
 * - "X or Y?"
 * - "compare X and Y"
 * - "difference between X and Y"
 * - "X compared to Y"
 */
export function extractComparisonSubjects(message: string): string[] {
  const trimmed = message.trim();
  const subjects: string[] = [];

  // Pattern 1: "X vs Y" or "X vs. Y"
  const vsMatch = trimmed.match(/(.+?)\s+vs\.?\s+(.+)/i);
  if (vsMatch) {
    subjects.push(cleanSubject(vsMatch[1]), cleanSubject(vsMatch[2]));
    return subjects.filter(s => s.length > 0);
  }

  // Pattern 2: "X or Y?" 
  const orMatch = trimmed.match(/(.+?)\s+or\s+(.+?)\s*\??$/i);
  if (orMatch) {
    subjects.push(cleanSubject(orMatch[1]), cleanSubject(orMatch[2]));
    return subjects.filter(s => s.length > 0);
  }

  // Pattern 3: "compare X and Y" or "compare X with Y"
  const compareAndMatch = trimmed.match(/compare\s+(.+?)\s+(?:and|with|to)\s+(.+)/i);
  if (compareAndMatch) {
    subjects.push(cleanSubject(compareAndMatch[1]), cleanSubject(compareAndMatch[2]));
    return subjects.filter(s => s.length > 0);
  }

  // Pattern 4: "difference between X and Y"
  const diffMatch = trimmed.match(/difference(?:s)?\s+between\s+(.+?)\s+and\s+(.+)/i);
  if (diffMatch) {
    subjects.push(cleanSubject(diffMatch[1]), cleanSubject(diffMatch[2]));
    return subjects.filter(s => s.length > 0);
  }

  // Pattern 5: "X compared to Y"
  const comparedToMatch = trimmed.match(/(.+?)\s+compared\s+to\s+(.+)/i);
  if (comparedToMatch) {
    subjects.push(cleanSubject(comparedToMatch[1]), cleanSubject(comparedToMatch[2]));
    return subjects.filter(s => s.length > 0);
  }

  // Pattern 6: Just "compare X" (single subject)
  const singleMatch = trimmed.match(/compare\s+(.+)/i);
  if (singleMatch) {
    subjects.push(cleanSubject(singleMatch[1]));
    return subjects.filter(s => s.length > 0);
  }

  return subjects;
}

/**
 * Clean up extracted subject text
 */
function cleanSubject(text: string): string {
  return text
    .replace(/^(?:the|a|an)\s+/i, '')       // Remove articles
    .replace(/\s*\?+\s*$/, '')               // Remove trailing ?
    .replace(/^compare\s+/i, '')             // Remove leading "compare"
    .replace(/^(?:which|what)\s+(?:is|are)\s+(?:better|best)\s*/i, '') // Remove "which is better"
    .trim();
}

// ========== Product Loading for Comparison ==========

/**
 * Find the best matching product for a subject string.
 */
async function findBestProduct(subject: string): Promise<ProductForScoring | null> {
  const keywords = extractKeywords(subject);

  const products = await loadProducts({
    keyword: subject,
    categories: keywords.categories.length > 0 ? keywords.categories : undefined,
    brands: keywords.brands.length > 0 ? keywords.brands : undefined,
    limit: 5,
  });

  if (products.length === 0) return null;

  // Score by title similarity
  const subjectLower = subject.toLowerCase();
  let best = products[0];
  let bestScore = 0;

  for (const product of products) {
    let score = 0;
    const titleLower = product.title.toLowerCase();

    // Exact title match
    if (titleLower.includes(subjectLower)) {
      score += 50;
    }

    // Word overlap
    const subjectWords = subjectLower.split(/\s+/);
    for (const word of subjectWords) {
      if (word.length > 2 && titleLower.includes(word)) score += 10;
      if (product.brand?.toLowerCase() === word) score += 20;
      if (product.category.toLowerCase().includes(word)) score += 15;
    }

    // Prefer higher-rated products for tie-breaking
    score += (product.rating || 0) * 2;

    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }

  return best;
}

// ========== Comparison Logic ==========

/**
 * Build comparison table for 2+ products.
 */
function buildComparisonTable(products: ProductForScoring[]): ComparisonField[] {
  const fields: ComparisonField[] = [];

  // Price comparison
  const prices = products.map(p => p.price);
  const minPrice = Math.min(...prices);
  fields.push({
    field: 'Price',
    values: products.map(p => `$${p.price.toLocaleString('en-US')}`),
    winner: prices.indexOf(minPrice), // Lower price wins
    icon: '💰',
  });

  // Rating comparison
  const ratings = products.map(p => p.rating || 0);
  const maxRating = Math.max(...ratings);
  fields.push({
    field: 'Rating',
    values: products.map(p => `${(p.rating || 0).toFixed(1)} ⭐`),
    winner: ratings.filter(r => r === maxRating).length === 1 ? ratings.indexOf(maxRating) : undefined,
    icon: '⭐',
  });

  // Brand
  fields.push({
    field: 'Brand',
    values: products.map(p => p.brand || 'Unknown'),
    icon: '🏷️',
  });

  // Category
  fields.push({
    field: 'Category',
    values: products.map(p => p.category),
    icon: '📂',
  });

  // Total Sales
  const sales = products.map(p => p.totalSales || 0);
  const maxSales = Math.max(...sales);
  if (maxSales > 0) {
    fields.push({
      field: 'Total Sales',
      values: products.map(p => (p.totalSales || 0).toLocaleString('en-US')),
      winner: sales.filter(s => s === maxSales).length === 1 ? sales.indexOf(maxSales) : undefined,
      icon: '📊',
    });
  }

  // Available Colors
  if (products.some(p => p.colors && p.colors.length > 0)) {
    fields.push({
      field: 'Colors',
      values: products.map(p => (p.colors && p.colors.length > 0) ? p.colors.join(', ') : 'N/A'),
      icon: '🎨',
    });
  }

  return fields;
}

/**
 * Generate a human-readable verdict comparing products.
 */
function generateVerdict(products: ProductForScoring[], table: ComparisonField[]): string {
  if (products.length < 2) return '';

  const p1 = products[0];
  const p2 = products[1];
  const parts: string[] = [];

  // Price comparison
  if (p1.price < p2.price) {
    const diff = p2.price - p1.price;
    parts.push(`**${p1.title}** is **$${diff.toFixed(0)} cheaper**`);
  } else if (p2.price < p1.price) {
    const diff = p1.price - p2.price;
    parts.push(`**${p2.title}** is **$${diff.toFixed(0)} cheaper**`);
  } else {
    parts.push('Both are **the same price**');
  }

  // Rating comparison
  const r1 = p1.rating || 0;
  const r2 = p2.rating || 0;
  if (r1 > r2) {
    parts.push(`**${p1.title}** has a **higher rating** (${r1.toFixed(1)} vs ${r2.toFixed(1)})`);
  } else if (r2 > r1) {
    parts.push(`**${p2.title}** has a **higher rating** (${r2.toFixed(1)} vs ${r1.toFixed(1)})`);
  }

  // Sales comparison
  const s1 = p1.totalSales || 0;
  const s2 = p2.totalSales || 0;
  if (s1 > s2 * 1.5) {
    parts.push(`**${p1.title}** is significantly **more popular** (${s1} sales)`);
  } else if (s2 > s1 * 1.5) {
    parts.push(`**${p2.title}** is significantly **more popular** (${s2} sales)`);
  }

  if (parts.length === 0) {
    return 'Both products are quite similar! Choose based on your personal preference.';
  }

  return parts.join('. ') + '.';
}

// ========== Main Export ==========

/**
 * Compare products based on extracted subjects.
 * 
 * @param message - The user's comparison message
 * @returns ComparisonResult with products, table, and verdict
 */
export async function compareProducts(message: string): Promise<ComparisonResult> {
  const subjects = extractComparisonSubjects(message);

  // No subjects extracted
  if (subjects.length === 0) {
    return {
      products: [],
      comparisonTable: [],
      verdict: '',
      success: false,
      message: "What would you like to compare? Try something like:\n• \"**Nike vs Adidas shoes**\"\n• \"**iPhone or Samsung**\"\n• \"**compare laptop and tablet**\"",
      quickReplies: ['Nike vs Adidas', 'Compare shoes', 'Browse categories'],
    };
  }

  // Single subject — ask for the second
  if (subjects.length === 1) {
    const product = await findBestProduct(subjects[0]);
    if (product) {
      return {
        products: [product],
        comparisonTable: [],
        verdict: '',
        success: false,
        message: `I found **${product.title}** ($${product.price}). What would you like to compare it with?`,
        quickReplies: [
          `Compare with similar`,
          `${product.brand || product.category} alternatives`,
          'Show me more',
        ],
      };
    }
    return {
      products: [],
      comparisonTable: [],
      verdict: '',
      success: false,
      message: `I couldn't find "${subjects[0]}". Could you try a different product name?`,
      quickReplies: ['Search products', 'Browse categories', 'Get recommendations'],
    };
  }

  // Two or more subjects — find products and compare
  const productPromises = subjects.slice(0, 4).map(s => findBestProduct(s));
  const foundProducts = (await Promise.all(productPromises)).filter(
    (p): p is ProductForScoring => p !== null
  );

  if (foundProducts.length < 2) {
    const found = foundProducts.length === 1 ? foundProducts[0].title : 'any matching products';
    const notFound = subjects.filter(
      (s, i) => !foundProducts[i]
    );
    return {
      products: foundProducts,
      comparisonTable: [],
      verdict: '',
      success: false,
      message: `I could only find **${found}**. Couldn't find: "${notFound.join('", "')}". Try different product names or brands.`,
      quickReplies: ['Search products', 'Browse categories', 'Try again'],
    };
  }

  // Build comparison
  const table = buildComparisonTable(foundProducts);
  const verdict = generateVerdict(foundProducts, table);

  return {
    products: foundProducts,
    comparisonTable: table,
    verdict,
    success: true,
    message: `Here's a comparison of **${foundProducts.map(p => p.title).join('** vs **')}**:`,
    quickReplies: [
      `View ${foundProducts[0].title.substring(0, 20)}`,
      `View ${foundProducts[1].title.substring(0, 20)}`,
      'Compare others',
    ],
  };
}
