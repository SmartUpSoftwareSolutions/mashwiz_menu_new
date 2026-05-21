import { Router } from "express";
import * as socialLinksController from "./controller/social-links.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/", socialLinksController.getSocialLinks);
router.post("/", auth(), socialLinksController.createSocialLink);
router.patch("/:id", auth(), socialLinksController.updateSocialLink);
router.delete("/:id", auth(), socialLinksController.deleteSocialLink);

export default router;
