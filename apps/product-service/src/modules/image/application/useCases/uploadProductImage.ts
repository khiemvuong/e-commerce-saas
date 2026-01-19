/**
 * Upload Product Image Use Case
 */

import { client } from '@packages/libs/imagekit';
import { toFile } from '@imagekit/nodejs';

/**
 * Input for uploading a product image
 */
export interface UploadProductImageInput {
    fileName: string; // base64 data URL
}

/**
 * Upload a product image to ImageKit
 */
export const uploadProductImage = async (input: UploadProductImageInput) => {
    const { fileName } = input;

    if (!fileName || typeof fileName !== 'string') {
        throw new Error('fileName (base64 data URL) is required');
    }

    // Parse base64 data URL
    // data:image/png;base64,AAAA...
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(fileName);
    if (!match) {
        throw new Error('Invalid base64 image data URL');
    }

    const mime = match[1]; // e.g. image/png
    const base64 = match[2];
    const buffer = Buffer.from(base64, 'base64');

    // Create "file" for SDK from Buffer
    const ext = mime.split('/')[1] || 'jpg';
    const uniqueName = `product-${Date.now()}.${ext}`;
    const fileForUpload = await toFile(buffer, uniqueName);

    // Upload
    const resp = await client.files.upload({
        file: fileForUpload,
        fileName: uniqueName,
    });

    return {
        file_url: (resp as any).url ?? (resp as any).filePath ?? null,
        fileId: (resp as any).fileId,
        thumbnailUrl: (resp as any).thumbnailUrl ?? null,
    };
};
