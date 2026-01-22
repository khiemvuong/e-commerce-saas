/**
 * Admin Routes
 */

import { Router } from 'express';
import { adminController } from './adminController';
import isAuthenticated from '@packages/middleware/isAuthenticated';
import { isAdmin } from '@packages/middleware/authorizeRoles';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

router.post('/login-admin', loginLimiter, adminController.login);
router.post('/logout-admin', isAuthenticated, isAdmin, adminController.logout);
router.get('/logged-in-admin', isAuthenticated, isAdmin, adminController.getLoggedInAdmin);

export { router as adminRoutes };
