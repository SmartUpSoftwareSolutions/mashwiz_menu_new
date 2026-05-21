import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  useRestaurantInfo,
  useSaveRestaurantInfo,
} from "@/services/restaurantInfoService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Upload, ImageOff } from "lucide-react";

type FormStatus =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const AdminRestaurantInfo: React.FC = () => {
  const { data: restaurantInfo, isLoading } = useRestaurantInfo();
  const saveMutation = useSaveRestaurantInfo();

  const initialValues = useMemo(
    () => ({
      name: restaurantInfo?.name ?? "",
      slogan: restaurantInfo?.slogan ?? "",
      logoUrl: restaurantInfo?.logo_url ?? null,
    }),
    [restaurantInfo]
  );

  const [name, setName] = useState(initialValues.name);
  const [slogan, setSlogan] = useState(initialValues.slogan);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialValues.logoUrl
  );
  const [status, setStatus] = useState<FormStatus>({ kind: "idle" });

  const updateLogoPreview = useCallback((nextPreview: string | null) => {
    setLogoPreview((previous) => {
      if (previous && previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return nextPreview;
    });
  }, []);

  useEffect(() => {
    setName(initialValues.name);
    setSlogan(initialValues.slogan);
    updateLogoPreview(initialValues.logoUrl);
    setLogoFile(null);
    setStatus({ kind: "idle" });
  }, [initialValues, updateLogoPreview]);

  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const handleLogoChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      setLogoFile(file);

      if (file) {
        updateLogoPreview(URL.createObjectURL(file));
      } else {
        updateLogoPreview(initialValues.logoUrl);
      }
    },
    [initialValues.logoUrl, updateLogoPreview]
  );

  const handleRemoveLogo = useCallback(() => {
    setLogoFile(null);
    updateLogoPreview(null);
  }, [updateLogoPreview]);

  const isDirty =
    name.trim() !== initialValues.name.trim() ||
    slogan.trim() !== initialValues.slogan.trim() ||
    logoFile !== null ||
    (initialValues.logoUrl !== logoPreview &&
      !(logoPreview === null && initialValues.logoUrl === null));

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!isDirty || saveMutation.isPending) {
        return;
      }

      try {
        setStatus({ kind: "idle" });

        let uploadedLogoUrl: string | null = initialValues.logoUrl;
        let removeLogo = false;

        if (logoFile) {
          const formData = new FormData();
          formData.append("image", logoFile);

          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/image/uploadImage`,
            formData,
            { withCredentials: true }
          );

          uploadedLogoUrl = response.data?.fileUrls?.[0] ?? null;

          if (!uploadedLogoUrl) {
            throw new Error("Image upload failed. Please try again.");
          }
        } else if (!logoPreview && initialValues.logoUrl) {
          removeLogo = true;
          uploadedLogoUrl = null;
        }

        await saveMutation.mutateAsync({
          name: name.trim(),
          slogan: slogan.trim() || null,
          logoUrl: uploadedLogoUrl,
          removeLogo,
          themeId: restaurantInfo?.theme_id ?? null,
          show_all_category: restaurantInfo?.show_all_category ?? true,
          branch_code: restaurantInfo?.branch_code ?? null,
          style: restaurantInfo?.style ?? null,
        });
        setStatus({
          kind: "success",
          message: "Restaurant information saved successfully.",
        });
      } catch (error) {
        console.error("Failed to save restaurant info:", error);
        setStatus({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to save changes. Please try again.",
        });
      }
    },
    [
      isDirty,
      logoFile,
      logoPreview,
      name,
      restaurantInfo,
      saveMutation,
      slogan,
      initialValues.logoUrl,
    ]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Information</CardTitle>
          <CardDescription>Manage brand identity and presentation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="grid gap-4 md:grid-cols-[1fr_200px]">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-11 w-full max-w-xs" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-orange-100 shadow-sm">
      <CardHeader>
        <CardTitle>Restaurant Information</CardTitle>
        <CardDescription>
          Update your brand name, slogan, and logo to keep menus and marketing aligned.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter restaurant name"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The name displayed across customer-facing experiences.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slogan">Slogan</Label>
                <Input
                  id="slogan"
                  value={slogan}
                  onChange={(event) => setSlogan(event.target.value)}
                  placeholder="Enter restaurant slogan"
                  maxLength={140}
                />
                <p className="text-sm text-muted-foreground">
                  Optional tagline shown on landing pages and marketing surfaces.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Logo</Label>
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-orange-200 bg-orange-50/40 p-6 text-center">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Restaurant logo preview"
                    className="h-24 w-24 rounded-full border border-orange-100 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-orange-100 bg-white text-orange-400 shadow-sm">
                    <ImageOff className="h-8 w-8" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label
                    htmlFor="logo"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-600 transition hover:border-orange-300 hover:bg-orange-50"
                  >
                    <Upload className="h-4 w-4" />
                    Upload logo
                  </Label>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Remove logo
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended size: 512 × 512px PNG with transparent background.
                </p>
              </div>
            </div>
          </div>

          {status.kind === "success" && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {status.message}
            </div>
          )}
          {status.kind === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {status.message}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Fields marked with * are required.
            </div>
            <Button
              type="submit"
              disabled={!isDirty || saveMutation.isPending}
              className="min-w-[150px]"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminRestaurantInfo;
