// src/hooks/useSortedMenuItems.ts
import { MenuItem } from "../services/menuServices.ts";
import React from "react";

export function sortMenuItems(items: MenuItem[]): MenuItem[] {
    if (!Array.isArray(items)) return [];
    return [...items].sort((a, b) => {
      const orderA = a.itemOrder ?? 0;
      const orderB = b.itemOrder ?? 0;
  
      // Sort by itemOrder ascending
      if (orderA !== orderB) {
        return orderA - orderB;
      }
  
      // Then sort by name ascending alphabetical
      return (a.name || '').localeCompare(b.name || '');
    });
  }
  
  export function useSortedMenuItems(items: MenuItem[]): MenuItem[] {
    return React.useMemo(() => sortMenuItems(items), [items]);
  }