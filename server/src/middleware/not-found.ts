import type { RequestHandler } from "express";
import AppError from "../utils/app-error";
import { ERROR_CODES } from "../constants/error-codes";

export const notFound: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, ERROR_CODES.ROUTE_NOT_FOUND, "Route was not found."));
};
