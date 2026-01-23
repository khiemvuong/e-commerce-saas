/**
 * Admin Routes
 */

import { Router } from 'express';
import { adminController } from './adminController';
import { isAuthenticatedAdmin } from '@packages/middleware/authorizeRoles';
import rateLimit from 'express-rate-limit';

const refreshLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Too many refresh token requests, please try again later',
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const twoFALimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many 2FA requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many password reset requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

// Public routes
router.post('/login-admin', loginLimiter, adminController.login);
router.post('/admin-refresh-token', refreshLimiter, adminController.refreshToken);

// Forgot password routes (public - no auth required)
router.post('/forgot-password-admin', forgotPasswordLimiter, adminController.forgotPasswordHandler);
router.post('/verify-forgot-password-admin', forgotPasswordLimiter, adminController.verifyForgotPasswordHandler);
router.post('/reset-password-admin', forgotPasswordLimiter, adminController.resetPasswordHandler);

// 2FA login verification (public - no auth required, but needs adminId from login step)
router.post('/admin/login/verify-2fa', twoFALimiter, adminController.verifyLoginWith2FAHandler);

// Protected routes - use isAuthenticatedAdmin (checks admin token + admin role in one middleware)
router.post('/logout-admin', isAuthenticatedAdmin, adminController.logout);
router.get('/logged-in-admin', isAuthenticatedAdmin, adminController.getLoggedInAdmin);

// 2FA management routes (protected - require admin authentication)
router.post('/admin/2fa/enable', isAuthenticatedAdmin, adminController.enable2FAHandler);
router.post('/admin/2fa/verify', isAuthenticatedAdmin, adminController.verify2FAHandler);
router.post('/admin/2fa/disable', isAuthenticatedAdmin, adminController.disable2FAHandler);
router.get('/admin/2fa/status', isAuthenticatedAdmin, adminController.get2FAStatusHandler);

export { router as adminRoutes };
