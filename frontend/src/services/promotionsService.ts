import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';

export interface Promotion {
  id: string;
  title: string | null;
  image_url: string;
  amount: string | null;
  date_from: string;
  date_to: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const fetchActivePromotions = async (): Promise<Promotion[]> => {
  const res = await api.get<{ success: boolean; data: Promotion[] }>('/api/promotions/active');
  return res.data ?? [];
};

export const fetchAllPromotions = async (): Promise<Promotion[]> => {
  const res = await api.get<{ success: boolean; data: Promotion[] }>('/api/promotions');
  return res.data ?? [];
};

export const createPromotion = async (
  promotion: Omit<Promotion, 'id' | 'created_at' | 'updated_at'>
): Promise<Promotion> => {
  const res = await api.post<{ success: boolean; data: Promotion }>('/api/promotions', promotion);
  return res.data;
};

export const updatePromotion = async (
  id: string,
  promotion: Partial<Omit<Promotion, 'id' | 'created_at' | 'updated_at'>>
): Promise<Promotion> => {
  const res = await api.patch<{ success: boolean; data: Promotion }>(`/api/promotions/${id}`, promotion);
  return res.data;
};

export const deletePromotion = async (id: string): Promise<void> => {
  await api.delete(`/api/promotions/${id}`);
};

export const useActivePromotions = () =>
  useQuery({ queryKey: ['promotions', 'active'], queryFn: fetchActivePromotions, staleTime: 1000 * 60 * 5 });

export const useAllPromotions = () =>
  useQuery({ queryKey: ['promotions', 'all'], queryFn: fetchAllPromotions });

export const useCreatePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPromotion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  });
};

export const useUpdatePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Promotion, 'id' | 'created_at' | 'updated_at'>> }) =>
      updatePromotion(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  });
};

export const useDeletePromotion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['promotions'] }),
  });
};
