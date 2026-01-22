/**
 * Get User Addresses Query
 */

import prisma from '@packages/libs/prisma';

export interface GetUserAddressesInput {
    userId: string;
}

export type GetUserAddresses = (input: GetUserAddressesInput) => Promise<{ success: true; addresses: any[] }>;

export const makeGetUserAddresses = (): GetUserAddresses => {
    return async (input) => {
        const addresses = await prisma.address.findMany({
            where: { userId: input.userId },
            orderBy: { createdAt: 'desc' },
        });

        return { success: true, addresses };
    };
};
