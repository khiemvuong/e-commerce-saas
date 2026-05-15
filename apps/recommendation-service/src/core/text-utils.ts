/**
 * Text Utilities
 *
 * Shared text-processing algorithms used across the recommendation engine:
 * - Levenshtein distance (edit distance for typo correction)
 * - Fuzzy matching (best-match lookup within a threshold)
 * - Soundex (phonetic encoding for sound-alike matching)
 * - N-gram similarity (Jaccard similarity on character bigrams)
 *
 * Previously duplicated across keyword-extractor.ts and smart-fallback.ts.
 * Consolidated here as the single source of truth.
 */

// ========== Levenshtein Distance ==========

/**
 * Compute the Levenshtein (edit) distance between two strings.
 * Uses dynamic programming in O(m × n) time.
 *
 * @example
 * levenshteinDistance('adidas', 'adisdas'); // 1
 * levenshteinDistance('nike', 'niike');     // 1
 * levenshteinDistance('shoes', 'boots');    // 4
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}

// ========== Fuzzy Matching ==========

/**
 * Find the best fuzzy match for a word against a list of known terms.
 * Returns the matched term if edit distance is within threshold, otherwise null.
 *
 * Uses adaptive thresholds: shorter words (< 5 chars) require distance ≤ 1,
 * longer words use the provided `maxDistance`.
 *
 * @example
 * fuzzyMatch('adisdas', ['adidas', 'nike', 'puma']);     // 'adidas'
 * fuzzyMatch('nikey', ['adidas', 'nike', 'puma']);       // 'nike'
 * fuzzyMatch('ab', ['adidas', 'nike']);                  // null (too short)
 */
export function fuzzyMatch(word: string, knownTerms: string[], maxDistance: number = 2): string | null {
  if (word.length < 3) return null;

  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const term of knownTerms) {
    if (Math.abs(word.length - term.length) > maxDistance) continue;

    const dist = levenshteinDistance(word.toLowerCase(), term.toLowerCase());
    const threshold = term.length >= 5 ? maxDistance : 1;

    if (dist <= threshold && dist < bestDistance) {
      bestDistance = dist;
      bestMatch = term;
    }
  }

  return bestMatch;
}

// ========== Soundex (Phonetic Encoding) ==========

/**
 * Compute the Soundex phonetic code for a word.
 * Maps words to a 4-character code based on pronunciation.
 *
 * @example
 * soundex('nike');   // 'N200'
 * soundex('niike');  // 'N200' — same code, so they sound alike
 * soundex('adidas'); // 'A332'
 */
export function soundex(word: string): string {
  if (!word || word.length === 0) return '';

  const upper = word.toUpperCase();
  let code = upper[0];

  const map: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6',
  };

  let prevCode = map[upper[0]] || '0';

  for (let i = 1; i < upper.length && code.length < 4; i++) {
    const charCode = map[upper[i]] || '0';
    if (charCode !== '0' && charCode !== prevCode) {
      code += charCode;
    }
    prevCode = charCode;
  }

  return code.padEnd(4, '0');
}

/**
 * Check if two words sound similar using Soundex.
 *
 * @example
 * soundsLike('nike', 'niike');   // true
 * soundsLike('adidas', 'nike');  // false
 */
export function soundsLike(word1: string, word2: string): boolean {
  if (word1.length < 3 || word2.length < 3) return false;
  return soundex(word1) === soundex(word2);
}

// ========== N-gram Similarity ==========

/**
 * Calculate n-gram (Jaccard) similarity between two strings.
 * Returns a score from 0 (no overlap) to 1 (identical bigrams).
 *
 * @example
 * ngramSimilarity('sneakers', 'sneakrs');  // ~0.7 (high similarity)
 * ngramSimilarity('shoes', 'laptop');      // ~0.0 (no similarity)
 */
export function ngramSimilarity(word: string, candidate: string, n: number = 2): number {
  if (word.length < n || candidate.length < n) return 0;

  const getNgrams = (str: string): Set<string> => {
    const ngrams = new Set<string>();
    const lower = str.toLowerCase();
    for (let i = 0; i <= lower.length - n; i++) {
      ngrams.add(lower.substring(i, i + n));
    }
    return ngrams;
  };

  const ngrams1 = getNgrams(word);
  const ngrams2 = getNgrams(candidate);

  let intersection = 0;
  for (const ng of ngrams1) {
    if (ngrams2.has(ng)) intersection++;
  }

  const union = ngrams1.size + ngrams2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
