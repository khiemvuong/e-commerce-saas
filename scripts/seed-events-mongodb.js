/**
 * MongoDB Shell Script to Create 50 Event Products
 * 
 * Usage:
 * mongosh "your-connection-string" < scripts/seed-events-mongodb.js
 * 
 * Or in mongosh:
 * load('scripts/seed-events-mongodb.js')
 */

// Switch to your database
// Database name from connection string: development
use('development');

print('📂 Current Database:', db.getName());
print('📊 Collections:', db.getCollectionNames().join(', '));
print('🏪 Shops count:', db.shops.countDocuments());
print('');

// Image URLs to randomly select from
const IMAGE_URLS = [
    'https://ik.imagekit.io/khiemvuong/product-1768813851434_ak9mXzA7F.jpeg',
    'https://ik.imagekit.io/khiemvuong/product-1768813870781_DugcupyYF.jpeg',
    'https://ik.imagekit.io/khiemvuong/product-1768814475347_xaLYNzp8G.jpeg',
];

// Categories and subcategories (matching your existing data)
const CATEGORIES = {
    Fashion: ['Women'],
    Electronic: ['Phone'],
    HouseHold: ['Washing machine'],
    Food: ['Chicken']
};

const EVENT_TITLES = [
    'Flash Sale',
    'Weekend Special',
    'Mega Discount',
    'Limited Time Offer',
    'Clearance Sale',
    'Summer Bonanza',
    'Winter Wonderland',
    'Spring Collection',
    'Festive Deals',
    'End of Season Sale',
    'New Year Blast',
    'Black Friday',
    'Cyber Monday',
    'Holiday Special',
    'Anniversary Sale',
];

const COLORS = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Pink', 'Purple', 'Orange', 'Gray'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

// Helper functions
function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomElements(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPrice(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Get dates
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
yesterday.setHours(0, 0, 0, 0);

const nextYear = new Date();
nextYear.setFullYear(nextYear.getFullYear() + 1);
nextYear.setHours(23, 59, 59, 999);

print('=================================================');
print('🚀 Starting Event Products Seed Script');
print('=================================================');
print('📅 Starting Date:', yesterday.toISOString());
print('📅 Ending Date:', nextYear.toISOString());
print('=================================================\n');

// Use specific shop ID
const SHOP_ID = ObjectId('6925685373ae5a243d72f586');

print('🔍 Looking for shop with ID:', SHOP_ID.toString());
print('📂 In database:', db.getName());

const shop = db.shops.findOne({ _id: SHOP_ID });

if (!shop) {
    print('\n❌ ERROR: Shop with ID 6925685373ae5a243d72f586 not found!');
    print('\n💡 Troubleshooting:');
    print('   1. Check database name at line 14 (currently:', db.getName() + ')');
    print('   2. Verify shop exists:');
    print('      > db.shops.findOne({ _id: ObjectId("6925685373ae5a243d72f586") })');
    print('   3. List all shops:');
    print('      > db.shops.find({}, { _id: 1, name: 1 }).pretty()');
    print('');
    quit();
}

print(`✅ Found shop: ${shop.name}`);
print(`🏪 Shop ID: ${SHOP_ID.toString()}\n`);

// Create 50 event products
const productsToInsert = [];
const imagesToInsert = [];

for (let i = 1; i <= 50; i++) {
    // Select random category and subcategory
    const categoryKeys = Object.keys(CATEGORIES);
    const category = randomElement(categoryKeys);
    const subCategory = randomElement(CATEGORIES[category]);
    const eventType = randomElement(EVENT_TITLES);
    
    // Generate product details
    const title = `${eventType} - ${category} ${subCategory} Event ${i}`;
    const slug = `${slugify(title)}-${Date.now()}-${randomInt(1000, 9999)}`;
    
    const regularPrice = randomPrice(50, 500);
    const discountPercent = randomInt(10, 70);
    const salePrice = parseFloat((regularPrice * (1 - discountPercent / 100)).toFixed(2));
    
    const productId = new ObjectId();
    
    // Create product document
    const product = {
        _id: productId,
        title: title,
        slug: slug,
        category: category,
        sub_category: subCategory,
        short_description: `Special ${eventType} event for ${category} - Limited time only! Get ${discountPercent}% OFF`,
        detailed_description: `<h2>${eventType}</h2><p>Don't miss this amazing opportunity to grab premium ${category} items at unbeatable prices! This exclusive event features top-quality ${subCategory} products with up to ${discountPercent}% discount.</p><p><strong>Event Highlights:</strong></p><ul><li>Premium quality products</li><li>Limited stock available</li><li>Fast shipping</li><li>Satisfaction guaranteed</li></ul>`,
        video_url: '',
        tags: ['event', 'sale', category.toLowerCase(), subCategory.toLowerCase(), `${discountPercent}% off`],
        brand: randomElement(['Premium Brand', 'Elite Collection', 'Top Choice', 'Quality Select', 'Brand X']),
        colors: randomElements(COLORS, randomInt(2, 4)),
        sizes: randomElements(SIZES, randomInt(2, 4)),
        starting_date: yesterday,
        ending_date: nextYear,
        stock: randomInt(10, 100),
        sale_price: salePrice,
        regular_price: regularPrice,
        rating: parseFloat((4 + Math.random()).toFixed(1)),
        warranty: randomElement(['1 Year', '2 Years', '6 Months', 'Lifetime', 'No Warranty']),
        custom_specifications: {},
        custom_properties: { 
            isEvent: true, 
            eventType: eventType,
            discountPercent: discountPercent 
        },
        isDeleted: false,
        cash_on_delivery: randomElement(['yes', 'no']),
        discount_codes: [],
        status: 'Active',
        totalSales: randomInt(0, 50),
        deletedAt: null,
        shopId: SHOP_ID,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    productsToInsert.push(product);
    
    // Create images for this product (1-3 images)
    const imageCount = randomInt(1, 3);
    const selectedImages = randomElements(IMAGE_URLS, imageCount);
    
    for (let j = 0; j < selectedImages.length; j++) {
        const imageUrl = selectedImages[j];
        const fileId = `img_${productId.toString()}_${j + 1}_${Date.now()}`;
        
        const image = {
            _id: new ObjectId(),
            fileId: fileId,
            file_url: imageUrl,
            type: 'product',
            productsId: productId,
            userId: null,
            shopId: null,
            siteConfigId: null
        };
        
        imagesToInsert.push(image);
    }
    
    print(`✅ [${i}/50] Prepared: ${title}`);
    print(`   Shop: ${shop.name} | Price: $${regularPrice} → $${salePrice} (${discountPercent}% off) | Images: ${imageCount}`);
}

// Insert all products
print('\n📦 Inserting products into database...');
const productResult = db.products.insertMany(productsToInsert);
print(`✅ Inserted ${productResult.insertedIds.length} products`);

// Insert all images
print('🖼️  Inserting images into database...');
const imageResult = db.images.insertMany(imagesToInsert);
print(`✅ Inserted ${imageResult.insertedIds.length} images`);

// Summary
print('\n=================================================');
print('✨ SEED COMPLETED SUCCESSFULLY!');
print('=================================================');

// Category summary
const categorySummary = {};
productsToInsert.forEach(p => {
    categorySummary[p.category] = (categorySummary[p.category] || 0) + 1;
});

print('\n📊 Summary by Category:');
Object.entries(categorySummary).forEach(([cat, count]) => {
    print(`   ${cat}: ${count} products`);
});

print('\n🎉 Done! You can now view the events in your application.');
print('=================================================\n');
