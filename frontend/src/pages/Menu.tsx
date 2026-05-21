import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Grid3X3,
  List,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMenuItems,
  useMenuCategories,
  useSubCategories,
  MenuItem,
  MenuCategory,
  usePrefetchMenuData,
} from "@/services/menuServices";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { useRestaurantInfo } from "../services/restaurantInfoService.ts";
import { useSortedMenuItems } from "@/hooks/useSortedMenuItems.ts";
import { useMenuItemImage } from "../getImageSrc.ts";
import { LazyImage } from "@/components/LazyImage";
import { useMenuBranches } from "@/services/branchService";

// Enhanced view styles with professional improvements
const VIEW_STYLES = {
  grid: {
    name: "Grid View",
    icon: Grid3X3,
    containerClass:
      "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
    itemClass: "h-full",
  },
  list: {
    name: "List View",
    icon: List,
    containerClass: "space-y-2",
    itemClass: "",
  },
  card: {
    name: "Card View",
    icon: LayoutGrid,
    containerClass: "grid gap-3 sm:gap-4",
    itemClass: "",
  },
};

const normalizeBooleanFlag = (value: unknown) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "y"
    );
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return value === true;
};

type MenuItemComponentProps = {
  item: MenuItem;
  language: string;
  getImageSrc: (item: MenuItem) => string;
};

type TagIconsProps = {
  tagIcons?: MenuItem["tagIcons"];
};

const TagIcons = React.memo(({ tagIcons }: TagIconsProps) => {
  if (!tagIcons) return null;

  const iconEntries = Object.entries(tagIcons).filter(
    ([, value]) => typeof value === "string" && value.trim().length > 0
  );

  if (!iconEntries.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {iconEntries.map(([name, src]) => (
        <img
          key={name}
          src={src}
          alt={name}
          className="w-10 h-10 rounded-md bg-white/80 p-0.5 shadow-sm border border-orange-100/60"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ))}
    </div>
  );
});

TagIcons.displayName = "TagIcons";

const GridMenuItem = React.memo(
  ({ item, language, getImageSrc }: MenuItemComponentProps) => {
  return (
    <div className="h-full flex flex-col rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm">
      <div className="relative overflow-hidden bg-gray-50">
        <div className="aspect-square">
          <LazyImage
            src={getImageSrc(item)}
            alt={item.name}
            className=""
            placeholder="/placeholder-food.jpg"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold text-gray-900 leading-snug">
          {language === "ar" ? (item.nameAr || item.name) : item.name}
        </h3>
        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed flex-1">
          {language === "ar" ? item.descriptionAr : item.description}
        </p>
        <TagIcons tagIcons={item.tagIcons} />
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
          <span className="text-base font-bold text-orange-500 tracking-tight">
            {item.price}
          </span>
        </div>
      </div>
    </div>
  );
  }
);

GridMenuItem.displayName = "GridMenuItem";

const ListMenuItem = React.memo(
  ({ item, language, getImageSrc }: MenuItemComponentProps) => {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-white border border-gray-100 px-2 py-2 shadow-sm">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50">
        <LazyImage
          src={getImageSrc(item)}
          alt={item.name}
          className=""
          placeholder="/placeholder-food.jpg"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">
          {language === "ar" ? (item.nameAr || item.name) : item.name}
        </h3>
        <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">
          {language === "ar" ? item.descriptionAr : item.description}
        </p>
        <TagIcons tagIcons={item.tagIcons} />
      </div>
      <div className="flex-shrink-0 pt-0.5">
        <span className="text-sm font-bold text-orange-500 whitespace-nowrap">
          {item.price}
        </span>
      </div>
    </div>
  );
  }
);

ListMenuItem.displayName = "ListMenuItem";

