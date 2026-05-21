
import { useQuery } from '@tanstack/react-query';

// This interface defines the structure of menu items from the Google Sheet
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image?: string;
}

// This interface defines the structure of menu categories from the Google Sheet
export interface MenuCategory {
  id: string;
  name: string;
}

// Configuration constants for the Google Sheets API
const GOOGLE_SHEETS_API_KEY = "YOUR_API_KEY"; // You'll need to provide this
const SHEET_ID = "YOUR_SHEET_ID"; // You'll need to provide the Google Sheet ID
const MENU_ITEMS_RANGE = "MenuItems!A2:F100"; // Adjust range as needed
const CATEGORIES_RANGE = "Categories!A2:B50"; // Adjust range as needed

// Fetch menu items from Google Sheet
export const fetchMenuItems = async (): Promise<MenuItem[]> => {
  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${MENU_ITEMS_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch menu items');
  }
  
  const data = await response.json();
  
  // Map the raw data to our MenuItem interface
  return (data.values || []).map((row: any[], index: number) => ({
    id: index.toString(),
    name: row[0] || '',
    description: row[1] || '',
    price: row[2] || '',
    category: row[3] || '',
    image: row[4] || undefined,
  }));
};

// Fetch menu categories from Google Sheet
export const fetchMenuCategories = async (): Promise<MenuCategory[]> => {
  const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${CATEGORIES_RANGE}?key=${GOOGLE_SHEETS_API_KEY}`;
  
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch menu categories');
  }
  
  const data = await response.json();
  
  // Map the raw data to our MenuCategory interface
  return (data.values || []).map((row: any[], index: number) => ({
    id: index.toString(),
    name: row[0] || '',
  }));
};

// React Query hooks for data fetching
export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menuItems'],
    queryFn: fetchMenuItems,
  });
};

export const useMenuCategories = () => {
  return useQuery({
    queryKey: ['menuCategories'],
    queryFn: fetchMenuCategories,
  });
};
