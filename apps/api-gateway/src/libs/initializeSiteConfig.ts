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
                    shopCategories: [
                        { value: "fashion", label: "Fashion" },
                        { value: "clothing", label: "Clothing" },
                        { value: "shoes", label: "Shoes" },
                        { value: "accessories", label: "Accessories" },
                        { value: "beauty", label: "Beauty & Personal Care" },
                        { value: "electronics", label: "Electronics" },
                        { value: "computers", label: "Computers & Accessories" },
                        { value: "home-garden", label: "Home & Garden" },
                        { value: "furniture", label: "Furniture" },
                        { value: "kitchen", label: "Kitchen" },
                        { value: "sports", label: "Sports & Outdoors" },
                        { value: "fitness", label: "Fitness" },
                        { value: "toys", label: "Toys & Games" },
                        { value: "books", label: "Books" },
                        { value: "music", label: "Music & Instruments" },
                        { value: "groceries", label: "Groceries" },
                        { value: "health", label: "Health & Wellness" },
                        { value: "baby", label: "Baby & Toddler" },
                        { value: "kids", label: "Kids" },
                        { value: "pet-supplies", label: "Pet Supplies" },
                        { value: "jewelry", label: "Jewelry" },
                        { value: "beauty-services", label: "Beauty Services" },
                        { value: "automotive", label: "Automotive & Parts" },
                        { value: "tools", label: "Tools & Home Improvement" },
                        { value: "office", label: "Office Supplies" },
                        { value: "garden", label: "Garden & Outdoor" },
                        { value: "handmade", label: "Handmade" },
                        { value: "art", label: "Art & Collectibles" },
                        { value: "antiques", label: "Antiques" },
                        { value: "services", label: "Local Services" },
                        { value: "games", label: "Video Games & Consoles" },
                    ],
                    countries: [
                        { code: "VN", name: "Viet Nam" },
                        { code: "US", name: "United States" },
                        { code: "GB", name: "United Kingdom" },
                        { code: "CN", name: "China" },
                        { code: "JP", name: "Japan" },
                        { code: "KR", name: "Korea" },
                        { code: "SG", name: "Singapore" },
                        { code: "TH", name: "Thailand" },
                        { code: "MY", name: "Malaysia" },
                        { code: "ID", name: "Indonesia" },
                        { code: "PH", name: "Philippines" },
                        { code: "IN", name: "India" },
                        { code: "AU", name: "Australia" },
                        { code: "CA", name: "Canada" },
                        { code: "DE", name: "Germany" },
                        { code: "FR", name: "France" },
                        { code: "IT", name: "Italy" },
                        { code: "ES", name: "Spain" },
                        { code: "NL", name: "Netherlands" },
                        { code: "BE", name: "Belgium" },
                        { code: "CH", name: "Switzerland" },
                        { code: "SE", name: "Sweden" },
                        { code: "NO", name: "Norway" },
                        { code: "DK", name: "Denmark" },
                        { code: "AT", name: "Austria" },
                        { code: "PL", name: "Poland" },
                        { code: "BR", name: "Brazil" },
                        { code: "MX", name: "Mexico" },
                        { code: "AR", name: "Argentina" },
                        { code: "CL", name: "Chile" },
                        { code: "CO", name: "Colombia" },
                        { code: "PE", name: "Peru" },
                        { code: "BZ", name: "Belize" },
                        { code: "ZA", name: "South Africa" },
                        { code: "EG", name: "Egypt" },
                        { code: "SA", name: "Saudi Arabia" },
                        { code: "AE", name: "United Arab Emirates" },
                        { code: "TR", name: "Turkey" },
                        { code: "RU", name: "Russian Federation" },
                        { code: "UA", name: "Ukraine" },
                        { code: "IE", name: "Ireland" },
                        { code: "PT", name: "Portugal" },
                        { code: "GR", name: "Greece" },
                        { code: "CZ", name: "Czech Republic" },
                        { code: "HU", name: "Hungary" },
                        { code: "RO", name: "Romania" },
                        { code: "NZ", name: "New Zealand" },
                        { code: "HK", name: "Hong Kong" },
                        { code: "TW", name: "Taiwan" },
                        { code: "IL", name: "Israel" },
                    ],
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