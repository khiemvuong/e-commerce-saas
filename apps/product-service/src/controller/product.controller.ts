import { AuthError, notFoundError, ValidationError } from "@packages/error-handler";
import { client } from "@packages/libs/imagekit";
import { toFile } from "@imagekit/nodejs";
import prisma from "@packages/libs/prisma";
import { Request, Response, NextFunction } from "express";

// Get product categories
export const getCategories = async (req:Request, res:Response, next:NextFunction) => {
    try {
        const config=await prisma.site_config.findFirst();
        if(!config){
            return res.status(404).json({message:"Categories not found"});
        }
        return res.status(200).json({
            categories: config.categories,
            subCategories: config.subCategories,
        });

    } catch (error) {
        return next(error);
    }
};

// Create discount code
export const createDiscountCodes = async (req:any, res:Response, next:NextFunction) => {
    try {
        const{public_name,discountType,discountValue,discountCode}=req.body;

        const isDiscountCodeExist=await prisma.discount_codes.findUnique({
            where:{discountCode}
        });
        if(isDiscountCodeExist){
            return next (new ValidationError("Discount code already exists"));
        }
        const discount_code=await prisma.discount_codes.create({
            data:{
                public_name,
                discountType,
                discountValue: parseFloat(discountValue),
                discountCode,
                sellerId: req.seller?.id,
            }
        });
        return res.status(201).json({success:true,discount_code});
    } catch (error) {
        
    }
};

// Get discount codes
export const getDiscountCodes = async (req:any, res:Response, next:NextFunction) => {
    try {
        const discount_codes=await prisma.discount_codes.findMany({
            where:{sellerId: req.seller?.id}
        });
        return res.status(200).json({success:true,discount_codes});
    } catch (error) {
        return next(error);
    }
};

// Delete discount code
export const deleteDiscountCode = async (req:any, res:Response, next:NextFunction) => {
    try {
        const {id}=req.params;
        const sellerId=req.seller?.id;
        const discountCode=await prisma.discount_codes.findUnique({
            where:{id},
            select:{id:true,sellerId:true}
        });
        if(!discountCode){
            return next (new notFoundError("Discount code not found"));
        }
        if(discountCode.sellerId !== sellerId){
            return next (new ValidationError("You are not authorized to delete this discount code"));
        }
        await prisma.discount_codes.delete({
            where:{id}
        });

        return res.status(200).json({success:true,message:"Discount code deleted successfully"});
    } catch (error) {
        return next(error);
    }
};

//Add product image
export const uploadProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileName } = req.body; // base64 data URL từ FE

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'fileName (base64 data URL) is required' });
    }

    // Parse base64 data URL
    // data:image/png;base64,AAAA...
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(fileName);
    if (!match) {
      return res.status(400).json({ error: 'Invalid base64 image data URL' });
    }

    const mime = match[1]; // e.g. image/png
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');

    // Tạo "file" cho SDK từ Buffer
    const ext = mime.split('/')[1] || 'jpg';
    const uniqueName = `product-${Date.now()}.${ext}`;
    const fileForUpload = await toFile(buffer, uniqueName);

    // Upload
    const resp = await client.files.upload({
      file: fileForUpload,
      fileName: uniqueName,
    });

    return res.status(200).json({
      success: true,
      file_url: (resp as any).url ?? (resp as any).filePath ?? null,
      fileId: (resp as any).fileId,
      thumbnailUrl: (resp as any).thumbnailUrl ?? null,
      // Có thể trả thêm các trường nếu cần: width/height/size
    });
  } catch (error: any) {
    console.error('ImageKit upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image', details: error?.message });
  }
};

// Delete product image
export const deleteProductImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).json({ error: 'fileId is required' });

    await client.files.delete(fileId);
    return res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('ImageKit delete error:', error);
    return res.status(500).json({ error: 'Failed to delete image', details: error?.message });
  }
};

