import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface CustomerDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormValues {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export const fetchCustomers = async (): Promise<CustomerDetails[]> => {
  const res = await api.get<{ success: boolean; data: CustomerDetails[] }>('/api/customers');
  return res.data ?? [];
};

export const addCustomer = async (customer: CustomerFormValues): Promise<CustomerDetails> => {
  const res = await api.post<{ success: boolean; data: CustomerDetails }>('/api/customers', customer);
  return res.data;
};

export const updateCustomer = async (id: string, customer: CustomerFormValues): Promise<CustomerDetails> => {
  const res = await api.patch<{ success: boolean; data: CustomerDetails }>(`/api/customers/${id}`, customer);
  return res.data;
};

export const deleteCustomer = async (id: string): Promise<void> => {
  await api.delete(`/api/customers/${id}`);
};

export const useCustomers = () =>
  useQuery({ queryKey: ['customers'], queryFn: fetchCustomers });

export const useAddCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: CustomerFormValues }) =>
      updateCustomer(id, formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
};
