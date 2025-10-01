import express, { Router } from "express";
import { userLogin, userRegistetration, verifyUser } from "../controller/auth.controller";

const router:Router = express.Router();


router.post("/user-registration", userRegistetration);
router.post("/verify-user", verifyUser);
router.post("/login-user", userLogin);

export default router;