//Create product
export const createProduct = async (req:any, res:Response, next:NextFunction) => {
    try {
        const {
            title,
            short_description,
            detailed_description,
            warranty,
            custom_specifications,
            slug,
            tags,
            cash_on_delivery,
            brand,
            video_url,
            category,
            colors=[],
            sizes=[],
            discountCodes=[],
            stock,
            sale_price,
            regular_price,
            sub_category,
            custom_properties,
            images=[],
        }=req.body;
        console.log('Received data:', req.body);
        if(!title || !short_description || !detailed_description || !slug || !category || !stock || !sale_price || !regular_price||images.length===0){
            return next (new ValidationError("Please fill all required fields"));
        }
        if(!req.seller.id){
            return next (new AuthError("Only sellers can create products"));
        }

        const slugCheck=await prisma.products.findUnique({
            where:{slug}
        });
        if(slugCheck){
            return next (new ValidationError("Slug already exists. Please choose another one"));
        }
        const newProduct=await prisma.products.create({
            data:{
                title, 
                short_description, 
                detailed_description, 
                warranty, 
                slug, 
                cash_on_delivery: cash_on_delivery, 
                brand, 
                video_url, 
                category, 
                sub_category, 
                stock: parseInt(stock), 
                sale_price: parseFloat(sale_price), 
                regular_price: parseFloat(regular_price), 
                shopId: req.seller?.shop?.id,
                tags:Array.isArray(tags) ? tags : tags.split(","),
                colors:colors || [], 
                sizes: sizes || [],
                starting_date: null,
                ending_date: null,
                discount_codes: discountCodes.map((codeId:string) => ({ id: codeId })),
                images: {
                    create:images
                        .filter((img:any)=> img && img.file_url && img.fileId)
                        .map((img:any) =>({
                            file_url: img.file_url,
                            fileId: img.fileId,
                        })),
            },
                custom_properties: custom_properties || [],
                custom_specifications: custom_specifications || {},
            },
            include:{ images:true }
        });
        return res.status(201).json({success:true,newProduct});

    } catch (error) {
        console.error("Create product error:", error);
        return next(error);
    }
}

//Get loggin seller products
export const getShopProducts = async (req:any, res:Response, next:NextFunction) => {
    try {
        // Check if seller is authenticated
        if(!req.seller || !req.seller.id){
            return next(new AuthError("Please login as seller to view shop products"));
        }

        // Check if seller has a shop
        if(!req.seller.shop || !req.seller.shop.id){
            return next(new ValidationError("You don't have a shop. Please create a shop first"));
        }

        const products=await prisma.products.findMany({
            where:{ shopId: req.seller.shop.id },
            include:{ images:true }
        });
        
        res.status(200).json({success:true,products});

    } catch (error) {
        console.error("Get shop products error:", error);
        return next(error);
    }
}

//Delete product
export const deleteProduct = async (req:any, res:Response, next:NextFunction) => {
    try {
        const {productId}=req.params;
        const sellerId=req.seller?.shop?.id;
        const product=await prisma.products.findUnique({
            where:{id:productId},
            select:{id:true,shopId:true,isDeleted:true}
        });
        if(!product){
            return next (new ValidationError("Product not found"));
        }
        if(product.shopId !== sellerId){
            return next (new ValidationError("You are not authorized to delete this product"));
        }
        if(product.isDeleted){
            return next (new ValidationError("Product is already deleted"));
        }
        const deletedProduct=await prisma.products.update({
            where:{id:productId},
            data:{
                isDeleted:true,
                deletedAt: new Date(Date.now()+24*60*60*1000), //24 hours from now
            }
        });
        return res.status(200).json({
            message:"Product deletion status updated successfully",
            deletedAt:deletedProduct.deletedAt,
        });
    } catch (error) {
        console.error("Delete product error:", error);
        return next(error);
    }
};

//Restor deleted product
export const restoreProduct = async (req:any, res:Response, next:NextFunction) => {
    try {
        const {productId}=req.params;
        const sellerId=req.seller?.shop?.id;
        const product=await prisma.products.findUnique({
            where:{id:productId},
            select:{id:true,shopId:true,isDeleted:true}
        });
        if(!product){
            return next (new ValidationError("Product not found"));
        }
        if(product.shopId !== sellerId){
            return next (new ValidationError("You are not authorized to restore this product"));
        }
        if(!product.isDeleted){
            return next (new ValidationError("Product is not deleted state"));
        }
        await prisma.products.update({
            where:{id:productId},
            data:{
                isDeleted:false,
                deletedAt:null,
            }
        });
        return res.status(200).json({
            message:"Product restored successfully",
        });
    } 
    catch (error) {
        return res.status(500).json({error:"Error restoring product"});
    }
};

