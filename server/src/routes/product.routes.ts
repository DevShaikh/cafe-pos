import { Router } from "express";

import * as productController from "../controllers/product.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

// Product data is available only to an authenticated staff member.
router.use(requireAuth);
router.get("/", productController.getProducts);

export default router;
