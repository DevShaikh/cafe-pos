import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import AppError from "../utils/app-error";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  next,
) => {
  void next;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        issues: error.issues.map(({ path, message }) => ({
          path: path.join("."),
          message,
        })),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error(error);
    }

    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  if (isMalformedJsonError(error)) {
    response.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body must contain valid JSON.",
      },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
};

function isMalformedJsonError(
  error: unknown,
): error is { type: "entity.parse.failed" } {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  );
}
