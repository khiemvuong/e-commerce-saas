import { AuthError } from "@packages/error-handler";
import { NextFunction, Response } from "express";


export const isSeller = (req:any, res:Response, next:NextFunction) => {
    if (req.role !== "seller") {
        return next(new AuthError("Forbidden! Access is allowed for sellers only"));
    }
    next();
};

export const isUser = (req:any, res:Response, next:NextFunction) => {
    if (req.role !== "user") {
        return next(new AuthError("Forbidden! Access is allowed for users only"));
    }
    next();
};