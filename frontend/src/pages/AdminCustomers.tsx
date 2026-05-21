
import React, { useState } from 'react';
import { useCustomers, useAddCustomer, useUpdateCustomer, useDeleteCustomer, CustomerDetails, CustomerFormValues } from '@/services/customerService';
import { Dialog } from '@/components/ui/dialog';
import { toast } from 'sonner';
import CustomerFormDialog from '@/components/admin/customers/CustomerFormDialog';
import CustomersTable from '@/components/admin/customers/CustomersTable';
import CustomerSearchBar from '@/components/admin/customers/CustomerSearchBar';

const AdminCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetails | undefined>(undefined);
  
  const { data: customers = [], isLoading } = useCustomers();
  const addCustomer = useAddCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const isPending = addCustomer.isPending || updateCustomer.isPending;

  const handleAddCustomer = () => {
    setSelectedCustomer(undefined);
    setIsDialogOpen(true);
  };

  const handleEditCustomer = (customer: CustomerDetails) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer.mutate(id, {
        onSuccess: () => {
          toast.success("Customer deleted successfully");
        },
        onError: (error) => {
          toast.error(`Failed to delete customer: ${error.message}`);
        }
      });
    }
  };

  const handleSubmit = (values: CustomerFormValues) => {
    if (selectedCustomer) {
      updateCustomer.mutate(
        { id: selectedCustomer.id, formData: values },
        {
          onSuccess: () => {
            toast.success("Customer updated successfully");
            setIsDialogOpen(false);
          },
          onError: (error) => {
            toast.error(`Failed to update customer: ${error.message}`);
          }
        }
      );
    } else {
      addCustomer.mutate(values, {
        onSuccess: () => {
          toast.success("Customer added successfully");
          setIsDialogOpen(false);
        },
        onError: (error) => {
          toast.error(`Failed to add customer: ${error.message}`);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Customer Details</h2>
        <CustomerSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={handleAddCustomer}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <CustomerFormDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          customer={selectedCustomer}
          onSubmit={handleSubmit}
          isPending={isPending}
        />
      </Dialog>

      <CustomersTable
        customers={customers}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onEditCustomer={handleEditCustomer}
        onDeleteCustomer={handleDeleteCustomer}
      />
    </div>
  );
};

export default AdminCustomers;
