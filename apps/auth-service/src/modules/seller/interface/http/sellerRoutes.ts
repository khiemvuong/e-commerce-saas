/**
 * Seller Routes
 */

import { Router } from 'express';
import { sellerController } from './sellerController';
import isAuthenticated from '@packages/middleware/isAuthenticated';
import { isSeller } from '@packages/middleware/authorizeRoles';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 requests per 15 minutes
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

// Public routes
router.post('/seller-registration', sellerController.register);
router.post('/verify-seller', sellerController.verify);
router.post('/login-seller', loginLimiter, sellerController.login);
router.post('/login/verify-2fa', loginLimiter, sellerController.verifyLoginWith2FA);
router.post('/create-stripe-link', sellerController.createStripeLink);

// Protected routes
router.post('/logout-seller', isAuthenticated, isSeller, sellerController.logout);
router.get('/logged-in-seller', isAuthenticated, isSeller, sellerController.getLoggedInSeller);

// 2FA routes (protected)
router.post('/2fa/enable', isAuthenticated, isSeller, sellerController.enable2FA);
router.post('/2fa/verify', isAuthenticated, isSeller, sellerController.verify2FA);
router.post('/2fa/disable', isAuthenticated, isSeller, sellerController.disable2FA);
router.get('/2fa/status', isAuthenticated, isSeller, sellerController.get2FAStatus);

export { router as sellerRoutes };
