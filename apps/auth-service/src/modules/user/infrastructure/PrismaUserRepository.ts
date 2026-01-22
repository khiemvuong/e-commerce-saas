/**
 * Prisma User Repository
 * 
 * Implementation of UserRepository using Prisma ORM.
 */

import prisma from '@packages/libs/prisma';
import { UserRepository } from '../domain/UserRepository';
import { User } from '../domain/User';

/**
 * Create Prisma User Repository instance
 */
export const makePrismaUserRepository = (): UserRepository => {
    return {
        async findById(id: string) {
            return prisma.users.findUnique({
                where: { id },
            });
        },

        async findByEmail(email: string) {
            return prisma.users.findUnique({
                where: { email },
            });
        },

        async findByIdWithAvatar(id: string) {
            return prisma.users.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    password: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true,
                    avatar: {
                        take: 1,
                        select: { file_url: true },
                    },
                },
            }) as any;
        },

        async create(data) {
            return prisma.users.create({
                data: {
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: data.role,
                },
            });
        },

        async update(id: string, data) {
            return prisma.users.update({
                where: { id },
                data,
            });
        },

        async updateProfile(id: string, data) {
            if (data.avatar) {
                return prisma.users.update({
                    where: { id },
                    data: {
                        name: data.name,
                        avatar: {
                            create: {
                                file_url: data.avatar.file_url,
                                fileId: data.avatar.fileId,
                                type: 'avatar',
                            },
                        },
                    },
                });
            }
            
            return prisma.users.update({
                where: { id },
                data: { name: data.name },
            });
        },

        async deleteAvatars(userId: string) {
            await prisma.images.deleteMany({
                where: { userId, type: 'avatar' },
            });
        },
    };
};

// Singleton instance
let userRepository: UserRepository | null = null;

export const getUserRepository = (): UserRepository => {
    if (!userRepository) {
        userRepository = makePrismaUserRepository();
    }
    return userRepository;
};
