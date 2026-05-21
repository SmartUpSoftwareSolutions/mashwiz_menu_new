import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuItem {
  order: number;
  id: string;
  name: string;
  itemOrder?: number;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: string;
  sales_price?: string;
  category: string;
  image?: string | { data: string };
  photo_url?: string | Uint8Array;
  fasting?: boolean;
  vegetarian?: boolean;
  healthyChoice?: boolean;
  signatureDish?: boolean;
  spicy?: boolean;
  tagIcons?: {
    fasting?: string | null;
    vegetarian?: string | null;
    healthyChoice?: string | null;
    signatureDish?: string | null;
    spicy?: string | null;
  };
  show_in_website?: boolean | number | string | null;
  showInWebsite?: boolean | number | string | null;
  displayOnWebsite?: boolean | number | string | null;
  showOnWebsite?: boolean | number | string | null;
  saleable?: boolean | number | string | null;
  isSaleable?: boolean | number | string | null;
  is_saleable?: boolean | number | string | null;
  branchCode?: string | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  nameAr?: string;
  commentEn?: string | null;
  commentAr?: string | null;
  orderGroup?: number | null;
  nested_level: number;
  parent_group_code?: string;
  path?: string;
  children?: MenuCategory[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

let cachedBranchCode: string | null | undefined;

const resolveBranchCode = async (branchOverride?: string | null): Promise<string | null> => {
  if (branchOverride !== undefined) return branchOverride ?? null;
  if (cachedBranchCode !== undefined) return cachedBranchCode;

  const envBranch = (
    import.meta.env.VITE_DEFAULT_BRANCH_CODE ||
    import.meta.env.VITE_BRANCH_CODE ||
    ""
  ).trim();
  if (envBranch) { cachedBranchCode = envBranch; return cachedBranchCode; }

  try {
    const res = await api.get<{ success: boolean; data: { branch_code?: string | null } | null }>("/api/restaurant");
    cachedBranchCode = res.data?.branch_code?.trim() || null;
  } catch {
    cachedBranchCode = null;
  }
  return cachedBranchCode;
};

let cachedTagIconsMap: Record<string, string | null> | null = null;
let tagsCacheTimestamp = 0;
const TAGS_CACHE_TTL = 1000 * 60 * 30;

const fetchTagIcons = async (): Promise<Record<string, string | null>> => {
  const now = Date.now();
  if (cachedTagIconsMap && now - tagsCacheTimestamp < TAGS_CACHE_TTL) return cachedTagIconsMap;

  try {
    const res = await api.get<{ success: boolean; data: { fasting?: string | null; vegetarian?: string | null; healthy_choice?: string | null; signature_dish?: string | null; spicy?: string | null } | null }>("/api/tags");
    const tagData = res.data;
    cachedTagIconsMap = tagData
      ? {
          fasting: tagData.fasting || null,
          vegetarian: tagData.vegetarian || null,
          healthyChoice: tagData.healthy_choice || null,
          signatureDish: tagData.signature_dish || null,
          spicy: tagData.spicy || null,
        }
      : { fasting: null, vegetarian: null, healthyChoice: null, signatureDish: null, spicy: null };
  } catch {
    cachedTagIconsMap = { fasting: null, vegetarian: null, healthyChoice: null, signatureDish: null, spicy: null };
  }
  tagsCacheTimestamp = now;
  return cachedTagIconsMap;
};

const addTagIcons = (item: MenuItem, tagIconsMap: Record<string, string | null>): MenuItem => ({
  ...item,
  tagIcons: {
    fasting: item.fasting ? tagIconsMap.fasting : null,
    vegetarian: item.vegetarian ? tagIconsMap.vegetarian : null,
    healthyChoice: item.healthyChoice ? tagIconsMap.healthyChoice : null,
    signatureDish: item.signatureDish ? tagIconsMap.signatureDish : null,
    spicy: item.spicy ? tagIconsMap.spicy : null,
  },
});

// ─── Public menu fetch ────────────────────────────────────────────────────────

export const fetchMenuItems = async (branchOverride?: string | null): Promise<MenuItem[]> => {
  try {
    const branchCode = await resolveBranchCode(
      typeof branchOverride === "string" ? branchOverride.trim() : branchOverride
    );
    const params = new URLSearchParams({ limit: "10000" });
    if (branchCode) params.set("branchCode", branchCode);

    const [res, tagIconsMap] = await Promise.all([
      fetch(`${BASE_URL}/api/items/items?${params}`, { credentials: "include" }).then((r) => r.json()),
      fetchTagIcons(),
    ]);
    return ((res.data ?? []) as MenuItem[]).map((item) => addTagIcons(item, tagIconsMap));
  } catch (error) {
    console.error("❌ Error fetching menu items:", error);
    throw new Error("Failed to fetch menu items");
  }
};

export const fetchAllMenuCategories = async (branchOverride?: string | null): Promise<MenuCategory[]> => {
  try {
    const branchCode = await resolveBranchCode(
      typeof branchOverride === "string" ? branchOverride.trim() : branchOverride
    );
    const params = new URLSearchParams({ limit: "10000" });
    if (branchCode) params.set("branchCode", branchCode);

    const res = await fetch(`${BASE_URL}/api/items/categories/all?${params}`, { credentials: "include" }).then((r) => r.json());
    return (res.data ?? []) as MenuCategory[];
  } catch (error) {
    console.error("❌ Error fetching menu categories:", error);
    throw new Error("Failed to fetch menu categories");
  }
};

export const fetchMenuCategories = async (branchOverride?: string | null): Promise<MenuCategory[]> => {
  try {
    const branchCode = await resolveBranchCode(
      typeof branchOverride === "string" ? branchOverride.trim() : branchOverride
    );
    const params = new URLSearchParams({ limit: "10000" });
    if (branchCode) params.set("branchCode", branchCode);

    const res = await fetch(`${BASE_URL}/api/items/categories?${params}`, { credentials: "include" }).then((r) => r.json());
    return (res.data ?? []) as MenuCategory[];
  } catch (error) {
    console.error("❌ Error fetching menu categories:", error);
    throw new Error("Failed to fetch menu categories");
  }
};

export const fetchSubCategories = async (
  parentGroupCode: string,
  branchOverride?: string | null
): Promise<MenuCategory[]> => {
  if (!parentGroupCode) return [];
  try {
    const branchCode = await resolveBranchCode(
      typeof branchOverride === "string" ? branchOverride.trim() : branchOverride
    );
    const params = new URLSearchParams({ limit: "10000" });
    if (branchCode) params.set("branchCode", branchCode);

    const res = await fetch(`${BASE_URL}/api/items/categories/${encodeURIComponent(parentGroupCode)}?${params}`, { credentials: "include" }).then((r) => r.json());
    return (res.data ?? []) as MenuCategory[];
  } catch (error) {
    console.error("❌ Error fetching subcategories:", error);
    throw new Error("Failed to fetch subcategories");
  }
};

// ─── Admin fetch (all items/categories, no visibility filter) ─────────────────

export const fetchAdminMenuItems = async (branchCode?: string | null): Promise<MenuItem[]> => {
  const params = new URLSearchParams();
  if (branchCode) params.set("branchCode", branchCode);
  const query = params.toString() ? `?${params}` : "";
  const res = await api.get<{ success: boolean; data: MenuItem[] }>(`/api/items/admin-items${query}`);
  return res.data ?? [];
};

export const fetchAdminCategories = async (branchCode?: string | null): Promise<MenuCategory[]> => {
  const params = new URLSearchParams();
  if (branchCode) params.set("branchCode", branchCode);
  const query = params.toString() ? `?${params}` : "";
  const res = await api.get<{ success: boolean; data: MenuCategory[] }>(`/api/items/admin-categories${query}`);
  return res.data ?? [];
};

// ─── Hierarchy builder ────────────────────────────────────────────────────────

export const buildCategoryHierarchy = (categories: MenuCategory[]): MenuCategory[] => {
  if (!Array.isArray(categories)) return [];
  const parents = categories.filter((c) => c.nested_level === 1);
  const children = categories.filter((c) => c.nested_level > 1);
  return parents
    .map((parent) => ({
      ...parent,
      children: children
        .filter((child) => child.parent_group_code === parent.id)
        .sort((a, b) => {
          const orderA = a.orderGroup ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.orderGroup ?? Number.MAX_SAFE_INTEGER;
          return orderA !== orderB ? orderA - orderB : (a.name || "").localeCompare(b.name || "");
        }),
    }))
    .sort((a, b) => {
      const orderA = a.orderGroup ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderGroup ?? Number.MAX_SAFE_INTEGER;
      return orderA !== orderB ? orderA - orderB : (a.name || "").localeCompare(b.name || "");
    });
};

// ─── Update / write ───────────────────────────────────────────────────────────

export const uploadMenuItemPhoto = async (_file: File, _itemCode: string): Promise<string | null> => null;

export interface MenuItemFormData {
  itm_code: string;
  itm_name: string;
  website_name_en: string;
  website_name_ar: string;
  website_description_en: string;
  website_description_ar: string;
  sales_price: string;
  itm_group_code: string;
  photo_url: string;
  image: string;
  show_in_website: boolean;
  saleable: boolean;
  fasting: boolean;
  vegetarian: boolean;
  healthyChoice: boolean;
  signatureDish: boolean;
  spicy: boolean;
}

export const handleMenuItemSubmit = async (data: MenuItemFormData, _photoFile: File | null) => {
  await updateMenuItem({
    id: data.itm_code,
    name: data.itm_name,
    nameAr: data.website_name_ar,
    description: data.website_description_en,
    descriptionAr: data.website_description_ar,
    price: data.sales_price,
    sales_price: data.sales_price,
    category: data.itm_group_code,
    image: typeof data.image === "string" ? data.image : "",
    fasting: data.fasting,
    vegetarian: data.vegetarian,
    healthyChoice: data.healthyChoice,
    signatureDish: data.signatureDish,
    spicy: data.spicy,
    order: 0,
    itemOrder: 0,
  });
};

export const updateMenuItem = async (item: MenuItem) => {
  try {
    const branchFilter = item.branchCode?.trim();
    const params = branchFilter ? `?branch_code=${encodeURIComponent(branchFilter)}` : "";

    await api.patch(`/api/items/items/${encodeURIComponent(item.id)}${params}`, {
      itm_name: item.name,
      website_name_en: item.name,
      website_name_ar: item.nameAr ?? "",
      website_description_en: item.description,
      website_description_ar: item.descriptionAr ?? "",
      sales_price: item.price ? parseFloat(item.price) : null,
      itm_group_code: item.category,
      image: typeof item.image === "string" ? item.image : "",
      fasting: item.fasting === true,
      vegetarian: item.vegetarian === true,
      healthy_choice: item.healthyChoice === true,
      signature_dish: item.signatureDish === true,
      spicy: item.spicy === true,
      ...(item.show_in_website != null ? { show_in_website: item.show_in_website === true } : {}),
      ...(item.saleable != null ? { saleable: item.saleable === true } : {}),
    });
    return true;
  } catch (error) {
    console.error("❌ Error updating menu item:", error);
    throw new Error("Failed to update menu item");
  }
};

// ─── React Query hooks ────────────────────────────────────────────────────────

export const useAdminMenuItems = (branchCode?: string | null) =>
  useQuery({
    queryKey: ["adminMenuItems", branchCode ?? "all"],
    queryFn: () => fetchAdminMenuItems(branchCode),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: (prev) => prev,
  });

export const useMenuItems = (branchCode?: string | null) =>
  useQuery({
    queryKey: ["menuItems", branchCode ?? "default"],
    queryFn: () => fetchMenuItems(branchCode),
    enabled: branchCode !== undefined ? branchCode !== null && branchCode !== "" : true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
  });

export const useMenuCategories = (branchCode?: string | null) =>
  useQuery({
    queryKey: ["menuCategories", branchCode ?? "default"],
    queryFn: () => fetchMenuCategories(branchCode),
    enabled: branchCode !== undefined ? branchCode !== null && branchCode !== "" : true,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
  });

export const useAllMenuCategories = (branchCode?: string | null) =>
  useQuery({
    queryKey: ["allMenuCategories", branchCode ?? "default"],
    queryFn: () => fetchAllMenuCategories(branchCode),
    enabled: branchCode !== undefined ? branchCode !== null && branchCode !== "" : true,
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
  });

export const useSubCategories = (parentGroupCode: string | null, branchCode?: string | null) => {
  const queryClient = useQueryClient();
  useEffect(() => { if (!parentGroupCode) return; }, [parentGroupCode, queryClient, branchCode]);
  return useQuery({
    queryKey: ["subCategories", branchCode ?? "default", parentGroupCode ?? ""],
    queryFn: () => fetchSubCategories(parentGroupCode ?? "", branchCode),
    enabled: !!parentGroupCode && (branchCode !== undefined ? branchCode !== null && branchCode !== "" : true),
    staleTime: 1000 * 60 * 15,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
  });
};

export const useCategoryHierarchy = (branchCode?: string | null) =>
  useQuery({
    queryKey: ["categoryHierarchy", branchCode ?? "default"],
    queryFn: async () => buildCategoryHierarchy(await fetchAllMenuCategories(branchCode)),
    enabled: branchCode !== undefined ? branchCode !== null && branchCode !== "" : true,
    placeholderData: (prev) => prev,
  });

export const prefetchMenuData = async (
  queryClient: ReturnType<typeof useQueryClient>,
  branchCode?: string | null
) => {
  const key = branchCode ?? "default";
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: ["menuItems", key], queryFn: () => fetchMenuItems(branchCode), staleTime: 1000 * 60 * 10 }),
    queryClient.prefetchQuery({ queryKey: ["menuCategories", key], queryFn: () => fetchMenuCategories(branchCode), staleTime: 1000 * 60 * 15 }),
  ]);
};

export const fetchMenuData = async (branchCode?: string | null) => {
  const [items, categories] = await Promise.all([fetchMenuItems(branchCode), fetchMenuCategories(branchCode)]);
  return { items, categories };
};

export const usePrefetchMenuData = (branchCode?: string | null) => {
  const queryClient = useQueryClient();
  useEffect(() => { if (branchCode) prefetchMenuData(queryClient, branchCode); }, [queryClient, branchCode]);
};
