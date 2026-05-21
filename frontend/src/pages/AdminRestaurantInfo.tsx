import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRestaurantInfo,
  useSaveRestaurantInfo,
} from "@/services/restaurantInfoService";
import axios from "axios";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
  RefreshCw,
  XCircle,
  Clock,
} from "lucide-react";
import ThemeSelector from "@/components/admin/ThemeSelector";

const STREAM_SYNC_MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isTransientSyncNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = (error.message || "").toLowerCase();
  if (error.name === "TypeError" && msg.includes("failed to fetch")) return true;
  return (
    msg.includes("networkerror") ||
    msg.includes("network changed") ||
    msg.includes("load failed") ||
    msg.includes("the network connection was lost") ||
    msg.includes("aborted")
  );
}
import RestaurantBasicInfoForm from "@/components/admin/restaurant/RestaurantBasicInfoForm";
import RestaurantLogoUpload from "@/components/admin/restaurant/RestaurantLogoUpload";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { QRCodeCanvas } from "qrcode.react";
import { DatabaseChangeDialog } from "@/components/admin/DatabaseChangeDialog";
import { SyncConfirmationDialog } from "@/components/admin/SyncConfirmationDialog";

type BranchSyncStatus = "pending" | "syncing" | "done" | "failed";
interface BranchProgress {
  code: string;
  name: string;
  status: BranchSyncStatus;
  error?: string;
}

interface RestaurantInfoFormValues {
  name: string;
  slogan: string;
  footer: string;
  footer_ar: string;
  theme_id: string;
  show_all_category: boolean;
  branch_code: string;
  style: string;
}

