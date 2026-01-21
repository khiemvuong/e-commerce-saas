import { ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import { Request, Response, NextFunction } from "express";
import { client } from "@packages/libs/imagekit";
import { toFile } from "@imagekit/nodejs";

//Get all Products
export const getAllProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        const where: any = {
            isDeleted: false,
            starting_date: null,
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
                { Shop: { name: { contains: search, mode: "insensitive" } } },
            ];
        }

        const [products, totalProducts] = await Promise.all([
            prisma.products.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    sale_price: true,
                    stock: true,
                    createdAt: true,
                    rating: true,
                    category: true,
                    images: {
                        select: { file_url: true },
                        take: 1,
                    },
                    Shop: {
                        select: { name: true },
                    },
                },
            }),
            prisma.products.count({
                where,
            }),
        ]);

        const totalPages = Math.ceil(totalProducts / limit);
        res.status(200).json({
            success: true,
            data: products,
            meta: {
                totalProducts,
                currentPage: page,
                totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
};

//Get all Events
export const getAllEvents = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        const where: any = {
            isDeleted: false,
            starting_date: { not: null },
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
                { Shop: { name: { contains: search, mode: "insensitive" } } },
            ];
        }

        const [products, totalProducts] = await Promise.all([
            prisma.products.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    sale_price: true,
                    stock: true,
                    createdAt: true,
                    rating: true,
                    category: true,
                    starting_date: true,
                    ending_date: true,
                    images: {
                        select: { file_url: true },
                        take: 1,
                    },
                    Shop: {
                        select: { name: true },
                    },
                },
            }),
            prisma.products.count({
                where,
            }),
        ]);

        const totalPages = Math.ceil(totalProducts / limit);
        res.status(200).json({
            success: true,
            data: products,
            meta: {
                totalProducts,
                currentPage: page,
                totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
};

//Get all Admins
export const getAllAdmins = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const admins = await prisma.users.findMany({
            where: { role: "admin" },
        });
        res.status(201).json({
            success: true,
            admins,
        });
    } catch (error) {
        next(error);
    }
};

// Add new admin
export const addNewAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, role } = req.body;

        const isUSer = await prisma.users.findUnique({
            where: { email },
        });

        if (!isUSer) {
            return next(new ValidationError("User does not exist"));
        }

        const updateRole = await prisma.users.update({
            where: { email },
            data: { role },
        });

        res.status(201).json({
            success: true,
            updateRole,
        });
    } catch (error) {
        next(error);
    }
};

// Remove admin
export const removeAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body;
        const isUSer = await prisma.users.findUnique({
            where: { email },
        });
        if (!isUSer) {
            return next(new ValidationError("User does not exist"));
        }

        const updateRole = await prisma.users.update({
            where: { email },
            data: { role: "user" },
        });

        res.status(201).json({
            success: true,
            updateRole,
        });
    } catch (error) {
        next(error);
    }
};

//Fetch all customizations
export const getAllCustomizations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const config = await prisma.site_config.findFirst({
            include: { images: true }
        });
        return res.status(200).json({
            categories: config?.categories || [],
            subCategories: config?.subCategories || {},
            shopCategories: config?.shopCategories || [],
            countries: config?.countries || [],
            images: config?.images || [],
        });
    } catch (error) {
        console.error("Error fetching customizations:", error);
        return next(error);
    }
};

// Update site config
export const updateSiteConfig = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { categories, subCategories, shopCategories, countries, images } = req.body;

        const config = await prisma.site_config.findFirst();

        if (!config) {
            // Should ideally be initialized, but handle just in case
            await prisma.site_config.create({
                data: {
                    categories: categories || [],
                    subCategories: subCategories || {},
                    shopCategories: shopCategories || [],
                    countries: countries || [],
                    images: {
                        create: images?.map((img: any) => ({
                            file_url: img.file_url,
                            fileId: img.fileId,
                            type: img.type
                        })) || []
                    }
                },
            });
            return res.status(201).json({ success: true });
        }

        // Delete existing images to replace with new set
        await prisma.images.deleteMany({
            where: { siteConfigId: config.id }
        });

        const updatedConfig = await prisma.site_config.update({
            where: { id: config.id },
            data: {
                categories,
                subCategories,
                shopCategories,
                countries,
                images: {
                    create: images?.map((img: any) => ({
                        file_url: img.file_url,
                        fileId: img.fileId,
                        type: img.type
                    })) || []
                }
            },
            include: { images: true }
        });

        res.status(200).json({
            success: true,
            data: updatedConfig,
        });
    } catch (error) {
        return next(error);
    }
};

