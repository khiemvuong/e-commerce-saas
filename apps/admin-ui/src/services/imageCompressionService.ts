/**
 * Image Compression Service
 * Uses browser-image-compression library for client-side image optimization
 * Reduces file size before upload to save bandwidth and storage
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  /** Max width or height in pixels */
  maxWidthOrHeight?: number;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Use web worker for compression (recommended) */
  useWebWorker?: boolean;
  /** Initial quality (0-1) */
  initialQuality?: number;
  /** File type to convert to */
  fileType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface CompressionResult {
  /** Original file */
  originalFile: File;
  /** Compressed file */
  compressedFile: File;
  /** Original file size in bytes */
  originalSize: number;
  /** Compressed file size in bytes */
  compressedSize: number;
  /** Compression ratio (compressed/original) */
  compressionRatio: number;
  /** Whether compression was applied */
  wasCompressed: boolean;
}

/**
 * Compression presets for different use cases
 */
export const compressionPresets: Record<string, CompressionOptions> = {
  /** High quality - minimal compression, for hero/banner images */
  high: {
    maxWidthOrHeight: 1920,
    maxSizeMB: 2,
    initialQuality: 0.9,
    useWebWorker: true,
  },
  /** Balanced - good quality with size reduction, recommended for products */
  balanced: {
    maxWidthOrHeight: 1200,
    maxSizeMB: 1,
    initialQuality: 0.8,
    useWebWorker: true,
  },
  /** Aggressive - maximum compression, for thumbnails */
  aggressive: {
    maxWidthOrHeight: 800,
    maxSizeMB: 0.5,
    initialQuality: 0.7,
    useWebWorker: true,
  },
  /** Thumbnail - very small, for previews */
  thumbnail: {
    maxWidthOrHeight: 400,
    maxSizeMB: 0.2,
    initialQuality: 0.6,
    useWebWorker: true,
  },
};

/**
 * Format file size to human readable string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Compress a single image file
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = compressionPresets.balanced
): Promise<CompressionResult> => {
  const originalSize = file.size;

  // Skip if already small enough
  const maxBytes = (options.maxSizeMB || 1) * 1024 * 1024;
  if (originalSize <= maxBytes * 0.9) {
    return {
      originalFile: file,
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false,
    };
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxWidthOrHeight: options.maxWidthOrHeight || 1200,
      maxSizeMB: options.maxSizeMB || 1,
      initialQuality: options.initialQuality || 0.8,
      useWebWorker: options.useWebWorker ?? true,
      fileType: options.fileType,
    });

    const compressedSize = compressedFile.size;

    return {
      originalFile: file,
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio: compressedSize / originalSize,
      wasCompressed: compressedSize < originalSize,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return {
      originalFile: file,
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      wasCompressed: false,
    };
  }
};

/**
 * Compress multiple images in parallel
 */
export const compressImages = async (
  files: File[],
  options: CompressionOptions = compressionPresets.balanced
): Promise<CompressionResult[]> => {
  return Promise.all(files.map((file) => compressImage(file, options)));
};

export default {
  compressImage,
  compressImages,
  compressionPresets,
  formatFileSize,
};
