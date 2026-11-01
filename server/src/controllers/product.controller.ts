import type { NextFunction, Request, Response } from "express";
import { sendSuccessResponse } from "../utils/responseHandler";
import * as productService from "../services/product.service";
import {
  createProductSchema,
  productIdSchema,
  productListQuerySchema,
  updateProductSchema,
} from "../schemas/product";

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

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = createProductSchema.parse(req.body);
    const product = await productService.createProduct(input);
    sendSuccessResponse(res, 201, product, "Product created successfully");
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = productIdSchema.parse(req.params.id);
    const input = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(id, input);
    sendSuccessResponse(res, 200, product, "Product updated successfully");
  } catch (error) {
    next(error);
  }
};
