import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { MenuCategory } from "@/services/menuServices";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  FolderKanban,
} from "lucide-react";

interface CategoryFormData {
  itm_group_code: string;
  itm_group_name: string;
  website_name_en: string;
  show_in_website: boolean;
  saleable: boolean;
  branch_code: string;
  comment_en: string;
  comment_ar: string;
}

interface MenuCategoryWithBranch extends MenuCategory {
  branchCode?: string | null;
  show_in_website?: boolean | null;
  saleable?: boolean | null;
}

interface DisplayCategory extends MenuCategoryWithBranch {
  allBranchCodes: string[];
}

const buildCategoryKey = (id: string, branchCode?: string | null) =>
  `${id ?? ""}__${branchCode ?? "default"}`;

const ITEMS_PER_PAGE = 10;

const normalizeCategory = (
  raw: Record<string, unknown>
): MenuCategoryWithBranch => {
  const orderGroupRaw = raw?.order_group ?? raw?.orderGroup ?? 0;
  const orderGroup =
    typeof orderGroupRaw === "number"
      ? orderGroupRaw
      : typeof orderGroupRaw === "string"
      ? Number(orderGroupRaw)
      : 0;

  const nestedLevelRaw = raw?.nested_level ?? raw?.nestedLevel ?? 1;
  const nested_level =
    typeof nestedLevelRaw === "number"
      ? nestedLevelRaw
      : typeof nestedLevelRaw === "string"
      ? Number(nestedLevelRaw)
      : 1;

  return {
    id: (raw?.itm_group_code ?? raw?.id ?? "") as string,
    name: (raw?.website_name_en ?? raw?.itm_group_name ?? raw?.name ?? "") as string,
    nameAr: (raw?.website_name_ar ?? raw?.itm_group_name_ar ?? "") as string,
    orderGroup: Number.isFinite(orderGroup) ? orderGroup : 0,
    nested_level: Number.isFinite(nested_level) ? nested_level : 1,
    parent_group_code: (raw?.parent_group_code ?? raw?.parentGroupCode ?? null) as
      | string
      | null,
    path: (raw?.path ?? "") as string,
    children: [],
    branchCode: (raw?.branch_code ?? raw?.branchCode ?? null) as string | null,
    show_in_website: raw?.show_in_website !== false,
    saleable: raw?.saleable !== false,
  };
};

