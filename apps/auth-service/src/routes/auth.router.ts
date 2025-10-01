import express, { Router } from "express";
import { userRegistetration, verifyUser } from "../controller/auth.controller";

const router:Router = express.Router();


router.post("/user-registration", userRegistetration);
router.post("/verify-user", verifyUser);

export default router;