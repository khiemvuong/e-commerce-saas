/**
 * Fuzzy Search Utilities
 * 
 * Provides fuzzy matching capabilities for search functionality.
 * Implements Levenshtein distance algorithm for typo tolerance.
 */

/**
 * Calculate Levenshtein distance between two strings
 * Lower distance = more similar
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;
    
    const matrix: number[][] = [];
    
    // Initialize matrix
    for (let i = 0; i <= s1.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= s1.length; i++) {
        for (let j = 1; j <= s2.length; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    
    return matrix[s1.length][s2.length];
};

/**
 * Calculate similarity score (0-100%)
 * Higher = more similar
 */
export const similarityScore = (str1: string, str2: string): number => {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 100;
    
    const distance = levenshteinDistance(str1, str2);
    return Math.round((1 - distance / maxLen) * 100);
};

/**
 * Check if keyword matches text with fuzzy tolerance
 * @param keyword - Search term
 * @param text - Text to match against
 * @param threshold - Minimum similarity % (default 70%)
 */
export const fuzzyMatch = (keyword: string, text: string, threshold = 70): boolean => {
    if (!keyword || !text) return false;
    
    const kw = keyword.toLowerCase().trim();
    const txt = text.toLowerCase();
    
    // Exact match
    if (txt.includes(kw)) return true;
    
    // Word-by-word fuzzy matching
    const textWords = txt.split(/\s+/);
    const keywordWords = kw.split(/\s+/);
    
    for (const kwWord of keywordWords) {
        if (kwWord.length < 3) continue; // Skip short words
        
        for (const textWord of textWords) {
            const score = similarityScore(kwWord, textWord);
            if (score >= threshold) return true;
        }
    }
    
    return false;
};

/**
 * Generate search variations for common typos
 * E.g., "shrit" -> ["shirt", "short"]
 */
export const generateSearchVariations = (keyword: string): string[] => {
    const variations: string[] = [keyword];
    const kw = keyword.toLowerCase();
    
    // Common Vietnamese/English typo patterns
    const typoPatterns: [string, string][] = [
        ['ao', 'áo'],
        ['quan', 'quần'],
        ['vay', 'váy'],
        ['giay', 'giày'],
        ['dep', 'dép'],
        ['tui', 'túi'],
        ['dong', 'đồng'],
        ['ho', 'hồ'],
        ['i', 'í'],
        ['a', 'á'],
        ['e', 'é'],
        ['o', 'ó'],
        ['u', 'ú'],
        // English common typos
        ['ie', 'ei'],
        ['ea', 'ae'],
        ['ss', 's'],
        ['ll', 'l'],
        ['tt', 't'],
        ['pp', 'p'],
    ];
    
    for (const [from, to] of typoPatterns) {
        if (kw.includes(from)) {
            variations.push(kw.replace(from, to));
        }
        if (kw.includes(to)) {
            variations.push(kw.replace(to, from));
        }
    }
    
    return [...new Set(variations)];
};

/**
 * Score search results for ranking
 * Higher score = better match
 */
export interface SearchScoreResult {
    item: any;
    score: number;
    matchType: 'exact' | 'partial' | 'fuzzy';
}

export const scoreSearchResult = (
    item: { title: string; short_description?: string; brand?: string; tags?: string[] },
    keyword: string
): SearchScoreResult => {
    const kw = keyword.toLowerCase();
    let score = 0;
    let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy';
    
    // Title exact match (highest priority)
    if (item.title.toLowerCase().includes(kw)) {
        score += 100;
        matchType = 'exact';
        // Bonus for title starting with keyword
        if (item.title.toLowerCase().startsWith(kw)) {
            score += 50;
        }
    } else {
        // Fuzzy title match
        const titleScore = similarityScore(kw, item.title);
        if (titleScore >= 60) {
            score += titleScore * 0.8;
            matchType = 'partial';
        }
    }
    
    // Brand match
    if (item.brand && item.brand.toLowerCase().includes(kw)) {
        score += 40;
        if (matchType === 'fuzzy') matchType = 'partial';
    }
    
    // Description match
    if (item.short_description && item.short_description.toLowerCase().includes(kw)) {
        score += 20;
        if (matchType === 'fuzzy') matchType = 'partial';
    }
    
    // Tags match
    if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(kw))) {
        score += 30;
        if (matchType === 'fuzzy') matchType = 'partial';
    }
    
    // Word-level fuzzy matching for title
    const titleWords = item.title.toLowerCase().split(/\s+/);
    const kwWords = kw.split(/\s+/);
    
    for (const kwWord of kwWords) {
        for (const titleWord of titleWords) {
            const wordScore = similarityScore(kwWord, titleWord);
            if (wordScore >= 75 && wordScore < 100) {
                score += wordScore * 0.3;
            }
        }
    }
    
    return { item, score, matchType };
};

/**
 * Sort and filter search results by relevance
 */
export const rankSearchResults = <T extends { title: string }>(
    items: T[],
    keyword: string,
    minScore = 20
): (T & { _searchScore: number; _matchType: string })[] => {
    const scored = items.map(item => scoreSearchResult(item as any, keyword));
    
    return scored
        .filter(result => result.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .map(result => ({
            ...result.item,
            _searchScore: result.score,
            _matchType: result.matchType,
        }));
};
