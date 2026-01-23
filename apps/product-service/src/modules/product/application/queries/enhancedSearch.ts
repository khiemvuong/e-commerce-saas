/**
 * Enhanced Search Products Query
 * 
 * Provides fuzzy search with typo tolerance, suggestions, and ranked results.
 */

import prisma from '@packages/libs/prisma';
import {
    generateSearchVariations,
    rankSearchResults,
    similarityScore,
} from '@packages/utils/fuzzySearch';

/**
 * Input for enhanced search
 */
export interface EnhancedSearchInput {
    keyword: string;
    page?: number;
    limit?: number;
    fuzzyThreshold?: number; // Minimum similarity % (default 70)
}

/**
 * Output with suggestions and match info
 */
export interface EnhancedSearchOutput {
    products: any[];
    suggestions: string[];
    didYouMean: string | null;
    pagination: {
        total: number;
        page: number;
        totalPages: number;
    };
    searchMeta: {
        originalKeyword: string;
        matchedVariations: string[];
        fuzzyMatchCount: number;
        exactMatchCount: number;
    };
}

/**
 * Get popular search terms for suggestions
 */
const getPopularSearchTerms = async (): Promise<string[]> => {
    // Get unique product titles, brands, and categories for suggestions
    const products = await prisma.products.findMany({
        where: { isDeleted: false },
        select: {
            title: true,
            brand: true,
            category: true,
            sub_category: true,
        },
        take: 500,
    });
    
    const terms = new Set<string>();
    
    products.forEach(p => {
        // Add individual words from titles
        p.title.split(/\s+/).forEach(word => {
            if (word.length >= 3) terms.add(word.toLowerCase());
        });
        if (p.brand) terms.add(p.brand.toLowerCase());
        if (p.category) terms.add(p.category.toLowerCase());
        if (p.sub_category) terms.add(p.sub_category.toLowerCase());
    });
    
    return Array.from(terms);
};

/**
 * Find closest matching term for "Did you mean?" suggestion
 */
const findClosestMatch = (keyword: string, terms: string[]): string | null => {
    const kw = keyword.toLowerCase();
    let bestMatch: string | null = null;
    let bestScore = 0;
    
    for (const term of terms) {
        // Skip if exact match exists
        if (term === kw) return null;
        
        const score = similarityScore(kw, term);
        if (score > bestScore && score >= 60 && score < 100) {
            bestScore = score;
            bestMatch = term;
        }
    }
    
    return bestMatch;
};

/**
 * Generate autocomplete suggestions based on partial input
 */
const getAutocompleteSuggestions = (keyword: string, terms: string[], limit = 5): string[] => {
    const kw = keyword.toLowerCase();
    
    // Find terms that start with or contain the keyword
    const suggestions = terms
        .filter(term => term.startsWith(kw) || term.includes(kw))
        .slice(0, limit);
    
    // If not enough, add fuzzy matches
    if (suggestions.length < limit) {
        const fuzzyMatches = terms
            .filter(term => !suggestions.includes(term))
            .map(term => ({ term, score: similarityScore(kw, term) }))
            .filter(({ score }) => score >= 60)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit - suggestions.length)
            .map(({ term }) => term);
        
        suggestions.push(...fuzzyMatches);
    }
    
    return suggestions;
};

/**
 * Enhanced search with fuzzy matching
 */
