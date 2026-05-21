
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { LocationFormDialog } from '@/components/admin/locations/LocationFormDialog';
import { LocationsTable } from '@/components/admin/locations/LocationsTable';
import { useLocations } from '@/hooks/useLocations';

const AdminLocations = () => {
  const {
    locations,
    isLoading,
    isOpen,
    setIsOpen,
    editingLocation,
    handleSubmit,
    handleDelete,
    handleEdit,
    handleOpenDialog,
    isPending
  } = useLocations();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Locations</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleOpenDialog}
              className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-md hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          
          <LocationFormDialog
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            editingLocation={editingLocation}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </Dialog>
      </div>

      <LocationsTable
        locations={locations}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminLocations;
