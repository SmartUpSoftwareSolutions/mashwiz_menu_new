import React, { useState, useMemo, useEffect, useCallback } from "react";
import { api } from "@/lib/apiClient";
import { MenuItem } from "@/services/menuServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  LayoutTemplate,
  RefreshCw,
  Search,
  Plus,
} from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface MenuItemWithBranch extends MenuItem {
  branchCode?: string | null;
  groupName?: string | null;
  groupOrder?: number | null;
}

/** When "All Branches" is selected, items with the same id are merged into one row */
interface DisplayItem extends MenuItemWithBranch {
  allBranchCodes: string[];
}

const buildItemKey = (id: string, branchCode?: string | null) =>
  `${id ?? ""}__${branchCode ?? "default"}`;



interface MenuItemsTableProps {
  items: MenuItem[];
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ITEMS_PER_PAGE = 10;
const priceToNumber = (price?: string | null) =>
  Number.parseFloat((price ?? "").replace(/^\$/, "")) || 0;

const MenuItemsTable: React.FC<MenuItemsTableProps> = ({
  items,
  onEditItem,
  onDeleteItem,
  onAddItem,
  onRefresh,
  isRefreshing: externalRefreshing = false,
  searchTerm,
  onSearchChange,
}) => {
  const [itemOrderInputs, setItemOrderInputs] = useState<
    Record<string, string>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [validGroupCodes, setValidGroupCodes] = useState<Set<string> | null>(null);
  const [isFetchingAllItems, setIsFetchingAllItems] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savingItemOrders, setSavingItemOrders] = useState<
    Record<string, boolean>
  >({});
  const [showOnWebsiteFilter, setShowOnWebsiteFilter] = useState<boolean | null>(null);
  const [isLocalRefreshing, setIsLocalRefreshing] = useState(false);
  const refreshing = isLocalRefreshing || externalRefreshing;
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnWebsiteOnly, setShowOnWebsiteOnly] = useState(false);
  const [saleableOnly, setSaleableOnly] = useState(false);

  const handleItemOrderChange = useCallback(
    (itemKey: string, value: string) => {
      setItemOrderInputs((previous) => ({ ...previous, [itemKey]: value }));
    },
    []
  );

  const normalizedItemsFromProps = useMemo<MenuItemWithBranch[]>(
    () =>
      items.map((item) => {
        const itemWithBranch = item as MenuItemWithBranch & {
          branch_code?: string | null;
        };
        return {
          ...itemWithBranch,
          branchCode:
            itemWithBranch.branchCode ?? itemWithBranch.branch_code ?? null,
          fasting: itemWithBranch.fasting === true,
          vegetarian: itemWithBranch.vegetarian === true,
          healthyChoice: itemWithBranch.healthyChoice === true,
          signatureDish: itemWithBranch.signatureDish === true,
          spicy: itemWithBranch.spicy === true,
        };
      }),
    [items]
  );

  // Only fetch the small item_main_group table to get valid category codes.
  // Item data comes from the parent's useMenuItems hook (already loaded, uses an index).
  const fetchAllItems = useCallback(async () => {
    setIsFetchingAllItems(true);
    try {
      const res = await api.get<{ success: boolean; data: { itm_group_code: string }[] }>('/api/items/admin-categories');
      setValidGroupCodes(new Set((res.data ?? []).map((c) => c.itm_group_code)));
      setFetchError(null);
    } catch (error) {
      console.error("Failed to fetch menu items for all branches", error);
      setFetchError((error as Error)?.message || "Failed to load menu items for all branches");
      toast.error("Failed to load menu items for all branches");
    } finally {
      setIsFetchingAllItems(false);
    }
  }, []);

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  const handleRefreshClick = useCallback(async () => {
    setIsLocalRefreshing(true);
    try {
      await fetchAllItems();
      if (onRefresh) {
        await Promise.resolve(onRefresh());
      }
    } finally {
      setIsLocalRefreshing(false);
    }
  }, [fetchAllItems, onRefresh]);

  const visibleItems = useMemo<MenuItemWithBranch[]>(
    () =>
      normalizedItemsFromProps.filter((item) => {
        // In the admin panel, show all items regardless of visibility status
        if (validGroupCodes !== null) {
          return validGroupCodes.has(item.category ?? "");
        }
        return true;
      }),
    [normalizedItemsFromProps, validGroupCodes]
  );
  const branchOptions = useMemo<string[]>(() => {
    const set = new Set<string>();
    visibleItems.forEach((item) => {
      if (item.branchCode) set.add(item.branchCode);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [visibleItems]);
  const categoryOptions = useMemo<string[]>(() => {
    const set = new Set<string>();
    visibleItems.forEach((item) => {
      const label = item.groupName || item.category || "";
      if (label) set.add(label);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [visibleItems]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const bySearch = (itemsToFilter: MenuItemWithBranch[]) => {
      if (!term) return itemsToFilter;
      return itemsToFilter.filter((item) => {
        const nameMatch = item.name?.toLowerCase().includes(term);
        const descMatch = item.description?.toLowerCase().includes(term);
        const idMatch = item.id?.toLowerCase().includes(term);
        const categoryMatch =
          (item.groupName || item.category || "")
            .toLowerCase()
            .includes(term);
        return nameMatch || descMatch || idMatch || categoryMatch;
      });
    };
    const byBranch = (itemsToFilter: MenuItemWithBranch[]) => {
      if (selectedBranch === "all") return itemsToFilter;
      return itemsToFilter.filter(
        (item) => (item.branchCode ?? "") === selectedBranch
      );
    };
    const byCategory = (itemsToFilter: MenuItemWithBranch[]) => {
      if (selectedCategory === "all") return itemsToFilter;
      return itemsToFilter.filter(
        (item) =>
          (item.groupName || item.category || "") === selectedCategory
      );
    };
    const afterBranch = byBranch(visibleItems);
    const afterCategory = byCategory(afterBranch);
    const afterWebsite = showOnWebsiteOnly
      ? afterCategory.filter((item) => (item as any).show_in_website !== false)
      : afterCategory;
    const afterSaleable = saleableOnly
      ? afterWebsite.filter((item) => (item as any).saleable !== false)
      : afterWebsite;
    return bySearch(afterSaleable);
  }, [visibleItems, searchTerm, selectedBranch, selectedCategory, showOnWebsiteOnly, saleableOnly]);

  // When "All Branches" is active, collapse items with the same name into one row
  // and collect all their branch codes. When a branch is selected, keep rows as-is.
  // Note: items can have DIFFERENT item codes across branches for the same product,
  // so we deduplicate by normalized name rather than by item code.
  const getItemDedupKey = (item: MenuItemWithBranch) =>
    (item.name || item.id || "").toLowerCase().trim();

  const deduplicateByName = (sourceItems: MenuItemWithBranch[]): DisplayItem[] => {
    const map = new Map<string, DisplayItem>();
    for (const item of sourceItems) {
      const key = getItemDedupKey(item);
      if (map.has(key)) {
        const existing = map.get(key)!;
        if (item.branchCode && !existing.allBranchCodes.includes(item.branchCode)) {
          existing.allBranchCodes.push(item.branchCode);
        }
      } else {
        map.set(key, {
          ...item,
          allBranchCodes: item.branchCode ? [item.branchCode] : [],
        });
      }
    }
    return Array.from(map.values());
  };

  const deduplicatedVisibleItems = useMemo<DisplayItem[]>(() => {
    if (selectedBranch !== "all") {
      return visibleItems.map((item) => ({
        ...item,
        allBranchCodes: item.branchCode ? [item.branchCode] : [],
      }));
    }
    return deduplicateByName(visibleItems);
  }, [visibleItems, selectedBranch]);

  const deduplicatedItems = useMemo<DisplayItem[]>(() => {
    if (selectedBranch !== "all") {
      return filteredItems.map((item) => ({
        ...item,
        allBranchCodes: item.branchCode ? [item.branchCode] : [],
      }));
    }
    return deduplicateByName(filteredItems);
  }, [filteredItems, selectedBranch]);

  const totalCount = deduplicatedVisibleItems.length;
  const filteredCount = deduplicatedItems.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

const handleItemOrderSave = async (item: MenuItemWithBranch, itemKey: string) => {
    const rawInput = itemOrderInputs[itemKey]?.trim();
    const itemOrder = Number(rawInput);

    if (!rawInput || isNaN(itemOrder)) {
      toast.error("Please enter a valid number for item order");
      return;
    }

    try {
      setSavingItemOrders((prev) => ({ ...prev, [itemKey]: true }));

      const branchQuery = item.branchCode ? `?branch_code=${item.branchCode}` : '';
      await api.patch(`/api/items/items/${item.id}${branchQuery}`, { item_order: itemOrder });
      toast.success("Item order updated successfully");
      setItemOrderInputs((prev) => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
    } catch (error) {
      toast.error("Failed to update item order: " + error.message);
    } finally {
      setSavingItemOrders((prev) => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
    }
  };

  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'price' | 'itemOrder';
    direction: 'ascending' | 'descending';
  }>({
    key: 'itemOrder',
    direction: 'ascending'
  });

  const requestSort = (key: 'name' | 'price' | 'itemOrder') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
    setCurrentPage(1); // Reset to first page on sort change
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const sortedItems = useMemo(() => {
    return [...deduplicatedItems].sort((a, b) => {
      let aValue: number | string, bValue: number | string;

      if (sortConfig.key === "price") {
        aValue = priceToNumber(a.price);
        bValue = priceToNumber(b.price);
      } else if (sortConfig.key === "itemOrder") {
        aValue = a.itemOrder ?? 0;
        bValue = b.itemOrder ?? 0;
      } else {
        aValue = (a.name || "").toLowerCase();
        bValue = (b.name || "").toLowerCase();
      }

      if (aValue < bValue)
        return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue)
        return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, sortedItems]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages]
  );

  const tableSkeleton = useMemo(
    () =>
      Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
        <TableRow key={`items-skeleton-${index}`}>
          <TableCell>
            <Skeleton className="h-4 w-24 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-20 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 rounded-full" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-8 w-20 rounded-md" />
          </TableCell>
        </TableRow>
      )),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-orange-100 bg-white/95 p-4 sm:p-6 shadow-lg backdrop-blur-sm">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-md">
              <LayoutTemplate className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Menu Items</h2>
              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 text-xs">
                {totalCount}
              </Badge>
              {searchTerm && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                  {filteredCount} results
                </Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={refreshing || isFetchingAllItems}
              onClick={handleRefreshClick}
              className="border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onAddItem}
              className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-md hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add New Item</span>
            </Button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
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
            className={`h-9 ${showOnWebsiteOnly ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700"}`}
            onClick={() => setShowOnWebsiteOnly((v) => !v)}
          >
            {showOnWebsiteOnly ? "✓ " : ""}Show on Website
          </Button>
          <Button
            type="button"
            variant={saleableOnly ? "default" : "outline"}
            size="sm"
            className={`h-9 ${saleableOnly ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-700"}`}
            onClick={() => setSaleableOnly((v) => !v)}
          >
            {saleableOnly ? "✓ " : ""}Saleable
          </Button>
        </div>

        <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-orange-100">
          {fetchError && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
              {fetchError}
            </div>
          )}
          {/* Desktop/Table view */}
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-orange-50/40">
                <TableRow className="uppercase text-xs tracking-wide text-gray-500">
                  <TableHead className="w-[120px] whitespace-nowrap">Item Code</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => requestSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      Name {getSortIcon("name")}
                    </div>
                  </TableHead>
                  <TableHead className="w-[140px] whitespace-nowrap">Category</TableHead>
                  <TableHead
                    className="w-[100px] cursor-pointer whitespace-nowrap"
                    onClick={() => requestSort("price")}
                  >
                    <div className="flex items-center gap-1">
                      Price {getSortIcon("price")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[110px] cursor-pointer whitespace-nowrap"
                    onClick={() => requestSort("itemOrder")}
                  >
                    <div className="flex items-center gap-1">
                      Order {getSortIcon("itemOrder")}
                    </div>
                  </TableHead>
                  <TableHead className="w-[160px] whitespace-nowrap">Branch</TableHead>
                  <TableHead className="w-[90px] text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isFetchingAllItems || refreshing ? (
                  tableSkeleton
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No menu items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item) => {
                    const itemKey = buildItemKey(item.id, item.branchCode);
                    return (
                      <TableRow key={itemKey} className="hover:bg-orange-50/30">
                        <TableCell className="font-mono text-sm text-gray-600">
                          {item.id}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {item.name || "Untitled item"}
                          </div>
                          {item.nameAr && (
                            <div className="text-xs text-muted-foreground">
                              {item.nameAr}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {item.category || "—"}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {item.price || "—"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={itemOrderInputs[itemKey] ?? item.itemOrder ?? ""}
                            onChange={(event) =>
                              handleItemOrderChange(itemKey, event.target.value)
                            }
                            onBlur={() => handleItemOrderSave(item, itemKey)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                handleItemOrderSave(item, itemKey);
                              }
                            }}
                            className="w-24 text-center"
                            disabled={savingItemOrders[itemKey]}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {(item as DisplayItem).allBranchCodes.length > 0
                              ? (item as DisplayItem).allBranchCodes.map((code) => (
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteItem(item.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
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
            {isFetchingAllItems || refreshing ? (
              <div className="divide-y divide-orange-100">
                {Array.from({ length: Math.min(ITEMS_PER_PAGE, 6) }).map((_, i) => (
                  <div key={`mi-skel-${i}`} className="p-4">
                    <Skeleton className="h-4 w-24 rounded-full" />
                    <Skeleton className="mt-2 h-5 w-40 rounded-full" />
                    <div className="mt-2 flex items-center justify-between">
                      <Skeleton className="h-4 w-16 rounded-full" />
                      <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedItems.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No menu items found.
              </div>
            ) : (
              <div className="divide-y divide-orange-100">
                {paginatedItems.map((item) => {
                  const itemKey = buildItemKey(item.id, item.branchCode);
                  return (
                    <div key={itemKey} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-mono text-xs text-gray-600">
                            {item.id}
                          </div>
                          <div className="mt-1 text-base font-semibold text-gray-900">
                            {item.name || "Untitled item"}
                          </div>
                          {item.nameAr && (
                            <div className="text-xs text-muted-foreground">
                              {item.nameAr}
                            </div>
                          )}
                          <div className="mt-1 text-sm text-gray-600">
                            {item.category || "—"}
                          </div>
                          <div className="mt-1 flex flex-row flex-wrap gap-1">
                            {(item as DisplayItem).allBranchCodes.length > 0
                              ? (item as DisplayItem).allBranchCodes.map((code) => (
                                  <Badge
                                    key={code}
                                    variant="outline"
                                    className="border-orange-200 bg-orange-50 text-orange-700 text-[11px] px-1.5 py-0"
                                  >
                                    {code}
                                  </Badge>
                                ))
                              : <span className="text-xs text-gray-400">—</span>}
                          </div>
                          <div className="mt-1 font-medium text-gray-900">
                            {item.price || "—"}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEditItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteItem(item.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <label className="mb-1 block text-xs text-muted-foreground">
                          Order
                        </label>
                        <Input
                          type="number"
                          value={itemOrderInputs[itemKey] ?? item.itemOrder ?? ""}
                          onChange={(event) =>
                            handleItemOrderChange(itemKey, event.target.value)
                          }
                          onBlur={() => handleItemOrderSave(item, itemKey)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleItemOrderSave(item, itemKey);
                            }
                          }}
                          className="w-28"
                          disabled={savingItemOrders[itemKey]}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-1 rounded-lg border border-orange-100 bg-white/80 p-2 text-[11px] text-muted-foreground">
            <span className="px-2">
              Page {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                    className={`h-7 px-2 text-xs ${
                      currentPage === page
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "text-gray-600 hover:bg-orange-100"
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <span className="px-2 text-right">
              {Math.min(currentPage * ITEMS_PER_PAGE, sortedItems.length)} /{" "}
              {sortedItems.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemsTable;