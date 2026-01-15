import { useState, useCallback } from 'react';
import {
  compressImage,
  compressImages,
  CompressionOptions,
  CompressionResult,
  compressionPresets,
  formatFileSize,
} from '../services/imageCompressionService';
import toast from 'react-hot-toast';

export interface UseImageCompressionOptions {
  /** Compression preset to use */
  preset?: keyof typeof compressionPresets;
  /** Custom compression options (overrides preset) */
  customOptions?: CompressionOptions;
  /** Show toast notifications for compression results */
  showToasts?: boolean;
}

export interface UseImageCompressionReturn {
  /** Compress a single image */
  compress: (file: File) => Promise<CompressionResult | null>;
  /** Compress multiple images */
  compressMultiple: (files: File[]) => Promise<CompressionResult[]>;
  /** Whether compression is in progress */
  isCompressing: boolean;
  /** Last compression result */
  lastResult: CompressionResult | null;
  /** All compression results from last batch operation */
  results: CompressionResult[];
  /** Total bytes saved from all compressions */
  totalBytesSaved: number;
  /** Format bytes to readable string */
  formatSize: typeof formatFileSize;
  /** Clear results */
  clearResults: () => void;
}

export const useImageCompression = (
  options: UseImageCompressionOptions = {}
): UseImageCompressionReturn => {
  const {
    preset = 'balanced',
    customOptions,
    showToasts = true,
  } = options;

  const [isCompressing, setIsCompressing] = useState(false);
  const [lastResult, setLastResult] = useState<CompressionResult | null>(null);
  const [results, setResults] = useState<CompressionResult[]>([]);
  const [totalBytesSaved, setTotalBytesSaved] = useState(0);

  // Get compression options from preset or custom
  const getCompressionOptions = useCallback((): CompressionOptions => {
    if (customOptions) {
      return customOptions;
    }
    return compressionPresets[preset];
  }, [preset, customOptions]);

  // Compress a single image
  const compress = useCallback(
    async (file: File): Promise<CompressionResult | null> => {
      if (!file.type.startsWith('image/')) {
        if (showToasts) {
          toast.error('File không phải là ảnh');
        }
        return null;
      }

      setIsCompressing(true);
      const toastId = showToasts ? toast.loading('Đang nén ảnh...') : undefined;

      try {
        const result = await compressImage(file, getCompressionOptions());
        
        setLastResult(result);
        setResults((prev) => [...prev, result]);
        
        if (result.wasCompressed) {
          const saved = result.originalSize - result.compressedSize;
          setTotalBytesSaved((prev) => prev + saved);

          if (showToasts) {
            const percentSaved = Math.round((1 - result.compressionRatio) * 100);
            toast.success(
              `Đã nén: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (-${percentSaved}%)`,
              { id: toastId }
            );
          }
        } else {
          if (showToasts) {
            toast.success('Ảnh đã tối ưu, không cần nén thêm', { id: toastId });
          }
        }

        return result;
      } catch (error) {
        console.error('Image compression failed:', error);
        if (showToasts) {
          toast.error('Nén ảnh thất bại', { id: toastId });
        }
        return null;
      } finally {
        setIsCompressing(false);
      }
    },
    [getCompressionOptions, showToasts]
  );

  // Compress multiple images
  const compressMultiple = useCallback(
    async (files: File[]): Promise<CompressionResult[]> => {
      const imageFiles = files.filter((f) => f.type.startsWith('image/'));
      
      if (imageFiles.length === 0) {
        if (showToasts) {
          toast.error('Không tìm thấy file ảnh hợp lệ');
        }
        return [];
      }

      setIsCompressing(true);
      const toastId = showToasts
        ? toast.loading(`Đang nén ${imageFiles.length} ảnh...`)
        : undefined;

      try {
        const batchResults = await compressImages(imageFiles, getCompressionOptions());
        
        setResults((prev) => [...prev, ...batchResults]);
        
        const totalSaved = batchResults.reduce((acc, r) => {
          if (r.wasCompressed) {
            return acc + (r.originalSize - r.compressedSize);
          }
          return acc;
        }, 0);
        
        setTotalBytesSaved((prev) => prev + totalSaved);

        if (batchResults.length > 0) {
          setLastResult(batchResults[batchResults.length - 1]);
        }

        if (showToasts) {
          const compressedCount = batchResults.filter((r) => r.wasCompressed).length;
          toast.success(
            `Đã nén ${compressedCount}/${imageFiles.length} ảnh, tiết kiệm ${formatFileSize(totalSaved)}`,
            { id: toastId }
          );
        }

        return batchResults;
      } catch (error) {
        console.error('Batch compression failed:', error);
        if (showToasts) {
          toast.error('Nén ảnh thất bại', { id: toastId });
        }
        return [];
      } finally {
        setIsCompressing(false);
      }
    },
    [getCompressionOptions, showToasts]
  );

  // Clear all results
  const clearResults = useCallback(() => {
    setResults([]);
    setLastResult(null);
    setTotalBytesSaved(0);
  }, []);

  return {
    compress,
    compressMultiple,
    isCompressing,
    lastResult,
    results,
    totalBytesSaved,
    formatSize: formatFileSize,
    clearResults,
  };
};

export default useImageCompression;
