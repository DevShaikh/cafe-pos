/**
 * @file src/routes/index.ts
 * @description Every API route in one place. Mounted at /api in app.ts.
 */
import { Router } from "express";
import { checkHealth } from "../controllers/healthController";
import {
  createProduct,
  getProductById,
  getProducts,
} from "../controllers/productController";

const router = Router();

// Health
router.get("/health", checkHealth);

// Products
router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.post("/products", createProduct);

export default router;
