import { PrismaClient } from '@prisma/client';


const prisma =  new PrismaClient();

const initializeSiteConfig = async () => {
    try {
        const existingConfig = await prisma.site_config.findFirst();
        if (!existingConfig) {
            await prisma.site_config.create({
                data: {
                    categories: [
                        "Electronics",
                        "Fashion",
                        "Home & Garden",
                        "Health & Beauty",
                        ],
                    subCategories: {
                        "Electronics": ["Mobile Phones", "Laptops", "Cameras", "Televisions"],
                        "Fashion": ["Men's Clothing", "Women's Clothing", "Footwear", "Accessories", "Jewelry"],
                        "Home & Garden": ["Furniture", "Kitchenware", "Gardening", "Bedding"],
                        "Health & Beauty": ["Skincare", "Makeup", "Haircare", "Wellness"],
                    },
                },
            });
        }

        
    } catch (error) {
        console.log('Error initializing site configuration:', error);
    }
    
}
export default initializeSiteConfig;