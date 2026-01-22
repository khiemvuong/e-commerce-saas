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
    max: 5,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

// Public routes
router.post('/seller-registration', sellerController.register);
router.post('/verify-seller', sellerController.verify);
router.post('/login-seller', loginLimiter, sellerController.login);
router.post('/create-stripe-link', sellerController.createStripeLink);

// Protected routes
router.post('/logout-seller', isAuthenticated, isSeller, sellerController.logout);
router.get('/logged-in-seller', isAuthenticated, isSeller, sellerController.getLoggedInSeller);

export { router as sellerRoutes };
