/**
 * Seller Repository Interface
 */

import { Seller } from './Seller';

export interface SellerRepository {
    findById(id: string): Promise<Seller.Type | null>;
    findByEmail(email: string): Promise<Seller.Type | null>;
    findByIdWithShop(id: string): Promise<Seller.WithShop | null>;
    create(data: {
        name: string;
        email: string;
        password: string;
        phone_number: string;
        country: string;
    }): Promise<Seller.Type>;
    updateStripeId(id: string, stripeId: string): Promise<Seller.Type>;
}
