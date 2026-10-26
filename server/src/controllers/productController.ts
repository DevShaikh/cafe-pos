import type { NextFunction, Request, Response } from "express";
import { sendSuccessResponse } from "../utils/responseHandler";

import * as productService from "../services/product.service";

export const getProducts = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await productService.getProducts();
    sendSuccessResponse(res, 200, products, "Products retrieved successfully");
  } catch (error) {
    next(error);
  }
};
