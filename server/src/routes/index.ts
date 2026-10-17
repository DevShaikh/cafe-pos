/**
 * @file src/routes/index.ts
 * @description Central index for all API routes.
 */

import { Router } from "express";

import healthRoutes from "./health.routes";
import productRoutes from "./product.routes";

const router = Router();

// Welcome route for the API
router.get("/", (_req, res) => {
  res.json({ message: "Welcome to the API" });
});

// Define API routes here
router.use("/health", healthRoutes); // Mount health routes at /health
router.use("/products", productRoutes); // Mount product routes at /products

export default router;
