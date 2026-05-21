import React from "react";
import { Card } from "@/components/ui/card";
import { MenuItem } from "@/services/menuServices";
import { useLanguage } from "@/hooks/useLanguage";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { useMenuItemImage } from "@/getImageSrc";

interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const { language } = useLanguage();
  const { getImageSrc, defaultImage } = useMenuItemImage();
  const fallbackImage = defaultImage || "/smartlogo.png";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg group",
        language === "ar" ? "text-right" : "text-left"
      )}
    >
      <div
        className={cn(
          "flex h-full",
          language === "ar" ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div className="relative w-1/3 min-w-[120px] overflow-hidden">
          <AspectRatio ratio={1} className="h-full">
            <img
              src={getImageSrc(item)}
              alt={item.name || "Menu item"}
              onError={(e) => {
                e.currentTarget.src = fallbackImage;
              }}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          </AspectRatio>
        </div>

        <div className="flex flex-col justify-between w-2/3 p-4">
          <div>
            <h3 className="text-xl font-bold text-restaurant-dark mb-1">
              {item.name}
              {language === "ar" && item.name && item.nameAr && (
                <span className="block text-sm font-normal text-gray-500 mt-1 ltr:text-left">
                  {item.name}
                </span>
              )}
            </h3>
            <p className="text-sm line-clamp-2 text-gray-700 mb-2">
              {language === "ar"
                ? item.descriptionAr || item.description
                : item.description}
              {language === "en" && item.nameAr && (
                <span className="block text-sm font-normal text-gray-500 mt-1 rtl:text-right">
                  {item.nameAr}
                </span>
              )}
              {language === "en" && item.descriptionAr && (
                <span className="block text-xs text-gray-500 mt-1 rtl:text-right line-clamp-1">
                  {item.descriptionAr}
                </span>
              )}
              {language === "ar" && item.description && item.descriptionAr && (
                <span className="block text-xs text-gray-500 mt-1 ltr:text-left line-clamp-1">
                  {item.description}
                </span>
              )}
            </p>
          </div>
          <div className="mt-auto">
            <span className="font-bold text-restaurant-primary text-lg">
              {`EGP ${item.price.replace("$", "")}`}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MenuItemCard;
