import { Router } from "express";
import * as imageController from "./controller/image.controller.js";

const router = Router();

router.post("/uploadImage", imageController.uploadImage);
router.get("/getImage", imageController.getImage);

export default router;