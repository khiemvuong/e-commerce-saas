import isAuthenticated from '@packages/middleware/isAuthenticated';
import express, { Router } from 'express';
import { createCODOrder, createPaymentIntent, createPaymentSession, getAdminOrders, getUserOrders,  verifyCouponCode, verifyPaymentSession } from '../controllers/order.controller';
import { isAuthenticatedAdmin } from '@packages/middleware/authorizeRoles';
const router:Router = express.Router();

// Define your order-related routes here

router.post("/create-payment-intent", isAuthenticated, createPaymentIntent);
router.post("/create-payment-session", isAuthenticated, createPaymentSession);
router.get(
    "/verify-payment-session",
    isAuthenticated,
    verifyPaymentSession
);

router.put('/verify-coupon', isAuthenticated,verifyCouponCode );
router.get('/get-user-orders', isAuthenticated, getUserOrders);
router.get('/get-admin-orders', isAuthenticatedAdmin, getAdminOrders);

// COD (Cash on Delivery) order route
router.post('/create-cod-order', isAuthenticated, createCODOrder);

export default router;