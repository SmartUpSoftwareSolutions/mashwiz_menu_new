import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRestaurantInfo,
  updateRestaurantInfo,
  RestaurantInfo,
} from "../services/restaurantInfoService.ts";

// Fetch hook
export const useRestaurantInfo = () =>
  useQuery({
    queryKey: ["restaurantInfo"],
    queryFn: fetchRestaurantInfo,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

// Save/mutation hook
export const useSaveRestaurantInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      slogan,
      logoUrl,
      removeLogo,
      themeId,
      show_all_category,
      branch_code,
      style
    }: {
      name: string;
      slogan: string | null;
      logoUrl?: string | null;
      removeLogo?: boolean;
      themeId?: string | null;
      show_all_category?: boolean;
      branch_code?: string | null;
      style?: string | null;
    }) => {
      return await updateRestaurantInfo(
        name, 
        slogan, 
        logoUrl ?? null, 
        removeLogo ?? false, 
        themeId ?? null,
        show_all_category ?? true,
        branch_code ?? null,
        style ?? null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantInfo"] });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });
};
