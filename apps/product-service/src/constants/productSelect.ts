/**
 * Product Select Constants
 * Centralized field selection for consistent API responses
 */

/**
 * Minimal fields for product list/table view (seller dashboard)
 * Used by: get-my-products API
 */
export const PRODUCT_LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  sale_price: true,
  regular_price: true,
  stock: true,
  status: true,
  rating: true,
  totalSales: true,
  cash_on_delivery: true,
  isDeleted: true,
  createdAt: true,
  // For variant display in list
  colors: true,
  sizes: true,
  custom_properties: true,
  // One image for list thumbnail
  images: { take: 1, select: { file_url: true } },
  // Event indicator
  starting_date: true,
  ending_date: true,
} as const;

/**
 * Full fields for edit modal (seller dashboard)
 * All schema fields required for form pre-fill
 * Used by: get-my-products?full=true or when passing to edit modal
 */
export const PRODUCT_FULL_SELECT = {
  id: true,
  title: true,
  slug: true,
  sale_price: true,
  regular_price: true,
  stock: true,
  status: true,
  rating: true,
  totalSales: true,
  cash_on_delivery: true,
  isDeleted: true,
  createdAt: true,
  // Full details for edit
  category: true,
  sub_category: true,
  short_description: true,
  detailed_description: true,
  warranty: true,
  brand: true,
  video_url: true,
  tags: true,
  custom_specifications: true,
  custom_properties: true,
  // discount_codes is String[] - direct select
  discount_codes: true,
  // Event dates
  starting_date: true,
  ending_date: true,
  // Variant options
  colors: true,
  sizes: true,
  // All images with fileId for edit
  images: { select: { file_url: true, fileId: true } },
} as const;

/**
 * Product card fields for user-facing lists
 * Optimized payload for product cards
 * Used by: get-all-products, get-shop-products/:id
 */
export const PRODUCT_CARD_SELECT = {
  id: true,
  title: true,
  slug: true,
  sale_price: true,
  regular_price: true,
  rating: true,
  stock: true,
  totalSales: true,
  cash_on_delivery: true,
  shopId: true,
  // Variant display
  colors: true,
  sizes: true,
  custom_properties: true,
  // 2 images for hover effect
  images: { take: 2, select: { file_url: true } },
  // Shop info for card
  Shop: { select: { id: true, name: true } },
} as const;

/**
 * Event card fields for user-facing lists
 * Same as product card + event dates
 */
export const EVENT_CARD_SELECT = {
  ...PRODUCT_CARD_SELECT,
  starting_date: true,
  ending_date: true,
  Shop: { select: { id: true, name: true, rating: true } },
} as const;

/**
 * Product detail page fields
 * Full fields for product detail page
 */
export const PRODUCT_DETAIL_SELECT = {
  id: true,
  title: true,
  slug: true,
  category: true,
  sub_category: true,
  short_description: true,
  detailed_description: true,
  video_url: true,
  tags: true,
  brand: true,
  colors: true,
  sizes: true,
  stock: true,
  sale_price: true,
  regular_price: true,
  rating: true,
  warranty: true,
  custom_specifications: true,
  custom_properties: true,
  cash_on_delivery: true,
  discount_codes: true,
  shopId: true,
  images: { select: { id: true, file_url: true, fileId: true } },
  Shop: { select: { id: true, name: true, rating: true, address: true } },
} as const;
