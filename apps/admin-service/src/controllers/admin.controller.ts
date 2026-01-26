import { ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import { Request, Response, NextFunction } from "express";
import { client } from "@packages/libs/imagekit";
import { toFile } from "@imagekit/nodejs";
import { getOrSetCache, invalidateCache } from "@packages/libs/cache-manager";

// Cache keys for admin APIs
const ADMIN_CACHE_KEYS = {
    DASHBOARD_STATS: 'admin:dashboard:stats',
    CUSTOMIZATIONS: 'admin:customizations',
} as const;

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

//Fetch all customizations - CACHED (5 min)
export const getAllCustomizations = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { data, fromCache, responseTime } = await getOrSetCache(
            ADMIN_CACHE_KEYS.CUSTOMIZATIONS,
            async () => {
                const config = await prisma.site_config.findFirst({
                    include: { images: true }
                });
                return {
                    categories: config?.categories || [],
                    subCategories: config?.subCategories || {},
                    shopCategories: config?.shopCategories || [],
                    countries: config?.countries || [],
                    images: config?.images || [],
                };
            },
            300 // 5 minutes TTL
        );

        res.setHeader('X-Cache', fromCache ? 'HIT' : 'MISS');
        res.setHeader('X-Response-Time', `${responseTime}ms`);
        return res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching customizations:", error);
        return next(error);
    }
};

// Update site config - INVALIDATES CACHE
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
            
            // Invalidate cache after create
            await invalidateCache(ADMIN_CACHE_KEYS.CUSTOMIZATIONS);
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

        // Invalidate cache after update
        await invalidateCache(ADMIN_CACHE_KEYS.CUSTOMIZATIONS);

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

