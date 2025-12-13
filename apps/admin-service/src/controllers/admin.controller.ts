import prisma from "@packages/libs/prisma";
import { Request, Response, NextFunction } from "express";
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
                { title: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
                { Shop: { name: { contains: search, mode: 'insensitive' } } },
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
