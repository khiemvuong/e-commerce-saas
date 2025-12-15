import { isSeller } from '@packages/middleware/authorizeRoles';
import isAuthenticated from '@packages/middleware/isAuthenticated';
import express, { Router } from 'express';
import { getShopDetails, updateShop, uploadShopImage } from '../controller/seller.controller';


const router: Router = express.Router();

router.get('/get-shop-details',isAuthenticated, getShopDetails);
router.put('/update-shop',isAuthenticated,isSeller, updateShop);
router.post('/upload-shop-image',isAuthenticated,isSeller,uploadShopImage);

export default router;