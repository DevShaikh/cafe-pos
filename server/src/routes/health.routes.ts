import { Router } from "express";

import * as healthController from "../controllers/healthController";

const router = Router();

// Check that the API is up and can reach the database
router.get("/", healthController.checkHealth);

export default router;
