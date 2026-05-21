
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Location, 
  fetchLocations, 
  createLocation, 
  updateLocation, 
  deleteLocation,
  defaultWorkingHours,
  DaySchedule
} from '@/services/locationServices';
import { LocationFormValues } from '@/components/admin/locations/LocationFormDialog';

export const useLocations = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: fetchLocations,
  });

  const createMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      handleCloseDialog();
      toast.success("Location created successfully");
    },
    onError: () => {
      toast.error("Failed to create location");
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      handleCloseDialog();
      toast.success("Location updated successfully");
    },
    onError: () => {
      toast.error("Failed to update location");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success("Location deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete location");
    }
  });

  const handleSubmit = (values: LocationFormValues) => {
    // Ensure working_hours is properly typed as DaySchedule[]
    const workingHours: DaySchedule[] = values.is_open_24_7 
      ? [] 
      : values.working_hours.map(day => ({
          day: day.day,
          open: day.open,
          close: day.close,
          closed: day.closed
        }));

    if (editingLocation) {
      // For update, include all required fields and the ID
      const locationToUpdate: Location = {
        id: editingLocation.id,
        location_order: editingLocation.location_order,
        locationOrder: editingLocation.locationOrder,
        name: values.name,
        address: values.address,
        city: values.city,
        map_link: values.map_link,
        phone: values.phone || null,
        is_open_24_7: values.is_open_24_7,
        working_hours: workingHours
      };
      updateMutation.mutate(locationToUpdate);
    } else {
      // For create, all fields are required
      const newLocation: Omit<Location, "id" | "locationOrder" | "location_order"> = {
        name: values.name,
        address: values.address,
        city: values.city,
        map_link: values.map_link,
        phone: values.phone || null,
        is_open_24_7: values.is_open_24_7,
        working_hours: workingHours
      };
      createMutation.mutate(newLocation);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setIsOpen(true);
  };

  const handleOpenDialog = () => {
    setEditingLocation(null);
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingLocation(null);
    setIsOpen(false);
  };

  return {
    locations,
    isLoading,
    isOpen,
    setIsOpen,
    editingLocation,
    handleSubmit,
    handleDelete,
    handleEdit,
    handleOpenDialog,
    isPending: createMutation.isPending || updateMutation.isPending
  };
};
