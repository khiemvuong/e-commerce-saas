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
                    images: {
                        create: [
                            { file_url: "https://ik.imagekit.io/khiemvuong/logo_3.png?updatedAt=1762869289719", fileId: "init_logo_1", type: "logo" },
                            { file_url: "https://ik.imagekit.io/khiemvuong/logo%20(2).png?updatedAt=1762868084272", fileId: "init_logo_2", type: "logo" },
                            { file_url: "https://ik.imagekit.io/khiemvuong/hero_endframe__cvklg0xk3w6e_large%202.png?updatedAt=1761726370763", fileId: "init_banner_1", type: "banner" }
                        ]
                    }
                },
            });
        }

        
    } catch (error) {
        console.log('Error initializing site configuration:', error);
    } finally {
        await prisma.$disconnect();
    }
    
}
export default initializeSiteConfig;