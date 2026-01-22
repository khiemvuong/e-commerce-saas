/**
 * Delete Address Use Case
 */

import prisma from '@packages/libs/prisma';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';

export interface DeleteAddressInput {
    userId: string;
    addressId: string;
}

export type DeleteAddress = (input: DeleteAddressInput) => Promise<{ success: true; message: string }>;

export const makeDeleteAddress = (): DeleteAddress => {
    return async (input) => {
        const { userId, addressId } = input;

        if (!addressId) {
            throw new ValidationError('Address ID is required');
        }

        const existingAddress = await prisma.address.findFirst({
            where: { id: addressId, userId },
        });

        if (!existingAddress) {
            throw new ValidationError('Address not found');
        }

        await prisma.address.delete({ where: { id: addressId } });

        return { success: true, message: 'Address deleted successfully' };
    };
};
