import type { NextFunction, Request, Response } from "express";
import { sendSuccessResponse } from "../utils/responseHandler";

import * as healthService from "../services/health.service";

export const checkHealth = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await healthService.checkDatabaseHealth();
    sendSuccessResponse(
      res,
      200,
      { status: "ok", database: "connected" },
      "Health check passed",
    );
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};
