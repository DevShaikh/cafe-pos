import { Router } from "express";

import * as productController from "../controllers/product.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

// Product data is available only to an authenticated staff member.
router.use(requireAuth);
router.get("/", productController.getProducts);
router.post("/", productController.createProduct);
router.patch("/:id", productController.updateProduct);

export default router;
