import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

export const getTags = asyncHandler(async (_req, res) => {
  const data = await prisma.tags.findFirst();
  res.json({ success: true, data: data ?? null });
});

export const upsertTags = asyncHandler(async (req, res) => {
  const { fasting, vegetarian, healthy_choice, signature_dish, spicy } = req.body;
  const existing = await prisma.tags.findFirst({ select: { id: true } });

  let data;
  if (existing?.id) {
    data = await prisma.tags.update({
      where: { id: existing.id },
      data: { fasting, vegetarian, healthy_choice, signature_dish, spicy },
    });
  } else {
    data = await prisma.tags.create({
      data: { id: crypto.randomUUID(), fasting, vegetarian, healthy_choice, signature_dish, spicy },
    });
  }
  res.json({ success: true, data });
});
