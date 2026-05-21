import { Router } from "express";
import * as analyticsController from "./controller/analytics.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/button-clicks", analyticsController.logButtonClick);
router.get("/button-clicks", auth(), analyticsController.getButtonClickAnalytics);
router.get("/button-clicks/chart", auth(), analyticsController.getButtonClickChartData);

export default router;
