import type { RequestHandler } from "express";
import { createProductSchema, productIdSchema, productListQuerySchema } from "./product.schemas.js";
import type { ProductServiceContract } from "./product.service.js";

export function createListProductsController(
  products: ProductServiceContract,
): RequestHandler {
  return async (request, response) => {
    const query = productListQuerySchema.parse(request.query);
    const records = await products.list(query);
    response.status(200).json({ data: records });
  };
}

export function createGetProductController(
  products: ProductServiceContract,
): RequestHandler {
  return async (request, response) => {
    const id = productIdSchema.parse(request.params.id);
    const product = await products.getById(id);
    response.status(200).json({ data: product });
  };
}

export function createProductController(
  products: ProductServiceContract,
): RequestHandler {
  return async (request, response) => {
    const input = createProductSchema.parse(request.body);
    const product = await products.create(input);
    response.status(201).json({ data: product });
  };
}
