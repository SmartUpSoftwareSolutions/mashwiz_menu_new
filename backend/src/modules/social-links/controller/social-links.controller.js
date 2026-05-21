import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

export const getSocialLinks = asyncHandler(async (_req, res) => {
  const data = await prisma.socialLink.findMany({ orderBy: { platform: "asc" } });
  res.json({ success: true, data });
});

export const createSocialLink = asyncHandler(async (req, res) => {
  const { platform, url, bgColor, textColor, borderColor, links_order } = req.body;
  const data = await prisma.socialLink.create({
    data: {
      id: crypto.randomUUID(),
      platform,
      url,
      bgColor: bgColor ?? null,
      textColor: textColor ?? null,
      borderColor: borderColor ?? null,
      links_order: links_order ?? null,
    },
  });
  res.status(201).json({ success: true, data });
});

export const updateSocialLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { platform, url, bgColor, textColor, borderColor, links_order } = req.body;
  const updateData = {};
  if (platform !== undefined) updateData.platform = platform;
  if (url !== undefined) updateData.url = url;
  if (bgColor !== undefined) updateData.bgColor = bgColor;
  if (textColor !== undefined) updateData.textColor = textColor;
  if (borderColor !== undefined) updateData.borderColor = borderColor;
  if (links_order !== undefined) updateData.links_order = links_order;
  const data = await prisma.socialLink.update({ where: { id }, data: updateData });
  res.json({ success: true, data });
});

export const deleteSocialLink = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.socialLink.delete({ where: { id } });
  res.json({ success: true });
});