const AdminCategories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] =
    useState<MenuCategoryWithBranch | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [orderInputs, setOrderInputs] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<MenuCategoryWithBranch[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnWebsiteOnly, setShowOnWebsiteOnly] = useState(false);
  const [saleableOnly, setSaleableOnly] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [editingAllBranchCodes, setEditingAllBranchCodes] = useState<string[]>([]);
  const [branchSettings, setBranchSettings] = useState<
    Record<string, { show_in_website: boolean; saleable: boolean }>
  >({});

  const form = useForm<CategoryFormData>({
    defaultValues: {
      itm_group_code: "",
      itm_group_name: "",
      website_name_en: "",
      show_in_website: true,
      saleable: true,
      branch_code: "",
    },
  });

  const resetForm = useCallback(
    (category?: MenuCategoryWithBranch | null) => {
      if (category) {
        form.reset({
          itm_group_code: category.id,
          itm_group_name: category.name,
          website_name_en: category.name,
          show_in_website: true,
          saleable: true,
          branch_code: category.branchCode ?? "",
          comment_en: category.commentEn ?? "",
          comment_ar: category.commentAr ?? "",
        });
      } else {
        form.reset({
          itm_group_code: "",
          itm_group_name: "",
          website_name_en: "",
          show_in_website: true,
          saleable: true,
          branch_code: "",
          comment_en: "",
          comment_ar: "",
        });
      }
    },
    [form]
  );

  useEffect(() => {
    resetForm(isEditing ? currentCategory : null);
  }, [currentCategory, isEditing, resetForm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBranch, selectedCategory, showOnWebsiteOnly, saleableOnly]);

  // Debounce search to avoid filtering on each keystroke
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchTerm]);

  const fetchAllCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const res = await api.get<{ success: boolean; data: Record<string, unknown>[] }>('/api/items/admin-categories');
      const rawData = res.data ?? [];

      const normalized =
        rawData.length > 0
          ? rawData.map((category) => normalizeCategory(category))
          : [];

      setCategories(normalized);
      setFetchError(null);
      setOrderInputs({});
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch categories for all branches", error);
      if (error instanceof Error) {
        setFetchError(error.message);
        toast.error(error.message);
      } else {
        setFetchError("Failed to load categories for all branches");
        toast.error("Failed to load categories for all branches");
      }
    } finally {
      setIsLoadingCategories(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);
  const branchOptions = useMemo<string[]>(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c.branchCode) set.add(c.branchCode);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories]);
  const categoryOptions = useMemo<string[]>(() => {
    const set = new Set<string>();
    categories.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories]);

  const handleAddCategory = useCallback(() => {
    setIsEditing(false);
    setCurrentCategory(null);
    resetForm(null);
    setIsSheetOpen(true);
  }, [resetForm]);

  const handleEditCategory = useCallback(
    (category: DisplayCategory) => {
      setIsEditing(true);
      setCurrentCategory(category);
      setEditingAllBranchCodes(category.allBranchCodes);

      // Build per-branch settings from the full categories list
      const settings: Record<string, { show_in_website: boolean; saleable: boolean }> = {};
      for (const branchCode of category.allBranchCodes) {
        const branchRow = categories.find(
          (c) => c.id === category.id && c.branchCode === branchCode
        );
        settings[branchCode] = {
          show_in_website: (branchRow as any)?.show_in_website !== false,
          saleable: (branchRow as any)?.saleable !== false,
        };
      }
      setBranchSettings(settings);

      resetForm(category);
      setIsSheetOpen(true);
    },
    [resetForm, categories]
  );

  const handleDeleteCategory = useCallback(
    async (category: MenuCategoryWithBranch) => {
      if (
        !window.confirm("Are you sure you want to delete this category?")
      ) {
        return;
      }

      try {
        const branchQuery = category.branchCode ? `?branch_code=${category.branchCode}` : '';
        await api.delete(`/api/items/categories/${category.id}${branchQuery}`);
        toast.success("Category deleted successfully");
        fetchAllCategories();
      } catch (error) {
        console.error("Failed to delete category:", error);
        toast.error(
          error instanceof Error
            ? `Failed to delete category: ${error.message}`
            : "Failed to delete category"
        );
      }
    },
    [fetchAllCategories]
  );

  const handleSubmitForm = useCallback(
    async (data: CategoryFormData) => {
      try {
        if (isEditing) {
          if (!data.itm_group_code) {
            throw new Error("Cannot update category: missing code");
          }

          const branchesToUpdate =
            editingAllBranchCodes.length > 0
              ? editingAllBranchCodes
              : data.branch_code
              ? [data.branch_code]
              : [];

          if (branchesToUpdate.length === 0) {
            throw new Error("No branches to update");
          }

          const updates = branchesToUpdate.map((branchCode) => {
            const settings = branchSettings[branchCode];
            return api.patch(`/api/items/categories/${data.itm_group_code}?branch_code=${branchCode}`, {
              itm_group_name: data.itm_group_name,
              website_name_en: data.website_name_en,
              show_in_website: settings?.show_in_website ?? true,
              saleable: settings?.saleable ?? true,
              comment_en: data.comment_en || null,
              comment_ar: data.comment_ar || null,
            });
          });

          await Promise.all(updates);

          toast.success(
            `Category updated across ${branchesToUpdate.length} branch${branchesToUpdate.length > 1 ? "es" : ""}`
          );
        } else {
          if (!data.branch_code?.trim()) {
            throw new Error("Branch code is required");
          }

          await api.post('/api/items/categories', {
            itm_group_code: data.itm_group_code,
            itm_group_name: data.itm_group_name,
            website_name_en: data.website_name_en,
            show_in_website: data.show_in_website,
            saleable: data.saleable,
            branch_code: data.branch_code,
            comment_en: data.comment_en || null,
            comment_ar: data.comment_ar || null,
            nested_level: 1,
            parent_group_code: data.itm_group_code,
            path: data.itm_group_code,
          });
          toast.success("Category created successfully");
        }

        setIsSheetOpen(false);
        fetchAllCategories();
      } catch (error) {
        console.error("Category save failed:", error);
        toast.error(
          error instanceof Error
            ? `Failed to ${isEditing ? "update" : "create"} category: ${error.message}`
            : "Unable to save category."
        );
      }
    },
    [fetchAllCategories, isEditing, editingAllBranchCodes, branchSettings]
  );

  const handleOrderChange = useCallback(
    (categoryKey: string, value: string) => {
      setOrderInputs((prev) => ({ ...prev, [categoryKey]: value }));
    },
    []
  );

  const handleOrderSave = useCallback(
    async (category: MenuCategoryWithBranch, categoryKey: string) => {
      const nextValue = orderInputs[categoryKey];
      const order = parseInt(nextValue ?? "", 10);

      if (Number.isNaN(order)) {
        toast.error("Please enter a valid number for order");
        return;
      }

      try {
        const branchQuery = category.branchCode ? `?branch_code=${category.branchCode}` : '';
        await api.patch(`/api/items/categories/${category.id}${branchQuery}`, { order_group: order });
        toast.success("Order updated successfully");
        setOrderInputs((previous) => {
          const next = { ...previous };
          delete next[categoryKey];
          return next;
        });
        fetchAllCategories();
      } catch (error) {
        console.error("Failed to update order:", error);
        toast.error(
          error instanceof Error
            ? `Failed to update order: ${error.message}`
            : "Failed to update order."
        );
      }
    },
    [fetchAllCategories, orderInputs]
  );

  const filteredCategories = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const byBranch = (list: MenuCategoryWithBranch[]) =>
      selectedBranch === "all"
        ? list
        : list.filter(
            (c) => (c.branchCode ?? "") === (selectedBranch ?? "")
          );
    const byCategory = (list: MenuCategoryWithBranch[]) =>
      selectedCategory === "all"
        ? list
        : list.filter((c) => c.name === selectedCategory);
    const bySearch = (list: MenuCategoryWithBranch[]) =>
      term
        ? list.filter((c) => c.name.toLowerCase().includes(term))
        : list;
    const afterBranch = byBranch(categories);
    const afterCategory = byCategory(afterBranch);
    const afterWebsite = showOnWebsiteOnly
      ? afterCategory.filter((c) => (c as any).show_in_website !== false)
      : afterCategory;
    const afterVisibility = saleableOnly
      ? afterWebsite.filter((c) => (c as any).saleable !== false)
      : afterWebsite;
    return bySearch(afterVisibility).sort((a, b) => {
      const orderA = a.orderGroup ?? 0;
      const orderB = b.orderGroup ?? 0;
      return orderA - orderB;
    });
  }, [categories, debouncedSearch, selectedBranch, selectedCategory, showOnWebsiteOnly, saleableOnly]);

  // When "All Branches" is selected, collapse rows with the same id into one,
  // collecting all branch codes. When a specific branch is selected, keep rows as-is.
  const deduplicatedCategories = useMemo<DisplayCategory[]>(() => {
    if (selectedBranch !== "all") {
      return filteredCategories.map((c) => ({
        ...c,
        allBranchCodes: c.branchCode ? [c.branchCode] : [],
      }));
    }
    const map = new Map<string, DisplayCategory>();
    for (const c of filteredCategories) {
      const key = c.id;
      if (map.has(key)) {
        const existing = map.get(key)!;
        if (c.branchCode && !existing.allBranchCodes.includes(c.branchCode)) {
          existing.allBranchCodes.push(c.branchCode);
        }
      } else {
        map.set(key, { ...c, allBranchCodes: c.branchCode ? [c.branchCode] : [] });
      }
    }
    return Array.from(map.values());
  }, [filteredCategories, selectedBranch]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(deduplicatedCategories.length / ITEMS_PER_PAGE)),
    [deduplicatedCategories.length]
  );

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return deduplicatedCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, deduplicatedCategories]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const tableSkeleton = useMemo(
    () =>
      Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell><Skeleton className="h-4 w-24 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-8 w-16 rounded-md" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-12 rounded-full mx-auto" /></TableCell>
          <TableCell><Skeleton className="h-5 w-12 rounded-full mx-auto" /></TableCell>
          <TableCell className="text-right"><Skeleton className="ml-auto h-8 w-20 rounded-md" /></TableCell>
        </TableRow>
      )),
    []
  );

  return (
    <div className="space-y-6">
      {/* Card wrapper */}
      <div className="flex flex-col gap-4 rounded-3xl border border-orange-100 bg-white/95 p-4 sm:p-6 shadow-lg backdrop-blur-sm">

        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-md">
              <FolderKanban className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 text-xs">
                {deduplicatedCategories.length}
              </Badge>
              {(debouncedSearch || selectedBranch !== "all" || selectedCategory !== "all") && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                  {deduplicatedCategories.length} results
                </Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRefreshing || isLoadingCategories}
              onClick={() => { setIsRefreshing(true); fetchAllCategories(); }}
              className="border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isRefreshing || isLoadingCategories ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              size="sm"
              onClick={handleAddCategory}
              className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-md hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Category</span>
            </Button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branchOptions.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={showOnWebsiteOnly ? "default" : "outline"}
            size="sm"
            className={`h-9 gap-1.5 ${showOnWebsiteOnly ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700"}`}
            onClick={() => setShowOnWebsiteOnly((v) => !v)}
          >
            <span>{showOnWebsiteOnly ? "✓" : ""} Show on Website</span>
          </Button>
          <Button
            type="button"
            variant={saleableOnly ? "default" : "outline"}
            size="sm"
            className={`h-9 gap-1.5 ${saleableOnly ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-700"}`}
            onClick={() => setSaleableOnly((v) => !v)}
          >
            <span>{saleableOnly ? "✓" : ""} Saleable</span>
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-orange-100">
          {fetchError && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
              {fetchError}
            </div>
          )}
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-orange-50/40">
                <TableRow className="uppercase text-xs tracking-wide text-gray-500">
                  <TableHead className="w-[160px] whitespace-nowrap">Category Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[120px] whitespace-nowrap">Order</TableHead>
                  <TableHead className="w-[120px] whitespace-nowrap">Branch</TableHead>
                  <TableHead className="w-[90px] whitespace-nowrap text-center">Website</TableHead>
                  <TableHead className="w-[90px] whitespace-nowrap text-center">Saleable</TableHead>
                  <TableHead className="w-[90px] text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingCategories ? (
                  tableSkeleton
                ) : paginatedCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                      No categories found. Try adjusting your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCategories.map((category) => {
                    const categoryKey = buildCategoryKey(category.id, category.branchCode);
                    return (
                      <TableRow key={categoryKey} className="hover:bg-orange-50/30">
                        <TableCell className="font-mono text-sm text-gray-600">
                          {category.id}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {category.name || "Untitled category"}
                          </div>
                          {category.nameAr && (
                            <div className="text-xs text-muted-foreground">{category.nameAr}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={orderInputs[categoryKey] ?? category.orderGroup ?? ""}
                            onChange={(event) => handleOrderChange(categoryKey, event.target.value)}
                            onBlur={() => handleOrderSave(category, categoryKey)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleOrderSave(category, categoryKey);
                              }
                            }}
                            className="w-20 text-center"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(category as DisplayCategory).allBranchCodes.length > 0
                              ? (category as DisplayCategory).allBranchCodes.map((code) => (
                                  <Badge
                                    key={code}
                                    variant="outline"
                                    className="border-orange-200 bg-orange-50 text-orange-700 text-[11px] px-1.5 py-0"
                                  >
                                    {code}
                                  </Badge>
                                ))
                              : <span className="text-sm text-gray-400">—</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {(category as any).show_in_website !== false ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">✓ Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-200 text-red-500 text-[11px]">✗ No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {(category as any).saleable !== false ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">✓ Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-200 text-red-500 text-[11px]">✗ No</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            {isLoadingCategories ? (
              <div className="divide-y divide-orange-100">
                {Array.from({ length: Math.min(ITEMS_PER_PAGE, 5) }).map((_, i) => (
                  <div key={`cat-skel-${i}`} className="p-4">
                    <Skeleton className="h-4 w-32 rounded-full" />
                    <div className="mt-2 flex items-center justify-between">
                      <Skeleton className="h-4 w-40 rounded-full" />
                      <Skeleton className="h-8 w-16 rounded-md" />
                    </div>
                    <Skeleton className="mt-2 h-3 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            ) : paginatedCategories.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No categories found. Try adjusting your search.
              </div>
            ) : (
              <div className="divide-y divide-orange-100">
                {paginatedCategories.map((category) => {
                  const categoryKey = buildCategoryKey(category.id, category.branchCode);
                  return (
                    <div key={categoryKey} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-xs text-gray-500">{category.id}</div>
                          <div className="mt-1 truncate text-base font-semibold text-gray-900">
                            {category.name || "Untitled category"}
                          </div>
                          {category.nameAr && (
                            <div className="text-xs text-muted-foreground">{category.nameAr}</div>
                          )}
                          <div className="mt-2 flex flex-row flex-wrap items-center gap-1.5">
                            {(category as DisplayCategory).allBranchCodes.length > 0
                              ? (category as DisplayCategory).allBranchCodes.map((code) => (
                                  <Badge
                                    key={code}
                                    variant="outline"
                                    className="border-orange-200 bg-orange-50 text-orange-700 text-[11px] px-1.5 py-0"
                                  >
                                    {code}
                                  </Badge>
                                ))
                              : null}
                            <span className="text-xs text-muted-foreground">
                              Order: {category.orderGroup ?? "—"}
                            </span>
                            {(category as any).show_in_website !== false ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">Website ✓</Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-200 text-red-500 text-[11px]">Website ✗</Badge>
                            )}
                            {(category as any).saleable !== false ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px]">Saleable ✓</Badge>
                            ) : (
                              <Badge variant="outline" className="border-red-200 text-red-500 text-[11px]">Saleable ✗</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="mb-1 block text-xs text-muted-foreground">Order</label>
                        <Input
                          type="number"
                          value={orderInputs[categoryKey] ?? category.orderGroup ?? ""}
                          onChange={(event) => handleOrderChange(categoryKey, event.target.value)}
                          onBlur={() => handleOrderSave(category, categoryKey)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleOrderSave(category, categoryKey);
                            }
                          }}
                          className="w-28"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-orange-100 bg-orange-50/60 px-2 py-0.5">
              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`h-7 px-2 text-xs ${
                    currentPage === page
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "text-gray-600 hover:bg-orange-100"
                  }`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditing ? "Edit Category" : "Add New Category"}</SheetTitle>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-5 py-6">
              <FormField
                control={form.control}
                name="itm_group_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Unique identifier" {...field} disabled={isEditing} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itm_group_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Category name" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website_name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name shown on customer menu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment (English)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Optional note shown under this category on the menu"
                        className="resize-none"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comment (Arabic)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="ملاحظة اختيارية تظهر أسفل هذه الفئة في القائمة"
                        className="resize-none text-right"
                        dir="rtl"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing ? (
                /* Per-branch settings table */
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">Branch Settings</p>
                  <div className="overflow-hidden rounded-lg border border-orange-100">
                    <table className="w-full text-sm">
                      <thead className="bg-orange-50/60">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                            Branch
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                            Show on Site
                          </th>
                          <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                            Saleable
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-50">
                        {editingAllBranchCodes.map((branchCode) => (
                          <tr key={branchCode} className="hover:bg-orange-50/30">
                            <td className="px-3 py-2.5">
                              <Badge
                                variant="outline"
                                className="border-orange-300 bg-orange-100 text-orange-700"
                              >
                                {branchCode}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Switch
                                checked={branchSettings[branchCode]?.show_in_website ?? true}
                                onCheckedChange={(val) =>
                                  setBranchSettings((prev) => ({
                                    ...prev,
                                    [branchCode]: {
                                      ...prev[branchCode],
                                      show_in_website: val,
                                    },
                                  }))
                                }
                              />
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <Switch
                                checked={branchSettings[branchCode]?.saleable ?? true}
                                onCheckedChange={(val) =>
                                  setBranchSettings((prev) => ({
                                    ...prev,
                                    [branchCode]: {
                                      ...prev[branchCode],
                                      saleable: val,
                                    },
                                  }))
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="branch_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Branch identifier" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="show_in_website"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50/40 px-3 py-2">
                        <div>
                          <FormLabel className="mb-0 font-medium text-gray-900">Show on website</FormLabel>
                          <p className="text-xs text-muted-foreground">Toggle visibility of this category in the menu.</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="saleable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50/40 px-3 py-2">
                        <div>
                          <FormLabel className="mb-0 font-medium text-gray-900">Saleable</FormLabel>
                          <p className="text-xs text-muted-foreground">Enable or disable sales for this category.</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}

              <SheetFooter className="pt-2">
                <SheetClose asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </SheetClose>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  {isEditing ? "Update Category" : "Create Category"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminCategories;