import { Router } from "express";
import * as expenseController from "../controllers/expense.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

router.use(requireAuth);
router.get("/", expenseController.list);
router.post("/", expenseController.create);

export default router;