// Get All Products
export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt((req.query.page as string) || "1", 10);
        const limit = parseInt((req.query.limit as string) || "20", 10);
        const skip = Math.max(0, (page - 1) * limit);
        const type = String(req.query.type || "");

        const baseFilter: any = {
            AND: [
                { isDeleted: false },
                { starting_date: null },
                { ending_date: null },
            ]
        };
        const orderBy: any =
            type === "latest" ? { createdAt: "desc" } : { totalSales: "desc" };

        const [products, total, top10Products] = await Promise.all([
            prisma.products.findMany({
                skip,
                take: limit,
                include: {
                    images: {
                        select: {
                            file_url: true,
                        }
                    },
                    Shop: {
                        select: {
                            id: true,
                            name: true,
                            rating: true,
                        }
                    },
                },
                where: baseFilter,
                orderBy: orderBy,
            }),
            prisma.products.count({
                where: baseFilter,
            }),
            prisma.products.findMany({
                take: 10,
                where: baseFilter,
                orderBy,
            }),
        ]);
        
        return res.status(200).json({
            products,
            top10By:type==="latest" ? "latest":"topSales",
            top10Products,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        });
        
    } catch (error) {
        console.error("Get all products error:", error);
        return next(error);
    }
};

//Get All Events
export const getAllEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt((req.query.page as string) || "1", 10);
        const limit = parseInt((req.query.limit as string) || "20", 10);
        const skip = Math.max(0, (page - 1) * limit);
        const baseFilter: any = {
            AND: [
                { starting_date: { not: null } },
                { ending_date: { not: null } },
                { OR: [
                    { isDeleted: false },
                    { isDeleted: null }
                ]
                }
            ],
        };
        const [events, total,top10BySales] = await Promise.all([
            prisma.products.findMany({
                where: baseFilter,
                skip,
                take: limit,
                include: {
                    images: {
                        select: {
                            file_url: true,
                        }
                    },
                    Shop: {
                        select: {
                            id: true,
                            name: true,
                            rating: true,
                        }
                    },
                },
                orderBy: { 
                    totalSales: "desc",
                },
            }),
                prisma.products.count({where: baseFilter,}),
                prisma.products.findMany({
                    where:baseFilter,
                    take:10,
                    orderBy: { totalSales: "desc" 
                    },
            }),
        ]);
        return res.status(200).json({
            events,
            top10BySales,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Get all events error:", error);
        return next(error);
    }
};

//Get product details by slug
export const getProductDetails = async (
    req: Request, 
    res: Response, 
    next: NextFunction
) => {
    try {
        const { slug } = req.params;
        const product = await prisma.products.findUnique({
            where: { slug },
            include: {
                images: true,
                Shop: true,
            },
        });
        if (!product) {
            return next(new ValidationError("Product not found"));
        }
        return res.status(201).json({
            success:true,
            product,
        });
    } catch (error) {
        console.error("Get product details error:", error);
        return next(error);
    }
}

//Get filter products
export const getFilteredProducts = async (
    req: Request, 
    res: Response,
    next: NextFunction
) => {
    try {
        const { 
            priceRange = [0,10000],
            categories = [],
            colors=[],
            sizes=[],
            page = 1, 
            limit = 12 
        } = req.query;

        const parsedPriceRange =
        typeof priceRange === "string"
            ? priceRange.split(",").map(Number)
            : [0,10000];
            const parsedPage = Number(page);
            const parsedLimit = Number(limit);
            const skip = (parsedPage - 1) * parsedLimit;
            const filters : Record<string, any> = {
                sale_price: {
                    gte: parsedPriceRange[0],
                    lte: parsedPriceRange[1],
                },
                AND: [
                    { isDeleted: false },
                    { starting_date: null },
                    { ending_date: null },
                ]
            };
            if (categories && (categories as string[]).length>0 ) {
                filters.category = { 
                    in: Array.isArray(categories) 
                    ? categories 
                    : String(categories).split(",")
                };
            }
            if (colors && (colors as string[]).length>0 ) {
                filters.colors = {
                    hasSome: Array.isArray(colors) 
                    ? colors
                    : [colors],
                };
            }
            if (sizes && (sizes as string[]).length>0 ) {
                filters.sizes = {
                    hasSome: Array.isArray(sizes) 
                    ? sizes 
                    : [sizes],
                };
            }
            const [products, total] = await Promise.all([
            prisma.products.findMany({
                where: filters,
                skip,
                take: parsedLimit,
                include: { images: true, Shop: true },
            }),
            prisma.products.count({
                where: filters,
            }),
        ]);
        const totalPages = Math.ceil(total / parsedLimit);

        res.json({
            products,
            pagination:{
                total,
                page: parsedPage,
                totalPages,
            }
        });

    } catch (error) {
        console.error("Get filtered products error:", error);
        next(error);
    }
};

