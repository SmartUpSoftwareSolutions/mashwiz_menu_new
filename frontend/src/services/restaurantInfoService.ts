import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/apiClient";

export interface RestaurantInfo {
  style: string;
  branch_code: string;
  id: string;
  name: string;
  slogan: string | null;
  footer: string | null;
  footer_ar: string | null;
  created_at: string;
  updated_at: string;
  logo_url: string | null;
  logo_blob: string | null;
  theme_id: string | null;
  show_all_category: boolean;
}

export const fetchRestaurantInfo = async (): Promise<RestaurantInfo | null> => {
  try {
    const res = await api.get<{ success: boolean; data: RestaurantInfo | null }>("/api/restaurant");
    return res.data ?? null;
  } catch (error) {
    console.error("Error fetching restaurant info:", error);
    return null;
  }
};

export const updateRestaurantInfo = async (
  name: string,
  slogan: string | null,
  logoUrl: string | null,
  removeLogo: boolean,
  themeId: string | null,
  show_all_category: boolean,
  branch_code: string | null,
  style: string | null,
  footer: string | null,
  footer_ar: string | null = null
): Promise<RestaurantInfo> => {
  const body: Record<string, unknown> = {
    name,
    slogan,
    footer,
    footer_ar,
    show_all_category,
    branch_code,
    style: style ?? "",
    theme_id: themeId,
  };

  if (removeLogo) {
    body.logo_url = null;
  } else if (logoUrl !== null) {
    body.logo_url = logoUrl;
  }

  const res = await api.patch<{ success: boolean; data: RestaurantInfo }>("/api/restaurant", body);
  return res.data;
};

export const useRestaurantInfo = () =>
  useQuery({
    queryKey: ["restaurantInfo"],
    queryFn: fetchRestaurantInfo,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

export const useSaveRestaurantInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name, slogan, logoUrl, removeLogo, themeId,
      show_all_category, branch_code, style, footer, footer_ar,
    }: {
      name: string; slogan: string | null; logoUrl: string | null;
      removeLogo: boolean; themeId: string | null; show_all_category: boolean;
      branch_code: string | null; style: string | null;
      footer: string | null; footer_ar: string | null;
    }) =>
      updateRestaurantInfo(name, slogan, logoUrl, removeLogo, themeId, show_all_category, branch_code, style, footer, footer_ar),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantInfo"] });
    },
  });
};

export const handleSaveRestaurantInfo = async (
  name: string,
  slogan: string | null,
  file: File | null,
  removeLogo: boolean = false,
  themeId: string | null = null,
  _dbName: string | null = null,
  showAllCategory: boolean = true,
  branch_code: string | null,
  style: string | null
) => {
  let logoUrl: string | null = null;

  if (file && !removeLogo) {
    const formData = new FormData();
    formData.append("image", file);
    const uploadResponse = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/image/uploadImage`,
      formData,
      { withCredentials: true }
    );
    logoUrl = uploadResponse.data.fileUrls[0];
    if (!logoUrl) throw new Error("No file URL returned from upload");
  }

  return updateRestaurantInfo(name, slogan, removeLogo ? null : logoUrl, removeLogo, themeId, showAllCategory, branch_code, style, null, null);
};
