/**
 * Product Price Utilities for Seller UI
 * Handles both old and new price field names for backward compatibility
 */

export interface ProductPriceFields {
    sale_price?: number | null;
    price?: number | null;
    regular_price?: number | null;
    compareAtPrice?: number | null;
}

export interface ProductPrice {
    salePrice: number;
    regularPrice: number;
    displayPrice: number;
    hasDiscount: boolean;
    discountPercent: number;
}

/**
 * Get product prices with support for both old and new field names
 * @param product - Product with price fields
 * @returns Normalized price object
 */
export function getProductPrices(product: ProductPriceFields | null | undefined): ProductPrice {
    if (!product) {
        return {
            salePrice: 0,
            regularPrice: 0,
            displayPrice: 0,
            hasDiscount: false,
            discountPercent: 0,
        };
    }

    // Support both old and new field names
    const salePrice = product.sale_price ?? product.price ?? 0;
    const regularPrice = product.regular_price ?? product.compareAtPrice ?? salePrice;
    const displayPrice = salePrice || regularPrice;
    const hasDiscount = salePrice > 0 && regularPrice > salePrice;
    const discountPercent = hasDiscount
        ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
        : 0;

    return {
        salePrice,
        regularPrice,
        displayPrice,
        hasDiscount,
        discountPercent,
    };
}

/**
 * Format price to 2 decimal places
 * @param price - Price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
    return price.toFixed(2);
}

/**
 * Format price with locale
 * @param price - Price to format
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted price string with locale
 */
export function formatPriceLocale(price: number, locale: string = 'en-US'): string {
    return price.toLocaleString(locale);
}

/**
 * Get display price string with discount
 * @param product - Product with price fields
 * @returns Formatted price string
 * @example "$49.99" or "$49.99 $99.99" (with strikethrough on second)
 */
export function getDisplayPriceString(product: ProductPriceFields | null | undefined): {
    current: string;
    original: string | null;
    hasDiscount: boolean;
} {
    const prices = getProductPrices(product);
    
    return {
        current: formatPrice(prices.displayPrice),
        original: prices.hasDiscount ? formatPrice(prices.regularPrice) : null,
        hasDiscount: prices.hasDiscount,
    };
}
