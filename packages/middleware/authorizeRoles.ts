import { AuthError } from "@packages/error-handler";
import { NextFunction, Response } from "express";

// Re-export role-specific auth middlewares for convenience
export { 
    isAuthenticatedAdmin, 
    isAuthenticatedSeller, 
    isAuthenticatedUser 
} from "./isAuthenticated";

/**
 * @deprecated Use isAuthenticatedSeller instead for better security
 * This middleware only checks role after isAuthenticated has run
 */
export const isSeller = (req:any, res:Response, next:NextFunction) => {
    if (req.role !== "seller") {
        return next(new AuthError("Forbidden! Access is allowed for sellers only"));
    }
    next();
};

/**
 * @deprecated Use isAuthenticatedUser instead for better security
 * This middleware only checks role after isAuthenticated has run
 */
export const isUser = (req:any, res:Response, next:NextFunction) => {
    if (req.role !== "user") {
        return next(new AuthError("Forbidden! Access is allowed for users only"));
    }
    next();
};

/**
 * @deprecated Use isAuthenticatedAdmin instead for better security
 * This middleware only checks role after isAuthenticated has run
 */
export const isAdmin = (req:any, res:Response, next:NextFunction) => {
    if (req.role !== "admin") {
        return next(new AuthError("Forbidden! Access is allowed for admins only"));
    }
    next();
};