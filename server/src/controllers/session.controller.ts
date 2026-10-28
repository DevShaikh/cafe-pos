import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "../constants/error-codes";
import {
  idempotencyKeySchema,
  listSessionsQuerySchema,
  sessionIdSchema,
} from "../schemas/session";
import * as sessionService from "../services/session.service";
import AppError from "../utils/app-error";
import { sendSuccessResponse } from "../utils/responseHandler";

function requireStaff(req: Request) {
  if (!req.authenticatedStaff) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Authentication is required.");
  }
  return req.authenticatedStaff;
}

function requireIdempotencyKey(req: Request) {
  const parsed = idempotencyKeySchema.safeParse(req.get("Idempotency-Key"));
  if (!parsed.success) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, "A valid Idempotency-Key header is required.");
  }
  return parsed.data;
}

export async function getCurrent(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = requireStaff(req);
    const session = await sessionService.getCurrentSession(staff.id);
    sendSuccessResponse(res, 200, session, "Current session retrieved successfully");
  } catch (error) {
    next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = requireStaff(req);
    const parsed = listSessionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, parsed.error.issues[0]?.message ?? "Invalid input.");
    }
    const sessions = await sessionService.listSessions(staff.id, parsed.data);
    sendSuccessResponse(res, 200, sessions, "Sessions retrieved successfully");
  } catch (error) {
    next(error);
  }
}

export async function open(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = requireStaff(req);
    const result = await sessionService.openSession(staff.id, requireIdempotencyKey(req));
    sendSuccessResponse(res, result.statusCode, result.data, "Session opened successfully");
  } catch (error) {
    next(error);
  }
}

export async function close(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = requireStaff(req);
    const parsed = sessionIdSchema.safeParse(req.params.id);
    if (!parsed.success) {
      throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, "Invalid session ID.");
    }
    const result = await sessionService.closeSession(
      parsed.data,
      staff.id,
      requireIdempotencyKey(req),
    );
    sendSuccessResponse(res, result.statusCode, result.data, "Session closed successfully");
  } catch (error) {
    next(error);
  }
}
