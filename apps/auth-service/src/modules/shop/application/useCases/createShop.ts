/**
 * Create Shop Use Case
 */

import prisma from '@packages/libs/prisma';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

export interface CreateShopInput {
    name: string;
    bio: string;
    address: string;
    opening_hours: string;
    website?: string;
    category: string;
    sellerId: string;
}

export type CreateShop = (input: CreateShopInput) => Promise<{
    success: true;
    message: string;
    shop: any;
}>;

export const makeCreateShop = (): CreateShop => {
    return async (input) => {
        const { name, bio, address, opening_hours, website, category, sellerId } = input;

        if (!name || !bio || !address || !opening_hours || !category || !sellerId) {
            throw new ValidationError('All fields are required');
        }

        const shopData: any = {
            name,
            bio,
            address,
            opening_hours,
            category,
            sellerId,
        };

        if (website && website.trim() !== '') {
            shopData.website = website;
        }

        const shop = await prisma.shops.create({ data: shopData });

        await sendLog({
            type: 'success',
            message: `Shop created: ${name} (ID: ${shop.id}) by seller ${sellerId}`,
            source: 'auth-service',
        });

        return {
            success: true,
            message: 'Shop created successfully!',
            shop,
        };
    };
};
