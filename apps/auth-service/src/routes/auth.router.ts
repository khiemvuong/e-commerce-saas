import express, { Router } from "express";
import { addUserAddress, createShop, createStripeConnectLink, deleteUserAddress, getAdmin, getSeller, getUser, getUserAddresses, loginAdmin, loginSeller, logOutSeller, logOutUser, refreshToken, registerSeller, resetUserPassword, updateUserPassword, uploadAvatar, updateUserProfile, userForgotPassword, userLogin, userRegistetration, verifySeller, verifyUser, verifyUserForgotPassword } from "../controller/auth.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import { isAdmin, isSeller } from "@packages/middleware/authorizeRoles";
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per IP
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});
const refreshLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
});
const router:Router = express.Router();
router.post("/user-registration", userRegistetration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginLimiter, userLogin);
router.post("/refresh-token",refreshLimiter,refreshToken);
router.get("/logged-in-user",isAuthenticated,getUser);
router.post("/logout-user", isAuthenticated, logOutUser);
router.post("/forgot-password-user", userForgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-user", verifyUserForgotPassword);
router.post("/seller-registration", registerSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop)
router.post("/create-stripe-link", createStripeConnectLink);
router.post("/login-seller", loginLimiter, loginSeller);
router.post("/logout-seller", isAuthenticated, isSeller, logOutSeller);
router.post("/login-admin", loginLimiter, loginAdmin);
// router.post("/logout-admin", isAuthenticated, isAdmin, logOutAdmin);
router.get("/logged-in-seller", isAuthenticated, isSeller, getSeller);
router.get("/logged-in-admin", isAuthenticated, isAdmin, getAdmin);
router.post("/change-password",isAuthenticated, updateUserPassword);
router.get("/shipping-addresses", isAuthenticated, getUserAddresses);
router.post("/add-address", isAuthenticated, addUserAddress);
router.delete("/delete-address/:addressId", isAuthenticated, deleteUserAddress);
router.post("/upload-avatar", isAuthenticated, uploadAvatar);
router.put("/update-profile", isAuthenticated, updateUserProfile);
export default router;