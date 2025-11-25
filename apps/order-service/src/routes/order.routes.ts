import isAuthenticated from '@packages/middleware/isAuthenticated';
import express, { Router } from 'express';
import { createPaymentIntent, createPaymentSession, getOrderDetails, getSellerOrders, verifyPaymentSession } from '../controllers/order.controller';
import {isSeller} from '@packages/middleware/authorizeRoles';
const router:Router = express.Router();

// Define your order-related routes here

router.post("/create-payment-intent", isAuthenticated, createPaymentIntent);
router.post("/create-payment-session", isAuthenticated, createPaymentSession);
router.get(
    "/verify-payment-session",
    isAuthenticated,
    verifyPaymentSession
);

router.get('/get-seller-orders', isAuthenticated,isSeller, getSellerOrders);
router.get('/get-orders-details/:id', isAuthenticated, getOrderDetails);
export default router;