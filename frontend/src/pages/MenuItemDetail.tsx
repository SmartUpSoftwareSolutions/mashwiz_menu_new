import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useMenuItemImage } from "../getImageSrc";
import { MenuItem } from "@/services/menuServices";
import { cn } from "@/lib/utils";

const MenuItemDetail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage() || { language: "en" };
  const { getImageSrc } = useMenuItemImage();

  const item: MenuItem | undefined = state?.item;

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="text-center space-y-4">
          <p className="text-gray-500">Item not found.</p>
          <Button onClick={() => navigate(-1)} variant="outline">Go back</Button>
        </div>
      </div>
    );
  }

  const name = language === "ar" ? (item.nameAr || item.name) : item.name;
  const description = language === "ar"
    ? (item.descriptionAr || item.description)
    : item.description;

  const tagIconEntries = item.tagIcons
    ? Object.entries(item.tagIcons).filter(
        ([, value]) => typeof value === "string" && value.trim().length > 0
      )
    : [];

  return (
    <div className={cn("min-h-screen bg-neutral-50", language === "ar" ? "text-right" : "text-left")}>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400" />
        <div className="flex items-center px-4 py-3 gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="rounded-xl text-gray-600 hover:text-orange-600 hover:bg-orange-50 px-3 py-2 gap-2"
          >
            <ArrowLeft className={cn("h-4 w-4", language === "ar" ? "rotate-180" : "")} />
            <span className="text-sm font-medium">{language === "ar" ? "رجوع" : "Back"}</span>
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        <div className="bg-white">
          <img
            src={getImageSrc(item)}
            alt={name}
            className="w-full aspect-square object-cover"
            onError={(e) => { e.currentTarget.src = "/placeholder-food.jpg"; }}
          />
        </div>

        <div className="bg-white mt-2 px-5 py-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 leading-snug flex-1">
              {name}
            </h1>
            <span className="text-2xl font-bold text-orange-500 whitespace-nowrap flex-shrink-0">
              {item.price}
            </span>
          </div>

          {description && (
            <p className="text-base text-gray-600 leading-relaxed">
              {description}
            </p>
          )}

          {tagIconEntries.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {tagIconEntries.map(([name, src]) => (
                <img
                  key={name}
                  src={src as string}
                  alt={name}
                  className="w-12 h-12 rounded-lg bg-white p-0.5 shadow-sm border border-orange-100"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemDetail;
