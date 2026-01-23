/**
 * Shop Routes
 */

import { Router } from 'express';
import { shopController } from './shopController';

const router = Router();

router.post('/create-shop', shopController.create);

export { router as shopRoutes };
