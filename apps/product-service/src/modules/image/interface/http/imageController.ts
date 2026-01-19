/**
 * Image Controller
 */

import { Request, Response, NextFunction } from 'express';
import { uploadProductImage, deleteProductImage } from '../../application/useCases';

/**
 * Image Controller
 */
export const imageController = {
    /**
     * Upload a product image
     * POST /api/upload-product-image
     */
    async upload(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await uploadProductImage({
                fileName: req.body.fileName,
            });

            return res.status(200).json({ success: true, ...result });
        } catch (error: any) {
            console.error('ImageKit upload error:', error);
            return res.status(500).json({ 
                error: 'Failed to upload image', 
                details: error?.message 
            });
        }
    },

    /**
     * Delete a product image
     * DELETE /api/delete-product-image
     */
    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await deleteProductImage({
                fileId: req.body.fileId,
            });

            return res.status(200).json(result);
        } catch (error: any) {
            console.error('ImageKit delete error:', error);
            return res.status(500).json({ 
                error: 'Failed to delete image', 
                details: error?.message 
            });
        }
    },
};
