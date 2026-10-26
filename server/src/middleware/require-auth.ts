import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import configuration from "../config/env";
import { prismaClient } from "../lib/prismaClient";
import { ERROR_CODES } from "../constants/error-codes";
import AppError from "../utils/app-error";

const unauthorized = () =>
  new AppError(401, ERROR_CODES.UNAUTHORIZED, "Authentication is required.");

export const requireAuth: RequestHandler = async (request, _response, next) => {
  const token: unknown = request.cookies?.pos_session;

  if (typeof token !== "string") {
    next(unauthorized());
    return;
  }

  if (!configuration.jwtSecret) {
    next(
      new AppError(
        500,
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        "Authentication is not configured on this server.",
      ),
    );
    return;
  }

  let staffId: string;
  try {
    const payload = jwt.verify(token, configuration.jwtSecret);
    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.id !== "string"
    ) {
      next(unauthorized());
      return;
    }
    staffId = payload.id;
  } catch {
    next(unauthorized());
    return;
  }

  try {
    const staff = await prismaClient.staff.findUnique({
      where: { id: staffId },
      select: { id: true, name: true, role: true, active: true },
    });

    if (!staff || !staff.active) {
      next(unauthorized());
      return;
    }

    request.authenticatedStaff = {
      id: staff.id,
      name: staff.name,
      role: staff.role,
    };
    next();
  } catch (error) {
    next(error);
  }
};
