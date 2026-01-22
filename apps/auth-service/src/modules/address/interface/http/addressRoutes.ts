/**
 * Address Routes
 */

import { Router } from 'express';
import { addressController } from './addressController';
import isAuthenticated from '@packages/middleware/isAuthenticated';

const router = Router();

router.get('/shipping-addresses', isAuthenticated, addressController.getAll);
router.post('/add-address', isAuthenticated, addressController.add);
router.delete('/delete-address/:addressId', isAuthenticated, addressController.delete);

export { router as addressRoutes };
