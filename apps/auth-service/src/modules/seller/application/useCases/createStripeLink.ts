/**
 * Create Stripe Connect Link Use Case
 */

import { Stripe } from 'stripe';
import { SellerRepository } from '../../domain/SellerRepository';
import { ValidationError } from '../../../../_lib/errors/AuthErrors';
import { sendLog } from '@packages/utils/kafka';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface CreateStripeLinkDeps {
    sellerRepository: SellerRepository;
}

export interface CreateStripeLinkInput {
    sellerId: string;
}

export type CreateStripeLink = (input: CreateStripeLinkInput) => Promise<{ url: string }>;

export const makeCreateStripeLink = ({ sellerRepository }: CreateStripeLinkDeps): CreateStripeLink => {
    return async (input) => {
        if (!input.sellerId) {
            throw new ValidationError('Seller ID is required');
        }

        const seller = await sellerRepository.findById(input.sellerId);
        if (!seller) {
            throw new ValidationError('Seller not found');
        }

        try {
            // Create Stripe Express account
            const account = await stripe.accounts.create({
                type: 'express',
                email: seller.email,
                country: seller.country || 'US',
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            // Update seller with Stripe ID
            await sellerRepository.updateStripeId(input.sellerId, account.id);

            // Create account link for onboarding
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${baseUrl}/stripe/refresh`,
                return_url: `${baseUrl}/stripe/success`,
                type: 'account_onboarding',
            });

            await sendLog({
                type: 'info',
                message: `Stripe connect link generated for seller ${input.sellerId}`,
                source: 'auth-service',
            });

            return { url: accountLink.url };
        } catch (error: any) {
            console.error('Stripe Connect Link Error:', error);

            await sendLog({
                type: 'error',
                message: `Stripe Connect Link Error for seller ${input.sellerId}: ${error.message}`,
                source: 'auth-service',
            });

            if (error.type === 'StripeInvalidRequestError') {
                throw new ValidationError(error.message);
            }

            throw error;
        }
    };
};
