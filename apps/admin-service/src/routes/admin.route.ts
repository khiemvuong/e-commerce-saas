import { isAuthenticatedAdmin } from '@packages/middleware/authorizeRoles';
import isAuthenticated from '@packages/middleware/isAuthenticated';
import express, { Router } from 'express';
import { addNewAdmin, getAllAdmins, getAllCustomizations, getAllEvents, getAllNotifications, getAllProducts, getAllSellers, getAllUsers, getUserNotifications, removeAdmin, updateSiteConfig, uploadSiteImage, getDashboardStats } from '../controllers/admin.controller';

const router: Router = express.Router();

// Admin-only routes - use isAuthenticatedAdmin (checks admin token + admin role)
router.get('/get-all-products', isAuthenticatedAdmin, getAllProducts);
router.get('/get-all-events', isAuthenticatedAdmin, getAllEvents);
router.get('/get-all-admins', isAuthenticatedAdmin, getAllAdmins);
router.put('/add-new-admin', isAuthenticatedAdmin, addNewAdmin);
router.put('/remove-admin', isAuthenticatedAdmin, removeAdmin);
router.get('/get-all-customizations', getAllCustomizations);
router.put('/update-site-config', isAuthenticatedAdmin, updateSiteConfig);
router.get('/get-all-users', isAuthenticatedAdmin, getAllUsers);
router.get('/get-all-sellers', isAuthenticatedAdmin, getAllSellers);
router.post('/upload-site-image', isAuthenticatedAdmin, uploadSiteImage);
router.get('/get-all-notifications', isAuthenticatedAdmin, getAllNotifications);
router.get('/get-user-notifications', isAuthenticated, getUserNotifications);
router.get('/get-dashboard-stats', isAuthenticatedAdmin, getDashboardStats);
export default router;