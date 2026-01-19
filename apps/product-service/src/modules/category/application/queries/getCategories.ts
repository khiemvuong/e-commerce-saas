/**
 * Get Categories Query
 */

import prisma from '@packages/libs/prisma';

/**
 * Get all categories and subcategories from site config
 */
export const getCategories = async () => {
    const config = await prisma.site_config.findFirst();
    
    if (!config) {
        return {
            categories: [],
            subCategories: [],
        };
    }

    return {
        categories: config.categories,
        subCategories: config.subCategories,
    };
};
