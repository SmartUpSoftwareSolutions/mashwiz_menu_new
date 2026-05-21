
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import MenuItemForm from './MenuItemForm';
import { MenuItem, MenuCategory } from '@/services/menuServices';

interface MenuItemFormData {
  itm_code: string;
  itm_name: string;
  website_name_en: string;
  website_name_ar: string;
  website_description_en: string;
  website_description_ar: string;
  sales_price: string;
  itm_group_code: string;
  photo_url: string;
  show_in_website: boolean;
  saleable: boolean;
  fasting: boolean;
  vegetarian: boolean;
  healthyChoice: boolean;
  signatureDish: boolean;
  spicy: boolean;
}

type BranchSettingsMap = Record<
  string,
  { show_in_website: boolean; saleable: boolean; itm_code: string }
>;

interface MenuItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  currentItem: MenuItem | null;
  categories?: MenuCategory[];
  onSubmit: (data: MenuItemFormData, photoFile: File | null) => Promise<void>;
  editingBranchCodes?: string[];
  branchSettings?: BranchSettingsMap;
  onBranchSettingChange?: (
    branchCode: string,
    key: 'show_in_website' | 'saleable',
    value: boolean
  ) => void;
}

const MenuItemDialog = ({
  isOpen,
  onOpenChange,
  isEditing,
  currentItem,
  categories,
  onSubmit,
  editingBranchCodes = [],
  branchSettings = {},
  onBranchSettingChange,
}: MenuItemDialogProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}</SheetTitle>
        </SheetHeader>

        <MenuItemForm
          currentItem={currentItem}
          isEditing={isEditing}
          categories={categories}
          onSubmit={onSubmit}
          onClose={() => onOpenChange(false)}
          editingBranchCodes={editingBranchCodes}
          branchSettings={branchSettings}
          onBranchSettingChange={onBranchSettingChange}
        />
      </SheetContent>
    </Sheet>
  );
};

export default MenuItemDialog;
