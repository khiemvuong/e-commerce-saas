/**
 * ImageKit URL Optimization Utility
 * Transforms ImageKit URLs to include resize, quality, and format optimizations
 */

interface ImageOptimizeOptions {
  width?: number;
  height?: number;
  quality?: number;
  blur?: number;  // For blur placeholder
}

/**
 * Optimizes an ImageKit URL with transformations
 * @example
 * optimizeImageUrl('https://ik.imagekit.io/xxx/image.jpg', { width: 400, quality: 80 })
 * → 'https://ik.imagekit.io/xxx/tr:w-400,q-80,f-auto/image.jpg'
 */
export const optimizeImageUrl = (
  url: string | undefined,
  options: ImageOptimizeOptions = {}
): string => {
  if (!url) return '';
  
  // Only transform ImageKit URLs
  if (!url.includes('ik.imagekit.io')) return url;
  
  const { width, height, quality = 80, blur } = options;
  
  // Build transformation string
  const transforms: string[] = [];
  if (width) transforms.push(`w-${width}`);
  if (height) transforms.push(`h-${height}`);
  transforms.push(`q-${quality}`);
  transforms.push('f-auto'); // Auto format (WebP, AVIF when supported)
  if (blur) transforms.push(`bl-${blur}`);
  
  const transformString = `tr:${transforms.join(',')}`;
  
  // Insert transformation into URL
  // Pattern: https://ik.imagekit.io/{id}/path → https://ik.imagekit.io/{id}/tr:.../path
  const regex = /(https:\/\/ik\.imagekit\.io\/[^\/]+)(\/.*)/;
  const match = url.match(regex);
  
  if (match) {
    return `${match[1]}/${transformString}${match[2]}`;
  }
  
  return url;
};

/**
 * Generates a tiny blurred placeholder URL for loading state
 */
export const getBlurPlaceholder = (url: string | undefined): string => {
  return optimizeImageUrl(url, { width: 10, quality: 20, blur: 50 });
};

/**
 * Preset configurations for common use cases
 */
export const IMAGE_PRESETS = {
  // Product card thumbnail (grid view)
  cardThumbnail: { width: 400, quality: 80 },
  
  // Product detail main image
  detailMain: { width: 800, quality: 85 },
  
  // Product detail thumbnail gallery
  detailThumb: { width: 120, quality: 75 },
  
  // Small avatar/icon
  avatar: { width: 80, quality: 75 },
  
  // Hero/banner images
  hero: { width: 1200, quality: 85 },
} as const;
