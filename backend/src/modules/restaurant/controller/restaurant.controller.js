import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

export const getRestaurantInfo = asyncHandler(async (_req, res) => {
  const data = await prisma.restaurantInfo.findFirst();
  res.json({ success: true, data: data ?? null });
});

export const upsertRestaurantInfo = asyncHandler(async (req, res) => {
  const {
    name,
    slogan,
    footer,
    footer_ar,
    logo_url,
    theme_id,
    show_all_category,
    branch_code,
    style,
  } = req.body;

  const existing = await prisma.restaurantInfo.findFirst({ select: { id: true } });

  let data;
  if (existing?.id) {
    const updateData = { name, slogan, footer, footer_ar, show_all_category, branch_code, style: style ?? "" };
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (theme_id !== undefined) updateData.theme_id = theme_id;

    data = await prisma.restaurantInfo.update({
      where: { id: existing.id },
      data: updateData,
    });
  } else {
    data = await prisma.restaurantInfo.create({
      data: {
        name,
        slogan,
        footer,
        footer_ar,
        logo_url: logo_url ?? null,
        theme_id: theme_id ?? null,
        show_all_category: show_all_category ?? true,
        branch_code: branch_code ?? null,
        style: style ?? "",
      },
    });
  }

  res.json({ success: true, data });
});
