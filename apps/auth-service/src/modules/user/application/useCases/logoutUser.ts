/**
 * Logout User Use Case
 * 
 * Handles user logout by clearing cookies.
 */

import { Response } from 'express';
import { TokenService } from '../../../_shared/services/TokenService';

export type LogoutUser = (res: Response) => { message: string };

export const makeLogoutUser = (): LogoutUser => {
    return (res: Response) => {
        TokenService.clearUserCookies(res);
        return { message: 'Logged out successfully' };
    };
};
