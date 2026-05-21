import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

export const getThemes = asyncHandler(async (_req, res) => {
  const data = await prisma.webTheme.findMany({ orderBy: { theme_name: "asc" } });
  res.json({ success: true, data });
});