export const enhancedSearchProducts = async (
    input: EnhancedSearchInput
): Promise<EnhancedSearchOutput> => {
    const { keyword, page = 1, limit = 12 } = input;
    
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;
    
    // Generate keyword variations for typo tolerance
    const variations = generateSearchVariations(keyword);
    
    // Build search filters with all variations
    const orConditions = variations.flatMap(v => [
        { title: { contains: v, mode: 'insensitive' as const } },
        { short_description: { contains: v, mode: 'insensitive' as const } },
        { brand: { contains: v, mode: 'insensitive' as const } },
        { category: { contains: v, mode: 'insensitive' as const } },
        { sub_category: { contains: v, mode: 'insensitive' as const } },
    ]);
    
    const filters = {
        AND: [
            { isDeleted: false },
            // Allow searching events/offers too
        ],
        OR: orConditions,
    };
    
    // Get all matching products (we'll rank them in memory)
    const allProducts = await prisma.products.findMany({
        where: filters,
        take: 100, // Get more than needed for ranking
        select: {
            id: true,
            title: true,
            slug: true,
            sale_price: true,
            regular_price: true,
            rating: true,
            stock: true,
            totalSales: true,
            cash_on_delivery: true,
            colors: true,
            sizes: true,
            brand: true,
            category: true,
            short_description: true,
            tags: true,
            custom_properties: true,
            images: { take: 2, select: { file_url: true } },
            Shop: { select: { id: true, name: true } },
        },
        orderBy: { totalSales: 'desc' },
    });
    
    // Rank results by relevance
    const rankedProducts = rankSearchResults(allProducts, keyword, 20);
    
    // Count match types
    const exactMatchCount = rankedProducts.filter(p => p._matchType === 'exact').length;
    const fuzzyMatchCount = rankedProducts.filter(p => p._matchType !== 'exact').length;
    
    // Paginate ranked results
    const total = rankedProducts.length;
    const paginatedProducts = rankedProducts.slice(skip, skip + parsedLimit);
    
    // Get suggestions and "Did you mean?"
    const popularTerms = await getPopularSearchTerms();
    const suggestions = getAutocompleteSuggestions(keyword, popularTerms, 5);
    const didYouMean = rankedProducts.length === 0 
        ? findClosestMatch(keyword, popularTerms) 
        : null;
    
    return {
        products: paginatedProducts.map(p => {
            // Remove internal scoring fields from response
            const { _searchScore, _matchType, ...product } = p;
            return product;
        }),
        suggestions,
        didYouMean,
        pagination: {
            total,
            page: parsedPage,
            totalPages: Math.ceil(total / parsedLimit),
        },
        searchMeta: {
            originalKeyword: keyword,
            matchedVariations: variations,
            fuzzyMatchCount,
            exactMatchCount,
        },
    };
};

/**
 * Quick autocomplete suggestions (for search-as-you-type)
 * Handles multi-word queries: "coffee es" matches "Coffee Espresso Machine"
 */
export const getSearchSuggestions = async (
    keyword: string,
    limit = 8
): Promise<{ suggestions: string[]; products: any[] }> => {
    if (!keyword || keyword.length < 2) {
        return { suggestions: [], products: [] };
    }
    
    const kw = keyword.toLowerCase().trim();
    const words = kw.split(/\s+/).filter(w => w.length >= 2);
    
    // Build OR conditions for each word (matches any word)
    // AND logic: all words must be present in title
    const titleConditions = words.map(word => ({
        title: { contains: word, mode: 'insensitive' as const }
    }));
    
    // Get matching products for quick preview
    const products = await prisma.products.findMany({
        where: {
            AND: [
                { isDeleted: false },
                // Allow searching events/offers too
                // Each word must be found in title
                ...titleConditions,
            ],
        },
        take: 5,
        select: {
            id: true,
            title: true,
            slug: true,
            sale_price: true,
            images: { take: 1, select: { file_url: true } },
        },
        orderBy: { totalSales: 'desc' },
    });
    
    // If no products found with AND logic, try OR logic (any word matches)
    let fallbackProducts: any[] = [];
    if (products.length === 0 && words.length > 1) {
        fallbackProducts = await prisma.products.findMany({
            where: {
                AND: [
                    { isDeleted: false },
                ],
                OR: words.map(word => ({
                    title: { contains: word, mode: 'insensitive' as const }
                })),
            },
            take: 5,
            select: {
                id: true,
                title: true,
                slug: true,
                sale_price: true,
                images: { take: 1, select: { file_url: true } },
            },
            orderBy: { totalSales: 'desc' },
        });
    }
    
    const finalProducts = products.length > 0 ? products : fallbackProducts;
    
    // Get category/brand suggestions
    const uniqueTerms = await prisma.products.findMany({
        where: {
            isDeleted: false,
            OR: [
                { brand: { contains: kw, mode: 'insensitive' } },
                { category: { contains: kw, mode: 'insensitive' } },
                // Also match partial words in brand/category
                ...words.map(word => ({
                    brand: { contains: word, mode: 'insensitive' as const }
                })),
                ...words.map(word => ({
                    category: { contains: word, mode: 'insensitive' as const }
                })),
            ],
        },
        select: { brand: true, category: true },
        take: 20,
    });
    
    const suggestions = new Set<string>();
    uniqueTerms.forEach(t => {
        if (t.brand) {
            const brandLower = t.brand.toLowerCase();
            if (words.some(w => brandLower.includes(w))) {
                suggestions.add(t.brand);
            }
        }
        if (t.category) {
            const catLower = t.category.toLowerCase();
            if (words.some(w => catLower.includes(w))) {
                suggestions.add(t.category);
            }
        }
    });
    
    return {
        suggestions: Array.from(suggestions).slice(0, limit),
        products: finalProducts,
    };
};

