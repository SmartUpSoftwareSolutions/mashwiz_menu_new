import { Router } from "express";
import * as promotionsController from "./controller/promotions.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/active", promotionsController.getActivePromotions);
router.get("/", auth(), promotionsController.getAllPromotions);
router.post("/", auth(), promotionsController.createPromotion);
router.patch("/:id", auth(), promotionsController.updatePromotion);
router.delete("/:id", auth(), promotionsController.deletePromotion);

export default router;
