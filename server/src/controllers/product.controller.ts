import type { NextFunction, Request, Response } from "express";
import { sendSuccessResponse } from "../utils/responseHandler";
import * as productService from "../services/product.service";

export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Extract search query and category filter from URL parameters
    const searchQuery = (req.query.search as string) || "";
    const categoryFilter = (req.query.category as string) || null;

    const products = await productService.getProducts({
      search: searchQuery,
      category: categoryFilter,
    });

    sendSuccessResponse(res, 200, products, "Products retrieved successfully");
  } catch (error) {
    next(error);
  }
};
