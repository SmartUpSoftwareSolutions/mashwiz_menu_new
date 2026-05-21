import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Tag,
  Upload,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  FileImage,
} from "lucide-react";
import { useTagsInfo, useSaveTagsInfo } from "@/services/tagsService.ts";

const TAG_KEYS = [
  "fasting",
  "vegetarian",
  "healthy_choice",
  "signature_dish",
  "spicy",
] as const;

type TagKey = (typeof TAG_KEYS)[number];
type TagsPayload = Record<TagKey, string | null>;

interface TagUploadState {
  file: File | null;
  preview: string | null;
  url: string | null;
  error: string | null;
  removed: boolean;
}

const normalizeRemoteImageUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return null;
};

const AdminTagsPage = () => {
  const { data: tagsInfo, isLoading, error } = useTagsInfo();
  const updateMutation = useSaveTagsInfo();

  const tagLabels = useMemo<Record<TagKey, string>>(
    () => ({
      fasting: "Fasting",
      vegetarian: "Vegetarian",
      healthy_choice: "Healthy Choice",
      signature_dish: "Signature Dish",
      spicy: "Spicy",
    }),
    []
  );

  const [tags, setTags] = useState<Record<TagKey, TagUploadState>>({
    fasting: {
      file: null,
      preview: null,
      url: null,
      error: null,
      removed: false,
    },
    vegetarian: {
      file: null,
      preview: null,
      url: null,
      error: null,
      removed: false,
    },
    healthy_choice: {
      file: null,
      preview: null,
      url: null,
      error: null,
      removed: false,
    },
    signature_dish: {
      file: null,
      preview: null,
      url: null,
      error: null,
      removed: false,
    },
    spicy: {
      file: null,
      preview: null,
      url: null,
      error: null,
      removed: false,
    },
  });
  const [isUploading, setIsUploading] = useState(false);
  const [initialValues, setInitialValues] = useState<TagsPayload>({
    fasting: null,
    vegetarian: null,
    healthy_choice: null,
    signature_dish: null,
    spicy: null,
  });

  useEffect(() => {
    if (!tagsInfo) {
      return;
    }

    const nextInitial: TagsPayload = {
      fasting: tagsInfo.fasting || null,
      vegetarian: tagsInfo.vegetarian || null,
      healthy_choice: tagsInfo.healthy_choice || null,
      signature_dish: tagsInfo.signature_dish || null,
      spicy: tagsInfo.spicy || null,
    };

    setInitialValues(nextInitial);

    setTags((previous) => {
      const resetState = { ...previous };
      TAG_KEYS.forEach((key) => {
        const state = resetState[key];
        if (state.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(state.preview);
        }
        resetState[key] = {
          file: null,
          preview: null,
          url: nextInitial[key],
          error: null,
          removed: false,
        };
      });
      return resetState;
    });
  }, [tagsInfo]);

  const hasChanges = useMemo(
    () =>
      Object.keys(tags).some((key) => {
        const tag = tags[key];
        const initialUrl = initialValues[key];
        return tag.removed || tag.file !== null || tag.url !== initialUrl;
      }),
    [initialValues, tags]
  );

  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith(".ico")) {
      return "Only .ico files are allowed";
    }
    if (file.size > 1024 * 1024) {
      return "File size must be less than 1MB";
    }
    return null;
  }, []);

  const handleTagChange = useCallback(
    (tagKey: TagKey, file: File | null) => {
      const validationError = file ? validateFile(file) : null;
      if (validationError) {
        toast.error(validationError);
      }

      setTags((previous) => {
        const current = previous[tagKey];
        if (current.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(current.preview);
        }

        if (!file) {
          return {
            ...previous,
            [tagKey]: {
              ...current,
              file: null,
              preview: null,
              error: null,
              removed: false,
            },
          };
        }

        if (validationError) {
          return {
            ...previous,
            [tagKey]: {
              ...current,
              file: null,
              preview: null,
              error: validationError,
            },
          };
        }

        const previewUrl = URL.createObjectURL(file);
        return {
          ...previous,
          [tagKey]: {
            ...current,
            file,
            preview: previewUrl,
            error: null,
            removed: false,
          },
        };
      });
    },
    [validateFile]
  );

  const handleFileInputChange = useCallback(
    (tagKey: TagKey, event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      handleTagChange(tagKey, file);
      event.target.value = "";
    },
    [handleTagChange]
  );

  const removeImage = useCallback((tagKey: TagKey) => {
    setTags((previous) => {
      const current = previous[tagKey];
      if (current.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(current.preview);
      }
      return {
        ...previous,
        [tagKey]: {
          ...current,
          file: null,
          preview: null,
          url: null,
          error: null,
          removed: true,
        },
      };
    });
  }, []);

  const getImageUrl = useCallback((tagData: TagUploadState): string | null => {
    if (tagData.preview) {
      return tagData.preview;
    }
    if (tagData.url) {
      return normalizeRemoteImageUrl(tagData.url);
    }
    return null;
  }, []);

  const hasImage = useCallback(
    (tagData: TagUploadState) => Boolean(getImageUrl(tagData)),
    [getImageUrl]
  );

  const stagedTags = useMemo(
    () =>
      TAG_KEYS.map((key) => ({
        key,
        label: tagLabels[key],
        state: tags[key],
      })),
    [tagLabels, tags]
  );

  const handleSubmit = useCallback(async () => {
    if (!hasChanges) {
      toast("No changes to save");
      return;
    }

    try {
      setIsUploading(true);

      const payload: TagsPayload = {
        fasting: null,
        vegetarian: null,
        healthy_choice: null,
        signature_dish: null,
        spicy: null,
      };

      const updatedTags = { ...tags } as Record<TagKey, TagUploadState>;

      for (const key of TAG_KEYS) {
        const state = tags[key];
        let nextUrl = state.url;

        if (state.file) {
          const formData = new FormData();
          formData.append("image", state.file);

          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/image/uploadImage`,
            formData,
            {
              withCredentials: true,
              headers: {
                Authorization: localStorage.getItem("token") || "",
              },
            }
          );

          nextUrl = response.data?.fileUrls?.[0] ?? null;
          if (!nextUrl) {
            throw new Error(
              `${tagLabels[key]} icon upload failed. Please try again.`
            );
          }
        } else if (state.removed) {
          nextUrl = null;
        }

        payload[key] = nextUrl;

        if (state.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(state.preview);
        }

        updatedTags[key] = {
          file: null,
          preview: null,
          url: nextUrl,
          error: null,
          removed: false,
        };
      }

      await updateMutation.mutateAsync(payload);
      toast.success("Tags updated successfully");
      setInitialValues(payload);
      setTags(updatedTags);
    } catch (error) {
      console.error("Tags update failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Update failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  }, [hasChanges, tagLabels, tags, updateMutation]);

  useEffect(() => {
    return () => {
      TAG_KEYS.forEach((key) => {
        const preview = tags[key].preview;
        if (preview?.startsWith("blob:")) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, [tags]);

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="max-w-md border border-red-200 bg-red-50/60 p-8">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                Unable to Load Data
              </h3>
              <p className="mt-2 text-red-700">
                There was an error loading your tags information. Please try
                refreshing the page or contact support.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tag Management</h1>
              <p className="text-gray-600">
                Upload branded icons used to highlight menu item attributes.
              </p>
            </div>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-2 pt-2">
              <Badge
                variant="secondary"
                className="border-amber-200 bg-amber-100 text-amber-800"
              >
                <AlertCircle className="mr-1 h-3 w-3" />
                Unsaved changes
              </Badge>
            </div>
          )}
        </div>

        <Card className="border border-orange-100 bg-white/95 shadow-lg backdrop-blur-sm">
          <div className="p-6 sm:p-8">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: TAG_KEYS.length }).map((_, index) => (
                  <div
                    key={index}
                    className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/40 p-6"
                  >
                    <Skeleton className="h-6 w-32 rounded-full" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-10">
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {stagedTags.map(({ key, label, state }) => {
                    const imageUrl = getImageUrl(state);
                    return (
                      <div
                        key={key}
                        className="group flex flex-col gap-4 rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-sm transition hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {label}
                          </h3>
                          {state.removed && (
                            <Badge
                              variant="outline"
                              className="border-red-200 bg-red-50 text-red-600"
                            >
                              Removed
                            </Badge>
                          )}
                        </div>

                        <div className="relative flex h-32 items-center justify-center rounded-xl border border-dashed border-orange-200 bg-orange-50/40">
                          {imageUrl ? (
                            <>
                              <img
                                src={imageUrl}
                                alt={label}
                                className="h-16 w-16 object-contain"
                              />
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-sm"
                                onClick={() => removeImage(key)}
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center text-center text-sm text-gray-500">
                              <FileImage className="mb-2 h-8 w-8 text-orange-300" />
                              No icon uploaded
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="relative">
                            <input
                              type="file"
                              accept=".ico"
                              onChange={(event) =>
                                handleFileInputChange(key, event)
                              }
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              disabled={isUploading}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-center border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50"
                              disabled={isUploading}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              {imageUrl ? "Replace Icon" : "Upload Icon"}
                            </Button>
                          </div>

                          {state.error && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              {state.error}
                            </div>
                          )}

                          <p className="text-xs text-gray-500">
                            Use a <strong>.ico</strong> file up to 1MB
                            (recommended 32×32px).
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t border-orange-100 pt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {updateMutation.isSuccess && !hasChanges && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">All changes saved</span>
                      </>
                    )}
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isUploading || updateMutation.isPending || !hasChanges
                    }
                    className="min-w-32 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition"
                  >
                    {isUploading || updateMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminTagsPage;