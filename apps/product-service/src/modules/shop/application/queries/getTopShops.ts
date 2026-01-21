/**
 * Get Top Shops Query
 */

import prisma from '@packages/libs/prisma';

/**
 * Get top 10 shops by total sales
 */
export const getTopShops = async () => {
    // 1. Fetch shops with necessary metrics
    // We take more than 10 to calculate scores and rerank
    const shops = await prisma.shops.findMany({
        take: 50, // Analyze top 50 candidates
        where: {
            // Optional: Only active shops or verified ones
        },
        select: {
            id: true,
            name: true,
            bio: true,
            address: true,
            rating: true,
            followers: true,
            category: true,
            images: {
                where: {
                    type: { in: ['avatar', 'cover'] }
                },
                select: {
                    file_url: true,
                    type: true
                }
            },
            _count: {
                select: {
                    products: true,
                    orders: true // Must rely on relation: orders Orders[]
                }
            }
        },
        orderBy: [
            { rating: 'desc' }, // Prioritize good ratings first
            { createdAt: 'desc' } // Then new shops
        ]
    });

    // 2. Score Calculation Formula
    // Goal: Balance between Established (Sales) vs Quality (Rating) vs New (Activity)
    const scoredShops = shops.map((shop: any) => {
        const rating = shop.rating || 0; // 0-5
        const orderCount = shop._count?.orders || 0;
        const productCount = shop._count?.products || 0;

        // A. Base Quality Score (0 - 50 points)
        // Rating is king. 5 stars = 50 pts.
        const qualityScore = rating * 10;

        // B. Popularity Score (Logarithmic) (0 - 40 points)
        // Logarithm prevents 10,000 orders from crushing 100 orders.
        // log10(1) = 0, log10(10)=1, log10(100)=2, log10(1000)=3.
        // We multiply by 10 to give it weight.
        const popularityScore = Math.log10(orderCount + 1) * 10;

        // C. Activity/Fullness Score (0 - 10 points)
        // Reward having products ready to sell. Cap at 20 products.
        const activityScore = Math.min(productCount, 20) * 0.5;

        // D. Random Exposure Factor (0 - 15 points)
        // "Shuffle" factor to rotate shops and prevent monopoly.
        // Gives a chance for lower ranks to pop up occasionally.
        const shuffleFactor = Math.random() * 15;

        const totalScore = qualityScore + popularityScore + activityScore + shuffleFactor;

        return {
            ...shop,
            totalSales: orderCount, // Keep for UI compatibility
            score: totalScore
        };
    });

    // 3. Sort by computed score
    return scoredShops
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
};
