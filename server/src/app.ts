import cors from "cors";
import express from "express";
import { AppError } from "./errors/app-error.js";
import { errorHandler } from "./errors/error-handler.js";
import { createHealthRoutes } from "./features/health/health.routes.js";
import type { HealthServiceContract } from "./features/health/health.service.js";
import { createProductRoutes } from "./features/products/product.routes.js";
import type { ProductServiceContract } from "./features/products/product.service.js";

interface AppDependencies {
  clientOrigin: string;
  healthService: HealthServiceContract;
  productService: ProductServiceContract;
}

export function createApp({
  clientOrigin,
  healthService,
  productService,
}: AppDependencies) {
  const app = express();

  app.use(cors({ origin: clientOrigin }));
  app.use(express.json());
  app.use("/api", createHealthRoutes(healthService));
  app.use("/api/products", createProductRoutes(productService));
  app.use((_request, _response, next) => {
    next(new AppError(404, "ROUTE_NOT_FOUND", "Route was not found."));
  });
  app.use(errorHandler);

  return app;
}
