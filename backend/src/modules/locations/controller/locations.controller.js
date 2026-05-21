import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

export const getLocations = asyncHandler(async (_req, res) => {
  const data = await prisma.location.findMany({ orderBy: { name: "asc" } });
  res.json({ success: true, data });
});

export const createLocation = asyncHandler(async (req, res) => {
  const { name, address, city, map_link, phone, is_open_24_7, working_hours } = req.body;
  const data = await prisma.location.create({
    data: { name, address, city, map_link, phone: phone ?? null, is_open_24_7: is_open_24_7 ?? false, working_hours: working_hours ?? [] },
  });
  res.status(201).json({ success: true, data });
});

export const updateLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, address, city, map_link, phone, is_open_24_7, working_hours, location_order } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (address !== undefined) updateData.address = address;
  if (city !== undefined) updateData.city = city;
  if (map_link !== undefined) updateData.map_link = map_link;
  if (phone !== undefined) updateData.phone = phone ?? null;
  if (is_open_24_7 !== undefined) updateData.is_open_24_7 = is_open_24_7;
  if (working_hours !== undefined) updateData.working_hours = working_hours;
  if (location_order !== undefined) updateData.location_order = location_order;
  const data = await prisma.location.update({ where: { id }, data: updateData });
  res.json({ success: true, data });
});

export const deleteLocation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.location.delete({ where: { id } });
  res.json({ success: true });
});
