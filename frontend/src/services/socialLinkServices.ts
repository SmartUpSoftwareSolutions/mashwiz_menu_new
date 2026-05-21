import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/apiClient';

export const socialLinkSchema = z.object({
  platform: z.string().min(1, { message: 'Platform name is required' }),
  url: z.string().url({ message: 'Must be a valid URL' }),
  iconType: z.enum(['lucide', 'custom']).optional(),
  lucideIcon: z.string().optional(),
  customIconUrl: z.string().url({ message: 'Invalid icon URL' }).optional(),
  color: z.string().optional(),
});

export type SocialLinkFormValues = z.infer<typeof socialLinkSchema>;
export type Color = string;

export interface SocialLink {
  linksOrder: unknown;
  links_order: unknown;
  id: string;
  platform: string;
  url: string;
  iconUrl?: string;
  bgColor?: string | null;
  textColor?: string | null;
  hoverBgColor?: string | null;
  borderColor?: string | null;
}

type ApiSocialLink = Omit<SocialLink, 'linksOrder'> & { links_order: unknown };

const normalize = (link: ApiSocialLink): SocialLink => ({
  ...link,
  linksOrder: link.links_order,
});

export const fetchSocialLinks = async (): Promise<SocialLink[]> => {
  try {
    const res = await api.get<{ success: boolean; data: ApiSocialLink[] }>('/api/social-links');
    return (res.data ?? []).map(normalize);
  } catch (error) {
    console.error('Error fetching social links:', error);
    toast.error('Failed to load social links');
    return [];
  }
};

export const createSocialLink = async (
  link: Omit<SocialLink, 'id' | 'linksOrder' | 'links_order'>
): Promise<SocialLink | null> => {
  try {
    const res = await api.post<{ success: boolean; data: ApiSocialLink }>('/api/social-links', {
      platform: link.platform,
      url: link.url,
    });
    toast.success('Social link created successfully');
    return normalize(res.data);
  } catch (error) {
    console.error('Error creating social link:', error);
    toast.error('Failed to create social link');
    return null;
  }
};

export const updateSocialLink = async (link: SocialLink): Promise<SocialLink | null> => {
  try {
    const res = await api.patch<{ success: boolean; data: ApiSocialLink }>(
      `/api/social-links/${link.id}`,
      { platform: link.platform, url: link.url }
    );
    toast.success('Social link updated successfully');
    return normalize(res.data);
  } catch (error) {
    console.error('Error updating social link:', error);
    toast.error('Failed to update social link');
    return null;
  }
};

export const deleteSocialLink = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/api/social-links/${id}`);
    toast.success('Social link deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting social link:', error);
    toast.error('Failed to delete social link');
    return false;
  }
};
