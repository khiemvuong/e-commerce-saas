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
                products: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: "desc" },
                    include: {
                        images: { take: 1 }
                    }
                }
            }
        });

        res.status(200).json({
            success: true,
            shop
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
