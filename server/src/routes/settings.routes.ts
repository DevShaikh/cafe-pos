import { Router } from "express";
import * as settingsController from "../controllers/settings.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

router.use(requireAuth);
router.get("/tax", settingsController.getTaxSettings);
router.patch("/tax", settingsController.updateTaxSettings);

export default router;
