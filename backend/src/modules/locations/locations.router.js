import { Router } from "express";
import * as locationsController from "./controller/locations.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", locationsController.getLocations);
router.post("/", auth(), locationsController.createLocation);
router.patch("/:id", auth(), locationsController.updateLocation);
router.delete("/:id", auth(), locationsController.deleteLocation);

export default router;
