import { Router } from "express";
import { createDiscountCodes, deleteDiscountCode, getCategories, getDiscountCodes } from "../controller/product.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";

const router: Router = Router();

router.get("/get-categories", getCategories);
router.post("/create-discount-code",isAuthenticated,createDiscountCodes);
router.get("/get-discount-codes",isAuthenticated,getDiscountCodes);
router.delete("/delete-discount-code/:id",isAuthenticated,deleteDiscountCode);


export default router;