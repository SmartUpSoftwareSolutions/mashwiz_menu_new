import { api } from "@/lib/apiClient";

export interface ButtonClick {
  id: string;
  button_name: string;
  clicked_at: string;
  user_id: string | null;
  created_at: string;
}

export interface ButtonClickStats {
  button_name: string;
  total_clicks: number;
  last_clicked: string | null;
  daily_clicks: Array<{ date: string; clicks: number }>;
}

export const logButtonClick = async (buttonName: string, userId?: string): Promise<void> => {
  try {
    await api.post("/api/analytics/button-clicks", { button_name: buttonName, user_id: userId ?? null });
  } catch (error) {
    console.error("Error logging button click:", error);
  }
};

export const fetchButtonClickAnalytics = async (
  startDate?: string,
  endDate?: string,
  buttonName?: string
): Promise<ButtonClickStats[]> => {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (buttonName && buttonName !== "all") params.set("buttonName", buttonName);

  const query = params.toString() ? `?${params}` : "";
  const res = await api.get<{ success: boolean; data: ButtonClickStats[] }>(
    `/api/analytics/button-clicks${query}`
  );
  return res.data ?? [];
};

export const fetchButtonClickChartData = async (
  startDate?: string,
  endDate?: string,
  groupBy: "day" | "week" | "month" = "day"
): Promise<Array<{ date: string; [key: string]: unknown }>> => {
  const params = new URLSearchParams({ groupBy });
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  const res = await api.get<{ success: boolean; data: Array<{ date: string; [key: string]: unknown }> }>(
    `/api/analytics/button-clicks/chart?${params}`
  );
  return res.data ?? [];
};
