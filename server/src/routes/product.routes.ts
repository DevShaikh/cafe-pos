import express, { Router } from "express";

import * as productController from "../controllers/product.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

// Product data is available only to an authenticated staff member.
router.use(requireAuth);
router.get("/images/:filename", productController.getProductImage);
router.get("/", productController.getProducts);
router.post("/", productController.createProduct);
router.post(
  "/:id/image",
  express.raw({
    type: "application/octet-stream",
    limit: 5 * 1024 * 1024,
  }),
  productController.uploadProductImage,
);
router.delete("/:id/image", productController.deleteProductImage);
router.patch("/:id", productController.updateProduct);

export default router;
