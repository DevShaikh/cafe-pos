import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

router.use(requireAuth);
router.get("/", orderController.listOrders);
router.post("/", orderController.createOrder);
router.get("/:id", orderController.getOrder);
router.post("/:id/payments", orderController.recordPayment);

export default router;
