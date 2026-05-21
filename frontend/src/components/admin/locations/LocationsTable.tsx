import React, { useCallback, useMemo, useState } from "react";
import { Location } from "@/services/locationServices";
import { api } from "@/lib/apiClient";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MapPin,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
} from "lucide-react";

interface LocationsTableProps {
  locations: Location[];
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => Promise<void> | void;
  isLoading: boolean;
}

export const LocationsTable: React.FC<LocationsTableProps> = ({
  locations,
  onEdit,
  onDelete,
  onRefresh,
  isLoading,
}) => {
  const [itemOrderInputs, setItemOrderInputs] = useState<
    Record<string, string>
  >({});
  const [savingOrder, setSavingOrder] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: "name" | "address" | "city" | "locationOrder";
    direction: "ascending" | "descending";
  }>({
    key: "locationOrder",
    direction: "ascending",
  });

  const handleItemOrderChange = useCallback((id: string, value: string) => {
    setItemOrderInputs((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleItemOrderSave = useCallback(
    async (id: string) => {
      const rawInput = itemOrderInputs[id]?.trim();
      const itemOrder = Number(rawInput);

      if (!rawInput || Number.isNaN(itemOrder)) {
        toast.error("Please enter a valid number for location order");
        return;
      }

      try {
        setSavingOrder((prev) => ({ ...prev, [id]: true }));
        await api.patch(`/api/locations/${id}`, { location_order: itemOrder });
        toast.success("Location order updated successfully");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error occurred";
        toast.error(`Failed to update location order: ${message}`);
      } finally {
        setSavingOrder((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [itemOrderInputs]
  );

  const requestSort = useCallback(
    (key: "name" | "address" | "city" | "locationOrder") => {
      setSortConfig((prev) => ({
        key,
        direction:
          prev.key === key && prev.direction === "ascending"
            ? "descending"
            : "ascending",
      }));
    },
    []
  );

  const getSortIcon = useCallback(
    (key: string) => {
      if (sortConfig.key !== key) return null;
      return sortConfig.direction === "ascending" ? (
        <ArrowUp className="ml-1 h-3 w-3" />
      ) : (
        <ArrowDown className="ml-1 h-3 w-3" />
      );
    },
    [sortConfig]
  );

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      let aValue: number | string, bValue: number | string;

      if (sortConfig.key === "locationOrder") {
        aValue = a.locationOrder ?? 0;
        bValue = b.locationOrder ?? 0;
      } else if (sortConfig.key === "name") {
        aValue = (a.name || "").toLowerCase();
        bValue = (b.name || "").toLowerCase();
      } else if (sortConfig.key === "address") {
        aValue = (a.address || "").toLowerCase();
        bValue = (b.address || "").toLowerCase();
      } else {
        aValue = (a.city || "").toLowerCase();
        bValue = (b.city || "").toLowerCase();
      }

      if (aValue < bValue)
        return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue)
        return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [locations, sortConfig]);

  const skeletonRows = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`location-skeleton-${index}`}>
          <TableCell>
            <Skeleton className="h-4 w-32 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-20 rounded-md" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </TableCell>
        </TableRow>
      )),
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-orange-100 bg-white/90 p-6 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Locations</h2>
          </div>
          <p className="text-sm text-gray-600">
            Maintain branch details, addresses, and display ordering.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 text-orange-700"
          >
            Total: {sortedLocations.length}
          </Badge>
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              onClick={onRefresh}
              className="border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50"
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white/95 shadow-sm">
        <Table>
          <TableHeader className="bg-orange-50/40">
            <TableRow className="uppercase text-xs tracking-wide text-gray-500">
              <TableHead onClick={() => requestSort("name")} className="cursor-pointer">
                <div className="flex items-center gap-1">
                  Name {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => requestSort("address")}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  Address {getSortIcon("address")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => requestSort("city")}
                className="cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  City {getSortIcon("city")}
                </div>
              </TableHead>
              <TableHead
                onClick={() => requestSort("locationOrder")}
                className="w-[140px] cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  Order {getSortIcon("locationOrder")}
                </div>
              </TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              skeletonRows
            ) : sortedLocations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="h-8 w-8 text-orange-300" />
                    <span>No locations found. Add a location to get started.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedLocations.map((location) => {
                const inputValue =
                  itemOrderInputs[location.id] ??
                  (location.locationOrder ?? "").toString();
                const isSaving = savingOrder[location.id] === true;

                return (
                  <TableRow key={location.id} className="hover:bg-orange-50/30">
                    <TableCell className="font-medium text-gray-900">
                      {location.name || "Untitled location"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {location.address || "—"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {location.city || "—"}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={inputValue}
                        onChange={(event) =>
                          handleItemOrderChange(location.id, event.target.value)
                        }
                        onBlur={() => handleItemOrderSave(location.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleItemOrderSave(location.id);
                          }
                        }}
                        className="w-24 text-center"
                        disabled={isSaving}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(location)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(location.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};