/**
 * @file src/routes/index.ts
 * @description Central index for all API routes.
 */

import { Router } from "express";

import configuration from "../config/env";

import healthRoutes from "./health.routes";
import productRoutes from "./product.routes";
import authRoutes from "./auth.routes";

const router = Router();

// Welcome route for the API
router.get("/", (_req, res) => {
  res.json({
    message: "Welcome to the API",
    version: configuration.version,
    environment: configuration.environment,
    timestamp: new Date().toISOString(),
  });
});

// Define API routes here
router.use("/auth", authRoutes); // Mount auth routes at /auth
router.use("/health", healthRoutes); // Mount health routes at /health
router.use("/products", productRoutes); // Mount product routes at /products

export default router;
