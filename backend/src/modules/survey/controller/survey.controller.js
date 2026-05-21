import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

export const getSurveySettings = asyncHandler(async (_req, res) => {
  const data = await prisma.surveySettings.findFirst();
  res.json({ success: true, data: data ?? null });
});

export const upsertSurveySettings = asyncHandler(async (req, res) => {
  const { description_en, description_ar, is_active } = req.body;
  const existing = await prisma.surveySettings.findFirst({ select: { id: true } });

  let data;
  if (existing?.id) {
    data = await prisma.surveySettings.update({
      where: { id: existing.id },
      data: { description_en, description_ar, is_active },
    });
  } else {
    data = await prisma.surveySettings.create({
      data: {
        description_en: description_en ?? "Help us improve by sharing your feedback. Your opinion matters!",
        description_ar: description_ar ?? "ساعدنا في التحسين من خلال مشاركة ملاحظاتك. رأيك يهمنا!",
        is_active: is_active ?? true,
      },
    });
  }
  res.json({ success: true, data });
});

export const getActiveQuestions = asyncHandler(async (_req, res) => {
  const data = await prisma.surveyQuestion.findMany({
    where: { is_active: true },
    orderBy: { display_order: "asc" },
  });
  res.json({ success: true, data });
});

export const getAllQuestions = asyncHandler(async (_req, res) => {
  const data = await prisma.surveyQuestion.findMany({ orderBy: { display_order: "asc" } });
  res.json({ success: true, data });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const { question_en, question_ar, question_type, choices, is_active, display_order } = req.body;
  const data = await prisma.surveyQuestion.create({
    data: { question_en, question_ar, question_type: question_type ?? "rating", choices: choices ?? null, is_active: is_active ?? true, display_order: display_order ?? 0 },
  });
  res.status(201).json({ success: true, data });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question_en, question_ar, question_type, choices, is_active, display_order } = req.body;
  const updateData = {};
  if (question_en !== undefined) updateData.question_en = question_en;
  if (question_ar !== undefined) updateData.question_ar = question_ar;
  if (question_type !== undefined) updateData.question_type = question_type;
  if (choices !== undefined) updateData.choices = choices;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (display_order !== undefined) updateData.display_order = display_order;
  const data = await prisma.surveyQuestion.update({ where: { id }, data: updateData });
  res.json({ success: true, data });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.surveyQuestion.delete({ where: { id } });
  res.json({ success: true });
});

export const submitSurvey = asyncHandler(async (req, res) => {
  const { customer_name, customer_email, customer_phone, responses } = req.body;
  const session_id = crypto.randomUUID();

  const records = (responses ?? []).map((r) => ({
    question_id: r.question_id,
    rating: r.rating ?? null,
    text_response: r.text_response ?? null,
    selected_choice: r.selected_choice ?? null,
    customer_name: customer_name ?? null,
    customer_email: customer_email ?? null,
    customer_phone: customer_phone ?? null,
    session_id,
  }));

  await prisma.surveyResponse.createMany({ data: records });
  res.status(201).json({ success: true, session_id });
});

export const getAllResponses = asyncHandler(async (_req, res) => {
  const data = await prisma.surveyResponse.findMany({
    include: { question: true },
    orderBy: { created_at: "desc" },
  });
  res.json({ success: true, data });
});

export const deleteResponseSession = asyncHandler(async (req, res) => {
  const { session_id } = req.params;
  await prisma.surveyResponse.deleteMany({ where: { session_id } });
  res.json({ success: true });
});
