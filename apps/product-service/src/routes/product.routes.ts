import { Router } from "express";
import { getCategories } from "../controller/product.controller";

const router: Router = Router();

router.get("/get-categories", getCategories);


export default router;