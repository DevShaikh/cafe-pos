import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "../constants/error-codes";
import { updateTaxSettingsSchema } from "../schemas/settings";
import * as settingsService from "../services/settings.service";
import AppError from "../utils/app-error";
import { sendSuccessResponse } from "../utils/responseHandler";

function requireStaff(req: Request) {
  if (!req.authenticatedStaff) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Authentication is required.");
  }
  return req.authenticatedStaff;
}

export async function getTaxSettings(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const settings = await settingsService.getTaxSettings();
    sendSuccessResponse(res, 200, settings, "Tax settings retrieved successfully");
  } catch (error) {
    next(error);
  }
}

export async function updateTaxSettings(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const staff = requireStaff(req);
    const parsed = updateTaxSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        parsed.error.issues[0]?.message ?? "Invalid tax settings.",
      );
    }

    const settings = await settingsService.updateTaxSettings(
      parsed.data,
      staff.id,
    );
    sendSuccessResponse(res, 200, settings, "Tax settings updated successfully");
  } catch (error) {
    next(error);
  }
}
