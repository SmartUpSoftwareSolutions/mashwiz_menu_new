import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

export const getBranches = asyncHandler(async (_req, res) => {
  const data = await prisma.branch.findMany({ orderBy: { code: "asc" } });
  res.json({ success: true, data });
});

export const getItemBranchCodes = asyncHandler(async (_req, res) => {
  const rows = await prisma.itemMaster.findMany({
    where: { branch_code: { not: null } },
    select: { branch_code: true },
    distinct: ["branch_code"],
  });
  const codes = [...new Set(rows.map((r) => r.branch_code?.trim()).filter(Boolean))].sort();
  res.json({ success: true, data: codes });
});

export const createBranch = asyncHandler(async (req, res) => {
  const { code, name, name_ar } = req.body;
  const data = await prisma.branch.create({
    data: { code: code.trim().toUpperCase(), name: name.trim(), name_ar: name_ar?.trim() || null },
  });
  res.status(201).json({ success: true, data });
});

export const updateBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, name_ar } = req.body;
  const data = await prisma.branch.update({
    where: { id },
    data: { name: name.trim(), name_ar: name_ar?.trim() || null },
  });
  res.json({ success: true, data });
});

export const deleteBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.branch.delete({ where: { id } });
  res.json({ success: true });
});
