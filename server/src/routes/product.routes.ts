import { Router } from "express";

import * as productController from "../controllers/productController";

const router = Router();

// Check that the API is up and can reach the database
router.get("/", productController.getProducts);

export default router;
