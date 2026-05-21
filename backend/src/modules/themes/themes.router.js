import { Router } from "express";
import * as themesController from "./controller/themes.controller.js";

const router = Router();

router.get("/", themesController.getThemes);

export default router;
