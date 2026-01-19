/**
 * Delete Product Image Use Case
 */

import { client } from '@packages/libs/imagekit';

/**
 * Input for deleting a product image
 */
export interface DeleteProductImageInput {
    fileId: string;
}

/**
 * Delete a product image from ImageKit
 */
export const deleteProductImage = async (input: DeleteProductImageInput) => {
    const { fileId } = input;

    if (!fileId) {
        throw new Error('fileId is required');
    }

    await client.files.delete(fileId);

    return { success: true, message: 'Image deleted successfully' };
};
