/**
 * Get Categories With Images Query
 */

import prisma from '@packages/libs/prisma';

/**
 * Get categories with images
 * Priority: 1) site_config images (type = category_{name}) 2) product images
 */
export const getCategoriesWithImages = async () => {
    const config = await prisma.site_config.findFirst({
        include: {
            images: {
                select: {
                    file_url: true,
                    type: true,
                }
            }
        }
    });
    
    if (!config) {
        return [];
    }

    const categories = config.categories || [];
    const siteImages = config.images || [];
    
    // Create a map of category name -> image URL from site_config
    // Images are stored with type = "category_CategoryName"
    const categoryImageMap = new Map<string, string>();
    siteImages.forEach((img) => {
        if (img.type && img.file_url && img.type.startsWith('category_')) {
            // Extract category name from type (format: "category_CategoryName")
            const catName = img.type.replace('category_', '');
            categoryImageMap.set(catName.toLowerCase(), img.file_url);
        }
    });
    
    // Get one product image for each category (as fallback)
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
            
            // First, check if there's a site_config image for this category
            const siteConfigImage = categoryImageMap.get(categoryName.toLowerCase());
            
            // Get product count and fallback image
            const [product, productCount] = await Promise.all([
                // Only query product if we don't have a site_config image
                siteConfigImage ? null : prisma.products.findFirst({
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

            // Prioritize site_config image, then product image
            const imageUrl = siteConfigImage || product?.images?.[0]?.file_url || null;

            return {
                name: categoryName,
                value: categoryName,
                image: imageUrl,
                productCount: productCount,
                ...categoryObj, // Include any extra fields from original object
            };
        })
    );

    return categoriesWithImages;
};
