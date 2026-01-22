/**
 * Admin Controller
 */

import { Request, Response, NextFunction } from 'express';
import { makeLoginAdmin, makeLogoutAdmin } from '../../application/useCases';
import { makeGetAdmin } from '../../application/queries';

const loginAdmin = makeLoginAdmin();
const logoutAdmin = makeLogoutAdmin();
const getAdmin = makeGetAdmin();

export const adminController = {
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await loginAdmin(req.body, res);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async logout(req: any, res: Response, next: NextFunction) {
        try {
            const result = logoutAdmin(res);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async getLoggedInAdmin(req: any, res: Response, next: NextFunction) {
        try {
            const result = getAdmin(req.admin);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },
};