//Get filtered offers
export const getFilteredEvents = async (
    req: Request, 
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            priceRange = [0,10000],
            categories = [],
            colors=[],
            sizes=[],
            page = 1, 
            limit = 12 
        } = req.query;
        const parsedPriceRange =
        typeof priceRange === "string"
            ? priceRange.split(",").map(Number)
            : [0,10000];
            const parsedPage = Number(page);
            const parsedLimit = Number(limit);

            const skip = (parsedPage - 1) * parsedLimit;
            const filters : Record<string, any> = {
                sale_price: {
                    gte: parsedPriceRange[0],
                    lte: parsedPriceRange[1],
                },
                AND:{
                    starting_date:{ not: null },
                    ending_date:{ not: null },
                    isDeleted: false,
                },
            };
            if (categories && (categories as string[]).length>0 ) {
                filters.category = { 
                    in: Array.isArray(categories)
                    ? categories
                    : String(categories).split(",")
                };
            }
            if (colors && (colors as string[]).length>0 ) {
                filters.colors = {
                    hasSome: Array.isArray(colors)
                    ? colors
                    : [colors],
                };
            }
            if (sizes && (sizes as string[]).length>0 ) {
                filters.sizes = {
                    hasSome: Array.isArray(sizes)
                    ? sizes
                    : [sizes],
                };
            }
            const [products, total] = await Promise.all([
            prisma.products.findMany({
                where: filters,
                skip,
                take: parsedLimit,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    sale_price: true,
                    regular_price: true,
                    rating: true,
                    stock: true,
                    short_description: true,
                    totalSales: true,
                    starting_date: true,
                    ending_date: true,
                    images: {
                        take: 2,
                        select: { file_url: true }
                    },
                    Shop: {
                        select: {
                            id: true,
                            name: true,
                            rating: true,
                        }
                    }
                }
            }),
            prisma.products.count({
                where: filters,
            }),
        ]);
        const totalPages = Math.ceil(total / parsedLimit);
        res.json({
            products,
            pagination:{
                total,
                page: parsedPage,
                totalPages,
            }
        });
    } catch (error) {
        console.error("Get filtered offers error:", error);
        next(error);
    }
};

//Get filtered Shops
export const getFilteredShops = async (
    req: Request, 
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            search,
            categories = [],
            countries =[],
            page = 1,
            limit = 12
        } = req.query;

        const parsedPage = Number(page) || 1;
        const parsedLimit = Number(limit) || 12;
        const skip = (parsedPage - 1) * parsedLimit;

        const filters: Record<string, any> = {};

        if (search) {
            filters.name = {
                contains: search as string,
                mode: "insensitive",
            };
        }

        if (categories && (categories as string[]).length > 0) {
            filters.category = {
                in: Array.isArray(categories)
                    ? categories
                    : String(categories).split(",")
            };
        }
        
        // Filter by seller's country (not shop's country)
        const sellerFilters: Record<string, any> = {};
        if (countries && (countries as string[]).length > 0) {
            sellerFilters.country = {
                in: Array.isArray(countries)
                    ? countries
                    : String(countries).split(",")
            };
        }

        const [shops, total] = await Promise.all([
            prisma.shops.findMany({
                where: {
                    ...filters,
                    ...(Object.keys(sellerFilters).length > 0 && {
                        sellers: {
                            country: sellerFilters.country
                        }
                    })
                },
                skip,
                take: parsedLimit,
                include: { 
                    sellers: {
                        select: {
                            id: true,
                            name: true,
                            country: true,
                        }
                    },
                    products: {
                        take: 4,
                        where: { isDeleted: false },
                        select: {
                            id: true,
                            images: {
                                take: 1,
                                select: { file_url: true }
                            }
                        }
                    },
                    _count: {
                        select: { products: true }
                    },
                    images: {
                        where: {
                            type: { in: ["avatar", "cover"] }
                        },
                        select: {
                            file_url: true,
                            type: true
                        }
                    }
                }
            }),
            prisma.shops.count({
                where: {
                    ...filters,
                    ...(Object.keys(sellerFilters).length > 0 && {
                        sellers: {
                            country: sellerFilters.country
                        }
                    })
                }
            })
        ]);
        const totalPages = Math.ceil(total / parsedLimit);
        res.json({
            shops,
            pagination: {
                total,
                page: parsedPage,
                totalPages
            }
        });
    } catch (error) {
        console.error("Get filtered shops error:", error);
        next(error);
    }
};

