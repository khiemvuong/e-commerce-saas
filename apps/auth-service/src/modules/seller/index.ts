/**
 * Seller Module Index
 */

export { Seller } from './domain/Seller';
export type { SellerRepository } from './domain/SellerRepository';

export {
    makeRegisterSeller,
    makeVerifySeller,
    makeLoginSeller,
    makeLogoutSeller,
    makeCreateStripeLink,
} from './application/useCases';

export { makeGetSeller } from './application/queries';

export { makePrismaSellerRepository, getSellerRepository } from './infrastructure/PrismaSellerRepository';

export { sellerController } from './interface/http/sellerController';
export { sellerRoutes } from './interface/http/sellerRoutes';
