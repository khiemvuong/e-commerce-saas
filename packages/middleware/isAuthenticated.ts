import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "@packages/libs/prisma";

type Role = "user" | "seller" | "admin";

/**
 * Mapping role to its specific cookie name
 */
const ROLE_TOKEN_MAP: Record<Role, string> = {
    user: "access_token",
    seller: "seller-access-token",
    admin: "admin-access-token",
};

/**
 * Get token for a specific role
 */
const getTokenForRole = (req: any, role: Role): string | undefined => {
    return req.cookies[ROLE_TOKEN_MAP[role]] || 
           req.headers.authorization?.split(" ")[1];
};

/**
 * Get any available token (fallback for generic auth)
 */
const getAnyToken = (req: any): string | undefined => {
    return req.cookies["access_token"] ||
           req.cookies["seller-access-token"] ||
           req.cookies["admin-access-token"] ||
           req.headers.authorization?.split(" ")[1];
};

/**
 * Load account based on role
 */
const loadAccount = async (id: string, role: Role) => {
    if (role === "user" || role === "admin") {
        return prisma.users.findUnique({ where: { id } });
    } else if (role === "seller") {
        return prisma.sellers.findUnique({ 
            where: { id },
            include: { shop: true },
        });
    }
    return null;
};

/**
 * Authentication Middleware Factory
 * 
 * @param requiredRole - If specified, only checks the token for that specific role
 *                       and validates that the token's role matches.
 *                       If not specified, accepts any valid token.
 * 
 * Usage:
 * - isAuthenticatedAdmin: Only accepts admin-access-token with admin role
 * - isAuthenticatedSeller: Only accepts seller-access-token with seller role
 * - isAuthenticatedUser: Only accepts access_token with user role
 * - isAuthenticated: Accepts any valid token (backward compatible)
 */
const createAuthMiddleware = (requiredRole?: Role) => {
    return async (req: any, res: Response, next: NextFunction) => {
        try {
            // Get token based on required role or any available token
            const token = requiredRole 
                ? getTokenForRole(req, requiredRole)
                : getAnyToken(req);
            
            if (!token) {
                return res.status(401).json({ 
                    message: requiredRole 
                        ? `Unauthorized! No ${requiredRole} token provided`
                        : "Unauthorized! No token provided" 
                });
            }

            // Verify token
            const decoded = jwt.verify(
                token, 
                process.env.ACCESS_TOKEN_SECRET!
            ) as { id: string; role: Role };

            if (!decoded) {
                return res.status(401).json({ message: "Unauthorized! Invalid token" });
            }

            // If requiredRole is specified, validate it matches token's role
            if (requiredRole && decoded.role !== requiredRole) {
                return res.status(403).json({ 
                    message: `Forbidden! Access is allowed for ${requiredRole}s only` 
                });
            }

            // Load account
            const account = await loadAccount(decoded.id, decoded.role);

            if (!account) {
                return res.status(401).json({ message: "Account not found" });
            }

            // Set account on request based on role
            if (decoded.role === "user") {
                req.user = account;
            } else if (decoded.role === "seller") {
                req.seller = account;
            } else if (decoded.role === "admin") {
                req.admin = account;
            }

            req.role = decoded.role;

            return next();
        } catch (error) {
            return res.status(401).json({ message: "Unauthorized! Token expired or invalid" });
        }
    };
};

/**
 * Role-specific authentication middlewares
 * Use these for routes that require a specific role
 */
export const isAuthenticatedAdmin = createAuthMiddleware("admin");
export const isAuthenticatedSeller = createAuthMiddleware("seller");
export const isAuthenticatedUser = createAuthMiddleware("user");

/**
 * Generic authentication middleware (backward compatible)
 * Accepts any valid token - use with isAdmin/isSeller/isUser for role check
 */
const isAuthenticated = createAuthMiddleware();

export default isAuthenticated;