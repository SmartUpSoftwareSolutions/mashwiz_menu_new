import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

export const getCustomers = asyncHandler(async (_req, res) => {
  const data = await prisma.customerDetails.findMany({ orderBy: { created_at: "desc" } });
  res.json({ success: true, data });
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { first_name, last_name, email, phone, notes } = req.body;
  const data = await prisma.customerDetails.create({
    data: { first_name, last_name, email: email ?? null, phone: phone ?? null, notes: notes ?? null },
  });
  res.status(201).json({ success: true, data });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, notes } = req.body;
  const data = await prisma.customerDetails.update({
    where: { id },
    data: { first_name, last_name, email: email ?? null, phone: phone ?? null, notes: notes ?? null },
  });
  res.json({ success: true, data });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.customerDetails.delete({ where: { id } });
  res.json({ success: true });
});