//Search products
export const searchProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const query = req.query.q as string;
        if(!query || query.trim().length === 0){
            return res.status(400).json({ error: "Search query is required" });
        }
        const products = await prisma.products.findMany({
            where: {
                OR:[
                    {
                        title: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                    {
                        short_description: {
                            contains: query,
                            mode: "insensitive",
                        },
                    },
                ]
            },
            select: {
                id:true,
                title:true,
                slug:true,
            },
            take: 10,
            orderBy: {
                createdAt: "desc"
            },
        });
        return res.status(200).json({ products });
    } catch (error) {
        console.error("Search products error:", error);
        return next(error);
    }
};

//Top shops
export const topShops = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const topShopsData = await prisma.orders.groupBy({
            by: ['shopId'],
            _sum: {
                total:true,
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
                id: { 
                    in: shopIds 
                } 
            },
            select:{
                id:true,
                name:true,
                // avatar:true,
                // coverBanner:true,
                address:true,
                rating:true,
                followers:true,
                category:true,
                images: {
                    where: {
                        type: { in: ["avatar", "cover"] }
                    },
                    select: {
                        file_url: true,
                        type: true
                    }
                }
            },
        });

        const enrichedShop = shops.map((shop: any) => {
            const salesData = topShopsData.find((s: any) => s.shopId === shop.id);
            return {
                ...shop,
                totalSales: salesData ? salesData._sum.total : 0,
            };
        });
        const top10Shops = enrichedShop
        .sort((a,b) => b.totalSales - a.totalSales)
        .slice(0,10);

        return res.status(200).json({ shops: top10Shops });
    } catch (error) {
        console.error("Top shops error:", error);
        return next(error);
    }
};

// Edit product
export const editProduct = async (req: any, res: Response, next: NextFunction) => {
    try {
        const {
            title,
            short_description,
            detailed_description,
            warranty,
            custom_specifications,
            slug,
            tags,
            cash_on_delivery,
            brand,
            video_url,
            category,
            sub_category,
            stock,
            sale_price,
            regular_price,
            colors = [],
            sizes = [],
            images = [],
            custom_properties,
            discountCodes = [],
        } = req.body;
        const { id } = req.params;

        if (!req.seller || !req.seller.shop || !req.seller.shop.id) {
            return next(new AuthError("You need to be a seller with a shop to edit products"));
        }

        const product = await prisma.products.findUnique({
            where: { id },
            select: { id: true, shopId: true, slug: true }
        });

        if (!product) {
            return next(new notFoundError("Product not found"));
        }

        if (product.shopId !== req.seller.shop.id) {
            return next(new ValidationError("You are not authorized to edit this product"));
        }

        if (slug && slug !== product.slug) {
            const slugCheck = await prisma.products.findUnique({
                where: { slug }
            });
            if (slugCheck) {
                return next(new ValidationError("Slug already exists. Please choose another one"));
            }
        }

        const updatedProduct = await prisma.products.update({
            where: { id },
            data: {
                title,
                short_description,
                detailed_description,
                warranty,
                slug,
                cash_on_delivery,
                brand,
                video_url,
                category,
                sub_category,
                stock: stock ? parseInt(stock) : undefined,
                sale_price: sale_price ? parseFloat(sale_price) : undefined,
                regular_price: regular_price ? parseFloat(regular_price) : undefined,
                tags: Array.isArray(tags) ? tags : tags?.split(","),
                colors: colors || [],
                sizes: sizes || [],
                discount_codes: {
                    set: discountCodes.map((codeId: string) => ({ id: codeId })),
                },
                images: {
                    deleteMany: {},
                    create: images
                        .filter((img: any) => img && img.file_url && img.fileId)
                        .map((img: any) => ({
                            file_url: img.file_url,
                            fileId: img.fileId,
                        })),
                },
                custom_properties: custom_properties || [],
                custom_specifications: custom_specifications || {},
            },
            include: { images: true }
        });

        return res.status(200).json({ success: true, product: updatedProduct });

    } catch (error) {
        console.error("Edit product error:", error);
        return next(error);
    }
};

