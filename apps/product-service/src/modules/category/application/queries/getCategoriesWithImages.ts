/**
 * Get Categories With Images Query
 */

import prisma from '@packages/libs/prisma';

/**
 * Get categories with product images
 */
export const getCategoriesWithImages = async () => {
    const config = await prisma.site_config.findFirst();
    
    if (!config) {
        return [];
    }

    const categories = config.categories || [];
    
    // Get one product image for each category
    const categoriesWithImages = await Promise.all(
        categories.map(async (categoryItem: any) => {
            // Handle both string and object format
            let categoryName: string;
            let categoryObj: any;
            
            if (typeof categoryItem === 'string') {
                categoryName = categoryItem;
                categoryObj = { name: categoryItem, value: categoryItem };
            } else {
                categoryName = categoryItem.value || categoryItem.name || String(categoryItem);
                categoryObj = categoryItem;
            }
            
            // Get product count for this category
            const [product, productCount] = await Promise.all([
                prisma.products.findFirst({
                    where: {
                        category: categoryName,
                        isDeleted: false,
                    },
                    select: {
                        images: {
                            take: 1,
                            select: { file_url: true }
                        }
                    }
                }),
                prisma.products.count({
                    where: {
                        category: categoryName,
                        isDeleted: false,
                    }
                })
            ]);

            return {
                name: categoryName,
                value: categoryName,
                image: product?.images?.[0]?.file_url || null,
                productCount: productCount,
                ...categoryObj, // Include any extra fields from original object
            };
        })
    );

    return categoriesWithImages;
};
