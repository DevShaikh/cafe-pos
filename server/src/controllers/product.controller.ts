import type { NextFunction, Request, Response } from "express";
import { ERROR_CODES } from "../constants/error-codes";
import { sendSuccessResponse } from "../utils/responseHandler";
import * as productService from "../services/product.service";
import {
  createProductSchema,
  productIdSchema,
  productListQuerySchema,
  updateProductSchema,
} from "../schemas/product";
import AppError from "../utils/app-error";

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

export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = productIdSchema.parse(req.params.id);
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "Choose an image file to upload.",
      );
    }

    const product = await productService.uploadProductImage(id, req.body);
    sendSuccessResponse(res, 200, product, "Product image uploaded successfully");
  } catch (error) {
    next(error);
  }
};

export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = productIdSchema.parse(req.params.id);
    const product = await productService.deleteProductImage(id);
    sendSuccessResponse(res, 200, product, "Product image removed successfully");
  } catch (error) {
    next(error);
  }
};

export const getProductImage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const filename = req.params.filename;
  const imagePath = productService.getProductImage(filename);
  if (!imagePath) {
    next(new AppError(404, ERROR_CODES.NOT_FOUND, "Product image not found."));
    return;
  }

  res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
  res.sendFile(imagePath, (error) => {
    if (error && !res.headersSent) {
      next(new AppError(404, ERROR_CODES.NOT_FOUND, "Product image not found."));
    }
  });
};
