/**
 * Seller Controller
 */

import { Request, Response, NextFunction } from 'express';

import {
    makeRegisterSeller,
    makeVerifySeller,
    makeLoginSeller,
    makeLogoutSeller,
    makeCreateStripeLink,
} from '../../application/useCases';
import { makeGetSeller } from '../../application/queries';
import { getSellerRepository } from '../../infrastructure/PrismaSellerRepository';

const sellerRepository = getSellerRepository();
const registerSeller = makeRegisterSeller({ sellerRepository });
const verifySeller = makeVerifySeller({ sellerRepository });
const loginSeller = makeLoginSeller({ sellerRepository });
const logoutSeller = makeLogoutSeller();
const createStripeLink = makeCreateStripeLink({ sellerRepository });
const getSeller = makeGetSeller();

export const sellerController = {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await registerSeller(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async verify(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await verifySeller(req.body, res);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await loginSeller(req.body, res);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async logout(req: any, res: Response, next: NextFunction) {
        try {
            const result = logoutSeller(res);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async getLoggedInSeller(req: any, res: Response, next: NextFunction) {
        try {
            const result = getSeller({ seller: req.seller });
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },

    async createStripeLink(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createStripeLink({ sellerId: req.body.sellerId });
            res.status(200).json(result);
        } catch (error: any) {
            if (error.type === 'StripeInvalidRequestError') {
                return res.status(400).json({ message: error.message });
            }
            if (error.code === 'P2002') {
                return res.status(409).json({ message: 'Duplicate field in DB' });
            }
            next(error);
        }
    },
};
