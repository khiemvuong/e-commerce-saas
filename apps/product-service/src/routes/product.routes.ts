import { Router } from "express";
import { createDiscountCodes, createProduct, deleteDiscountCode, deleteProduct,restoreProduct, deleteProductImage, getCategories, getDiscountCodes, getMyProducts, getShopProducts, uploadProductImage,getAllProducts, getProductDetails, getFilteredProducts, getFilteredShops, getFilteredEvents, searchProducts, topShops, getAllEvents, editProduct, getMyEvents, getShopEvents, createEvents, editEvent } from "../controller/product.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";

const router: Router = Router();

router.get("/get-categories", getCategories);
router.post("/create-discount-code",isAuthenticated,createDiscountCodes);
router.get("/get-discount-codes",isAuthenticated,getDiscountCodes);
router.delete("/delete-discount-code/:id",isAuthenticated,deleteDiscountCode);
router.post("/upload-product-image",isAuthenticated,uploadProductImage);
router.delete("/delete-product-image",isAuthenticated,deleteProductImage);
router.post("/create-product",isAuthenticated,createProduct);
router.put("/edit-product/:id",isAuthenticated,editProduct);

// New unified API endpoints for seller dashboard
router.get("/get-my-products",isAuthenticated,getMyProducts);
router.get("/get-my-events",isAuthenticated,getMyEvents);

// @deprecated - kept for backward compatibility, use get-my-products/get-my-events
router.get("/get-shop-products",isAuthenticated,getShopProducts);
router.get("/get-shop-events",isAuthenticated,getShopEvents);

router.post("/create-events",isAuthenticated,createEvents);
router.delete("/delete-product/:productId",isAuthenticated,deleteProduct);
router.put("/edit-event/:productId",isAuthenticated,editEvent);
router.put("/restore-product/:productId",isAuthenticated,restoreProduct);

// Public endpoints for user UI
router.get("/get-all-products",getAllProducts);
router.get("/get-all-events",getAllEvents);
router.get("/get-product/:slug",getProductDetails);
router.get("/get-filtered-products",getFilteredProducts);
router.get("/get-filtered-offers",getFilteredEvents);
router.get("/get-filtered-shops",getFilteredShops);
router.get("/search-products",searchProducts);
router.get("/top-shops",topShops);

export default router;