/**
 * Get Product Details Query
 * 
 * Fetches detailed information about a single product by slug.
 */

import prisma from '@packages/libs/prisma';
import { PRODUCT_DETAIL_SELECT } from '../../../../constants/productSelect';
import { ProductNotFoundError } from '../../../../_lib/errors/ProductErrors';

/**
 * Input for getting product details
 */
export interface GetProductDetailsInput {
    slug: string;
}

/**
 * Get product details by slug
 */
export const getProductDetails = async (input: GetProductDetailsInput) => {
    const { slug } = input;

    const product = await prisma.products.findUnique({
        where: { slug },
        select: PRODUCT_DETAIL_SELECT,
    });

    if (!product) {
        throw new ProductNotFoundError(slug);
    }

    return product;
};
