import { Router } from "express";
import { getSales } from "../controllers/reports.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

router.use(requireAuth);
router.get("/sales", getSales);

export default router;
