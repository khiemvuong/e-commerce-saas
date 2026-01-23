/**
 * Address Controller
 */

import { Response, NextFunction } from 'express';
import { AuthError } from '../../../../_lib/errors/AuthErrors';
import { makeAddAddress, makeDeleteAddress } from '../../application/useCases';
import { makeGetUserAddresses } from '../../application/queries';

const addAddress = makeAddAddress();
const deleteAddress = makeDeleteAddress();
const getUserAddresses = makeGetUserAddresses();

export const addressController = {
    async add(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return next(new AuthError('User not authenticated'));
            }

            const result = await addAddress({ userId, ...req.body });
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },

    async delete(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return next(new AuthError('User not authenticated'));
            }

            const result = await deleteAddress({
                userId,
                addressId: req.params.addressId,
            });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async getAll(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return next(new AuthError('User not authenticated'));
            }

            const result = await getUserAddresses({ userId });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },
};
