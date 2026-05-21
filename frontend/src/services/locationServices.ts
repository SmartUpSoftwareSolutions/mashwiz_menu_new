import { toast } from "sonner";
import { api } from "@/lib/apiClient";

export interface DaySchedule {
  day: string;
  open?: string;
  close?: string;
  closed?: boolean;
}

export interface Location {
  location_order: number;
  locationOrder: number;
  id: string;
  name: string;
  address: string;
  city: string;
  map_link: string;
  phone?: string | null;
  working_hours: DaySchedule[];
  is_open_24_7: boolean;
  branch_code?: string | null;
  branchCode?: string | null;
}

export const parseWorkingHours = (json: unknown): DaySchedule[] => {
  if (!json || !Array.isArray(json)) return [];
  return (json as Record<string, unknown>[]).map((day) => ({
    day: day.day as string,
    open: (day.open as string | undefined) ?? "",
    close: (day.close as string | undefined) ?? "",
    closed: (day.closed as boolean | undefined) ?? false,
  }));
};

type ApiLocation = {
  id: string; name: string; address: string; city: string;
  map_link: string; phone?: string | null; is_open_24_7: boolean;
  working_hours: unknown; location_order: number;
  branch_code?: string | null;
};

const normalize = (loc: ApiLocation): Location => ({
  ...loc,
  locationOrder: loc.location_order,
  location_order: loc.location_order,
  working_hours: parseWorkingHours(loc.working_hours),
  branchCode: loc.branch_code ?? null,
});

export const fetchLocations = async (): Promise<Location[]> => {
  try {
    const res = await api.get<{ success: boolean; data: ApiLocation[] }>("/api/locations");
    return (res.data ?? []).map(normalize);
  } catch (error) {
    console.error("Error fetching locations:", error);
    toast.error("Failed to load locations");
    return [];
  }
};

export const createLocation = async (
  location: Omit<Location, "id" | "locationOrder" | "location_order">
): Promise<Location | null> => {
  try {
    const res = await api.post<{ success: boolean; data: ApiLocation }>("/api/locations", {
      name: location.name,
      address: location.address,
      city: location.city,
      map_link: location.map_link,
      phone: location.phone ?? null,
      is_open_24_7: location.is_open_24_7,
      working_hours: location.working_hours,
    });
    toast.success("Location created successfully");
    return normalize(res.data);
  } catch (error) {
    console.error("Error creating location:", error);
    toast.error("Failed to create location");
    return null;
  }
};

export const updateLocation = async (location: Location): Promise<Location | null> => {
  try {
    const res = await api.patch<{ success: boolean; data: ApiLocation }>(
      `/api/locations/${location.id}`,
      {
        name: location.name,
        address: location.address,
        city: location.city,
        map_link: location.map_link,
        phone: location.phone ?? null,
        is_open_24_7: location.is_open_24_7,
        working_hours: location.working_hours,
      }
    );
    toast.success("Location updated successfully");
    return normalize(res.data);
  } catch (error) {
    console.error("Error updating location:", error);
    toast.error("Failed to update location");
    return null;
  }
};

export const deleteLocation = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/api/locations/${id}`);
    toast.success("Location deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting location:", error);
    toast.error("Failed to delete location");
    return false;
  }
};

export const defaultWorkingHours: DaySchedule[] = [
  { day: "Monday", open: "09:00", close: "17:00", closed: false },
  { day: "Tuesday", open: "09:00", close: "17:00", closed: false },
  { day: "Wednesday", open: "09:00", close: "17:00", closed: false },
  { day: "Thursday", open: "09:00", close: "17:00", closed: false },
  { day: "Friday", open: "09:00", close: "17:00", closed: false },
  { day: "Saturday", open: "", close: "", closed: true },
  { day: "Sunday", open: "", close: "", closed: true },
];
