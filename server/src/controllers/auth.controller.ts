import type { NextFunction, Request, Response } from "express";
import { sendSuccessResponse } from "../utils/responseHandler";
import * as authService from "../services/auth.service";
import { loginSchema } from "../schemas/auth";
import AppError from "../utils/app-error";
import { ERROR_CODES } from "../constants/error-codes";

export const getActiveStaff = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const staff = await authService.getActiveStaff();
    sendSuccessResponse(res, 200, staff, "Active staff retrieved successfully");
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        parsed.error.issues[0]?.message ?? "Invalid input",
      );
    }

    const { token, staff } = await authService.login(parsed.data);

    res.cookie("pos_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
    });

    sendSuccessResponse(res, 200, staff, "Logged in successfully");
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.clearCookie("pos_session");
    sendSuccessResponse(res, 200, null, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

export const getCurrentStaff = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.authenticatedStaff) {
    next(
      new AppError(
        401,
        ERROR_CODES.UNAUTHORIZED,
        "Authentication is required.",
      ),
    );
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  sendSuccessResponse(res, 200, req.authenticatedStaff, "Session is active");
};
