import type { NextFunction, Request, Response } from "express";
import { sendSuccessResponse } from "../utils/responseHandler";
import {
  categoryIdSchema,
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/product";
import * as productService from "../services/product.service";

export const list = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categories = await productService.listCategories();
    sendSuccessResponse(
      res,
      200,
      categories,
      "Categories retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
};

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name } = createCategorySchema.parse(req.body);
    const category = await productService.createCategory(name);
    sendSuccessResponse(res, 201, category, "Category created successfully");
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = categoryIdSchema.parse(req.params.id);
    const { name } = updateCategorySchema.parse(req.body);
    const category = await productService.updateCategory(id, name);
    sendSuccessResponse(res, 200, category, "Category updated successfully");
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = categoryIdSchema.parse(req.params.id);
    const result = await productService.deleteCategory(id);
    sendSuccessResponse(res, 200, result, "Category deleted successfully");
  } catch (error) {
    next(error);
  }
};
