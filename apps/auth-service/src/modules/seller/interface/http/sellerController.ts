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
    makeVerifyLoginWith2FA,
} from '../../application/useCases';
import { makeEnable2FA } from '../../application/useCases/enable2FA';
import { makeVerify2FA } from '../../application/useCases/verify2FA';
import { makeDisable2FA } from '../../application/useCases/disable2FA';
import { makeGetSeller } from '../../application/queries';
import { getSellerRepository } from '../../infrastructure/PrismaSellerRepository';

const sellerRepository = getSellerRepository();
const registerSeller = makeRegisterSeller({ sellerRepository });
const verifySeller = makeVerifySeller({ sellerRepository });
const loginSeller = makeLoginSeller({ sellerRepository });
const logoutSeller = makeLogoutSeller();
const createStripeLink = makeCreateStripeLink({ sellerRepository });
const getSeller = makeGetSeller();

// 2FA use cases
const enable2FA = makeEnable2FA({ sellerRepository });
const verify2FA = makeVerify2FA({ sellerRepository });
const disable2FA = makeDisable2FA({ sellerRepository });
const verifyLoginWith2FA = makeVerifyLoginWith2FA({ sellerRepository });

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

    // ==========================================
    // 2FA Endpoints
    // ==========================================

    /**
     * Enable 2FA - Step 1: Generate secret and QR code
     * POST /api/2fa/enable
     */
    async enable2FA(req: any, res: Response, next: NextFunction) {
        try {
            if (!req.seller?.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const result = await enable2FA({ sellerId: req.seller.id });
            res.status(200).json({
                success: true,
                message: 'Scan the QR code with your authenticator app',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Verify 2FA - Step 2: Verify TOTP code and activate 2FA
     * POST /api/2fa/verify
     */
    async verify2FA(req: any, res: Response, next: NextFunction) {
        try {
            if (!req.seller?.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const result = await verify2FA({
                sellerId: req.seller.id,
                totpCode: req.body.code,
            });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Disable 2FA
     * POST /api/2fa/disable
     */
    async disable2FA(req: any, res: Response, next: NextFunction) {
        try {
            if (!req.seller?.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const result = await disable2FA({
                sellerId: req.seller.id,
                password: req.body.password,
            });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get 2FA status
     * GET /api/2fa/status
     */
    async get2FAStatus(req: any, res: Response, next: NextFunction) {
        try {
            if (!req.seller?.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            res.status(200).json({
                enabled: req.seller.twoFactorEnabled || false,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * Verify 2FA during login
     * POST /api/login/verify-2fa
     */
    async verifyLoginWith2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await verifyLoginWith2FA(
                {
                    sellerId: req.body.sellerId,
                    totpCode: req.body.code,
                },
                res
            );
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },
};

