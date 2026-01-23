/**
 * Logout Seller Use Case
 */

import { Response } from 'express';
import { TokenService } from '../../../_shared/services/TokenService';

export type LogoutSeller = (res: Response) => { message: string };

export const makeLogoutSeller = (): LogoutSeller => {
    return (res) => {
        TokenService.clearSellerCookies(res);
        return { message: 'Logged out successfully' };
    };
};
