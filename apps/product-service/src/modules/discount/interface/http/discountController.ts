/**
 * Discount Controller
 * 
 * HTTP layer for discount code operations.
 */

import { Response, NextFunction } from 'express';
import { AuthError } from '@packages/error-handler';

// Use Cases
import { createDiscountCode, deleteDiscountCode } from '../../application/useCases';

// Queries
import { getDiscountCodes } from '../../application/queries';

/**
 * Discount Controller
 */
export const discountController = {
    /**
     * Create a new discount code
     * POST /api/create-discount-code
     */
    async create(req: any, res: Response, next: NextFunction) {
        try {
            if (!req.seller?.id) {
                return next(new AuthError('Please login as seller'));
            }

            const discountCode = await createDiscountCode({
                public_name: req.body.public_name,
                discountType: req.body.discountType,
                discountValue: req.body.discountValue,
                discountCode: req.body.discountCode,
                sellerId: req.seller.id,
            });

            return res.status(201).json({ success: true, discount_code: discountCode });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Get all discount codes for the seller
     * GET /api/get-discount-codes
     */
    async getAll(req: any, res: Response, next: NextFunction) {
        try {
            if (!req.seller?.id) {
                return next(new AuthError('Please login as seller'));
            }

            const discountCodes = await getDiscountCodes({
                sellerId: req.seller.id,
            });

            return res.status(200).json({ success: true, discount_codes: discountCodes });
        } catch (error) {
            return next(error);
        }
    },

    /**
     * Delete a discount code
     * DELETE /api/delete-discount-code/:id
     */
    async delete(req: any, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (!req.seller?.id) {
                return next(new AuthError('Please login as seller'));
            }

            const result = await deleteDiscountCode({
                id,
                sellerId: req.seller.id,
            });

            return res.status(200).json(result);
        } catch (error) {
            return next(error);
        }
    },
};