// Upload site image
export const uploadSiteImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileName } = req.body; // base64 data URL
  
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
      const uniqueName = `site-${Date.now()}.${ext}`;
      const fileForUpload = await toFile(buffer, uniqueName);
  
      const resp = await client.files.upload({
        file: fileForUpload,
        fileName: uniqueName,
      });
  
      return res.status(200).json({
        success: true,
        file_url: (resp as any).url ?? (resp as any).filePath ?? null,
        fileId: (resp as any).fileId,
        thumbnailUrl: (resp as any).thumbnailUrl ?? null,
      });
    } catch (error: any) {
      console.error('ImageKit upload error:', error);
      return res.status(500).json({ error: 'Failed to upload image', details: error?.message });
    }
  };

//Get all users
export const getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const role = req.query.role as string | undefined;
        const skip = (page - 1) * limit;
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (role && role !== 'all') {
            where.role = role;
        }
        const [users, totalUsers] = await Promise.all([
            prisma.users.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                where,
                select: {
                    id: true,
                    name: true,
                    role: true,
                    email: true,
                    createdAt: true,
                },
            }),
            prisma.users.count({ where }),
        ]);

        const totalPages = Math.ceil(totalUsers / limit);
        res.status(200).json({
            success: true,
            data: users,
            meta: {
                totalUsers,
                currentPage: page,
                totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
};

//Get all sellers
export const getAllSellers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { shop: { name: { contains: search, mode: "insensitive" } } },
            ];
        }

        const [sellers, totalSellers] = await Promise.all([
            prisma.sellers.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                    shop: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                            images: {
                                take: 1,
                                where: { type: "avatar" },
                                select: { file_url: true },
                            },
                        },
                    },
                },
            }),
            prisma.sellers.count({ where }),
        ]);

        const totalPages = Math.ceil(totalSellers / limit);
        res.status(200).json({
            success: true,
            data: sellers,
            meta: {
                totalSellers,
                currentPage: page,
                totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
};


export const getAllNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        // Get all admin user IDs
        const adminUsers = await prisma.users.findMany({
            where: { role: "admin" },
            select: { id: true },
        });

        const adminIds = adminUsers.map(admin => admin.id);

        // If no admins exist, return empty result
        if (adminIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                meta: {
                    totalNotifications: 0,
                    currentPage: page,
                    totalPages: 0,
                },
            });
        }

        // Build where clause
        const where: any = {
            receiverId: { in: adminIds },
        };

        if (search) {
            where.AND = [
                { receiverId: { in: adminIds } },
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

// get all user notification
export const getUserNotifications = async (req: any, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { message: { contains: search, mode: "insensitive" } },
            ];
        }

        const [notifications, totalNotifications] = await Promise.all([
            prisma.notifications.findMany({
                where :{
                    receiverId: req.user.id,
                },
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
        res.status(200).json({
            success: true,
            data: notifications,
            meta: {
                totalNotifications,
                currentPage: page,
                totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
};

// Get Dashboard Statistics
export const getDashboardStats = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. Sellers by Country
        const sellersRaw = await prisma.sellers.findMany({
            select: { country: true },
        });
        const sellersByCountry: Record<string, number> = {};
        sellersRaw.forEach((s) => {
            const country = s.country || "Unknown";
            sellersByCountry[country] = (sellersByCountry[country] || 0) + 1;
        });
        const sellersByCountryArray = Object.entries(sellersByCountry).map(
            ([country, count]) => ({ country, count })
        );

        // 2. Users by Country (from userAnalytics)
        const userAnalyticsRaw = await prisma.userAnalytics.findMany({
            select: { country: true, device: true },
        });
        const usersByCountry: Record<string, number> = {};
        const deviceStats: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };

        userAnalyticsRaw.forEach((ua) => {
            // Count by country
            const country = ua.country || "Unknown";
            usersByCountry[country] = (usersByCountry[country] || 0) + 1;

            // Count by device type
            const deviceStr = (ua.device || "").toLowerCase();
            if (deviceStr.includes("mobile") || deviceStr.includes("iphone") || deviceStr.includes("android")) {
                deviceStats["Mobile"]++;
            } else if (deviceStr.includes("tablet") || deviceStr.includes("ipad")) {
                deviceStats["Tablet"]++;
            } else {
                deviceStats["Desktop"]++;
            }
        });

        const usersByCountryArray = Object.entries(usersByCountry).map(
            ([country, count]) => ({ country, count })
        );

        const deviceStatsArray = [
            { name: "Mobile", value: deviceStats["Mobile"], color: "#4ade80" },
            { name: "Desktop", value: deviceStats["Desktop"], color: "#60a5fa" },
            { name: "Tablet", value: deviceStats["Tablet"], color: "#f59e0b" },
        ];

        // 3. Revenue by Month (from orders)
        const orders = await prisma.orders.findMany({
            where: { status: { in: ["Paid", "COD", "Delivered"] } },
            select: { total: true, createdAt: true },
        });

        const revenueByMonth: Record<string, { revenue: number; orders: number }> = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Initialize all months
        months.forEach((m) => {
            revenueByMonth[m] = { revenue: 0, orders: 0 };
        });

        orders.forEach((order) => {
            const monthIndex = new Date(order.createdAt).getMonth();
            const monthName = months[monthIndex];
            revenueByMonth[monthName].revenue += order.total || 0;
            revenueByMonth[monthName].orders += 1;
        });

        const revenueData = months.map((month) => ({
            month,
            revenue: Math.round(revenueByMonth[month].revenue * 100) / 100,
            orders: revenueByMonth[month].orders,
        }));

        // 4. Summary counts
        const [totalUsers, totalSellers, totalProducts, totalOrders] = await Promise.all([
            prisma.users.count(),
            prisma.sellers.count(),
            prisma.products.count({ where: { isDeleted: false } }),
            prisma.orders.count(),
        ]);

        // 5. Total Revenue
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

        // 6. Geographical data for map (combine users + sellers by country)
        // Map country names to ISO numeric codes for the map
        const countryCodeMap: Record<string, string> = {
            "United States": "840", "USA": "840", "US": "840",
            "United Kingdom": "826", "UK": "826", "GB": "826",
            "Germany": "276", "DE": "276",
            "France": "250", "FR": "250",
            "Canada": "124", "CA": "124",
            "Australia": "036", "AU": "036",
            "Japan": "392", "JP": "392",
            "Vietnam": "704", "Viet Nam": "704", "VN": "704",
            "China": "156", "CN": "156",
            "Korea": "410", "KR": "410",
            "Singapore": "702", "SG": "702",
            "Thailand": "764", "TH": "764",
            "Malaysia": "458", "MY": "458",
            "Indonesia": "360", "ID": "360",
            "India": "356", "IN": "356",
            "Spain": "724", "ES": "724",
        };

        const geoData: Record<string, { users: number; sellers: number }> = {};
        
        usersByCountryArray.forEach(({ country, count }) => {
            const code = countryCodeMap[country] || country;
            if (!geoData[code]) geoData[code] = { users: 0, sellers: 0 };
            geoData[code].users += count;
        });

        sellersByCountryArray.forEach(({ country, count }) => {
            const code = countryCodeMap[country] || country;
            if (!geoData[code]) geoData[code] = { users: 0, sellers: 0 };
            geoData[code].sellers += count;
        });

        const geographicalData = Object.entries(geoData).map(([id, data]) => ({
            id,
            name: Object.keys(countryCodeMap).find(k => countryCodeMap[k] === id) || id,
            users: data.users,
            sellers: data.sellers,
        }));

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalUsers,
                    totalSellers,
                    totalProducts,
                    totalOrders,
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                },
                sellersByCountry: sellersByCountryArray,
                usersByCountry: usersByCountryArray,
                deviceStats: deviceStatsArray,
                revenueData,
                geographicalData,
            },
        });
    } catch (error) {
        next(error);
    }
};