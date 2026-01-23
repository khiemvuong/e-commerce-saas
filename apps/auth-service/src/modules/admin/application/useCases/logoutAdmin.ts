/**
 * Logout Admin Use Case
 */

import { Response } from 'express';
import { TokenService } from '../../../_shared/services/TokenService';

export type LogoutAdmin = (res: Response) => { message: string };

export const makeLogoutAdmin = (): LogoutAdmin => {
    return (res) => {
        TokenService.clearAdminCookies(res);
        return { message: 'Logged out successfully' };
    };
};
