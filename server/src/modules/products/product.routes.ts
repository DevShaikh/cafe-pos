import { Router } from "express";
import {
  createGetProductController,
  createListProductsController,
  createProductController,
} from "./product.controller.js";
import type { ProductServiceContract } from "./product.service.js";

export function createProductRoutes(products: ProductServiceContract): Router {
  const router = Router();

  router.get("/", createListProductsController(products));
  router.get("/:id", createGetProductController(products));
  router.post("/", createProductController(products));

  return router;
}
