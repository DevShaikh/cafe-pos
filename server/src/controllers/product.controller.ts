import type { NextFunction, Request, Response } from "express";
import { sendSuccessResponse } from "../utils/responseHandler";
import * as productService from "../services/product.service";
import { productListQuerySchema } from "../schemas/product";

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = productListQuerySchema.parse(req.query);

    const products = await productService.getProducts({
      search: query.search,
      category: query.category ?? null,
      includeUnavailable: query.includeUnavailable === "true",
    });

    sendSuccessResponse(res, 200, products, "Products retrieved successfully");
  } catch (error) {
    next(error);
  }
};
