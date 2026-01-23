/**
 * Get Seller Query
 */

export interface GetSellerInput {
    seller: any; // From middleware
}

export type GetSeller = (input: GetSellerInput) => { success: true; seller: any };

export const makeGetSeller = (): GetSeller => {
    return (input) => {
        return { success: true, seller: input.seller };
    };
};