// Get Dashboard Statistics - CACHED (60s)
export const getDashboardStats = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { data: dashboardData, fromCache, responseTime } = await getOrSetCache(
            ADMIN_CACHE_KEYS.DASHBOARD_STATS,
            async () => {
        // Date ranges for comparison
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // Fetch site config for country mapping
        const siteConfig = await prisma.site_config.findFirst({
            select: { countries: true }
        });
        
        // Create a map of Name -> Code and Code -> Name for flexibility
        const countryList = (siteConfig?.countries as any[]) || [];
        const nameToCodeMap: Record<string, string> = {};
        const codeToNameMap: Record<string, string> = {};

        countryList.forEach((c: {name: string, code: string}) => {
            nameToCodeMap[c.name] = c.code;
            nameToCodeMap[c.name.toLowerCase()] = c.code;
            codeToNameMap[c.code] = c.name;
        });

        // Standard ISO 3166-1 alpha-2 to numeric mapping
        const isoAlpha2ToNumeric: Record<string, string> = {
            'AF': '004', 'AL': '008', 'DZ': '012', 'AS': '016', 'AD': '020', 'AO': '024', 'AI': '660', 'AQ': '010', 'AG': '028', 'AR': '032',
            'AM': '051', 'AW': '533', 'AU': '036', 'AT': '040', 'AZ': '031', 'BS': '044', 'BH': '048', 'BD': '050', 'BB': '052', 'BY': '112',
            'BE': '056', 'BZ': '084', 'BJ': '204', 'BM': '060', 'BT': '064', 'BO': '068', 'BA': '070', 'BW': '072', 'BV': '074', 'BR': '076',
            'IO': '086', 'BN': '096', 'BG': '100', 'BF': '854', 'BI': '108', 'KH': '116', 'CM': '120', 'CA': '124', 'CV': '132', 'KY': '136',
            'CF': '140', 'TD': '148', 'CL': '152', 'CN': '156', 'CX': '162', 'CC': '166', 'CO': '170', 'KM': '174', 'CG': '178', 'CD': '180',
            'CK': '184', 'CR': '188', 'CI': '384', 'HR': '191', 'CU': '192', 'CY': '196', 'CZ': '203', 'DK': '208', 'DJ': '262', 'DM': '212',
            'DO': '214', 'EC': '218', 'EG': '818', 'SV': '222', 'GQ': '226', 'ER': '232', 'EE': '233', 'ET': '231', 'FK': '238', 'FO': '234',
            'FJ': '242', 'FI': '246', 'FR': '250', 'GF': '254', 'PF': '258', 'TF': '260', 'GA': '266', 'GM': '270', 'GE': '268', 'DE': '276',
            'GH': '288', 'GI': '292', 'GR': '300', 'GL': '304', 'GD': '308', 'GP': '312', 'GU': '316', 'GT': '320', 'GN': '324', 'GW': '624',
            'GY': '328', 'HT': '332', 'HM': '334', 'VA': '336', 'HN': '340', 'HK': '344', 'HU': '348', 'IS': '352', 'IN': '356', 'ID': '360',
            'IR': '364', 'IQ': '368', 'IE': '372', 'IL': '376', 'IT': '380', 'JM': '388', 'JP': '392', 'JO': '400', 'KZ': '398', 'KE': '404',
            'KI': '296', 'KP': '408', 'KR': '410', 'KW': '414', 'KG': '417', 'LA': '418', 'LV': '428', 'LB': '422', 'LS': '426', 'LR': '430',
            'LY': '434', 'LI': '438', 'LT': '440', 'LU': '442', 'MO': '446', 'MK': '807', 'MG': '450', 'MW': '454', 'MY': '458', 'MV': '462',
            'ML': '466', 'MT': '470', 'MH': '474', 'MQ': '478', 'MR': '478', 'MU': '480', 'YT': '175', 'MX': '484', 'FM': '583', 'MD': '498',
            'MC': '492', 'MN': '496', 'ME': '499', 'MS': '500', 'MA': '504', 'MZ': '508', 'MM': '104', 'NA': '516', 'NR': '520', 'NP': '524',
            'NL': '528', 'NC': '540', 'NZ': '554', 'NI': '558', 'NE': '562', 'NG': '566', 'NU': '570', 'NF': '574', 'MP': '580', 'NO': '578',
            'OM': '512', 'PK': '586', 'PW': '585', 'PS': '275', 'PA': '591', 'PG': '598', 'PY': '600', 'PE': '604', 'PH': '608', 'PN': '612',
            'PL': '616', 'PT': '620', 'PR': '630', 'QA': '634', 'RE': '638', 'RO': '642', 'RU': '643', 'RW': '646', 'SH': '654', 'KN': '659',
            'LC': '662', 'PM': '666', 'VC': '670', 'WS': '882', 'SM': '674', 'ST': '678', 'SA': '682', 'SN': '686', 'RS': '688', 'SC': '690',
            'SL': '694', 'SG': '702', 'SK': '703', 'SI': '705', 'SB': '090', 'SO': '706', 'ZA': '710', 'GS': '239', 'ES': '724', 'LK': '144',
            'SD': '729', 'SR': '740', 'SJ': '744', 'SZ': '748', 'SE': '752', 'CH': '756', 'SY': '760', 'TW': '158', 'TJ': '762', 'TZ': '834',
            'TH': '764', 'TL': '626', 'TG': '768', 'TK': '772', 'TO': '776', 'TT': '780', 'TN': '788', 'TR': '792', 'TM': '795', 'TC': '796',
            'TV': '798', 'UG': '800', 'UA': '804', 'AE': '784', 'GB': '826', 'UK': '826', 'US': '840', 'UM': '581', 'UY': '858', 'UZ': '860',
            'VU': '548', 'VE': '862', 'VN': '704', 'VG': '092', 'VI': '850', 'WF': '876', 'EH': '732', 'YE': '887', 'ZM': '894', 'ZW': '716'
        };

        const getCountryCode = (input: string | null) => {
            if (!input) return "Unknown";
            const cleanInput = input.trim();
            const upperInput = cleanInput.toUpperCase();
            
            if (isoAlpha2ToNumeric[upperInput]) return isoAlpha2ToNumeric[upperInput];
            if (nameToCodeMap[cleanInput]) return nameToCodeMap[cleanInput];
            if (nameToCodeMap[cleanInput.toLowerCase()]) return nameToCodeMap[cleanInput.toLowerCase()];
            if (codeToNameMap[cleanInput]) return cleanInput;
            if (upperInput === 'USA') return '840';
            if (upperInput === 'VIETNAM') return '704';
            
            return cleanInput;
        };

        // 1. Sellers by Country
        const sellersRaw = await prisma.sellers.findMany({
            select: { country: true, createdAt: true },
        });
        const sellersByCountry: Record<string, number> = {};
        let thisMonthSellers = 0;
        let lastMonthSellers = 0;

        sellersRaw.forEach((s) => {
            const countryName = s.country || "Unknown";
            sellersByCountry[countryName] = (sellersByCountry[countryName] || 0) + 1;
            
            const createdAt = new Date(s.createdAt);
            if (createdAt >= thisMonthStart && createdAt <= now) thisMonthSellers++;
            if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) lastMonthSellers++;
        });
        
        const sellersByCountryArray = Object.entries(sellersByCountry).map(
            ([country, count]) => ({ country, count })
        );

        // 2. Users by Country (from userAnalytics)
        const userAnalyticsRaw = await prisma.userAnalytics.findMany({
            select: { country: true, device: true, createdAt: true },
        });
        const usersByCountry: Record<string, number> = {};
        const deviceStats: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
        let thisMonthUsers = 0;
        let lastMonthUsers = 0;

        userAnalyticsRaw.forEach((ua) => {
            const countryName = ua.country || "Unknown";
            usersByCountry[countryName] = (usersByCountry[countryName] || 0) + 1;

            const createdAt = new Date(ua.createdAt);
            if (createdAt >= thisMonthStart && createdAt <= now) thisMonthUsers++;
            if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) lastMonthUsers++;

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
        let thisMonthRevenue = 0;
        let lastMonthRevenue = 0;
        let thisMonthOrderCount = 0;
        let lastMonthOrderCount = 0;

        months.forEach((m) => {
            revenueByMonth[m] = { revenue: 0, orders: 0 };
        });

        orders.forEach((order) => {
            const orderDate = new Date(order.createdAt);
            const monthIndex = orderDate.getMonth();
            const monthName = months[monthIndex];
            revenueByMonth[monthName].revenue += order.total || 0;
            revenueByMonth[monthName].orders += 1;

            if (orderDate >= thisMonthStart && orderDate <= now) {
                thisMonthRevenue += order.total || 0;
                thisMonthOrderCount++;
            }
            if (orderDate >= lastMonthStart && orderDate <= lastMonthEnd) {
                lastMonthRevenue += order.total || 0;
                lastMonthOrderCount++;
            }
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

        // 6. Calculate growth percentages
        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const growth = {
            users: calculateGrowth(thisMonthUsers, lastMonthUsers),
            sellers: calculateGrowth(thisMonthSellers, lastMonthSellers),
            revenue: calculateGrowth(thisMonthRevenue, lastMonthRevenue),
            orders: calculateGrowth(thisMonthOrderCount, lastMonthOrderCount),
        };

        // 7. Alerts - Action required items
        const [failedOrders, pendingOrders, todayNewUsers] = await Promise.all([
            prisma.orders.count({ where: { status: 'Failed' } }),
            prisma.orders.count({ where: { status: 'Pending' } }),
            prisma.users.count({
                where: {
                    createdAt: {
                        gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    }
                }
            })
        ]);

        const alerts: Array<{ type: string; icon: string; text: string; count: number; link?: string }> = [];
        
        if (failedOrders > 0) {
            alerts.push({
                type: 'error',
                icon: 'alert-circle',
                text: `${failedOrders} đơn hàng Failed cần review`,
                count: failedOrders,
                link: '/dashboard/orders?status=Failed'
            });
        }
        
        if (pendingOrders > 0) {
            alerts.push({
                type: 'warning',
                icon: 'clock',
                text: `${pendingOrders} đơn hàng Pending chờ xử lý`,
                count: pendingOrders,
                link: '/dashboard/orders?status=Pending'
            });
        }
        
        if (todayNewUsers > 0) {
            alerts.push({
                type: 'success',
                icon: 'user-plus',
                text: `${todayNewUsers} users mới đăng ký hôm nay`,
                count: todayNewUsers,
                link: '/dashboard/users'
            });
        }

        // 8. Top Performers - Shop rankings
        const shopsWithOrders = await prisma.shops.findMany({
            select: {
                id: true,
                name: true,
                orders: {
                    where: {
                        createdAt: { gte: lastMonthStart }
                    },
                    select: {
                        total: true,
                        createdAt: true
                    }
                },
                images: {
                    where: { type: 'avatar' },
                    take: 1,
                    select: { file_url: true }
                }
            }
        });

        // Calculate shop metrics
        const shopMetrics = shopsWithOrders.map(shop => {
            const thisMonthOrders = shop.orders.filter(o => new Date(o.createdAt) >= thisMonthStart);
            const lastMonthOrders = shop.orders.filter(o => {
                const d = new Date(o.createdAt);
                return d >= lastMonthStart && d < thisMonthStart;
            });
            
            const thisMonthRev = thisMonthOrders.reduce((sum, o) => sum + o.total, 0);
            const lastMonthRev = lastMonthOrders.reduce((sum, o) => sum + o.total, 0);
            const growthPct = lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : (thisMonthRev > 0 ? 100 : 0);
            
            return {
                id: shop.id,
                name: shop.name,
                avatar: shop.images[0]?.file_url || null,
                revenue: thisMonthRev,
                orderCount: thisMonthOrders.length,
                growth: growthPct
            };
        }).filter(s => s.revenue > 0 || s.orderCount > 0);

        // Sort for different rankings
        const topByRevenue = [...shopMetrics].sort((a, b) => b.revenue - a.revenue)[0];
        const topByGrowth = [...shopMetrics].sort((a, b) => b.growth - a.growth)[0];
        const topByOrders = [...shopMetrics].sort((a, b) => b.orderCount - a.orderCount)[0];

        const topPerformers = {
            topRevenue: topByRevenue ? {
                shopName: topByRevenue.name,
                shopId: topByRevenue.id,
                avatar: topByRevenue.avatar,
                revenue: topByRevenue.revenue
            } : null,
            fastestGrowth: topByGrowth ? {
                shopName: topByGrowth.name,
                shopId: topByGrowth.id,
                avatar: topByGrowth.avatar,
                growth: topByGrowth.growth
            } : null,
            mostOrders: topByOrders ? {
                shopName: topByOrders.name,
                shopId: topByOrders.id,
                avatar: topByOrders.avatar,
                orders: topByOrders.orderCount
            } : null
        };

        // 9. Geographical data for map
        const geoData: Record<string, { users: number; sellers: number }> = {};
        
        usersByCountryArray.forEach(({ country, count }) => {
            const code = getCountryCode(country);
            if (!geoData[code]) geoData[code] = { users: 0, sellers: 0 };
            geoData[code].users += count;
        });

        sellersByCountryArray.forEach(({ country, count }) => {
            const code = getCountryCode(country);
            if (!geoData[code]) geoData[code] = { users: 0, sellers: 0 };
            geoData[code].sellers += count;
        });

        const geographicalData = Object.entries(geoData).map(([id, data]) => ({
            id,
            name: codeToNameMap[id] || id,
            users: data.users,
            sellers: data.sellers,
        }));

        // Return data object for caching
        return {
            summary: {
                totalUsers,
                totalSellers,
                totalProducts,
                totalOrders,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
            },
            growth,
            alerts,
            topPerformers,
            sellersByCountry: sellersByCountryArray,
            usersByCountry: usersByCountryArray,
            deviceStats: deviceStatsArray,
            revenueData,
            geographicalData,
        };
            }, // end of fetcher function
            60 // 60 seconds TTL for dashboard stats
        );

        // Set cache headers
        res.setHeader('X-Cache', fromCache ? 'HIT' : 'MISS');
        res.setHeader('X-Response-Time', `${responseTime}ms`);

        res.status(200).json({
            success: true,
            data: dashboardData,
        });
    } catch (error) {
        next(error);
    }
};