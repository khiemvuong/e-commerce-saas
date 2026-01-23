/**
 * User Routes
 * 
 * Defines HTTP routes for user authentication and profile management.
 */

import { Router } from 'express';
import { userController } from './userController';
import isAuthenticated from '@packages/middleware/isAuthenticated';
import rateLimit from 'express-rate-limit';

// Rate limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per IP
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const refreshLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Too many refresh token requests, please try again later',
});

const twoFALimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per IP
    message: 'Too many 2FA requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const otpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 requests per IP
    message: 'Too many OTP requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

// Public routes
router.post('/user-registration', userController.register);
router.post('/verify-user', userController.verify);
router.post('/login-user', loginLimiter, userController.login);
router.post('/refresh-token', refreshLimiter, userController.refreshToken);
router.post('/forgot-password-user', userController.forgotPassword);
router.post('/verify-forgot-password-user', userController.verifyForgotPassword);
router.post('/reset-password-user', userController.resetPassword);

// 2FA login verification (public - no auth required, but needs userId from login step)
router.post('/user/login/verify-2fa', twoFALimiter, userController.verifyLoginWith2FAHandler);

// Protected routes (require authentication)
router.get('/logged-in-user', isAuthenticated, userController.getLoggedInUser);
router.post('/logout-user', isAuthenticated, userController.logout);
router.post('/change-password', isAuthenticated, userController.updatePassword);
router.post('/upload-avatar', isAuthenticated, userController.uploadAvatar);
router.put('/update-profile', isAuthenticated, userController.updateProfile);

// 2FA management routes (protected - require authentication)
router.post('/user/2fa/enable', isAuthenticated, userController.enable2FAHandler);
router.post('/user/2fa/verify', isAuthenticated, userController.verify2FAHandler);
router.post('/user/2fa/disable', isAuthenticated, userController.disable2FAHandler);
router.get('/user/2fa/status', isAuthenticated, userController.get2FAStatusHandler);

// Change password OTP routes (protected - require authentication)
router.post('/user/change-password/request-otp', isAuthenticated, otpLimiter, userController.requestChangePasswordOtpHandler);
router.post('/user/change-password/verify-otp', isAuthenticated, otpLimiter, userController.verifyChangePasswordOtpHandler);

export { router as userRoutes };
