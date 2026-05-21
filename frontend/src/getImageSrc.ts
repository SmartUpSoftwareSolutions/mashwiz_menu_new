// utils/getImageSrc.ts
import { useRestaurantLogo } from "./hooks/useRestaurantLogo.ts";
import { MenuItem } from "@/services/menuServices";

function uint8ToBase64(uint8Array: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

const isAbsoluteUrl = (value: string): boolean => {
  return /^https?:\/\//i.test(value) || value.startsWith("data:");
};

const normalizeImageUrl = (rawValue?: string | null): string | null => {
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  if (isAbsoluteUrl(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return null;
};

export const useMenuItemImage = () => {
  const defaultImage = useRestaurantLogo();

  const getImageSrc = (item: MenuItem): string => {
    if (!item) return defaultImage || "";

    // If photo_url (LONGBLOB) exists
    if (
      item.photo_url &&
      typeof item.photo_url === "object" &&
      "data" in item.photo_url &&
      Array.isArray(item.photo_url.data) &&
      item.photo_url.data.length > 0
    ) {
      const byteArray = new Uint8Array(item.photo_url.data);
      return `data:image/jpeg;base64,${uint8ToBase64(byteArray)}`;
    }

    if (typeof item.photo_url === "string") {
      const normalizedPhotoUrl = normalizeImageUrl(item.photo_url);
      if (normalizedPhotoUrl) {
        return normalizedPhotoUrl;
      }
    }

    // If image is a string
    if (typeof item.image === "string" && item.image.trim()) {
      const normalizedImageUrl = normalizeImageUrl(item.image);
      if (normalizedImageUrl) {
        return normalizedImageUrl;
      }
    }

    return defaultImage || "";
  };

  return { getImageSrc, defaultImage };
};
