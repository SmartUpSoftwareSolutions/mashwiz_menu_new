
import React, { ReactNode, useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/apiClient";
import { Skeleton } from "@/components/ui/skeleton";

interface LinkTreeContainerProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

type RestaurantInfoState = { name: string; loading: boolean; error?: string };

const LinkTreeContainer: React.FC<LinkTreeContainerProps> = React.memo(
  ({ children, title, className }) => {
    const [{ name, loading, error }, setRestaurantInfo] = useState<RestaurantInfoState>({
      name: "",
      loading: true,
    });

    useEffect(() => {
      let isMounted = true;
      api
        .get<{ success: boolean; data: { name?: string } | null }>("/api/restaurant")
        .then((res) => {
          if (!isMounted) return;
          setRestaurantInfo({ name: res.data?.name?.trim() ?? "", loading: false });
        })
        .catch((err) => {
          if (!isMounted) return;
          setRestaurantInfo({ name: "", loading: false, error: err?.message ?? "Unable to load restaurant details." });
        });
      return () => { isMounted = false; };
    }, []);

    const displayName = useMemo(() => name.trim(), [name]);
    const resolvedTitle = useMemo(() => title?.trim() ?? "", [title]);
    const hasHeading = Boolean(displayName || resolvedTitle);

    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-100 via-white to-neutral-100 px-4 py-10">
        <div
          className={[
            "mx-auto flex max-w-xl flex-col items-center gap-6 rounded-3xl border border-neutral-200 bg-white/90 p-8 shadow-lg backdrop-blur-sm transition-shadow duration-200 hover:shadow-xl",
            className ?? "",
          ].join(" ").trim()}
        >
          {loading ? (
            <div className="w-full text-center">
              <Skeleton className="mx-auto mb-4 h-7 w-48 rounded-full" />
              <Skeleton className="mx-auto h-1 w-16 rounded-full" />
            </div>
          ) : hasHeading ? (
            <div className="text-center">
              {displayName && <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{displayName}</h1>}
              {resolvedTitle && <p className="mt-1 text-sm font-medium text-gray-500">{resolvedTitle}</p>}
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-orange-400 to-orange-500" />
            </div>
          ) : null}

          {error ? (
            <div className="flex w-full items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)}
                </div>
              ) : children}
            </div>
          )}
        </div>

        <footer className="mt-10 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {displayName || "Restaurant"}</p>
        </footer>
      </div>
    );
  }
);

LinkTreeContainer.displayName = "LinkTreeContainer";
export default LinkTreeContainer;
