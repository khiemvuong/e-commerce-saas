/**
 * Get Top Shops Query
 */

import prisma from '@packages/libs/prisma';

/**
 * Get top 10 shops by total sales
 */
export const getTopShops = async () => {
    // Get top shops by total order value
    const topShopsData = await prisma.orders.groupBy({
        by: ['shopId'],
        _sum: {
            total: true,
        },
        orderBy: {
            _sum: {
                total: 'desc',
            },
        },
        take: 10,
    });

    const shopIds = topShopsData.map((item: any) => item.shopId);
    
    const shops = await prisma.shops.findMany({
        where: {
            id: { in: shopIds }
        },
        select: {
            id: true,
            name: true,
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
            }
        },
    });

    // Enrich shops with total sales
    const enrichedShops = shops.map((shop: any) => {
        const salesData = topShopsData.find((s: any) => s.shopId === shop.id);
        return {
            ...shop,
            totalSales: salesData ? salesData._sum.total : 0,
        };
    });

    // Sort by total sales descending
    return enrichedShops
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10);
};
