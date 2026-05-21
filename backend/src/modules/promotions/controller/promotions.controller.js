import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

export const getActivePromotions = asyncHandler(async (_req, res) => {
  const today = new Date();
  const data = await prisma.promotion.findMany({
    where: {
      is_active: true,
      date_from: { lte: today },
      date_to: { gte: today },
    },
    orderBy: { created_at: "desc" },
  });
  res.json({ success: true, data });
});

export const getAllPromotions = asyncHandler(async (_req, res) => {
  const data = await prisma.promotion.findMany({ orderBy: { created_at: "desc" } });
  res.json({ success: true, data });
});

export const createPromotion = asyncHandler(async (req, res) => {
  const { title, image_url, amount, date_from, date_to, is_active } = req.body;
  const data = await prisma.promotion.create({
    data: {
      title: title ?? null,
      image_url,
      amount: amount ?? null,
      date_from: new Date(date_from),
      date_to: new Date(date_to),
      is_active: is_active ?? true,
    },
  });
  res.status(201).json({ success: true, data });
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, image_url, amount, date_from, date_to, is_active } = req.body;
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (image_url !== undefined) updateData.image_url = image_url;
  if (amount !== undefined) updateData.amount = amount;
  if (date_from !== undefined) updateData.date_from = new Date(date_from);
  if (date_to !== undefined) updateData.date_to = new Date(date_to);
  if (is_active !== undefined) updateData.is_active = is_active;
  const data = await prisma.promotion.update({ where: { id }, data: updateData });
  res.json({ success: true, data });
});

export const deletePromotion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.promotion.delete({ where: { id } });
  res.json({ success: true });
});