const AdminRestaurantInfo = () => {
  const { data: restaurantInfo, isLoading, error } = useRestaurantInfo();
  const updateMutation = useSaveRestaurantInfo();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [branchProgress, setBranchProgress] = useState<BranchProgress[]>([]);
  const [showDbChangeDialog, setShowDbChangeDialog] = useState(false);
  const [showSyncConfirmationDialog, setShowSyncConfirmationDialog] = useState(false);
  const [pendingSyncAction, setPendingSyncAction] = useState<(() => Promise<void>) | null>(null);

  const form = useForm<RestaurantInfoFormValues>({
    defaultValues: {
      name: "",
      slogan: "",
      footer: "",
      footer_ar: "",
      theme_id: "",
      show_all_category: true,
      branch_code: "",
      style: "",
    },
  });

  const initialFormValues = useMemo<RestaurantInfoFormValues>(
    () => ({
      name: restaurantInfo?.name || "",
      slogan: restaurantInfo?.slogan || "",
      footer: restaurantInfo?.footer || "",
      footer_ar: restaurantInfo?.footer_ar || "",
      theme_id: restaurantInfo?.theme_id || "",
      show_all_category: restaurantInfo?.show_all_category ?? true,
      branch_code: restaurantInfo?.branch_code || "",
      style: restaurantInfo?.style || "grid",
    }),
    [restaurantInfo]
  );

  const initialLogoUrl = useMemo(
    () => restaurantInfo?.logo_url || null,
    [restaurantInfo?.logo_url]
  );

  useEffect(() => {
    form.reset(initialFormValues, { keepDirty: false });
    setLogoUrl(initialLogoUrl);
    setLogoRemoved(false);
    setLogoFile(null);
    setLogoPreview((previous) => {
      if (previous && previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return initialLogoUrl;
    });
  }, [form, initialFormValues, initialLogoUrl]);

  const handleLogoChange = useCallback(
    (file: File | null, _bytes?: number[]) => {
      setLogoRemoved(false);
      setLogoFile(file);

      if (!file) {
        setLogoPreview((previous) => {
          if (previous && previous.startsWith("blob:")) {
            URL.revokeObjectURL(previous);
          }
          return initialLogoUrl;
        });
        setLogoUrl(initialLogoUrl);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setLogoPreview((previous) => {
        if (previous && previous.startsWith("blob:")) {
          URL.revokeObjectURL(previous);
        }
        return previewUrl;
      });
      setLogoUrl(null);
    },
    [initialLogoUrl]
  );

  const handleRemoveLogo = useCallback(() => {
    setLogoPreview((previous) => {
      if (previous && previous.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });
    setLogoUrl(null);
    setLogoRemoved(true);
    setLogoFile(null);
  }, []);

  // Check if database credentials have changed
  const checkDatabaseChanged = useCallback(async (): Promise<{
    changed: boolean;
    currentDb?: string;
    newDb?: string;
  }> => {
    try {
      const storedCredentials = localStorage.getItem("dbCredentials");
      if (!storedCredentials) {
        // No stored credentials, first time sync
        return { changed: false };
      }

      const credentials = JSON.parse(storedCredentials);
      const currentEmail = credentials.email;
      const currentPassword = credentials.password;

      // Get current user from localStorage
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user || !currentEmail || !currentPassword) {
        return { changed: false };
      }

      // Check if email/password changed by attempting to get current database info
      // We'll check via the token and compare with stored database name
      const token = localStorage.getItem("token");
      if (!token) {
        return { changed: false };
      }

      // Try to get current database info from backend (lightweight endpoint)
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/current-database`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        // If endpoint fails, assume no change (fail gracefully)
        console.warn("Could not check database change, assuming no change");
        return { changed: false };
      }

      const result = await response.json().catch(() => ({}));
      const newDatabaseName = result?.databaseName;
      const storedDatabaseName = credentials.databaseName;

      if (newDatabaseName && storedDatabaseName && newDatabaseName !== storedDatabaseName) {
        return {
          changed: true,
          currentDb: storedDatabaseName,
          newDb: newDatabaseName,
        };
      }

      // Also check if email changed
      if (user.email && user.email !== currentEmail) {
        return {
          changed: true,
          currentDb: storedDatabaseName,
          newDb: newDatabaseName || "New Database",
        };
      }

      return { changed: false };
    } catch (error) {
      console.error("Error checking database change:", error);
      return { changed: false };
    }
  }, []);

  // Streaming sync — shows per-branch progress in real time
  const performStreamingSync = useCallback(async () => {
    setIsSyncing(true);
    setBranchProgress([]);

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
    const streamUrl = `${baseUrl}/api/transfer/sync-all-stream`;
    const token = localStorage.getItem("token") || "";

    type StreamSummary = { total: number; synced: number; failed: number } | null;

    // If no meaningful SSE event arrives within this window, abort and fall back.
    const STREAM_IDLE_TIMEOUT_MS = 60_000;

    const runStreamOnce = async (): Promise<
      | { ok: true; summary: StreamSummary }
      | { ok: false; transient: boolean; error: Error }
    > => {
      const abort = new AbortController();
      let idleTimer: ReturnType<typeof setTimeout> | null = null;

      const resetIdleTimer = (reader: ReadableStreamDefaultReader<Uint8Array>) => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          reader.cancel();
          abort.abort();
        }, STREAM_IDLE_TIMEOUT_MS);
      };

      try {
        const response = await fetch(streamUrl, {
          headers: { Authorization: token },
          credentials: "include",
          signal: abort.signal,
        });

        if (!response.ok || !response.body) {
          const result = (await response.json().catch(() => ({}))) as { message?: string };
          return {
            ok: false,
            transient: false,
            error: new Error(result?.message || `Server error: ${response.status}`),
          };
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let summary: StreamSummary = null;

        resetIdleTimer(reader);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Any data (including keepalive pings) resets the idle timer.
          resetIdleTimer(reader);

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            let event: Record<string, unknown>;
            try {
              event = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (event.type === "init") {
              const branches = (event.branches as { code: string; name: string }[]) ?? [];
              setBranchProgress(branches.map((b) => ({ code: b.code, name: b.name, status: "pending" })));
            } else if (event.type === "start") {
              setBranchProgress((prev) =>
                prev.map((b) => (b.code === event.branchCode ? { ...b, status: "syncing" } : b))
              );
            } else if (event.type === "done") {
              setBranchProgress((prev) =>
                prev.map((b) => (b.code === event.branchCode ? { ...b, status: "done" } : b))
              );
            } else if (event.type === "failed") {
              setBranchProgress((prev) =>
                prev.map((b) =>
                  b.code === event.branchCode
                    ? { ...b, status: "failed", error: event.error as string }
                    : b
                )
              );
            } else if (event.type === "complete") {
              summary = event.summary as StreamSummary;
            } else if (event.type === "error") {
              return {
                ok: false,
                transient: false,
                error: new Error((event.message as string) || "Sync stream error"),
              };
            }
          }
        }

        return { ok: true, summary };
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        const timedOut = abort.signal.aborted;
        return {
          ok: false,
          transient: timedOut || isTransientSyncNetworkError(err),
          error: timedOut ? new Error("Sync stream timed out. Retrying…") : err,
        };
      } finally {
        if (idleTimer) clearTimeout(idleTimer);
      }
    };

    const toastSummary = (summary: StreamSummary) => {
      if (!summary) return;
      if (summary.failed === 0) {
        toast.success(`All ${summary.synced} branches synced successfully.`);
      } else if (summary.synced === 0) {
        toast.error(`Sync failed for all ${summary.total} branches.`);
      } else {
        toast.warning(`${summary.synced} synced, ${summary.failed} failed.`);
      }
    };

    const runPostSyncAllFallback = async () => {
      const response = await fetch(`${baseUrl}/api/transfer/sync-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
        summary?: { totalBranches?: number; syncedBranches?: number; failedBranches?: number };
      };
      if (!response.ok && response.status !== 207) {
        throw new Error(result?.message || `Server error: ${response.status}`);
      }
      const s = result.summary;
      if (s) {
        toastSummary({
          total: s.totalBranches ?? 0,
          synced: s.syncedBranches ?? 0,
          failed: s.failedBranches ?? 0,
        });
      } else {
        toast.success(result?.message || "Sync completed.");
      }
    };

    try {
      for (let attempt = 0; attempt < STREAM_SYNC_MAX_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          setBranchProgress([]);
          toast.info(`Connection interrupted. Retrying (${attempt + 1}/${STREAM_SYNC_MAX_ATTEMPTS})…`);
          await sleep(1200 * attempt);
        }

        const outcome = await runStreamOnce();
        if (outcome.ok) {
          toastSummary(outcome.summary);
          return;
        }
        if (!outcome.transient) {
          toast.error(outcome.error.message);
          return;
        }
      }

      toast.info("Live progress unavailable. Running full sync in one request…");
      await runPostSyncAllFallback();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Sync failed. Check console for details.";
      console.error("Streaming sync failed:", error);
      toast.error(msg);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Truncate-and-sync uses the regular POST (more complex flow with credential update)
  const performTruncateSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      setBranchProgress([]);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/transfer/truncate-and-sync-all`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token") || "",
          },
          credentials: "include",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = result?.message || result?.error || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      toast.success(result?.message || "All data truncated and synced successfully from new database.");

      // Update stored credentials after successful truncate-sync
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const token = localStorage.getItem("token");
      if (user && token) {
        try {
          const dbResponse = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/auth/current-database`,
            { method: "GET", headers: { "Content-Type": "application/json", Authorization: token }, credentials: "include" }
          );
          if (dbResponse.ok) {
            const dbResult = await dbResponse.json().catch(() => ({}));
            const dbName = dbResult?.databaseName;
            if (dbName) {
              const storedCredentials = localStorage.getItem("dbCredentials");
              if (storedCredentials) {
                const credentials = JSON.parse(storedCredentials);
                localStorage.setItem("dbCredentials", JSON.stringify({ ...credentials, databaseName: dbName, timestamp: Date.now() }));
              }
            }
          }
        } catch (e) {
          console.error("Error updating credentials:", e);
        }
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Truncate sync failed.";
      console.error("Truncate sync failed:", error);
      toast.error(msg);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const performSync = useCallback(
    async (truncate: boolean = false) => {
      if (truncate) {
        await performTruncateSync();
      } else {
        await performStreamingSync();
      }
    },
    [performStreamingSync, performTruncateSync]
  );

  const handleSyncAll = useCallback(async () => {
    // Always show confirmation dialog first
    setShowSyncConfirmationDialog(true);
  }, []);

  const handleConfirmSync = useCallback(async () => {
    setShowSyncConfirmationDialog(false);
    await performSync(false);
  }, [performSync]);

  const handleCancelSync = useCallback(() => {
    setShowSyncConfirmationDialog(false);
  }, []);

  const handleConfirmDbChange = useCallback(async () => {
    setShowDbChangeDialog(false);
    if (pendingSyncAction) {
      await pendingSyncAction();
      setPendingSyncAction(null);
    }
  }, [pendingSyncAction]);

  const handleCancelDbChange = useCallback(() => {
    setShowDbChangeDialog(false);
    setPendingSyncAction(null);
  }, []);

  const hasChanges = useMemo(
    () => form.formState.isDirty || logoRemoved || logoFile !== null,
    [form.formState.isDirty, logoRemoved, logoFile]
  );

  const onSubmit = useCallback(
    async (values: RestaurantInfoFormValues) => {
      if (!hasChanges) {
        toast("No changes to save");
        return;
      }

      try {
        setIsUploading(true);

        let uploadedLogoUrl = initialLogoUrl;
        let removeLogo = logoRemoved;

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
            throw new Error("Logo upload failed. Please try again.");
          }
          removeLogo = false;
        } else if (logoRemoved) {
          uploadedLogoUrl = null;
        }

        await updateMutation.mutateAsync({
          name: values.name,
          slogan: values.slogan,
          footer: values.footer || null,
          footer_ar: values.footer_ar || null,
          themeId: values.theme_id || null,
          logoUrl: removeLogo ? null : uploadedLogoUrl,
          removeLogo,
          show_all_category: values.show_all_category,
          branch_code: values.branch_code || null,
          style: values.style || "grid",
        });

        toast.success("Restaurant information updated successfully");
        setLogoRemoved(false);
        setLogoFile(null);
        setLogoUrl(uploadedLogoUrl);
        setLogoPreview((previous) => {
          if (previous && previous.startsWith("blob:")) {
            URL.revokeObjectURL(previous);
          }
          return uploadedLogoUrl ?? null;
        });
      } catch (error) {
        console.error("Update failed:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Update failed. Please try again."
        );
      } finally {
        setIsUploading(false);
      }
    },
    [hasChanges, initialLogoUrl, logoFile, logoRemoved, updateMutation]
  );

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto border-red-200 bg-red-50/50">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                Unable to Load Data
              </h3>
              <p className="text-red-700 mt-2">
                There was an error loading your restaurant information. Please
                try refreshing the page or contact support.
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
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Restaurant Information
              </h1>
              <p className="text-gray-600">
                Manage your brand presence, menu defaults, and syncing options.
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
            <div className="space-y-8">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-32 w-32 rounded-lg" />
              <Skeleton className="h-11 w-32" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <RestaurantBasicInfoForm form={form} />

                  <FormField
                    control={form.control}
                    name="footer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Text</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter footer text (e.g. copyright, contact info)"
                            className="resize-none"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          This text will appear in the footer of your menu website.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="footer_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Text (Arabic)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="أدخل نص التذييل بالعربية"
                            className="resize-none text-right"
                            dir="rtl"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Arabic footer text shown when the menu language is set to Arabic.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-3 rounded-md border border-dashed border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Building2 className="w-4 h-4" />
                      <span>Branch Data Sync</span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSyncAll}
                        disabled={isSyncing}
                        className="sm:w-auto"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync All Branches
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Pull the latest menu data from every branch in one step.
                      </p>
                    </div>

                    {branchProgress.length > 0 && (
                      <div className="mt-2 rounded-md border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="text-left px-3 py-2 font-medium text-slate-600">Branch</th>
                              <th className="text-left px-3 py-2 font-medium text-slate-600">Code</th>
                              <th className="text-right px-3 py-2 font-medium text-slate-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {branchProgress.map((branch) => (
                              <tr key={branch.code} className="border-b border-slate-100 last:border-0">
                                <td className="px-3 py-2 text-slate-700">{branch.name}</td>
                                <td className="px-3 py-2 text-slate-500 font-mono">{branch.code}</td>
                                <td className="px-3 py-2 text-right">
                                  {branch.status === "pending" && (
                                    <span className="inline-flex items-center gap-1 text-slate-400">
                                      <Clock className="w-3.5 h-3.5" />
                                      Pending
                                    </span>
                                  )}
                                  {branch.status === "syncing" && (
                                    <span className="inline-flex items-center gap-1 text-blue-500">
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      Syncing
                                    </span>
                                  )}
                                  {branch.status === "done" && (
                                    <span className="inline-flex items-center gap-1 text-green-600">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Done
                                    </span>
                                  )}
                                  {branch.status === "failed" && (
                                    <span className="inline-flex items-center gap-1 text-red-500" title={branch.error}>
                                      <XCircle className="w-3.5 h-3.5" />
                                      Failed
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {restaurantInfo?.branch_code && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Default branch:</span>{" "}
                        {restaurantInfo.branch_code}
                      </div>
                    )}
                  </div>
                  {/*Menu display style*/}
                  <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Menu Display Style</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select display style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="grid">Grid</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="list">List</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="show_all_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Show All Categories by Default</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/*QR code generator*/}
                <div className="border-t pt-8">
                  <FormLabel className="text-lg font-semibold text-gray-900">
                    Menu QR Code
                  </FormLabel>

                  <div className="mt-4 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* QR Code Preview */}
                    <div className="p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
                      <QRCodeCanvas
                        id="menu-qrcode"
                        value={`${window.location.origin}`}
                        size={150}
                        includeMargin={true}
                      />
                    </div>

                    {/* Text + Actions */}
                    <div className="flex flex-col justify-center gap-3">
                      <p className="text-sm text-gray-600 max-w-xs">
                        Scan this QR code to instantly access the restaurant’s
                        menu page. This link will adapt to your website’s
                        domain.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-fit"
                        onClick={() => {
                          const canvas = document.getElementById(
                            "menu-qrcode"
                          ) as HTMLCanvasElement;
                          const pngUrl = canvas
                            .toDataURL("image/png")
                            .replace("image/png", "image/octet-stream");
                          const downloadLink = document.createElement("a");
                          downloadLink.href = pngUrl;
                          downloadLink.download = "menu-qrcode.png";
                          document.body.appendChild(downloadLink);
                          downloadLink.click();
                          document.body.removeChild(downloadLink);
                        }}
                      >
                        Download QR Code
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-8">
                  <RestaurantLogoUpload
                    logoPreview={logoPreview}
                    onLogoChange={(file) => handleLogoChange(file)}
                    onRemoveLogo={handleRemoveLogo}
                  />
                </div>

                <div className="border-t pt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {updateMutation.isSuccess && !hasChanges && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">
                          All changes saved
                        </span>
                      </>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      isUploading || updateMutation.isPending || !hasChanges
                    }
                    className="min-w-32 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isUploading || updateMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </Card>
    </div>
    
    {/* Sync Confirmation Dialog */}
    <SyncConfirmationDialog
      open={showSyncConfirmationDialog}
      onOpenChange={setShowSyncConfirmationDialog}
      onConfirm={handleConfirmSync}
      onCancel={handleCancelSync}
    />

    {/* Database Change Confirmation Dialog */}
    <DatabaseChangeDialog
      open={showDbChangeDialog}
      onOpenChange={setShowDbChangeDialog}
      onConfirm={handleConfirmDbChange}
      onCancel={handleCancelDbChange}
      currentDatabase={undefined}
      newDatabase={undefined}
    />
  </div>
);
};

export default AdminRestaurantInfo;
