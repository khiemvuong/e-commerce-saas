import { ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import { Request, Response, NextFunction } from "express";
import { client } from "@packages/libs/imagekit";
import { toFile } from "@imagekit/nodejs";

// Get Shop Details
export const getShopDetails = async (
    req: any,
    res: Response,
    next: NextFunction
) => {
    try {
        const sellerId=req.seller?.id;

        if (!sellerId) {
            return next(new ValidationError("Unauthorized"));
        }

        const shop = await prisma.shops.findUnique({
            where: { sellerId },
            include: {
                images: {
                    where: {
                        type: { in: ["avatar", "cover"] }
                    }
                },
            }
        });

        if (!shop) {
            return next(new ValidationError("Shop not found"));
        }

        // Get products (exclude events - products without starting_date/ending_date)
        const products = await prisma.products.findMany({
            where: { 
                shopId: shop.id, 
                isDeleted: false,
                OR: [
                    { starting_date: null },
                    { ending_date: null }
                ]
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                slug: true,
                sale_price: true,
                regular_price: true,
                stock: true,
                rating: true,
                totalSales: true,
                status: true,
                createdAt: true,
                cash_on_delivery: true,
                images: {
                    take: 1,
                    select: {
                        id: true,
                        file_url: true
                    }
                }
            }
        });

        // Get events (products with both starting_date and ending_date)
        const events = await prisma.products.findMany({
            where: { 
                shopId: shop.id, 
                isDeleted: false,
                starting_date: { not: null },
                ending_date: { not: null }
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                slug: true,
                sale_price: true,
                regular_price: true,
                stock: true,
                rating: true,
                totalSales: true,
                status: true,
                createdAt: true,
                cash_on_delivery: true,
                starting_date: true,
                ending_date: true,
                images: {
                    take: 1,
                    select: {
                        id: true,
                        file_url: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            shop: {
                ...shop,
                products,
                events
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Shop By ID (for public user view)
export const getShopById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        if (!id) {
            return next(new ValidationError("Shop ID is required"));
        }

        const shop = await prisma.shops.findUnique({
            where: { id },
            include: {
                images: {
                    where: {
                        type: { in: ["avatar", "cover"] }
                    }
                }
            }
        });

        if (!shop) {
            return next(new ValidationError("Shop not found"));
        }

        // Get products (exclude events)
        const products = await prisma.products.findMany({
            where: { 
                shopId: id, 
                isDeleted: false,
                OR: [
                    { starting_date: null },
                    { ending_date: null }
                ]
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                slug: true,
                sale_price: true,
                regular_price: true,
                stock: true,
                rating: true,
                totalSales: true,
                status: true,
                createdAt: true,
                cash_on_delivery: true,
                images: {
                    take: 1,
                    select: {
                        id: true,
                        file_url: true
                    }
                }
            }
        });

        // Get events (products with starting_date and ending_date)
        const events = await prisma.products.findMany({
            where: { 
                shopId: id, 
                isDeleted: false,
                starting_date: { not: null },
                ending_date: { not: null }
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                slug: true,
                sale_price: true,
                regular_price: true,
                stock: true,
                rating: true,
                totalSales: true,
                status: true,
                createdAt: true,
                cash_on_delivery: true,
                starting_date: true,
                ending_date: true,
                images: {
                    take: 1,
                    select: {
                        id: true,
                        file_url: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            shop: {
                ...shop,
                products,
                events
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get Shop Products
export const getShopProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params;

        if (!id) {
            return next(new ValidationError("Shop ID is required"));
        }

        const products = await prisma.products.findMany({
            where: { shopId: id, isDeleted: false },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                slug: true,
                sale_price: true,
                regular_price: true,
                stock: true,
                rating: true,
                totalSales: true,
                status: true,
                createdAt: true,
                cash_on_delivery: true,
                images: {
                    take: 1,
                    select: {
                        id: true,
                        file_url: true
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            products
        });
    } catch (error) {
        next(error);
    }
};

// Update Shop Details
export const updateShop = async (
    req: any,
    res: Response,
    next: NextFunction
) => {
    try {
        const sellerId=req.seller?.id;
        if (!sellerId) {
            return next(new ValidationError("Unauthorized"));
        }
        const { name, bio, website, address, opening_hours, socialLinks, images } = req.body;

        const shop = await prisma.shops.findUnique({ where: { sellerId } });

        if (!shop) {
            return next(new ValidationError("Shop not found"));
        }

        // Update basic info
        await prisma.shops.update({
            where: { id: shop.id },
            data: {
                name,
                bio,
                website,
                address,
                opening_hours,
                socialLinks: socialLinks || [],
            }
        });

        // Update images if provided
        if (images && Array.isArray(images)) {
            // Delete existing avatar and cover images
            await prisma.images.deleteMany({
                where: {
                    shopId: shop.id,
                    type: { in: ["avatar", "cover"] }
                }
            });

            // Create new images
            if (images.length > 0) {
                await prisma.images.createMany({
                    data: images.map((img: any) => ({
                        file_url: img.file_url,
                        fileId: img.fileId,
                        type: img.type, // 'avatar' or 'cover'
                        shopId: shop.id
                    }))
                });
            }
        }

        res.status(200).json({
            success: true,
            message: "Shop updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

// Upload Shop Image
export const uploadShopImage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { fileName } = req.body;

        if (!fileName || typeof fileName !== 'string') {
            return res.status(400).json({ error: 'fileName (base64 data URL) is required' });
        }

        const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(fileName);
        if (!match) {
            return res.status(400).json({ error: 'Invalid base64 image data URL' });
        }

        const mime = match[1];
        const base64 = match[2];
        const buffer = Buffer.from(base64, 'base64');

        const ext = mime.split('/')[1] || 'jpg';
        const uniqueName = `shop-${Date.now()}.${ext}`;
        const fileForUpload = await toFile(buffer, uniqueName);

        const resp = await client.files.upload({
            file: fileForUpload,
            fileName: uniqueName,
        });

        return res.status(200).json({
            success: true,
            file_url: (resp as any).url ?? (resp as any).filePath ?? null,
            fileId: (resp as any).fileId,
        });
    } catch (error: any) {
        console.error('ImageKit upload error:', error);
        return res.status(500).json({ error: 'Failed to upload image', details: error?.message });
    }
};

// Get Seller Analytics
export const getSellerAnalytics = async (
    req: any,
    res: Response,
    next: NextFunction
) => {
    try {
        const sellerId = req.seller?.id;

        if (!sellerId) {
            return next(new ValidationError("Unauthorized"));
        }

        const shop = await prisma.shops.findUnique({
            where: { sellerId }
        });

        if (!shop) {
            return next(new ValidationError("Shop not found"));
        }

        // 1. Revenue Analytics (Last 12 months)
        const last12Months = new Date();
        last12Months.setMonth(last12Months.getMonth() - 11);
        last12Months.setDate(1);
        last12Months.setHours(0, 0, 0, 0);

        const orders = await prisma.orders.findMany({
            where: {
                shopId: shop.id,
                createdAt: { gte: last12Months }
            },
            select: {
                total: true,
                createdAt: true
            }
        });

        const revenueMap = new Map<string, number>();
        
        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const month = d.toLocaleString('default', { month: 'short', year: 'numeric' });
            revenueMap.set(month, 0);
        }

        orders.forEach(order => {
            const month = new Date(order.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
            if (revenueMap.has(month)) {
                revenueMap.set(month, revenueMap.get(month)! + order.total);
            }
        });

        const revenueData = Array.from(revenueMap, ([name, total]) => ({ name, total }));

        // 2. Top Products (by Sales)
        const topProducts = await prisma.products.findMany({
            where: { shopId: shop.id, isDeleted: false },
            orderBy: { totalSales: 'desc' },
            take: 5,
            select: {
                id: true,
                title: true,
                sale_price: true,
                regular_price: true,
                totalSales: true,
                images: {
                    take: 1,
                    select: {
                        id: true,
                        file_url: true
                    }
                }
            }
        });

        // 3. Recent Orders
        const recentOrders = await prisma.orders.findMany({
            where: { shopId: shop.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                user: { select: { name: true, email: true } }
            }
        });

        res.status(200).json({
            success: true,
            revenueData,
            topProducts,
            recentOrders
        });
    } catch (error) {
        next(error);
    }
};

//Get seller orders
export const getSellerOrders = async (req:any, res:Response, next:NextFunction) => {
    try {
        const shop = await prisma.shops.findUnique({
            where: {
                sellerId: req.seller.id,
            },
        });

        //Fetch all orders for this shop
        const orders = await prisma.orders.findMany({
            where: {
                shopId: shop?.id,
            },
            include: {
                user:{
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: {
                            take: 1,
                            select: {
                                id: true,
                                file_url: true
                            }
                        }
                    }
                }
            },
            orderBy:{
                createdAt: 'desc',
            }
        });

        res.status(201).json({
            success: true,
            orders,
        });
    } catch (error) {
        next(error);
    }
};

//Get order details
export const getOrderDetails = async (req:any,res:Response,next:NextFunction) => {
    try {
        const orderId = req.params.id;

        const order = await prisma.orders.findUnique({
            where: {id: orderId},
            include: {
                items: true,
                // user:{
                //     select: {
                //         id: true,
                //         name: true,
                //         email: true,
                //     }
                // }
            }
        });
        if(!order){
            return next(new ValidationError("Order not found"));
        }

        const shippingAddress = order.shippingAddressId
        ? await prisma.address.findUnique({
            where: {id: order?.shippingAddressId},
        })
        : null;

        const coupon = order.couponCode
        ? await prisma.discount_codes.findUnique({
            where: {discountCode: order.couponCode},
        })
        : null;

        //Fetch all products details in one go

        const productIds = order.items.map((item) => item.productId);
        const products = await prisma.products.findMany({
            where: {
                id: {in: productIds},
            },
            select: {
                id: true,
                title: true,
                images: true,
            }
        });

        const productMap = new Map(products.map((product) => [product.id, product]));

        const items = order.items.map((item:any) => ({
            ...item,
            selectedOptions: item.selectedOptions || {},
            product: productMap.get(item.productId) || null,
        }));
        res.status(200).json({
            success: true,
            order:{
                ...order,
                items,
                shippingAddress,
                couponCode: coupon || null,
            }
        });
    } catch (error) {
        next(error);
    }
}

// Toggle Follow Shop
export const toggleFollowShop = async (
    req: any,
    res: Response,
    next: NextFunction
) => {
    try {
        const { shopId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return next(new ValidationError("Please login to follow shops"));
        }

        if (!shopId) {
            return next(new ValidationError("Shop ID is required"));
        }

        const shop = await prisma.shops.findUnique({ where: { id: shopId } });
        if (!shop) {
            return next(new ValidationError("Shop not found"));
        }

        // Check if already following using the unique constraint in followers table
        const existingFollow = await prisma.followers.findUnique({
            where: {
                userId_shopId: {
                    userId,
                    shopId
                }
            }
        });

        if (existingFollow) {
            // Unfollow
            const user = await prisma.users.findUnique({ where: { id: userId } });
            
            await prisma.$transaction([
                prisma.followers.delete({
                    where: {
                        userId_shopId: {
                            userId,
                            shopId
                        }
                    }
                }),
                prisma.shops.update({
                    where: { id: shopId },
                    data: {
                        followers: {
                            set: shop.followers.filter((id) => id !== userId)
                        }
                    }
                }),
                prisma.users.update({
                    where: { id: userId },
                    data: {
                        following: {
                            set: user?.following.filter((id) => id !== shopId) || []
                        }
                    }
                })
            ]);

            res.status(200).json({
                success: true,
                message: "Unfollowed successfully",
            });
        } else {
            // Follow
            await prisma.$transaction([
                prisma.followers.create({
                    data: {
                        userId,
                        shopId
                    }
                }),
                prisma.shops.update({
                    where: { id: shopId },
                    data: {
                        followers: {
                            push: userId
                        }
                    }
                }),
                prisma.users.update({
                    where: { id: userId },
                    data: {
                        following: {
                            push: shopId
                        }
                    }
                })
            ]);

            res.status(200).json({
                success: true,
                message: "Followed successfully",
            });
        }
    } catch (error) {
        next(error);
    }
};

//Update order status
export const updateDeliveryStatus = async (req:Request,res:Response,next:NextFunction) => {
    try {
        const {orderId} = req.params;
        const {deliveryStatus} = req.body;

        if(!orderId || !deliveryStatus){
            return res
            .status(400)
            .json({success: false, message: "Order ID and delivery status are required"});
        }

        const allowedStatuses = ["Ordered", "Packed", "Shipped","Out for Delivery", "Delivered"];
        if(!allowedStatuses.includes(deliveryStatus)){
            return next(new ValidationError("Invalid delivery status"));
        }

        const existingOrder = await prisma.orders.findUnique({
            where: {id: orderId},
        });

        if (!existingOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Prevent reverting to previous status
        const statusOrder = ["Ordered", "Packed", "Shipped", "Out for Delivery", "Delivered"];
        const currentIndex = statusOrder.indexOf(existingOrder.deliveryStatus || "Ordered");
        const newIndex = statusOrder.indexOf(deliveryStatus);

        if (newIndex < currentIndex) {
            return res.status(400).json({
                success: false,
                message: "Cannot revert to previous delivery status"
            });
        }

        const updatedOrder = await prisma.orders.update({
            where: {id: orderId},
            data: {
                deliveryStatus: deliveryStatus,
                updatedAt: new Date(),
            },
        });

        return res.status(200).json({success: true, order: updatedOrder});
    } catch (error) {
        next(error);
    }
}

// Get seller notifications with pagination and search
export const sellerNotifications = async (req: any, res: Response, next: NextFunction) => {
    try {
        const sellerId = req.seller?.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        if (!sellerId) {
            return next(new ValidationError("Unauthorized"));
        }

        // Build where clause
        const where: any = {
            receiverId: sellerId,
        };

        if (search) {
            where.AND = [
                { receiverId: sellerId },
                {
                    OR: [
                        { title: { contains: search, mode: "insensitive" } },
                        { message: { contains: search, mode: "insensitive" } },
                    ],
                },
            ];
            delete where.receiverId; // Remove duplicate condition
        }

        const [notifications, totalNotifications] = await Promise.all([
            prisma.notifications.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    message: true,
                    type: true,
                    createdAt: true,
                },
            }),
            prisma.notifications.count({ where }),
        ]);

        const totalPages = Math.ceil(totalNotifications / limit);
        return res.status(200).json({
            success: true,
            data: notifications,
            meta: {
                totalNotifications,
                currentPage: page,
                totalPages,
            },
        });
    } catch (error) {
        return next(error);
    }
};