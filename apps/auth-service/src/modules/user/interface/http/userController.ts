/**
 * User Controller
 * 
 * HTTP layer - handles requests, validates input, calls use cases/queries,
 * and formats responses.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../../../../_lib/errors/AuthErrors';

// Use Cases
import {
    makeRegisterUser,
    makeVerifyUser,
    makeLoginUser,
    makeLogoutUser,
    makeForgotPassword,
    makeVerifyForgotPassword,
    makeResetPassword,
    makeUpdateProfile,
    makeUpdatePassword,
    makeUploadAvatar,
    makeRefreshToken,
} from '../../application/useCases';

// Queries
import { makeGetUser } from '../../application/queries';

// Infrastructure
import { getUserRepository } from '../../infrastructure/PrismaUserRepository';

// Initialize repository and use cases
const userRepository = getUserRepository();
const registerUser = makeRegisterUser({ userRepository });
const verifyUser = makeVerifyUser({ userRepository });
const loginUser = makeLoginUser({ userRepository });
const logoutUser = makeLogoutUser();
const forgotPassword = makeForgotPassword({ userRepository });
const verifyForgotPasswordUseCase = makeVerifyForgotPassword();
const resetPassword = makeResetPassword({ userRepository });
const updateProfile = makeUpdateProfile({ userRepository });
const updatePassword = makeUpdatePassword({ userRepository });
const uploadAvatar = makeUploadAvatar();
const refreshToken = makeRefreshToken();
const getUser = makeGetUser({ userRepository });

/**
 * User Controller
 */
export const userController = {
    /**
     * Refresh token
     * POST /api/refresh-token
     */
    async refreshToken(req: any, res: Response, next: NextFunction) {
        try {
            const result = await refreshToken(
                { cookies: req.cookies, authHeader: req.headers.authorization },
                res
            );
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Register user - send OTP
     * POST /api/user-registration
     */
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await registerUser(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Verify user - complete registration
     * POST /api/verify-user
     */
    async verify(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await verifyUser(req.body);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Login user
     * POST /api/login-user
     */
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await loginUser(req.body, res);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Logout user
     * POST /api/logout-user
     */
    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const result = logoutUser(res);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Get logged in user
     * GET /api/logged-in-user
     */
    async getLoggedInUser(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return next(new AuthError('User not authenticated'));
            }

            const result = await getUser({ userId });
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Forgot password - send OTP
     * POST /api/forgot-password-user
     */
    async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await forgotPassword(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Verify forgot password OTP
     * POST /api/verify-forgot-password-user
     */
    async verifyForgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await verifyForgotPasswordUseCase(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Reset password
     * POST /api/reset-password-user
     */
    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await resetPassword(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update password
     * POST /api/change-password
     */
    async updatePassword(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return next(new AuthError('User not authenticated'));
            }

            const result = await updatePassword({ userId, ...req.body });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Upload avatar
     * POST /api/upload-avatar
     */
    async uploadAvatar(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await uploadAvatar(req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    /**
     * Update profile
     * PUT /api/update-profile
     */
    async updateProfile(req: any, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return next(new AuthError('User not authenticated'));
            }

            const result = await updateProfile({
                userId,
                name: req.body.name,
                avatar: req.body.avatar,
            });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },
};
