import { Router } from "express";

import * as healthController from "../controllers/healthController";

const router = Router();

// Get user's current XP balance
router.get("/", healthController.checkHealth);

export default router;
