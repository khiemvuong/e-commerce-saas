/**
 * Combined Routes Index
 * 
 * Combines all module routes into a single router.
 */

import { Router } from 'express';
import { userRoutes } from '../modules/user';
import { sellerRoutes } from '../modules/seller';
import { adminRoutes } from '../modules/admin';
import { shopRoutes } from '../modules/shop';
import { addressRoutes } from '../modules/address';

const router = Router();

// User routes
router.use(userRoutes);

// Seller routes
router.use(sellerRoutes);

// Admin routes
router.use(adminRoutes);

// Shop routes
router.use(shopRoutes);

// Address routes
router.use(addressRoutes);

export default router;
