import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export interface TagsInfo {
  id: string;
  fasting: string | null;
  vegetarian: string | null;
  healthy_choice: string | null;
  signature_dish: string | null;
  spicy: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchTagsInfo = async (): Promise<TagsInfo | null> => {
  try {
    const res = await api.get<{ success: boolean; data: TagsInfo | null }>("/api/tags");
    return res.data ?? null;
  } catch (error) {
    console.error("Error fetching tags info:", error);
    return null;
  }
};

export const updateTagsInfo = async (
  fasting: string | null,
  vegetarian: string | null,
  healthy_choice: string | null,
  signature_dish: string | null,
  spicy: string | null
): Promise<TagsInfo> => {
  const res = await api.patch<{ success: boolean; data: TagsInfo }>("/api/tags", {
    fasting, vegetarian, healthy_choice, signature_dish, spicy,
  });
  return res.data;
};

export const useTagsInfo = () =>
  useQuery({ queryKey: ["tagsInfo"], queryFn: fetchTagsInfo, staleTime: 1000 * 60 * 5, retry: 1 });

export const useSaveTagsInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fasting, vegetarian, healthy_choice, signature_dish, spicy,
    }: {
      fasting: string | null; vegetarian: string | null;
      healthy_choice: string | null; signature_dish: string | null; spicy: string | null;
    }) => updateTagsInfo(fasting, vegetarian, healthy_choice, signature_dish, spicy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tagsInfo"] }),
  });
};

export const handleSaveTagsInfo = async (
  fasting: string | null = null,
  vegetarian: string | null = null,
  healthy_choice: string | null = null,
  signature_dish: string | null = null,
  spicy: string | null = null
) => updateTagsInfo(fasting, vegetarian, healthy_choice, signature_dish, spicy);
