import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "../constants/error-codes";
import {
  createExpenseSchema,
  listExpensesQuerySchema,
} from "../schemas/expense";
import * as expenseService from "../services/expense.service";
import AppError from "../utils/app-error";
import { sendSuccessResponse } from "../utils/responseHandler";

function requireStaff(req: Request) {
  if (!req.authenticatedStaff) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, "Authentication is required.");
  }
  return req.authenticatedStaff;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listExpensesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        parsed.error.issues[0]?.message ?? "Invalid expense filters.",
      );
    }

    const result = await expenseService.listExpenses(parsed.data);
    sendSuccessResponse(res, 200, result, "Expenses retrieved successfully");
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const staff = requireStaff(req);
    const parsed = createExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        parsed.error.issues[0]?.message ?? "Invalid expense details.",
      );
    }

    const expense = await expenseService.createExpense(parsed.data, staff.id);
    sendSuccessResponse(res, 201, expense, "Expense recorded successfully");
  } catch (error) {
    next(error);
  }
}
