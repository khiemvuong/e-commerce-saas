/**
 * Add Address Use Case
 */

import prisma from '@packages/libs/prisma';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';

export interface AddAddressInput {
    userId: string;
    label: string;
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    isDefault?: boolean;
}

export type AddAddress = (input: AddAddressInput) => Promise<{ success: true; address: any }>;

export const makeAddAddress = (): AddAddress => {
    return async (input) => {
        const { userId, label, name, street, city, zip, country, isDefault } = input;

        if (!label || !name || !street || !city || !zip || !country) {
            throw new ValidationError('All fields are required');
        }

        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        const address = await prisma.address.create({
            data: {
                userId,
                label: label as any, // Type matches Prisma addressType enum
                name,
                street,
                city,
                zip,
                country,
                isDefault: !!isDefault,
            },
        });

        return { success: true, address };
    };
};
