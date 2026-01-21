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
        // Fetch site config for country mapping
        const siteConfig = await prisma.site_config.findFirst({
            select: { countries: true }
        });
        
        // Create a map of Name -> Code and Code -> Name for flexibility
        // If countries is not set, we fall back to a basic map or empty
        const countryList = (siteConfig?.countries as any[]) || [];
        const nameToCodeMap: Record<string, string> = {};
        const codeToNameMap: Record<string, string> = {};

        countryList.forEach((c: {name: string, code: string}) => {
            nameToCodeMap[c.name] = c.code;
            nameToCodeMap[c.name.toLowerCase()] = c.code; // Case insensitive lookup
            codeToNameMap[c.code] = c.name;
        });

        // Helper to get Code from Name (or handle if input is already a code)
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
            
            // Check if it matches a 2-letter code directly
            if (isoAlpha2ToNumeric[upperInput]) return isoAlpha2ToNumeric[upperInput];

            // Check if it matches a name from our DB config
            if (nameToCodeMap[cleanInput]) return nameToCodeMap[cleanInput];
            if (nameToCodeMap[cleanInput.toLowerCase()]) return nameToCodeMap[cleanInput.toLowerCase()];
            
            // Check if it is already a valid numeric code
            if (codeToNameMap[cleanInput]) return cleanInput;
            
            // Manual fallbacks for common mismatched names
            if (upperInput === 'USA') return '840';
            if (upperInput === 'VIETNAM') return '704';
            
            return cleanInput; // Return as is if no match found
        };

        // 1. Sellers by Country
        const sellersRaw = await prisma.sellers.findMany({
            select: { country: true },
        });
        const sellersByCountry: Record<string, number> = {};
        sellersRaw.forEach((s) => {
            const countryName = s.country || "Unknown";
            // We count by Name for the list, but use Code for the map later
            sellersByCountry[countryName] = (sellersByCountry[countryName] || 0) + 1;
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
            const countryName = ua.country || "Unknown";
            usersByCountry[countryName] = (usersByCountry[countryName] || 0) + 1;

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
            name: codeToNameMap[id] || id, // Try to provide clean name from config if available
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