import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "../constants/error-codes";
import { salesReportQuerySchema } from "../schemas/order";
import { getSalesReport } from "../services/order.service";
import AppError from "../utils/app-error";
import { sendSuccessResponse } from "../utils/responseHandler";

export async function getSales(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.authenticatedStaff) {
      throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Authentication is required.");
    }

    const parsed = salesReportQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        parsed.error.issues[0]?.message ?? "Invalid input.",
      );
    }

    const report = await getSalesReport(parsed.data, req.authenticatedStaff.id);
    sendSuccessResponse(res, 200, report, "Sales report retrieved successfully");
  } catch (error) {
    next(error);
  }
}
