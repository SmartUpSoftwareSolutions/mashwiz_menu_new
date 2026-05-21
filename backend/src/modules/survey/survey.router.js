import { Router } from "express";
import * as surveyController from "./controller/survey.controller.js";
import { auth } from "../../middleware/auth.middleware.js";

const router = Router();

router.get("/settings", surveyController.getSurveySettings);
router.post("/settings", auth(), surveyController.upsertSurveySettings);
router.patch("/settings", auth(), surveyController.upsertSurveySettings);

router.get("/questions/active", surveyController.getActiveQuestions);
router.get("/questions", auth(), surveyController.getAllQuestions);
router.post("/questions", auth(), surveyController.createQuestion);
router.patch("/questions/:id", auth(), surveyController.updateQuestion);
router.delete("/questions/:id", auth(), surveyController.deleteQuestion);

router.post("/responses", surveyController.submitSurvey);
router.get("/responses", auth(), surveyController.getAllResponses);
router.delete("/responses/session/:session_id", auth(), surveyController.deleteResponseSession);

export default router;
