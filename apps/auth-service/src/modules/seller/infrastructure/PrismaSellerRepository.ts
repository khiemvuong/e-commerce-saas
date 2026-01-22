/**
 * Prisma Seller Repository
 */

import prisma from '@packages/libs/prisma';
import { SellerRepository } from '../domain/SellerRepository';

export const makePrismaSellerRepository = (): SellerRepository => {
    return {
        async findById(id: string) {
            return prisma.sellers.findUnique({ where: { id } });
        },

        async findByEmail(email: string) {
            return prisma.sellers.findUnique({ where: { email } });
        },

        async findByIdWithShop(id: string) {
            return prisma.sellers.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    password: true,
                    phone_number: true,
                    country: true,
                    stripeId: true,
                    createdAt: true,
                    updatedAt: true,
                    shop: {
                        select: { id: true, name: true },
                    },
                },
            }) as any;
        },

        async create(data) {
            return prisma.sellers.create({ data });
        },

        async updateStripeId(id: string, stripeId: string) {
            return prisma.sellers.update({
                where: { id },
                data: { stripeId },
            });
        },
    };
};

let sellerRepository: SellerRepository | null = null;

export const getSellerRepository = (): SellerRepository => {
    if (!sellerRepository) {
        sellerRepository = makePrismaSellerRepository();
    }
    return sellerRepository;
};
