/**
 * Upload Avatar Use Case
 * 
 * Handles avatar image upload to ImageKit.
 */

import { client } from '@packages/libs/imagekit';
import { toFile } from '@imagekit/nodejs';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';

export interface UploadAvatarInput {
    fileName: string; // Base64 encoded image
}

export interface UploadAvatarResult {
    success: true;
    file_url: string;
    fileId: string;
}

export type UploadAvatar = (input: UploadAvatarInput) => Promise<UploadAvatarResult>;

export const makeUploadAvatar = (): UploadAvatar => {
    return async (input: UploadAvatarInput) => {
        // 1. Validate input
        if (!input.fileName || typeof input.fileName !== 'string') {
            throw new ValidationError('fileName (base64) is required');
        }

        // 2. Parse base64 image
        const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(input.fileName);
        if (!match) {
            throw new ValidationError('Invalid base64 image');
        }

        const mime = match[1];
        const base64 = match[2];
        const buffer = Buffer.from(base64, 'base64');
        const ext = mime.split('/')[1] || 'jpg';
        const uniqueName = `avatar-${Date.now()}.${ext}`;

        // 3. Convert to file for upload
        const fileForUpload = await toFile(buffer, uniqueName);

        // 4. Upload to ImageKit
        const resp = await client.files.upload({
            file: fileForUpload,
            fileName: uniqueName,
            folder: '/avatars',
        });

        return {
            success: true,
            file_url: (resp as any).url,
            fileId: (resp as any).fileId,
        };
    };
};
