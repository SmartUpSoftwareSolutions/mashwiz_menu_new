import { Router } from "express";
import * as restaurantController from "./controller/restaurant.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", restaurantController.getRestaurantInfo);
router.post("/", auth(), restaurantController.upsertRestaurantInfo);
router.patch("/", auth(), restaurantController.upsertRestaurantInfo);

export default router;