const CardMenuItem = React.memo(
  ({ item, language, getImageSrc }: MenuItemComponentProps) => {
  return (
    <div className="overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm">
      <div className="flex">
        <div className="relative w-36 sm:w-44 flex-shrink-0 overflow-hidden bg-gray-50 min-h-[140px]">
          <LazyImage
            src={getImageSrc(item)}
            alt={item.name}
            className=""
            placeholder="/placeholder-food.jpg"
          />
        </div>
        <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-snug">
              {language === "ar" ? (item.nameAr || item.name) : item.name}
            </h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {language === "ar" ? item.descriptionAr : item.description}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-50">
            <TagIcons tagIcons={item.tagIcons} />
            <span className="text-lg font-bold text-orange-500 tracking-tight">
              {item.price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
  }
);

CardMenuItem.displayName = "CardMenuItem";

const Menu = () => {
  const { t } = useTranslation() || { t: (key) => key };
  const { language, setLanguage } = useLanguage() || { language: "en", setLanguage: () => {} };
  const [searchParams] = useSearchParams();
  const { getImageSrc } = useMenuItemImage();

  const branchCode = React.useMemo(() => {
    const fromQuery = searchParams.get("branch");
    if (fromQuery && fromQuery.trim().length > 0) {
      return fromQuery.trim();
    }

    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("selectedBranchCode");
        if (stored && stored.trim().length > 0) {
          return stored.trim();
        }
      } catch (error) {
        console.warn("Unable to read branch code from storage", error);
      }
    }

    return null;
  }, [searchParams]);

  const branchName = React.useMemo(() => {
    const fromQuery = searchParams.get("branchName");
    if (fromQuery && fromQuery.trim().length > 0) {
      return fromQuery.trim();
    }

    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("selectedBranchName");
        if (stored && stored.trim().length > 0) {
          return stored.trim();
        }
      } catch (error) {
        console.warn("Unable to read branch name from storage", error);
      }
    }

    return null;
  }, [searchParams]);

  const { data: allBranches = [] } = useMenuBranches();
  const displayBranchName = React.useMemo(() => {
    if (!branchCode) return branchName;
    const branch = allBranches.find(
      (b) => b.code.trim().toLowerCase() === branchCode.trim().toLowerCase()
    );
    if (!branch) return branchName;
    return language === "ar" && branch.name_ar ? branch.name_ar : branch.name;
  }, [allBranches, branchCode, branchName, language]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (branchCode) {
        window.localStorage.setItem("selectedBranchCode", branchCode);
      }
      if (branchName) {
        window.localStorage.setItem("selectedBranchName", branchName);
      }
    } catch (error) {
      console.warn("Unable to persist branch selection", error);
    }
  }, [branchCode, branchName]);

  const [activeParentCategory, setActiveParentCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showSubLeftArrow, setShowSubLeftArrow] = useState(false);
  const [showSubRightArrow, setShowSubRightArrow] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Mobile-specific arrow visibility (separate from desktop to avoid ref clashes)
  const [showLeftArrowMobile, setShowLeftArrowMobile] = useState(false);
  const [showRightArrowMobile, setShowRightArrowMobile] = useState(false);
  const [showSubLeftArrowMobile, setShowSubLeftArrowMobile] = useState(false);
  const [showSubRightArrowMobile, setShowSubRightArrowMobile] = useState(false);
  const [currentView, setCurrentView] =
    useState<keyof typeof VIEW_STYLES>("list");
  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const subTabsContainerRef = useRef<HTMLDivElement | null>(null);
  // Mobile-specific refs (desktop sections also render and can steal shared refs)
  const mobileTabsContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileSubTabsContainerRef = useRef<HTMLDivElement | null>(null);

  // Prefetch menu data for faster loading
  usePrefetchMenuData(branchCode);

  useEffect(() => {
    setActiveParentCategory(null);
    setActiveSubCategory(null);
  }, [branchCode]);

  const { data: restaurantInfo } = useRestaurantInfo();
  const showAllCategory = !!restaurantInfo?.show_all_category;

  // Update favicon dynamically from restaurant info (logo/icon) when available
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!restaurantInfo) return;
    const info = restaurantInfo as unknown as {
      favicon?: string;
      logoUrl?: string;
      logo_url?: string;
      logo?: string;
      icon?: string;
    };
    const logoUrl =
      info?.favicon ||
      info?.logoUrl ||
      info?.logo_url ||
      info?.logo ||
      info?.icon;
    if (!logoUrl || typeof logoUrl !== "string" || logoUrl.trim().length === 0)
      return;
    try {
      let link =
        (document.querySelector("link#app-favicon") as HTMLLinkElement | null) ||
        (document.querySelector("link[rel='icon']") as HTMLLinkElement | null);
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        link.id = "app-favicon";
        document.head.appendChild(link);
      } else {
        link.id = link.id || "app-favicon";
      }
      // Prefer PNG/ICO; type hint is optional and safe
      link.type = "image/png";
      link.href = logoUrl;
    } catch (err) {
      console.warn("Unable to set dynamic favicon", err);
    }
  }, [restaurantInfo]);

  const allowedViews = React.useMemo(
    () => Object.keys(VIEW_STYLES) as Array<keyof typeof VIEW_STYLES>,
    []
  );
  const defaultView = restaurantInfo?.style;

  const handleChangeView = useCallback(
    (view: keyof typeof VIEW_STYLES) => {
      if (!allowedViews.includes(view)) {
        return;
      }

      setCurrentView(view);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("menuView", view);
      }
    },
    [allowedViews]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      const fallbackView =
        defaultView &&
        allowedViews.includes(defaultView as keyof typeof VIEW_STYLES)
          ? (defaultView as keyof typeof VIEW_STYLES)
          : "grid";
      handleChangeView(fallbackView);
      return;
    }

    const savedView = window.localStorage.getItem(
      "menuView"
    ) as keyof typeof VIEW_STYLES | null;

    if (savedView && allowedViews.includes(savedView)) {
      handleChangeView(savedView);
      return;
    }

    if (
      defaultView &&
      allowedViews.includes(defaultView as keyof typeof VIEW_STYLES)
    ) {
      handleChangeView(defaultView as keyof typeof VIEW_STYLES);
      return;
    }

    handleChangeView("grid");
  }, [allowedViews, defaultView, handleChangeView]);

  const {
    data: menuItems = [],
    isLoading: isLoadingItems = false,
    isFetching: isFetchingItems = false,
    error: itemsError,
    dataUpdatedAt,
  } = (useMenuItems(branchCode) || {}) as {
    data?: MenuItem[];
    isLoading?: boolean;
    isFetching?: boolean;
    error?: Error;
    dataUpdatedAt?: number;
  };

  // Use cached data immediately if available while fetching fresh data
  const shouldShowCachedData = !isLoadingItems && menuItems.length > 0;
  const isInitialLoad = isLoadingItems && menuItems.length === 0;

  const visibleMenuItems = React.useMemo<MenuItem[]>(() => {
    if (!Array.isArray(menuItems)) return [];

    return menuItems.filter((item) => {
      const showValue =
        item.show_in_website ??
        item.showInWebsite ??
        item.displayOnWebsite ??
        item.showOnWebsite;
      const saleableValue =
        item.saleable ?? item.isSaleable ?? item.is_saleable;

      return (
        normalizeBooleanFlag(showValue) && normalizeBooleanFlag(saleableValue)
      );
    });
  }, [menuItems]);

  const {
    data: parentCategories = [],
    isLoading: isLoadingCategories = false,
    error: categoriesError,
  } = (useMenuCategories(branchCode) || {}) as {
    data?: MenuCategory[];
    isLoading?: boolean;
    error?: Error;
  };

  const {
    data: subCategories = [],
    isLoading: isLoadingSubCategories = false,
  } = (useSubCategories(activeParentCategory, branchCode) || {}) as {
    data?: MenuCategory[];
    isLoading?: boolean;
  };

  const sortedParentCategories = React.useMemo<MenuCategory[]>(() => {
    if (!Array.isArray(parentCategories)) return [];
    return [...parentCategories].sort((a, b) => {
      const orderA = a?.orderGroup ?? Number.MAX_SAFE_INTEGER;
      const orderB = b?.orderGroup ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return (a?.name || "").localeCompare(b?.name || "");
    });
  }, [parentCategories]);

  useEffect(() => {
    if (
      !activeParentCategory &&
      sortedParentCategories.length > 0 &&
      !showAllCategory
    ) {
      setActiveParentCategory(String(sortedParentCategories[0].id));
      setActiveSubCategory(null);
    }
  }, [activeParentCategory, sortedParentCategories, showAllCategory]);

  const sortedSubCategories = React.useMemo<MenuCategory[]>(() => {
    if (!Array.isArray(subCategories)) return [];
    return [...subCategories].sort((a, b) => {
      const orderA = a?.orderGroup ?? Number.MAX_SAFE_INTEGER;
      const orderB = b?.orderGroup ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return (a?.name || "").localeCompare(b?.name || "");
    });
  }, [subCategories]);

  useEffect(() => {
    if (activeParentCategory && sortedSubCategories.length > 0) {
      const firstSubCategory = sortedSubCategories[0];
      if (firstSubCategory?.id) {
        setActiveSubCategory(String(firstSubCategory.id));
      }
    } else if (!activeParentCategory) {
      setActiveSubCategory(null);
    }
  }, [activeParentCategory, sortedSubCategories]);

  const filteredItems = React.useMemo<MenuItem[]>(() => {
    if (!Array.isArray(visibleMenuItems)) return [];

    if (!showAllCategory && !activeParentCategory && !activeSubCategory)
      return [];

    // Early return if no items to filter
    if (visibleMenuItems.length === 0) return [];

    // Use more efficient filtering with early exits
    if (activeSubCategory) {
      return visibleMenuItems.filter(
        (item) => item?.category === activeSubCategory
      );
    }

    if (activeParentCategory) {
      return visibleMenuItems.filter(
        (item) => item?.category === activeParentCategory
      );
    }

    return visibleMenuItems;
  }, [
    visibleMenuItems,
    activeParentCategory,
    activeSubCategory,
    showAllCategory,
  ]);

  const sortedFilteredItems = useSortedMenuItems(filteredItems) || [];

  const activeCategoryName = React.useMemo(() => {
    if (activeSubCategory) {
      const subCategory = sortedSubCategories.find(
        (cat) => cat?.id === activeSubCategory
      );
      return subCategory?.name || t("all") || "All";
    }

    if (activeParentCategory) {
      const parentCategory = sortedParentCategories.find(
        (cat) => cat?.id === activeParentCategory
      );
      return parentCategory?.name || t("all") || "All";
    }

    if (sortedParentCategories.length > 0) {
      return sortedParentCategories[0]?.name;
    }

    return t("all") || "All";
  }, [
    activeParentCategory,
    activeSubCategory,
    sortedParentCategories,
    sortedSubCategories,
    t,
  ]);

  const activeCategoryComment = React.useMemo(() => {
    const activeParent = sortedParentCategories.find(
      (cat) => cat?.id === activeParentCategory
    );
    return {
      en: activeParent?.commentEn ?? null,
      ar: activeParent?.commentAr ?? null,
    };
  }, [activeParentCategory, sortedParentCategories]);

  const handleParentCategorySelect = useCallback((categoryId: string | null) => {
    setActiveParentCategory(categoryId);
    setActiveSubCategory(null);
    setDropdownOpen(false);
  }, []);

  const handleSubCategorySelect = useCallback((categoryId: string | null) => {
    setActiveSubCategory(categoryId);
    setDropdownOpen(false);
  }, []);

  const menuItemComponents = React.useMemo(
    () => ({
      grid: GridMenuItem,
      list: ListMenuItem,
      card: CardMenuItem,
    }),
    []
  );

  const validViewKey = allowedViews.includes(currentView)
    ? currentView
    : "card";
  const currentViewStyle = VIEW_STYLES[validViewKey];
  const MenuItemComponent =
    menuItemComponents[validViewKey] ?? menuItemComponents.card;

  const scrollAmount = 200;

  const checkScrollPosition = useCallback(() => {
    if (!tabsContainerRef.current) return;
    try {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    } catch (error) {
      console.error("Error checking scroll position:", error);
    }
  }, []);

  const checkMobileScrollPosition = useCallback(() => {
    if (!mobileTabsContainerRef.current) return;
    try {
      const { scrollLeft, scrollWidth, clientWidth } =
        mobileTabsContainerRef.current;
      setShowLeftArrowMobile(scrollLeft > 0);
      setShowRightArrowMobile(scrollLeft < scrollWidth - clientWidth - 1);
    } catch (error) {
      console.error("Error checking mobile scroll position:", error);
    }
  }, []);
  const scrollCategories = useCallback(
    (direction: "left" | "right") => {
      if (!tabsContainerRef.current) return;
      try {
        const newScrollLeft =
          direction === "left"
            ? tabsContainerRef.current.scrollLeft - scrollAmount
            : tabsContainerRef.current.scrollLeft + scrollAmount;
        tabsContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: "smooth",
        });
      } catch (error) {
        console.error("Error scrolling categories:", error);
      }
    },
    [scrollAmount]
  );

  const scrollCategoriesMobile = useCallback(
    (direction: "left" | "right") => {
      if (!mobileTabsContainerRef.current) return;
      try {
        const newScrollLeft =
          direction === "left"
            ? mobileTabsContainerRef.current.scrollLeft - scrollAmount
            : mobileTabsContainerRef.current.scrollLeft + scrollAmount;
        mobileTabsContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: "smooth",
        });
      } catch (error) {
        console.error("Error scrolling categories (mobile):", error);
      }
    },
    [scrollAmount]
  );
  // (moved continuous scroll helpers below to avoid TDZ on callbacks)

  const checkSubScrollPosition = useCallback(() => {
    if (!subTabsContainerRef.current) return;
    try {
      const { scrollLeft, scrollWidth, clientWidth } =
        subTabsContainerRef.current;
      setShowSubLeftArrow(scrollLeft > 0);
      setShowSubRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    } catch (error) {
      console.error("Error checking sub scroll position:", error);
    }
  }, []);

  const checkMobileSubScrollPosition = useCallback(() => {
    if (!mobileSubTabsContainerRef.current) return;
    try {
      const { scrollLeft, scrollWidth, clientWidth } =
        mobileSubTabsContainerRef.current;
      setShowSubLeftArrowMobile(scrollLeft > 0);
      setShowSubRightArrowMobile(scrollLeft < scrollWidth - clientWidth - 1);
    } catch (error) {
      console.error("Error checking sub scroll position (mobile):", error);
    }
  }, []);
  const scrollSubCategories = useCallback(
    (direction: "left" | "right") => {
      if (!subTabsContainerRef.current) return;
      try {
        const newScrollLeft =
          direction === "left"
            ? subTabsContainerRef.current.scrollLeft - scrollAmount
            : subTabsContainerRef.current.scrollLeft + scrollAmount;
        subTabsContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: "smooth",
        });
      } catch (error) {
        console.error("Error scrolling subcategories:", error);
      }
    },
    [scrollAmount]
  );

  const scrollSubCategoriesMobile = useCallback(
    (direction: "left" | "right") => {
      if (!mobileSubTabsContainerRef.current) return;
      try {
        const newScrollLeft =
          direction === "left"
            ? mobileSubTabsContainerRef.current.scrollLeft - scrollAmount
            : mobileSubTabsContainerRef.current.scrollLeft + scrollAmount;
        mobileSubTabsContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: "smooth",
        });
      } catch (error) {
        console.error("Error scrolling subcategories (mobile):", error);
      }
    },
    [scrollAmount]
  );
  // Continuous scroll helpers for parent categories (after checks to avoid TDZ)
  const categoryScrollIntervalRef = useRef<number | null>(null);
  const startCategoryContinuousScroll = useCallback((direction: "left" | "right") => {
    const step = direction === "left" ? -20 : 20;
    if (!tabsContainerRef.current) return;
    if (categoryScrollIntervalRef.current) {
      window.clearInterval(categoryScrollIntervalRef.current);
      categoryScrollIntervalRef.current = null;
    }
    const tick = () => {
      if (!tabsContainerRef.current) return;
      tabsContainerRef.current.scrollBy({ left: step, behavior: "auto" });
      checkScrollPosition();
    };
    tick();
    categoryScrollIntervalRef.current = window.setInterval(tick, 16);
  }, [checkScrollPosition]);
  const stopCategoryContinuousScroll = useCallback(() => {
    if (categoryScrollIntervalRef.current) {
      window.clearInterval(categoryScrollIntervalRef.current);
      categoryScrollIntervalRef.current = null;
    }
  }, []);

  // Continuous scroll helpers for subcategories (after checks to avoid TDZ)
  const subCategoryScrollIntervalRef = useRef<number | null>(null);
  const startSubContinuousScroll = useCallback((direction: "left" | "right") => {
    const step = direction === "left" ? -20 : 20;
    if (!subTabsContainerRef.current) return;
    if (subCategoryScrollIntervalRef.current) {
      window.clearInterval(subCategoryScrollIntervalRef.current);
      subCategoryScrollIntervalRef.current = null;
    }
    const tick = () => {
      if (!subTabsContainerRef.current) return;
      subTabsContainerRef.current.scrollBy({ left: step, behavior: "auto" });
      checkSubScrollPosition();
    };
    tick();
    subCategoryScrollIntervalRef.current = window.setInterval(tick, 16);
  }, [checkSubScrollPosition]);
  const stopSubContinuousScroll = useCallback(() => {
    if (subCategoryScrollIntervalRef.current) {
      window.clearInterval(subCategoryScrollIntervalRef.current);
      subCategoryScrollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (sortedParentCategories.length > 0) {
      checkScrollPosition();
      window.addEventListener("resize", checkScrollPosition);
      return () => window.removeEventListener("resize", checkScrollPosition);
    }
  }, [sortedParentCategories, checkScrollPosition]);

  // Mobile parent categories scroll visibility
  useEffect(() => {
    if (sortedParentCategories.length > 0) {
      checkMobileScrollPosition();
      window.addEventListener("resize", checkMobileScrollPosition);
      return () =>
        window.removeEventListener("resize", checkMobileScrollPosition);
    }
  }, [sortedParentCategories, checkMobileScrollPosition]);

  // Scroll active tab into view on mobile when activeParentCategory changes
  useEffect(() => {
    if (!mobileTabsContainerRef.current || !activeParentCategory) return;
    const container = mobileTabsContainerRef.current;
    const activeTab = container.querySelector<HTMLElement>(
      `[data-value="${activeParentCategory}"], [data-state="active"]`
    );
    if (activeTab) {
      const containerLeft = container.scrollLeft;
      const containerRight = containerLeft + container.clientWidth;
      const tabLeft = activeTab.offsetLeft;
      const tabRight = tabLeft + activeTab.offsetWidth;
      if (tabLeft < containerLeft || tabRight > containerRight) {
        container.scrollTo({
          left: tabLeft - container.clientWidth / 2 + activeTab.offsetWidth / 2,
          behavior: "smooth",
        });
      }
    }
  }, [activeParentCategory]);
  useEffect(() => {
    if (sortedSubCategories.length > 0) {
      checkSubScrollPosition();
      window.addEventListener("resize", checkSubScrollPosition);
      return () => window.removeEventListener("resize", checkSubScrollPosition);
    }
  }, [sortedSubCategories, checkSubScrollPosition]);

  // Mobile subcategories scroll visibility
  useEffect(() => {
    if (sortedSubCategories.length > 0) {
      checkMobileSubScrollPosition();
      window.addEventListener("resize", checkMobileSubScrollPosition);
      return () =>
        window.removeEventListener("resize", checkMobileSubScrollPosition);
    }
  }, [sortedSubCategories, checkMobileSubScrollPosition]);
  if (!branchCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold text-gray-900">
            {t("selectBranch")}
          </h2>
          <p className="text-sm text-gray-500">{t("selectBranchDescription")}</p>
          <Button
            asChild
            className="rounded-xl border-0 bg-orange-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <Link to="/">{t("back") || "Back"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (itemsError || categoriesError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold text-gray-900">
            {t("menuLoadError") || "Error Loading Menu"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            {itemsError?.message ||
              categoriesError?.message ||
              "Failed to load menu data"}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl border-0 bg-orange-500 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            {t("tryAgain") || "Try Again"}
          </Button>
        </div>
      </div>
    );
  }

  const skeletonCount = validViewKey === "grid" ? 8 : 6;
  // Show loading only on initial load, not when refetching (we show cached data)
  const isLoadingContent = isInitialLoad || isLoadingSubCategories;
  const hasItems =
    Array.isArray(sortedFilteredItems) && sortedFilteredItems.length > 0;
  
  // Show subtle loading indicator when refreshing in background
  const isRefreshing = isFetchingItems && !isInitialLoad && shouldShowCachedData;

  return (
    <div
      className={cn(
        "min-h-screen bg-neutral-50",
        language === "ar" ? "text-right" : "text-left"
      )}
    >
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400" />
        <div className="px-4 py-3">
          {/* Top row: back | title | actions — always LTR so back stays left */}
          <div className="flex items-center justify-between gap-2" dir="ltr">
            {/* Back button */}
            <Link
              to="/"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            {/* Title + branch */}
            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">
                {t("ourMenu") || "Our Menu"}
              </h1>
              {displayBranchName && (
                <span className="mt-0.5 text-xs font-medium text-orange-500 bg-orange-50 px-2.5 py-0.5 rounded-full">
                  {displayBranchName}
                </span>
              )}
            </div>

            {/* Right actions */}
            <div className="flex flex-shrink-0 items-center gap-1.5">
              {/* Language toggle */}
              <button
                onClick={() => setLanguage(language === "en" ? "ar" : "en")}
                className="flex h-9 items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 text-xs font-bold text-gray-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                <span className="text-sm leading-none">{language === "en" ? "🇪🇬" : "🇬🇧"}</span>
                {language === "en" ? "AR" : "EN"}
              </button>

              {/* View style */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50 transition-colors">
                    {React.createElement(currentViewStyle.icon, {
                      className: "h-4 w-4 text-orange-500",
                    })}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-40 rounded-xl border border-gray-100 bg-white p-1 shadow-lg"
                  align="end"
                  sideOffset={8}
                >
                  {Object.entries(VIEW_STYLES).map(([key, style]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => handleChangeView(key as keyof typeof VIEW_STYLES)}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-50"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        {React.createElement(style.icon, { className: "h-4 w-4 text-orange-500" })}
                        {style.name}
                      </span>
                      {validViewKey === key && <Check className="h-3.5 w-3.5 text-orange-500" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-0 pb-16 lg:px-8">
        {isLoadingCategories ? (
          <div className="py-4 lg:py-6">
            <Skeleton className="h-11 w-full rounded-full bg-gray-100" />
          </div>
        ) : (
          <>
            <div className="sticky top-[57px] z-30 bg-white border-b border-gray-200 lg:hidden">
              <div
                ref={mobileTabsContainerRef}
                className="flex overflow-x-auto px-3 pt-3"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                onScroll={checkMobileScrollPosition}
              >
                <Tabs value={activeParentCategory || "all"}>
                  <TabsList className="flex w-max gap-0 rounded-none bg-transparent p-0 h-auto">
                    {showAllCategory && (
                      <TabsTrigger
                        value="all"
                        onClick={() => {
                          setActiveParentCategory(null);
                          setActiveSubCategory(null);
                        }}
                        className="rounded-none border-b-2 border-transparent -mb-px px-3 py-2.5 text-xs font-medium text-gray-500 bg-transparent hover:text-gray-800 hover:bg-transparent transition-colors data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-none whitespace-nowrap"
                      >
                        {t("all") || "All"}
                      </TabsTrigger>
                    )}
                    {sortedParentCategories.map((category) => (
                      <TabsTrigger
                        key={category?.id ?? `parent-${category?.name}`}
                        value={category?.id ? String(category.id) : ""}
                        onClick={() =>
                          handleParentCategorySelect(
                            category?.id ? String(category.id) : null
                          )
                        }
                        className="rounded-none border-b-2 border-transparent -mb-px px-3 py-2.5 text-xs font-medium text-gray-500 bg-transparent hover:text-gray-800 hover:bg-transparent transition-colors data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-none whitespace-nowrap"
                      >
                        {(language === "ar" && category?.nameAr) ? category.nameAr : (category?.name || "Unknown Category")}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="relative hidden lg:block">
              {showLeftArrow && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 z-10 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 shadow-sm border border-gray-200 hover:bg-white hover:border-orange-200"
                  onClick={() => scrollCategories("left")}
                >
                  <ChevronLeft className="h-4 w-4 text-gray-500" />
                </Button>
              )}
              {showRightArrow && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 shadow-sm border border-gray-200 hover:bg-white hover:border-orange-200"
                  onClick={() => scrollCategories("right")}
                >
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                </Button>
              )}
              <Tabs
                value={activeParentCategory || "all"}
                className="sticky top-[57px] -mx-8 bg-white/98 px-8 backdrop-blur border-b border-gray-200"
              >
                <div
                  ref={tabsContainerRef}
                  className="flex overflow-x-auto scrollbar-hide justify-center"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  onScroll={checkScrollPosition}
                >
                  <TabsList className="flex w-max gap-0 rounded-none bg-transparent p-0 h-auto">
                    {showAllCategory && (
                      <TabsTrigger
                        value="all"
                        onClick={() => {
                          setActiveParentCategory(null);
                          setActiveSubCategory(null);
                        }}
                        className="rounded-none border-b-2 border-transparent -mb-px px-5 py-3.5 text-sm font-medium text-gray-500 bg-transparent hover:text-gray-800 hover:bg-transparent transition-colors data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-none"
                      >
                        {t("all") || "All"}
                      </TabsTrigger>
                    )}
                    {sortedParentCategories.map((category) => (
                      <TabsTrigger
                        key={category?.id ?? `parent-${category?.name}`}
                        value={category?.id ? String(category.id) : ""}
                        onClick={() =>
                          handleParentCategorySelect(
                            category?.id ? String(category.id) : null
                          )
                        }
                        className="rounded-none border-b-2 border-transparent -mb-px px-5 py-3.5 text-sm font-medium text-gray-500 bg-transparent hover:text-gray-800 hover:bg-transparent transition-colors data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:font-semibold data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0 focus-visible:outline-none whitespace-nowrap"
                      >
                        {(language === "ar" && category?.nameAr) ? category.nameAr : (category?.name || "Unknown Category")}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>
            </div>

            {activeParentCategory && sortedSubCategories.length > 0 && (
              <>
                <div className="sticky top-[106px] z-20 bg-white px-3 pb-3 pt-2 border-b border-gray-100 lg:hidden">
                  <div
                    ref={mobileSubTabsContainerRef}
                    className="flex overflow-x-auto"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    onScroll={checkMobileSubScrollPosition}
                  >
                    <Tabs
                      value={
                        activeSubCategory ||
                        (sortedSubCategories.length > 0
                          ? String(sortedSubCategories[0]?.id ?? "")
                          : "all-sub")
                      }
                    >
                      <TabsList className="flex w-max gap-1.5 rounded-full bg-orange-50 border border-orange-100 p-1 h-auto">
                        {sortedSubCategories.map((subCategory) => (
                          <TabsTrigger
                            key={subCategory?.id ?? `sub-${subCategory?.name}`}
                            value={subCategory?.id ? String(subCategory.id) : ""}
                            onClick={() =>
                              handleSubCategorySelect(
                                subCategory?.id ? String(subCategory.id) : null
                              )
                            }
                            className="rounded-full px-3.5 py-1.5 text-xs font-medium text-orange-700 bg-transparent hover:bg-white hover:text-orange-700 transition-colors data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm focus-visible:ring-0 focus-visible:outline-none whitespace-nowrap"
                          >
                            {(language === "ar" && subCategory?.nameAr) ? subCategory.nameAr : (subCategory?.name || "Unknown Subcategory")}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <div className="relative hidden lg:block">
                  {showSubLeftArrow && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-0 top-1/2 z-10 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 shadow-sm border border-gray-200 hover:bg-white lg:hidden"
                      onClick={() => scrollSubCategories("left")}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                  )}
                  {showSubRightArrow && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1/2 z-10 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 shadow-sm border border-gray-200 hover:bg-white lg:hidden"
                      onClick={() => scrollSubCategories("right")}
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                  )}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-0 top-1/2 z-10 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 shadow-sm border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed lg:hidden"
                      onClick={() => scrollSubCategoriesMobile("left")}
                      onMouseDown={() => startSubContinuousScroll("left")}
                      onMouseUp={stopSubContinuousScroll}
                      onMouseLeave={stopSubContinuousScroll}
                      onTouchStart={() => startSubContinuousScroll("left")}
                      onTouchEnd={stopSubContinuousScroll}
                      disabled={!showSubLeftArrowMobile}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1/2 z-10 -translate-y-1/2 h-7 w-7 rounded-full bg-white/90 shadow-sm border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed lg:hidden"
                      onClick={() => scrollSubCategoriesMobile("right")}
                      onMouseDown={() => startSubContinuousScroll("right")}
                      onMouseUp={stopSubContinuousScroll}
                      onMouseLeave={stopSubContinuousScroll}
                      onTouchStart={() => startSubContinuousScroll("right")}
                      onTouchEnd={stopSubContinuousScroll}
                      disabled={!showSubRightArrowMobile}
                    >
                      <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Tabs
                      value={
                        activeSubCategory ||
                        (sortedSubCategories.length > 0
                          ? String(sortedSubCategories[0]?.id ?? "")
                          : "")
                      }
                      className="sticky top-[116px] -mx-8 bg-white/98 px-8 py-2.5 backdrop-blur border-b border-gray-100"
                    >
                      <div
                        ref={mobileSubTabsContainerRef}
                        className="flex overflow-x-auto scrollbar-hide"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        onScroll={checkMobileSubScrollPosition}
                      >
                        <TabsList className="flex w-max gap-1.5 rounded-full bg-orange-50 border border-orange-100 p-1 h-auto">
                          {sortedSubCategories.map((subCategory) => (
                            <TabsTrigger
                              key={subCategory?.id ?? `sub-${subCategory?.name}`}
                              value={subCategory?.id ? String(subCategory.id) : ""}
                              onClick={() =>
                                handleSubCategorySelect(
                                  subCategory?.id ? String(subCategory.id) : null
                                )
                              }
                              className="rounded-full px-3.5 py-1.5 text-xs font-medium text-orange-700 bg-transparent hover:bg-white hover:text-orange-700 transition-colors data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:font-semibold data-[state=active]:shadow-sm focus-visible:ring-0 focus-visible:outline-none whitespace-nowrap"
                            >
                              {(language === "ar" && subCategory?.nameAr) ? subCategory.nameAr : (subCategory?.name || "Unknown Subcategory")}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>
                    </Tabs>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {(() => {
          const comment = language === "ar" ? activeCategoryComment.ar : activeCategoryComment.en;
          return comment ? (
            <div className="px-4 pt-4 pb-1 lg:px-0">
              <p className={cn(
                "text-sm text-gray-500 leading-relaxed",
                language === "ar" ? "text-right" : "text-left"
              )}>
                {comment}
              </p>
            </div>
          ) : null;
        })()}

        <section className="relative pt-6 px-1 lg:px-0">
          {/* Subtle loading indicator when refreshing in background */}
          {isRefreshing && (
            <div className="absolute top-0 right-0 z-50 m-4">
              <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-orange-600 shadow-md backdrop-blur-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                Updating...
              </div>
            </div>
          )}
          {isLoadingContent ? (
            <div className={currentViewStyle.containerClass}>
              {Array.from({ length: skeletonCount }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    currentViewStyle.itemClass,
                    "rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm"
                  )}
                >
                  <Skeleton
                    className={cn(
                      "w-full bg-gray-100",
                      validViewKey === "grid" ? "aspect-square" : "h-32"
                    )}
                  />
                  <div className="p-4">
                    <Skeleton className="mb-2 h-4 w-3/4 rounded-md bg-gray-100" />
                    <Skeleton className="h-3 w-1/2 rounded-md bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={currentViewStyle.containerClass}>
                {hasItems ? (
                  sortedFilteredItems.map((item, index) => {
                    if (!item) return null;
                    return (
                      <div
                        key={item.id || index}
                        className={cn(currentViewStyle.itemClass)}
                      >
                        <MenuItemComponent
                          item={item}
                          language={language}
                          getImageSrc={getImageSrc}
                        />
                      </div>
                    );
                  })
                ) : (
                <div className="col-span-full flex flex-col items-center rounded-2xl bg-white border border-gray-100 px-6 py-16 text-center shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-400">
                    <LayoutGrid className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    {t("noItemsInCategory") || "No items found"}
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-gray-500 leading-relaxed">
                    {activeSubCategory
                      ? t("noItemsInSubcategory") ||
                        "No items in this subcategory. Try selecting a different one."
                      : t("trySelectingDifferentCategory") ||
                        "Try selecting a different category or check back later."}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {(restaurantInfo?.footer || restaurantInfo?.footer_ar) && (
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white py-3 px-4 text-center text-sm text-gray-500 shadow-[0_-1px_4px_rgba(0,0,0,0.06)]">
          {language === "ar" && restaurantInfo.footer_ar
            ? restaurantInfo.footer_ar
            : restaurantInfo.footer}
        </footer>
      )}
    </div>
  );
};

export default Menu;
