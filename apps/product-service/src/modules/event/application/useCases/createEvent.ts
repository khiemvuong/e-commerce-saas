/**
 * Create Event Use Case
 * 
 * Converts an existing product to an event by adding start/end dates.
 */

import prisma from '@packages/libs/prisma';
import { Event } from '../../domain/Event';
import { 
    ProductNotFoundError, 
    ProductAuthorizationError, 
    ProductValidationError 
} from '../../../../_lib/errors/ProductErrors';

/**
 * Input for creating an event
 */
export interface CreateEventInput {
    productId: string;
    shopId: string;
    starting_date: string | Date;
    ending_date: string | Date;
    sale_price: number | string;
}

/**
 * Create event from a product
 */
export const createEvent = async (input: CreateEventInput) => {
    const { productId, shopId, starting_date, ending_date, sale_price } = input;

    // 1. Validate input
    if (!productId || !starting_date || !ending_date || !sale_price) {
        throw new ProductValidationError('Please provide all required fields');
    }

    // 2. Find the product
    const product = await prisma.products.findUnique({
        where: { id: productId },
        select: { id: true, shopId: true, regular_price: true }
    });

    if (!product) {
        throw new ProductNotFoundError(productId);
    }

    // 3. Check authorization
    if (product.shopId !== shopId) {
        throw new ProductAuthorizationError('You are not authorized to create event for this product');
    }

    // 4. Validate event data
    const salePrice = parseFloat(String(sale_price));
    const validation = Event.validate({
        starting_date,
        ending_date,
        sale_price: salePrice,
        regular_price: product.regular_price,
    });

    if (!validation.valid) {
        throw new ProductValidationError(validation.errors.join(', '));
    }

    // 5. Update product to become an event
    const updatedProduct = await prisma.products.update({
        where: { id: productId },
        data: {
            starting_date: new Date(starting_date),
            ending_date: new Date(ending_date),
            sale_price: salePrice,
        },
        include: { images: true }
    });

    return updatedProduct;
};
