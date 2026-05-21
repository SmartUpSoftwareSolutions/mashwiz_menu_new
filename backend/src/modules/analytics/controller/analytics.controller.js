import { asyncHandler } from "../../../utils/errorHandling.js";
import { prisma } from "../../../utils/prismaClient.js";

export const logButtonClick = asyncHandler(async (req, res) => {
  const { button_name, user_id } = req.body;
  await prisma.buttonClick.create({
    data: { button_name, user_id: user_id ?? null },
  });
  res.status(201).json({ success: true });
});

export const getButtonClickAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, buttonName } = req.query;

  const where = {};
  if (startDate) where.clicked_at = { ...where.clicked_at, gte: new Date(startDate) };
  if (endDate) where.clicked_at = { ...where.clicked_at, lte: new Date(endDate) };
  if (buttonName && buttonName !== "all") where.button_name = buttonName;

  const clicks = await prisma.buttonClick.findMany({
    where,
    orderBy: { clicked_at: "desc" },
  });

  const statsMap = new Map();
  for (const click of clicks) {
    const name = click.button_name;
    const dateKey = click.clicked_at.toISOString().split("T")[0];

    if (!statsMap.has(name)) {
      statsMap.set(name, { button_name: name, total_clicks: 0, last_clicked: null, daily_clicks: [] });
    }

    const stats = statsMap.get(name);
    stats.total_clicks++;
    if (!stats.last_clicked || click.clicked_at > new Date(stats.last_clicked)) {
      stats.last_clicked = click.clicked_at.toISOString();
    }

    const daily = stats.daily_clicks.find((d) => d.date === dateKey);
    if (daily) daily.clicks++;
    else stats.daily_clicks.push({ date: dateKey, clicks: 1 });
  }

  statsMap.forEach((s) => s.daily_clicks.sort((a, b) => a.date.localeCompare(b.date)));

  const data = [...statsMap.values()].sort((a, b) => b.total_clicks - a.total_clicks);
  res.json({ success: true, data });
});

export const getButtonClickChartData = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = "day" } = req.query;

  const where = {};
  if (startDate) where.clicked_at = { ...where.clicked_at, gte: new Date(startDate) };
  if (endDate) where.clicked_at = { ...where.clicked_at, lte: new Date(endDate) };

  const clicks = await prisma.buttonClick.findMany({
    where,
    select: { button_name: true, clicked_at: true },
    orderBy: { clicked_at: "asc" },
  });

  const chartData = new Map();
  for (const click of clicks) {
    const date = click.clicked_at;
    let dateKey;
    if (groupBy === "week") {
      const ws = new Date(date);
      ws.setDate(date.getDate() - date.getDay());
      dateKey = ws.toISOString().split("T")[0];
    } else if (groupBy === "month") {
      dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    } else {
      dateKey = date.toISOString().split("T")[0];
    }

    if (!chartData.has(dateKey)) chartData.set(dateKey, { date: dateKey });
    const day = chartData.get(dateKey);
    day[click.button_name] = (day[click.button_name] || 0) + 1;
  }

  const data = [...chartData.values()].sort((a, b) => a.date.localeCompare(b.date));
  res.json({ success: true, data });
});
