import express, { Router } from "express";
import { resetUserPassword, userForgotPassword, userLogin, userRegistetration, verifyUser, verifyUserForgotPassword } from "../controller/auth.controller";

const router:Router = express.Router();


router.post("/user-registration", userRegistetration);
router.post("/verify-user", verifyUser);
router.post("/login-user", userLogin);
router.post("/forgot-password-user", userForgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-user", verifyUserForgotPassword);
export default router;