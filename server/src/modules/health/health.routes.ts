import { Router } from "express";
import { createHealthController } from "./health.controller.js";
import type { HealthServiceContract } from "./health.service.js";

export function createHealthRoutes(
  healthService: HealthServiceContract,
): Router {
  const router = Router();

  router.get("/health", createHealthController(healthService));

  return router;
}
