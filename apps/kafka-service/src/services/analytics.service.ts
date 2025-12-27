import prisma from "@packages/libs/prisma";

export const  updateUserAnalytics = async (event: any) => {
    try {
        const existingData = await prisma.userAnalytics.findUnique({
            where: { 
                userId: event.userId
            },
            select:{ actions: true}
        });
        let updatedActions:any = existingData?.actions;
        if(!Array.isArray(updatedActions)){
            updatedActions = [];
        }
        const actionExists = updatedActions.some(
            (entry: any) =>
                entry.productId === event.productId && entry.action === event.action
        );

        //Always store 'product_view' actions for recommendations
        if(event.action === 'product_view'){
            updatedActions.push({
                action: 'product_view',
                productId: event?.productId,
                shopId: event?.shopId || null,
                timestamp: new Date(),
            });
        }
        else if(event.action === 'shop_view'){
            updatedActions.push({
                action: 'shop_view',
                shopId: event?.shopId,
                timestamp: new Date(),
            });
        }
        else if(["add_to_cart","add_to_wishlist"].includes(event.action) && !actionExists){
            updatedActions.push({
                action: event?.action,
                productId: event?.productId,
                shopId: event.shopId || null,
                timestamp: new Date(),
            });
        }
        //Remove 'add_to_cart' when 'remove_from_cart' is triggered
        else if(event.action === 'remove_from_cart'){
            updatedActions = updatedActions.filter(
                (entry: any) =>
                    !(
                        entry.productId === event.productId && entry.action === 'add_to_cart'
                    )
            );
        }
        //Remove 'add_to_wishlist' when 'remove_from_wishlist' is triggered
        else if(event.action === 'remove_from_wishlist'){
            updatedActions = updatedActions.filter(
                (entry: any) =>
                    !(
                        entry.productId === event.productId && entry.action === 'add_to_wishlist'
                    )
            );
        }
        //Keep only the latest 100 actions
        if (updatedActions.length > 100) {
            updatedActions.shift();
        }

        const extraFields:Record<string, any> = {};
        if(event.country){
            extraFields.country = event.country;
        }
        
        if(event.city){
            extraFields.city = event.city;
        }

        if(event.device){
            extraFields.device = event.device;
        }

        //Update or create user analytics record
        await prisma.userAnalytics.upsert({
            where: { userId: event.userId },
            update: {
                lastVisited: new Date(),
                actions: updatedActions,
                ...extraFields
            },
            create: {
                userId: event?.userId,
                lastVisited: new Date(),
                actions: updatedActions,
                ...extraFields
            }
        });

        //Update product analytics
        if (event.productId) {
            await updateProductAnalytics(event);
        }
    } catch (error) {
        console.log('Error in updateUserAnalytics:', error);
    }
};
export const updateProductAnalytics = async (event: any) => {
    try {
        if(!event.productId) {
            console.log("Analytics: ProductId missing in event", event);
            return;
        }

        const updateFields:any={};

        if(event.action === 'product_view'){
            updateFields.views = {
                increment: 1
            };
        }
        if (event.action === 'add_to_cart'){
            updateFields.cartAdds = {
                increment: 1
            };
        }
        if (event.action === 'remove_from_cart'){
            updateFields.cartAdds = {
                decrement: 1
            };
        }
        if (event.action === 'add_to_wishlist'){
            updateFields.wishlistAdds = {
                increment: 1
            };
        }
        if (event.action === 'remove_from_wishlist'){
            updateFields.wishlistAdds = {
                decrement: 1
            };
        }
        if (event.action === 'purchase'){
            updateFields.purchases = {
                increment: 1
            };
        }

        // Ensure shopId exists for creation
        let shopId = event.shopId;
        if (!shopId) {
            const product = await prisma.products.findUnique({
                where: { id: event.productId },
                select: { shopId: true }
            });
            shopId = product?.shopId;
        }

        if (!shopId) {
            console.log("Analytics: ShopId not found for product", event.productId);
            return; 
        }

        await prisma.productAnalytics.upsert({
            where: { productId: event.productId },
            update: {
                lastViewedAt: new Date(),
                ...updateFields
            },
            create: {
                productId: event.productId,
                shopId: shopId,
                views: event.action === 'product_view' ? 1 : 0,
                cartAdds: event.action === 'add_to_cart' ? 1 : 0,
                wishlistAdds: event.action === 'add_to_wishlist' ? 1 : 0,
                purchases: event.action === 'purchase' ? 1 : 0,
                lastViewedAt: new Date(),
            },
        });
    } catch (error) {
        console.log('Error in updateProductAnalytics:', error);
    }
}

export const updateShopAnalytics = async (event: any) => {
    try {
        if (!event.shopId) return;

        // 1. Update Shop Analytics (Total Visitors & Stats)
        const shopAnalytics = await prisma.shopAnalytics.findUnique({
            where: { shopId: event.shopId }
        });

        const country = event.country || 'Unknown';
        const city = event.city || 'Unknown';
        const device = event.device || 'Unknown';

        let countryStats: any = shopAnalytics?.countryStats || {};
        let cityStats: any = shopAnalytics?.cityStats || {};
        let deviceStats: any = shopAnalytics?.deviceStats || {};

        // Helper to increment stats
        const incrementStat = (obj: any, key: string) => {
            obj[key] = (obj[key] || 0) + 1;
        };

        incrementStat(countryStats, country);
        incrementStat(cityStats, city);
        incrementStat(deviceStats, device);

        await prisma.shopAnalytics.upsert({
            where: { shopId: event.shopId },
            create: {
                shopId: event.shopId,
                totalVisitors: 1,
                countryStats,
                cityStats,
                deviceStats,
                lastVisitedAt: new Date(),
            },
            update: {
                totalVisitors: { increment: 1 },
                countryStats,
                cityStats,
                deviceStats,
                lastVisitedAt: new Date(),
            }
        });

        // 2. Track Unique Visitors (if userId exists)
        if (event.userId) {
            try {
                await prisma.uniqueShopVisitors.create({
                    data: {
                        shopId: event.shopId,
                        userId: event.userId,
                    }
                });
            } catch (e) {
                // Ignore unique constraint violation
            }
        }
    } catch (error) {
        console.log("Error updating shop analytics:", error);
    }
};