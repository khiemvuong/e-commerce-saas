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
        const { categories, subCategories, images } = req.body;

        const config = await prisma.site_config.findFirst();

        if (!config) {
            // Should ideally be initialized, but handle just in case
            await prisma.site_config.create({
                data: {
                    categories: categories || [],
                    subCategories: subCategories || {},
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