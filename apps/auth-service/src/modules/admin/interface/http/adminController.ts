/**
 * Admin Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../../../../_lib/errors/AuthErrors';
import { 
    makeLoginAdmin, 
    makeLogoutAdmin,
    // Forgot Password Use Cases
    makeForgotPasswordAdmin,
    makeVerifyForgotPasswordAdmin,
    makeResetPasswordAdmin,
    // 2FA Use Cases
    makeEnable2FA,
    makeVerify2FA,
    makeDisable2FA,
    makeVerifyLoginWith2FA,
    makeGet2FAStatus,
} from '../../application/useCases';
import { makeGetAdmin } from '../../application/queries';
import { makeRefreshToken } from '../../../user/application/useCases';

const loginAdmin = makeLoginAdmin();
const logoutAdmin = makeLogoutAdmin();
const getAdmin = makeGetAdmin();
const refreshToken = makeRefreshToken();

// Forgot Password Use Cases
const forgotPasswordAdmin = makeForgotPasswordAdmin();
const verifyForgotPasswordAdmin = makeVerifyForgotPasswordAdmin();
const resetPasswordAdmin = makeResetPasswordAdmin();

// 2FA Use Cases
const enable2FA = makeEnable2FA();
const verify2FA = makeVerify2FA();
const disable2FA = makeDisable2FA();
const verifyLoginWith2FA = makeVerifyLoginWith2FA();
const get2FAStatus = makeGet2FAStatus();

export const adminController = {
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await loginAdmin(req.body, res);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Refresh admin token
     * POST /api/admin-refresh-token
     */
    async refreshToken(req: any, res: Response, next: NextFunction) {
        try {
            const result = await refreshToken(
                { cookies: req.cookies, authHeader: req.headers.authorization },
                res
            );
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

    // ==================== Forgot Password Endpoints ====================

    /**
     * Request forgot password OTP
     * POST /api/forgot-password-admin
     */
    async forgotPasswordHandler(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await forgotPasswordAdmin(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Verify forgot password OTP
     * POST /api/verify-forgot-password-admin
     */
    async verifyForgotPasswordHandler(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await verifyForgotPasswordAdmin(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Reset password after OTP verification
     * POST /api/reset-password-admin
     */
    async resetPasswordHandler(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await resetPasswordAdmin(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    // ==================== 2FA Endpoints ====================

    /**
     * Enable 2FA - Generate secret and QR code
     * POST /api/admin/2fa/enable
     */
    async enable2FAHandler(req: any, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.id;
            if (!adminId) {
                return next(new AuthError('Admin not authenticated'));
            }

            const result = await enable2FA({ adminId });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Verify and activate 2FA
     * POST /api/admin/2fa/verify
     */
    async verify2FAHandler(req: any, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.id;
            if (!adminId) {
                return next(new AuthError('Admin not authenticated'));
            }

            const result = await verify2FA({ adminId, totpCode: req.body.totpCode });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Disable 2FA
     * POST /api/admin/2fa/disable
     */
    async disable2FAHandler(req: any, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.id;
            if (!adminId) {
                return next(new AuthError('Admin not authenticated'));
            }

            const result = await disable2FA({ adminId, password: req.body.password });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get 2FA status
     * GET /api/admin/2fa/status
     */
    async get2FAStatusHandler(req: any, res: Response, next: NextFunction) {
        try {
            const adminId = req.admin?.id;
            if (!adminId) {
                return next(new AuthError('Admin not authenticated'));
            }

            const result = await get2FAStatus({ adminId });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Verify 2FA during login
     * POST /api/admin/login/verify-2fa
     */
    async verifyLoginWith2FAHandler(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await verifyLoginWith2FA(
                { adminId: req.body.adminId, totpCode: req.body.totpCode },
                res
            );
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },
};
