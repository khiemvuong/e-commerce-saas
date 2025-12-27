import { isSeller } from '@packages/middleware/authorizeRoles';
import isAuthenticated from '@packages/middleware/isAuthenticated';
import express, { Router } from 'express';
import { getOrderDetails, getSellerAnalytics, getSellerOrders, getShopById, getShopDetails, getShopProducts, toggleFollowShop, updateDeliveryStatus, updateShop, uploadShopImage } from '../controller/seller.controller';


const router: Router = express.Router();

router.get('/get-shop-details',isAuthenticated,isSeller, getShopDetails);
router.get('/get-shop-details/:id', getShopById);
router.get('/get-shop-products/:id', getShopProducts);
router.put('/update-shop',isAuthenticated,isSeller, updateShop);
router.put('/follow-shop', isAuthenticated, toggleFollowShop);
router.post('/upload-shop-image',isAuthenticated,isSeller,uploadShopImage);
router.get('/get-analytics', isAuthenticated, isSeller, getSellerAnalytics);
router.get('/get-seller-orders', isAuthenticated,isSeller, getSellerOrders);
router.get('/get-order-details/:id', isAuthenticated,getOrderDetails);
router.put('/update-order-status/:orderId', isAuthenticated,isSeller, updateDeliveryStatus);
export default router;