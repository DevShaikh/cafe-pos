import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { loginRateLimit } from "../middleware/login-rate-limit";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

router.get("/staff", authController.getActiveStaff);
router.get("/setup-status", authController.getSetupStatus);
router.post("/setup", loginRateLimit, authController.setup);
router.post("/login", loginRateLimit, authController.login);
router.post("/logout", authController.logout);
router.get("/me", requireAuth, authController.getCurrentStaff);

export default router;
