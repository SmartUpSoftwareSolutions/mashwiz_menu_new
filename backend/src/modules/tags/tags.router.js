import { Router } from "express";
import * as tagsController from "./controller/tags.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", tagsController.getTags);
router.post("/", auth(), tagsController.upsertTags);
router.patch("/", auth(), tagsController.upsertTags);

export default router;
