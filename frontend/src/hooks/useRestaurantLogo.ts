import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

const DEFAULT_LOGO_PATH = "/smartlogo.png";

const normalizeLogoUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return null;
};

export function useRestaurantLogo() {
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_PATH);

  useEffect(() => {
    api
      .get<{ success: boolean; data: { logo_url?: string | null } | null }>("/api/restaurant")
      .then((res) => {
        const normalized = normalizeLogoUrl(res.data?.logo_url);
        setLogoUrl(normalized ?? DEFAULT_LOGO_PATH);
      })
      .catch(() => setLogoUrl(DEFAULT_LOGO_PATH));
  }, []);

  return logoUrl;
}
