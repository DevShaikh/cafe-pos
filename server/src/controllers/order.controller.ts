import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";
import { ERROR_CODES } from "../constants/error-codes";
import * as orderService from "../services/order.service";
import {
  createOrderSchema,
  idempotencyKeySchema,
  listOrdersQuerySchema,
  orderIdSchema,
  recordPaymentSchema,
} from "../schemas/order";
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

function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new AppError(400, ERROR_CODES.VALIDATION_ERROR, parsed.error?.issues[0]?.message ?? "Invalid input.");
  }
  return parsed.data as T;
}

export async function listOrders(req: Request, res: Response, next: NextFunction) {
  try {
    requireStaff(req);
    const query = validate(listOrdersQuerySchema, req.query);
    const page = await orderService.listOrders(query);
    sendSuccessResponse(res, 200, page, "Orders retrieved successfully");
  } catch (error) {
    next(error);
  }
}

export async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    requireStaff(req);
    const id = validate(orderIdSchema, req.params.id);
    const order = await orderService.getOrder(id);
    sendSuccessResponse(res, 200, order, "Order retrieved successfully");
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = requireStaff(req);
    const input = validate(createOrderSchema, req.body);
    const key = requireIdempotencyKey(req);
    const result = await orderService.createOrder(input, staff.id, key);
    sendSuccessResponse(res, result.statusCode, result.data, "Order created successfully");
  } catch (error) {
    next(error);
  }
}

export async function recordPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = requireStaff(req);
    const orderId = validate(orderIdSchema, req.params.id);
    const input = validate(recordPaymentSchema, req.body);
    const key = requireIdempotencyKey(req);
    const result = await orderService.recordPayment(orderId, input, staff.id, key);
    sendSuccessResponse(res, result.statusCode, result.data, "Payment recorded successfully");
  } catch (error) {
    next(error);
  }
}
