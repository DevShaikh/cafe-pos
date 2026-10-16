import type { RequestHandler } from "express";
import type { HealthServiceContract } from "./health.service.js";

export function createHealthController(
  healthService: HealthServiceContract,
): RequestHandler {
  return async (_request, response) => {
    await healthService.checkDatabase();
    response.status(200).json({
      status: "ok",
      database: "connected",
    });
  };
}
