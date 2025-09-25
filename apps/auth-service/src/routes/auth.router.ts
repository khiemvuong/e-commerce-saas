import express, { Router } from "express";
import { userRegistetration } from "../controller/auth.controller";

const router:Router = express.Router();

router.post("/user-registration", userRegistetration);

export default router;