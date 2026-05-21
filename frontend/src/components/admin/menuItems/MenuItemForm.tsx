import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { MenuItem, MenuCategory, updateMenuItem } from "@/services/menuServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SheetClose, SheetFooter } from "@/components/ui/sheet";
import { UploadCloud, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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
  image: string;
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

interface MenuItemFormProps {
  currentItem: MenuItem | null;
  isEditing: boolean;
  categories?: MenuCategory[];
  onSubmit: (data: MenuItemFormData, photoFile: File | null) => Promise<void>;
  onClose: () => void;
  editingBranchCodes?: string[];
  branchSettings?: BranchSettingsMap;
  onBranchSettingChange?: (
    branchCode: string,
    key: 'show_in_website' | 'saleable',
    value: boolean
  ) => void;
}

type MenuCategoryWithBranch = MenuCategory & {
  branchCode?: string | null;
  orderGroup?: number | null;
};

const MenuItemForm = ({
  currentItem,
  isEditing,
  categories = [],
  onSubmit,
  onClose,
  editingBranchCodes = [],
  branchSettings = {},
  onBranchSettingChange,
}: MenuItemFormProps) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoUploadRef = useRef<Promise<string> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MenuItemFormData>({
    defaultValues: {
      itm_code: "",
      itm_name: "",
      website_name_en: "",
      website_name_ar: "",
      website_description_en: "",
      website_description_ar: "",
      sales_price: "",
      itm_group_code: "",
      photo_url: "",
      image: "",
      show_in_website: true,
      saleable: true,
      fasting: false,
      vegetarian: false,
      healthyChoice: false,
      signatureDish: false,
      spicy: false,
    },
  });
  const categoryOptions = useMemo(() => {
    if (!Array.isArray(categories)) {
      return [];
    }

    const deduped = new Map<string, MenuCategoryWithBranch>();

    categories.forEach((category) => {
      const categoryWithBranch = category as MenuCategoryWithBranch;
      const key = categoryWithBranch.id ?? "";

      if (!categoryWithBranch.id || deduped.has(key)) {
        return;
      }

      deduped.set(key, categoryWithBranch);
    });

    return Array.from(deduped.values()).sort((a, b) => {
      const orderA = Number.isFinite(a.orderGroup) ? (a.orderGroup as number) : 0;
      const orderB = Number.isFinite(b.orderGroup) ? (b.orderGroup as number) : 0;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return (a.name || "").localeCompare(b.name || "");
    });
  }, [categories]);

  const getCategoryLabel = (category: MenuCategoryWithBranch) => {
    if (category.branchCode) {
      return `${category.name} (${category.branchCode})`;
    }
    return category.name;
  };

  useEffect(() => {
    if (currentItem && isEditing) {
      const imageName =
        typeof currentItem.image === "string" &&
        currentItem.image !==
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400"
          ? currentItem.image
          : "";

      form.reset({
        itm_code: currentItem.id,
        itm_name: currentItem.name,
        website_name_en: currentItem.name,
        website_name_ar: currentItem.nameAr || "",
        website_description_en: currentItem.description,
        website_description_ar: currentItem.descriptionAr || "",
        sales_price: currentItem.price.replace("$", ""),
        itm_group_code: currentItem.category,
        photo_url: imageName,
        image: imageName,
        show_in_website: currentItem.show_in_website !== false,
        saleable: currentItem.saleable !== false,
        fasting: currentItem.fasting || false,
        vegetarian: currentItem.vegetarian || false,
        healthyChoice: currentItem.healthyChoice || false,
        signatureDish: currentItem.signatureDish || false,
        spicy: currentItem.spicy || false,
      });

      if (imageName) {
        // If already an absolute URL (Cloudinary, etc.) use it directly;
        // otherwise treat as a backend-served filename.
        const url = /^https?:\/\//i.test(imageName)
          ? imageName
          : `${import.meta.env.VITE_API_BASE_URL}/images/${imageName}`;
        setPhotoPreview(url);
      } else {
        setPhotoPreview(null);
      }
      photoUploadRef.current = null;
    } else {
      form.reset({
        itm_code: "",
        itm_name: "",
        website_name_en: "",
        website_name_ar: "",
        website_description_en: "",
        website_description_ar: "",
        sales_price: "",
        itm_group_code: "",
        photo_url: "",
        image: "",
        show_in_website: true,
        saleable: true,
        fasting: false,
        vegetarian: false,
        healthyChoice: false,
        signatureDish: false,
        spicy: false,
      });
      setPhotoPreview(null);
      photoUploadRef.current = null;
    }
  }, [currentItem, isEditing, form]);

  // Compress image in-browser before uploading (reduces payload by ~80%)
  const compressImage = useCallback(
    (file: File, maxWidth = 1200, quality = 0.85): Promise<File> => {
      if (file.type === "image/svg+xml" || file.size < 100 * 1024) {
        return Promise.resolve(file);
      }
      return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          let { width, height } = img;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size >= file.size) { resolve(file); return; }
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              }));
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
        img.src = objectUrl;
      });
    },
    []
  );

  // Compress then upload to backend → Cloudinary
  const doUpload = useCallback(async (file: File): Promise<string> => {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append("image", compressed);
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/image/uploadImage`,
      formData,
      { withCredentials: true }
    );
    const fileUrls = response.data?.fileUrls;
    if (!fileUrls?.[0]) throw new Error("Image upload failed");
    return fileUrls[0] as string;
  }, [compressImage]);

  // Start uploading the moment the user picks a file (background upload)
  const handlePhotoChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);

      // Show preview instantly
      setPhotoPreview(URL.createObjectURL(file));
      form.setValue("photo_url", "");
      form.setValue("image", "");

      // Kick off the upload in the background NOW, not on submit
      setIsUploadingPhoto(true);
      photoUploadRef.current = doUpload(file)
        .then((url) => {
          form.setValue("photo_url", url);
          form.setValue("image", url);
          return url;
        })
        .catch((err) => {
          console.error("Photo upload failed:", err);
          toast.error("Image upload failed. Please try again.");
          photoUploadRef.current = null;
          throw err;
        })
        .finally(() => setIsUploadingPhoto(false));
    },
    [form, photoPreview, doUpload]
  );

  const handleRemovePhoto = useCallback(() => {
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    photoUploadRef.current = null;
    form.setValue("photo_url", "");
    form.setValue("image", "");
  }, [form, photoPreview]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleSubmit = async (data: MenuItemFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (!data.itm_code.trim()) {
        form.setError("itm_code", { message: "Item code is required" });
        return;
      }

      if (!data.itm_name.trim()) {
        form.setError("itm_name", { message: "Item name is required" });
        return;
      }

      if (!data.itm_group_code) {
        form.setError("itm_group_code", {
          message: "Please select a category",
        });
        return;
      }

      let uploadedImage = data.image;
      // If the background upload is still in progress, wait for it.
      // If it already finished, data.image is already set by the promise.
      if (photoUploadRef.current) {
        uploadedImage = await photoUploadRef.current;
      }

      const payload: MenuItemFormData = {
        ...data,
        image: uploadedImage ?? "",
        photo_url: uploadedImage ?? "",
      };

      await onSubmit(payload, null);

      if (!isEditing) {
        form.reset();
        handleRemovePhoto();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchChange = async (
    fieldName: keyof MenuItemFormData,
    value: boolean
  ) => {
    const previousValue = form.getValues(fieldName);
    form.setValue(fieldName, value);
    form.clearErrors(fieldName);

    const itemId = form.getValues("itm_code");
    if (!itemId) {
      return;
    }

    const updatedItem: MenuItem = {
      id: itemId,
      name: form.getValues("itm_name"),
      nameAr: form.getValues("website_name_ar"),
      description: form.getValues("website_description_en"),
      descriptionAr: form.getValues("website_description_ar"),
      price: form.getValues("sales_price"),
      category: form.getValues("itm_group_code"),
      image: form.getValues("image"),
      branchCode: currentItem?.branchCode ?? undefined,
      show_in_website: fieldName === "show_in_website" ? value : form.getValues("show_in_website"),
      saleable: fieldName === "saleable" ? value : form.getValues("saleable"),
      fasting: fieldName === "fasting" ? value : form.getValues("fasting"),
      vegetarian:
        fieldName === "vegetarian" ? value : form.getValues("vegetarian"),
      healthyChoice:
        fieldName === "healthyChoice"
          ? value
          : form.getValues("healthyChoice"),
      signatureDish:
        fieldName === "signatureDish"
          ? value
          : form.getValues("signatureDish"),
      spicy: fieldName === "spicy" ? value : form.getValues("spicy"),
      order: currentItem?.order ?? 0,
      itemOrder: currentItem?.itemOrder ?? currentItem?.order ?? 0,
    };

    try {
      await updateMenuItem(updatedItem);
    } catch (error) {
      console.error("Failed to update menu item toggle", error);
      form.setValue(fieldName, previousValue);
    }
  };

  const tagToggleFields: Array<{
    name: keyof MenuItemFormData;
    label: string;
    helper: string;
  }> = [
    {
      name: "fasting",
      label: "Fasting Friendly",
      helper: "Mark item as suitable for fasting customers.",
    },
    {
      name: "vegetarian",
      label: "Vegetarian",
      helper: "Highlight as vegetarian option on the menu.",
    },
    {
      name: "healthyChoice",
      label: "Healthy Choice",
      helper: "Promote as a lighter, health-forward dish.",
    },
    {
      name: "signatureDish",
      label: "Signature Dish",
      helper: "Feature as one of the restaurant’s signature items.",
    },
    {
      name: "spicy",
      label: "Spicy",
      helper: "Warn guests that this item brings the heat.",
    },
  ];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-8 py-4"
      >
        <div className="space-y-6 rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Provide core details that appear across the menu experience.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="itm_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Unique identifier visible internally"
                      {...field}
                      disabled={isEditing || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itm_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Name shown to guests"
                      {...field}
                      disabled={isSubmitting}
                    />
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
                  <FormLabel>Display Name (English)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional override for English menus"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website_name_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name (Arabic)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Optional override for Arabic menus"
                      {...field}
                      dir="rtl"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="website_description_en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (English)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Entice diners with an appealing description."
                      {...field}
                      className="min-h-[120px]"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website_description_ar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Arabic)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="الوصف باللغة العربية"
                      {...field}
                      className="min-h-[120px]"
                      dir="rtl"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="sales_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Set the menu price"
                      {...field}
                      disabled
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="itm_group_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting || categoryOptions.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            categoryOptions.length === 0
                              ? "No categories available"
                              : "Choose a category"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categoryOptions.length === 0 ? (
                        <SelectItem value="__empty" disabled>
                          No categories available
                        </SelectItem>
                      ) : (
                        categoryOptions.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                          >
                            {getCategoryLabel(category)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Media</h3>
            <p className="text-sm text-muted-foreground">
              Upload a high-quality image to showcase this item across your menu.
            </p>
          </div>

          <FormField
            control={form.control}
            name="photo_url"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="flex flex-col gap-4">
                    {photoPreview ? (
                      <div className="overflow-hidden rounded-xl border border-orange-100 bg-white shadow-sm">
                        <AspectRatio ratio={16 / 9}>
                          <img
                            src={photoPreview}
                            alt="Item preview"
                            className="h-full w-full object-cover"
                          />
                        </AspectRatio>
                      </div>
                    ) : (
                      <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-orange-200 bg-white/70 text-center text-sm text-muted-foreground">
                        No image selected
                      </div>
                    )}

                    {isUploadingPhoto && (
                      <div className="flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-orange-600">
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                        </svg>
                        Uploading image…
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        id="menu-item-photo-upload"
                        disabled={isSubmitting || isUploadingPhoto}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50"
                        onClick={() =>
                          document.getElementById("menu-item-photo-upload")?.click()
                        }
                        disabled={isSubmitting || isUploadingPhoto}
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        {photoPreview ? "Replace Photo" : "Upload Photo"}
                      </Button>
                      {photoPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-50"
                          onClick={handleRemovePhoto}
                          disabled={isSubmitting || isUploadingPhoto}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <Input type="hidden" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Visibility</h3>
            <p className="text-sm text-muted-foreground">
              Control whether this item appears on the website per branch.
            </p>
          </div>

          {isEditing && editingBranchCodes.length > 1 ? (
            /* Per-branch settings table */
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
                  {editingBranchCodes.map((branchCode) => (
                    <tr key={branchCode} className="hover:bg-orange-50/30">
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                          {branchCode}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Switch
                          checked={branchSettings[branchCode]?.show_in_website ?? true}
                          onCheckedChange={(val) =>
                            onBranchSettingChange?.(branchCode, 'show_in_website', val)
                          }
                          disabled={isSubmitting}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Switch
                          checked={branchSettings[branchCode]?.saleable ?? true}
                          onCheckedChange={(val) =>
                            onBranchSettingChange?.(branchCode, 'saleable', val)
                          }
                          disabled={isSubmitting}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Single-branch or create: global toggles */
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="show_in_website"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3 shadow-sm">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium text-gray-900">
                        Show on Website
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">Display this item on the guest-facing menu.</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => handleSwitchChange("show_in_website", value)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saleable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3 shadow-sm">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium text-gray-900">
                        Saleable
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">Allow this item to be ordered by customers.</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) => handleSwitchChange("saleable", value)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tags & Badges</h3>
            <p className="text-sm text-muted-foreground">
              Toggle the attributes that will surface badges on the guest-facing menu.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {tagToggleFields.map(({ name, label, helper }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50/40 px-4 py-3 shadow-sm">
                    <div className="space-y-1">
                      <FormLabel className="text-sm font-medium text-gray-900">
                        {label}
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">{helper}</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(value) =>
                          handleSwitchChange(name, value)
                        }
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <SheetFooter className="pt-2">
          <SheetClose asChild>
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {isSubmitting
              ? isUploadingPhoto ? "Uploading image…" : "Saving..."
              : isEditing ? "Update Item" : "Create Item"}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
};

export default MenuItemForm;
