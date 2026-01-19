/**
 * Image Processing Utilities
 * 
 * Handles image resizing and optimization before upload
 */

export interface ImageDimensions {
    width: number;
    height: number;
}

/**
 * Standard product image dimensions
 * Using 4:5 aspect ratio (800x1000) - e-commerce standard
 */
export const PRODUCT_IMAGE_DIMENSIONS: ImageDimensions = {
    width: 800,
    height: 1000,
};

/**
 * Resize and crop image to standard dimensions
 * Uses canvas to crop from center and resize
 */
export const resizeProductImage = async (
    file: File,
    targetDimensions: ImageDimensions = PRODUCT_IMAGE_DIMENSIONS
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                // Create canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Set canvas to target dimensions
                canvas.width = targetDimensions.width;
                canvas.height = targetDimensions.height;

                // Calculate crop dimensions to maintain aspect ratio
                const targetRatio = targetDimensions.width / targetDimensions.height;
                const imgRatio = img.width / img.height;

                let sourceX = 0;
                let sourceY = 0;
                let sourceWidth = img.width;
                let sourceHeight = img.height;

                if (imgRatio > targetRatio) {
                    // Image is wider than target - crop width
                    sourceWidth = img.height * targetRatio;
                    sourceX = (img.width - sourceWidth) / 2;
                } else {
                    // Image is taller than target - crop height
                    sourceHeight = img.width / targetRatio;
                    sourceY = (img.height - sourceHeight) / 2;
                }

                // Draw cropped and resized image
                ctx.drawImage(
                    img,
                    sourceX,
                    sourceY,
                    sourceWidth,
                    sourceHeight,
                    0,
                    0,
                    targetDimensions.width,
                    targetDimensions.height
                );

                // Convert to base64 with quality optimization
                const base64 = canvas.toDataURL('image/jpeg', 0.9);
                resolve(base64);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
};

/**
 * Batch resize multiple product images
 */
export const resizeProductImages = async (
    files: File[],
    targetDimensions: ImageDimensions = PRODUCT_IMAGE_DIMENSIONS
): Promise<string[]> => {
    const resizePromises = files.map(file => resizeProductImage(file, targetDimensions));
    return Promise.all(resizePromises);
};

/**
 * Get image dimensions from base64 string
 */
export const getImageDimensions = (base64: string): Promise<ImageDimensions> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        img.src = base64;
    });
};

/**
 * Validate image file
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'File must be an image' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        return { valid: false, error: 'Image size must be less than 10MB' };
    }

    return { valid: true };
};
