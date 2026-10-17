/**
 * @file src/utils/responseHandler.ts
 * @description Utility functions for sending standardized API responses.
 */

import { Response } from "express";

interface SuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data?: T;
}

/**
 * Sends a standardized success JSON response.
 * @param res Express Response object.
 * @param statusCode HTTP status code (e.g., 200, 201).
 * @param data The actual data payload to send.
 * @param message An optional success message.
 */
export const sendSuccessResponse = <T>(
  res: Response,
  statusCode: number,
  data?: T,
  message?: string,
): void => {
  const responseBody: SuccessResponse<T> = {
    success: true,
  };

  if (message) {
    responseBody.message = message;
  }

  if (data !== undefined) {
    responseBody.data = data;
  }

  res.status(statusCode).json(responseBody);
};