// Get shop events
export const getShopEvents = async (req: any, res: Response, next: NextFunction) => {
    try {
        if (!req.seller || !req.seller.shop || !req.seller.shop.id) {
            return next(new AuthError("Please login as seller to view shop events"));
        }

        const events = await prisma.products.findMany({
            where: {
                shopId: req.seller.shop.id,
                starting_date: { not: null },
                ending_date: { not: null },
            },
            include: { images: true }
        });

        return res.status(200).json({ success: true, events });
    } catch (error) {
        console.error("Get shop events error:", error);
        return next(error);
    }
};

// Edit event
export const editEvent = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { productId } = req.params;
        const { starting_date, ending_date, sale_price } = req.body;

        if (!starting_date || !ending_date || !sale_price) {
            return next(new ValidationError("Please provide all required fields"));
        }

        if (!req.seller || !req.seller.shop || !req.seller.shop.id) {
            return next(new AuthError("You need to be a seller with a shop to edit events"));
        }

        const product = await prisma.products.findUnique({
            where: { id: productId },
            select: { id: true, shopId: true, regular_price: true }
        });

        if (!product) {
            return next(new notFoundError("Product not found"));
        }

        if (product.shopId !== req.seller.shop.id) {
            return next(new ValidationError("You are not authorized to edit this event"));
        }

        if (parseFloat(sale_price) >= product.regular_price) {
            return next(new ValidationError("Event sale price must be lower than the regular price"));
        }

        const updatedEvent = await prisma.products.update({
            where: { id: productId },
            data: {
                starting_date: new Date(starting_date),
                ending_date: new Date(ending_date),
                sale_price: parseFloat(sale_price),
            },
        });

        return res.status(200).json({ success: true, event: updatedEvent });
    } catch (error) {
        console.error("Edit event error:", error);
        return next(error);
    }
};

// Create events (Update product to event)
export const createEvents = async (req: any, res: Response, next: NextFunction) => {
    try {
        const { productId, starting_date, ending_date, sale_price } = req.body;

        if (!productId || !starting_date || !ending_date || !sale_price) {
            return next(new ValidationError("Please provide all required fields"));
        }

        if (!req.seller || !req.seller.shop || !req.seller.shop.id) {
            return next(new AuthError("You need to be a seller with a shop to create events"));
        }

        const product = await prisma.products.findUnique({
            where: { id: productId },
            select: { id: true, shopId: true, regular_price: true }
        });

        if (!product) {
            return next(new notFoundError("Product not found"));
        }

        if (product.shopId !== req.seller.shop.id) {
            return next(new ValidationError("You are not authorized to create event for this product"));
        }

        if (parseFloat(sale_price) >= product.regular_price) {
            return next(new ValidationError("Event sale price must be lower than the regular price"));
        }

        const updatedProduct = await prisma.products.update({
            where: { id: productId },
            data: {
                starting_date: new Date(starting_date),
                ending_date: new Date(ending_date),
                sale_price: parseFloat(sale_price),
            },
            include: { images: true }
        });

        return res.status(200).json({ success: true, event: updatedProduct });

    } catch (error) {
        console.error("Create event error:", error);
        return next(error);
    }
};
