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

import { ProductForScoring } from "./recommendation-engine";
import { loadProducts } from "../data/product-loader";
import {
  extractKeywords,
  fuzzyMatch,
  BRAND_KEYWORDS,
} from "./keyword-extractor";

// ========== Types ==========

export interface ComparisonField {
  field: string; // "Price", "Rating", "Brand", etc.
  values: (string | number)[]; // Value per product
  winner?: number; // Index of the better product for this field (0-based), undefined if tie
  icon?: string; // Emoji icon
}

export interface ComparisonResult {
  /** Products being compared (2-5) */
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

/** Max subjects to extract from a single comparison query */
const MAX_COMPARISON_SUBJECTS = 5;

/**
 * Clean price hints and noise from a subject string.
 * "Nike Air Max ($130)" → "Nike Air Max"
 * "the Nike shoes" → "Nike shoes"
 */
function cleanSubject(text: string): string {
  return text
    .replace(/\s*\(\$[\d,.]+\)\s*/g, '') // Remove ($130), ($12.99)
    .replace(/\s*\$[\d,.]+\s*/g, ' ')     // Remove standalone $130
    .replace(/^(?:the|a|an)\s+/i, '')     // Remove articles
    .replace(/\s*\?+\s*$/, '')            // Remove trailing ?
    .replace(/^compare\s+/i, '')          // Remove leading "compare"
    .replace(/^(?:which|what)\s+(?:is|are)\s+(?:better|best)\s*/i, '')
    .trim();
}

/**
 * Extract comparison subjects from a message.
 * Supports N-way comparisons using split-based parsing.
 *
 * Handles:
 * - "A vs B vs C"          → ["A", "B", "C"]
 * - "A or B or C?"         → ["A", "B", "C"]
 * - "compare A and B and C" → ["A", "B", "C"]
 * - "difference between A and B" → ["A", "B"]
 * - "A compared to B"      → ["A", "B"]
 * - "compare A"            → ["A"]
 */
export function extractComparisonSubjects(message: string): string[] {
  const trimmed = message.trim();

  // Pattern 1: Split by "vs" / "vs." (most common, supports N-way)
  if (/\bvs\.?\b/i.test(trimmed)) {
    return trimmed
      .split(/\s+vs\.?\s+/i)
      .map(cleanSubject)
      .filter(s => s.length > 0)
      .slice(0, MAX_COMPARISON_SUBJECTS);
  }

  // Pattern 2: "A or B or C?" (N-way, must end with ?)
  if (/\bor\b/i.test(trimmed) && /\?\s*$/.test(trimmed)) {
    return trimmed
      .split(/\s+or\s+/i)
      .map(cleanSubject)
      .filter(s => s.length > 0)
      .slice(0, MAX_COMPARISON_SUBJECTS);
  }

  // Pattern 3: "difference(s) between A and B (and C)"
  const diffMatch = trimmed.match(/difference(?:s)?\s+between\s+(.+)/i);
  if (diffMatch) {
    return diffMatch[1]
      .split(/\s+and\s+/i)
      .map(cleanSubject)
      .filter(s => s.length > 0)
      .slice(0, MAX_COMPARISON_SUBJECTS);
  }

  // Pattern 4: "A compared to B"
  const comparedToMatch = trimmed.match(/(.+?)\s+compared\s+to\s+(.+)/i);
  if (comparedToMatch) {
    return [cleanSubject(comparedToMatch[1]), cleanSubject(comparedToMatch[2])]
      .filter(s => s.length > 0);
  }

  // Pattern 5: "compare A and B and C" or "compare A with B"
  const compareMatch = trimmed.match(/compare\s+(.+)/i);
  if (compareMatch) {
    const body = compareMatch[1];
    // If body contains "and" or "with", split by them
    if (/\s+(?:and|with)\s+/i.test(body)) {
      return body
        .split(/\s+(?:and|with)\s+/i)
        .map(cleanSubject)
        .filter(s => s.length > 0)
        .slice(0, MAX_COMPARISON_SUBJECTS);
    }
    // Single subject: "compare X"
    const cleaned = cleanSubject(body);
    return cleaned.length > 0 ? [cleaned] : [];
  }

  return [];
}

// ========== Product Loading for Comparison ==========

/**
 * Find the best matching product for a subject string.
 * Strips price hints, uses fuzzy brand matching, and scores by title similarity.
 */
async function findBestProduct(
  subject: string,
): Promise<ProductForScoring | null> {
  // Strip price hints before searching: "Nike Air Max ($130)" → "Nike Air Max"
  const cleanedSubject = subject
    .replace(/\s*\(\$[\d,.]+\)\s*/g, '')
    .replace(/\s*\$[\d,.]+\s*/g, ' ')
    .trim();

  const keywords = extractKeywords(cleanedSubject);

  // Fuzzy brand resolution: if no exact brand found, try fuzzy match on each word
  let resolvedBrands = keywords.brands;
  if (resolvedBrands.length === 0) {
    for (const word of cleanedSubject.split(/\s+/)) {
      if (word.length < 3) continue;
      const fuzzy = fuzzyMatch(word, BRAND_KEYWORDS, 1);
      if (fuzzy && !resolvedBrands.includes(fuzzy)) resolvedBrands = [fuzzy];
    }
  }

  const products = await loadProducts({
    keyword: cleanedSubject,
    categories:
      keywords.categories.length > 0 ? keywords.categories : undefined,
    brands: resolvedBrands.length > 0 ? resolvedBrands : undefined,
    limit: 10, // More candidates for better matching
  });

  if (products.length === 0) return null;

  // Score by title similarity (fuzzy)
  const subjectLower = cleanedSubject.toLowerCase();
  const subjectWords = subjectLower.split(/\s+/).filter(w => w.length > 2);
  let best = products[0];
  let bestScore = -1;

  for (const product of products) {
    let score = 0;
    const titleLower = product.title.toLowerCase();

    // Full substring match
    if (titleLower.includes(subjectLower)) score += 50;

    // Word-level matching
    for (const word of subjectWords) {
      if (titleLower.includes(word)) score += 10;
      if (product.brand?.toLowerCase() === word) score += 20;
      if (product.category.toLowerCase().includes(word)) score += 15;
    }

    // Fuzzy title match: check each subject word against each title word
    const titleWords = titleLower.split(/\s+/).filter(w => w.length > 2);
    for (const sw of subjectWords) {
      for (const tw of titleWords) {
        if (sw !== tw && fuzzyMatch(sw, [tw], 1)) {
          score += 5; // Partial credit for close matches
        }
      }
    }

    score += (product.rating || 0) * 2;

    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }

  return best;
}

// ========== Comparison Logic ==========

// ========== Spec Display Configuration ==========

interface SpecConfig {
  key: string;
  label: string;
  icon: string;
  winRule: "higher" | "lower" | "none";
  suffix?: string;
  format?: (val: any) => string;
}

/** Ordered list of spec fields to display when available */
const SPEC_DISPLAY_CONFIG: SpecConfig[] = [
  { key: "cpu", label: "Processor", icon: "💻", winRule: "none" },
  { key: "gpu", label: "GPU", icon: "🎮", winRule: "none" },
  { key: "ram_gb", label: "RAM", icon: "🧠", winRule: "higher", suffix: "GB" },
  {
    key: "storage_gb",
    label: "Storage",
    icon: "💾",
    winRule: "higher",
    suffix: "GB",
    format: (v: number) =>
      v >= 1024 ? `${(v / 1024).toFixed(0)}TB` : `${v}GB`,
  },
  { key: "display_size", label: "Display", icon: "📱", winRule: "none" },
  { key: "display_type", label: "Panel", icon: "🖥️", winRule: "none" },
  { key: "resolution", label: "Resolution", icon: "📐", winRule: "none" },
  {
    key: "battery_hours",
    label: "Battery",
    icon: "🔋",
    winRule: "higher",
    suffix: "hrs",
  },
  {
    key: "battery_mah",
    label: "Battery",
    icon: "🔋",
    winRule: "higher",
    suffix: "mAh",
  },
  {
    key: "camera_mp",
    label: "Camera",
    icon: "📷",
    winRule: "higher",
    suffix: "MP",
  },
  { key: "camera_system", label: "Camera System", icon: "📸", winRule: "none" },
  {
    key: "weight_kg",
    label: "Weight",
    icon: "⚖️",
    winRule: "lower",
    suffix: "kg",
  },
  {
    key: "weight_g",
    label: "Weight",
    icon: "⚖️",
    winRule: "lower",
    suffix: "g",
  },
  { key: "os", label: "OS", icon: "⚙️", winRule: "none" },
  { key: "noise_cancellation", label: "ANC", icon: "🔇", winRule: "none" },
  {
    key: "driver_mm",
    label: "Driver",
    icon: "🔊",
    winRule: "higher",
    suffix: "mm",
  },
  { key: "connectivity", label: "Connectivity", icon: "📡", winRule: "none" },
  {
    key: "water_resistance",
    label: "Water Resistance",
    icon: "💧",
    winRule: "none",
  },
  { key: "ports", label: "Ports", icon: "🔌", winRule: "none" },
];

/**
 * Build comparison table for 2+ products.
 * Automatically includes spec fields if products have customSpecs.
 */
function buildComparisonTable(
  products: ProductForScoring[],
): ComparisonField[] {
  const fields: ComparisonField[] = [];

  // Price comparison
  const prices = products.map((p) => p.price);
  const minPrice = Math.min(...prices);
  fields.push({
    field: "Price",
    values: products.map((p) => `$${p.price.toLocaleString("en-US")}`),
    winner: prices.indexOf(minPrice), // Lower price wins
    icon: "💰",
  });

  // Rating comparison
  const ratings = products.map((p) => p.rating || 0);
  const maxRating = Math.max(...ratings);
  fields.push({
    field: "Rating",
    values: products.map((p) => `${(p.rating || 0).toFixed(1)} ⭐`),
    winner:
      ratings.filter((r) => r === maxRating).length === 1
        ? ratings.indexOf(maxRating)
        : undefined,
    icon: "⭐",
  });

  // Brand
  fields.push({
    field: "Brand",
    values: products.map((p) => p.brand || "Unknown"),
    icon: "🏷️",
  });

  // ===== Spec-aware comparison fields =====
  const hasSpecs = products.some(
    (p) => p.customSpecs && Object.keys(p.customSpecs).length > 0,
  );

  if (hasSpecs) {
    // Find common spec keys across all products
    const allSpecKeys = new Set<string>();
    products.forEach((p) => {
      if (p.customSpecs) {
        Object.keys(p.customSpecs).forEach((k) => allSpecKeys.add(k));
      }
    });

    // For each configured spec field, add a comparison row if at least 2 products have it
    for (const config of SPEC_DISPLAY_CONFIG) {
      if (!allSpecKeys.has(config.key)) continue;

      const values = products.map((p) => p.customSpecs?.[config.key]);
      const hasValue = values.filter((v) => v !== undefined && v !== null);
      if (hasValue.length < 2) continue;

      // Determine winner based on win rule
      let winner: number | undefined;
      if (config.winRule !== "none") {
        const numericValues = values.map((v) =>
          typeof v === "number" ? v : NaN,
        );
        const validNumerics = numericValues.filter((v) => !isNaN(v));

        if (validNumerics.length >= 2) {
          const target =
            config.winRule === "higher"
              ? Math.max(...validNumerics)
              : Math.min(...validNumerics);
          const allSame = validNumerics.every((v) => v === target);
          if (!allSame) {
            winner = numericValues.indexOf(target);
          }
        }
      }

      // Format display values
      const displayValues = values.map((v) => {
        if (v === undefined || v === null) return "N/A";
        if (config.format) return config.format(v);
        if (typeof v === "number" && config.suffix)
          return `${v}${config.suffix}`;
        return String(v);
      });

      fields.push({
        field: config.label,
        values: displayValues,
        winner,
        icon: config.icon,
      });
    }
  } else {
    // Non-spec products: show basic fields
    // Category
    fields.push({
      field: "Category",
      values: products.map((p) => p.category),
      icon: "📂",
    });

    // Total Sales
    const sales = products.map((p) => p.totalSales || 0);
    const maxSales = Math.max(...sales);
    if (maxSales > 0) {
      fields.push({
        field: "Total Sales",
        values: products.map((p) =>
          (p.totalSales || 0).toLocaleString("en-US"),
        ),
        winner:
          sales.filter((s) => s === maxSales).length === 1
            ? sales.indexOf(maxSales)
            : undefined,
        icon: "📊",
      });
    }

    // Available Colors
    if (products.some((p) => p.colors && p.colors.length > 0)) {
      fields.push({
        field: "Colors",
        values: products.map((p) =>
          p.colors && p.colors.length > 0 ? p.colors.join(", ") : "N/A",
        ),
        icon: "🎨",
      });
    }
  }

  return fields;
}

/**
 * Generate a human-readable verdict for N products (2-5).
 * Identifies the winner in each dimension rather than hard-coding p1 vs p2.
 */
function generateVerdict(products: ProductForScoring[], _table: ComparisonField[]): string {
  if (products.length < 2) return '';

  const parts: string[] = [];
  const hasSpecs = products.some(p => p.customSpecs && Object.keys(p.customSpecs).length > 0);

  // ── Cheapest ──
  const minPrice = Math.min(...products.map(p => p.price));
  const cheapest = products.filter(p => p.price === minPrice);
  if (cheapest.length === 1 && products.length > 1) {
    const most = products.reduce((a, b) => b.price > a.price ? b : a);
    const diff = most.price - cheapest[0].price;
    parts.push(`**${cheapest[0].title}** is the **cheapest** ($${diff.toFixed(0)} less than the most expensive)`);
  }

  // ── Highest rated ──
  const maxRating = Math.max(...products.map(p => p.rating || 0));
  const bestRated = products.filter(p => (p.rating || 0) === maxRating);
  if (bestRated.length === 1) {
    parts.push(`**${bestRated[0].title}** has the **best rating** (${maxRating.toFixed(1)}⭐)`);
  }

  if (hasSpecs) {
    // ── Most RAM ──
    const ramValues = products.map(p => ({ p, val: p.customSpecs?.ram_gb as number | undefined })).filter(x => x.val);
    if (ramValues.length >= 2) {
      const best = ramValues.reduce((a, b) => (b.val! > a.val! ? b : a));
      const allSame = ramValues.every(x => x.val === best.val);
      if (!allSame) parts.push(`**${best.p.title}** has the **most RAM** (${best.val}GB)`);
    }

    // ── Best camera ──
    const camValues = products.map(p => ({ p, val: p.customSpecs?.camera_mp as number | undefined })).filter(x => x.val);
    if (camValues.length >= 2) {
      const best = camValues.reduce((a, b) => (b.val! > a.val! ? b : a));
      const allSame = camValues.every(x => x.val === best.val);
      if (!allSame) parts.push(`**${best.p.title}** has the **best camera** (${best.val}MP)`);
    }

    // ── Best battery ──
    const batValues = products
      .map(p => ({ p, val: (p.customSpecs?.battery_hours || p.customSpecs?.battery_mah) as number | undefined }))
      .filter(x => x.val);
    if (batValues.length >= 2) {
      const best = batValues.reduce((a, b) => (b.val! > a.val! ? b : a));
      const allSame = batValues.every(x => x.val === best.val);
      if (!allSame) parts.push(`**${best.p.title}** has the **longest battery life**`);
    }
  } else {
    // ── Most popular (non-spec) ──
    const maxSales = Math.max(...products.map(p => p.totalSales || 0));
    const bestSales = products.filter(p => (p.totalSales || 0) === maxSales);
    if (bestSales.length === 1 && maxSales > 0) {
      const runner = products.filter(p => p !== bestSales[0]).reduce((a, b) =>
        (b.totalSales || 0) > (a.totalSales || 0) ? b : a
      );
      if (maxSales > (runner.totalSales || 0) * 1.3) {
        parts.push(`**${bestSales[0].title}** is the **most popular** (${maxSales} sales)`);
      }
    }
  }

  if (parts.length === 0) {
    return 'All products are quite similar! Choose based on your personal preference.';
  }

  return parts.join('. ') + '.';
}

/**
 * Compare products based on extracted subjects or context.
 *
 * Flow:
 * 1. Context-ref ("compare them/these") → compare shown products
 * 2. Extract subjects from message → resolve each to a product → compare
 *
 * @param message - The user's comparison message
 * @param lastShownProducts - Products currently shown in chat (for "compare them/these")
 */
export async function compareProducts(
  message: string,
  lastShownProducts: ProductForScoring[] = [],
): Promise<ComparisonResult> {
  const trimmed = message.trim();

  // ── Flow 1: Context-aware ("compare them", "compare these") ──
  const isContextRef =
    /^compare\s+(?:them|these|those|the\s+(?:two|three|results?)|(?:all\s+)?of\s+them)\s*$/i.test(trimmed) ||
    /^(?:compare\s+)?(?:with\s+)?similar\s*$/i.test(trimmed) ||
    /^compare\s+these\s+(?:two|three|products?)\s*$/i.test(trimmed);

  if (isContextRef && lastShownProducts.length >= 2) {
    const toCompare = lastShownProducts.slice(0, 5);
    const table = buildComparisonTable(toCompare);
    const verdict = generateVerdict(toCompare, table);
    return {
      products: toCompare,
      comparisonTable: table,
      verdict,
      success: true,
      message: `Here's a side-by-side comparison of all ${toCompare.length} products:`,
      quickReplies: ['Show me more', 'Filter by price', 'Search products'],
    };
  }

  if (isContextRef && lastShownProducts.length === 1) {
    return {
      products: lastShownProducts,
      comparisonTable: [],
      verdict: '',
      success: false,
      message: `I have **${lastShownProducts[0].title}** — what would you like to compare it with?`,
      quickReplies: [
        'Compare with similar',
        `${lastShownProducts[0].brand} alternatives`,
        'Show me more',
      ],
    };
  }

  // ── Flow 2: Extract subjects from message ──
  const subjects = extractComparisonSubjects(trimmed);

  if (subjects.length === 0) {
    return {
      products: [],
      comparisonTable: [],
      verdict: '',
      success: false,
      message:
        'What would you like to compare? Try something like:\n• "**Nike vs Adidas vs Puma shoes**"\n• "**iPhone or Samsung or Pixel**"\n• "**compare laptop and tablet**"',
      quickReplies: ['Nike vs Adidas', 'Compare shoes', 'Browse categories'],
    };
  }

  // Single subject — attempt to pair with context product or ask
  if (subjects.length === 1) {
    if (lastShownProducts.length >= 1) {
      const product = await findBestProduct(subjects[0]);
      if (product) {
        const toCompare = [lastShownProducts[0], product];
        const table = buildComparisonTable(toCompare);
        const verdict = generateVerdict(toCompare, table);
        return {
          products: toCompare,
          comparisonTable: table,
          verdict,
          success: true,
          message: `Here's a comparison of **${toCompare.map(p => p.title).join('** vs **')}**:`,
          quickReplies: toCompare
            .map(p => `View ${p.title.substring(0, 20)}`)
            .concat(['Search products']),
        };
      }
    }

    const product = await findBestProduct(subjects[0]);
    if (product) {
      return {
        products: [product],
        comparisonTable: [],
        verdict: '',
        success: false,
        message: `I found **${product.title}** ($${product.price}). What would you like to compare it with?`,
        quickReplies: [
          'Compare with similar',
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

  // Multiple subjects — resolve each to a product and compare
  const productPromises = subjects.slice(0, MAX_COMPARISON_SUBJECTS).map(s => findBestProduct(s));
  const foundProducts = (await Promise.all(productPromises)).filter(
    (p): p is ProductForScoring => p !== null,
  );

  if (foundProducts.length < 2) {
    const found = foundProducts.length === 1 ? foundProducts[0].title : 'any matching products';
    const notFound = subjects.filter((_, i) => !foundProducts[i] && i < productPromises.length);
    return {
      products: foundProducts,
      comparisonTable: [],
      verdict: '',
      success: false,
      message: `I could only find **${found}**. Couldn't find: "${notFound.join('", "')}". Try different product names or brands.`,
      quickReplies: ['Search products', 'Browse categories', 'Try again'],
    };
  }

  const table = buildComparisonTable(foundProducts);
  const verdict = generateVerdict(foundProducts, table);

  return {
    products: foundProducts,
    comparisonTable: table,
    verdict,
    success: true,
    message: `Here's a comparison of **${foundProducts.map(p => p.title).join('** vs **')}**:`,
    quickReplies: foundProducts
      .map(p => `View ${p.title.substring(0, 20)}`)
      .concat(['Search products']),
  };
}
