import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";

export interface PublicBranch {
  code: string;
  name: string;
  name_ar?: string | null;
  address?: string;
  city?: string;
}

export const fetchMenuBranches = async (): Promise<PublicBranch[]> => {
  try {
    const res = await api.get<{ success: boolean; data: Array<{ code: string; name: string; name_ar?: string | null }> }>("/api/branches");
    const branches = (res.data ?? []).map((b) => ({ code: b.code, name: b.name, name_ar: b.name_ar ?? null }));
    if (branches.length > 0) return branches;
  } catch {
    // fall through
  }

  // Fallback: distinct branch codes from item_master
  try {
    const res2 = await api.get<{ success: boolean; data: string[] }>("/api/branches/item-codes");
    return (res2.data ?? []).map((code) => ({ code, name: code }));
  } catch {
    return [];
  }
};

export const useMenuBranches = () =>
  useQuery({ queryKey: ["menuBranches"], queryFn: fetchMenuBranches, staleTime: 1000 * 60 * 5 });
