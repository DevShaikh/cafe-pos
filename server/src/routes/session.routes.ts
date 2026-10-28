import { Router } from "express";
import * as sessionController from "../controllers/session.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

router.use(requireAuth);
router.get("/current", sessionController.getCurrent);
router.get("/", sessionController.list);
router.post("/", sessionController.open);
router.post("/:id/close", sessionController.close);

export default router;
