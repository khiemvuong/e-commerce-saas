/**
 * Discount Module Index
 */

// Domain
export { DiscountCode } from './domain/DiscountCode';

// Use Cases
export { createDiscountCode, deleteDiscountCode } from './application/useCases';

// Queries
export { getDiscountCodes } from './application/queries';

// Interface
export { discountController } from './interface/http/discountController';
export { discountRoutes } from './interface/http/discountRoutes';
