import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { requireAuth } from "../middleware/require-auth";

const router = Router();

router.use(requireAuth);
router.get("/", categoryController.list);
router.post("/", categoryController.create);
router.patch("/:id", categoryController.update);
router.delete("/:id", categoryController.remove);

export default router;
