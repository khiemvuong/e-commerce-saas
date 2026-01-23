/**
 * Shop Controller
 */

import { Request, Response, NextFunction } from 'express';
import { makeCreateShop } from '../../application/useCases';

const createShop = makeCreateShop();

export const shopController = {
    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await createShop(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },
};
