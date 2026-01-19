/**
 * Delete Discount Code Use Case
 */

import prisma from '@packages/libs/prisma';
import { 
    ProductNotFoundError, 
    ProductAuthorizationError 
} from '../../../../_lib/errors/ProductErrors';

/**
 * Input for deleting a discount code
 */
export interface DeleteDiscountCodeInput {
    id: string;
    sellerId: string;
}

/**
 * Delete a discount code
 */
export const deleteDiscountCode = async (input: DeleteDiscountCodeInput) => {
    const { id, sellerId } = input;

    // 1. Find the discount code
    const discountCode = await prisma.discount_codes.findUnique({
        where: { id },
        select: { id: true, sellerId: true }
    });

    if (!discountCode) {
        throw new ProductNotFoundError(id);
    }

    // 2. Check authorization
    if (discountCode.sellerId !== sellerId) {
        throw new ProductAuthorizationError('You are not authorized to delete this discount code');
    }

    // 3. Delete the discount code
    await prisma.discount_codes.delete({
        where: { id }
    });

    return { success: true, message: 'Discount code deleted successfully' };
};
