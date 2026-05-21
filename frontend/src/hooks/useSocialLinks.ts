
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SocialLink, fetchSocialLinks, createSocialLink, updateSocialLink, deleteSocialLink } from '@/services/socialLinkServices';
import { z } from 'zod';

export const socialLinkSchema = z.object({
  platform: z.string().min(1, { message: 'Platform name is required' }),
  url: z.string().url({ message: 'Must be a valid URL' }),
});

export type SocialLinkFormValues = z.infer<typeof socialLinkSchema>;

export const useSocialLinks = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  
  const { data: socialLinks = [], isLoading } = useQuery({
    queryKey: ['socialLinks'],
    queryFn: fetchSocialLinks,
  });

  const createMutation = useMutation({
    mutationFn: createSocialLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialLinks'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSocialLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialLinks'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSocialLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialLinks'] });
    },
  });

  const onSubmit = (values: SocialLinkFormValues) => {
    if (editingLink) {
      // For update, include all required fields and the ID
      const linkToUpdate: SocialLink = {
        id: editingLink.id,
        platform: values.platform,
        url: values.url,
        linksOrder: editingLink.linksOrder,
        links_order: editingLink.links_order
      };
      updateMutation.mutate(linkToUpdate);
    } else {
      // For create, all fields are required
      const newLink: Omit<SocialLink, "id" | "linksOrder" | "links_order"> = {
        platform: values.platform,
        url: values.url
      };
      createMutation.mutate(newLink);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this social link?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (link: SocialLink) => {
    setEditingLink(link);
    setIsOpen(true);
  };

  const handleOpenDialog = () => {
    setEditingLink(null);
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingLink(null);
    setIsOpen(false);
  };

  return {
    socialLinks,
    isLoading,
    isOpen,
    setIsOpen,
    editingLink,
    onSubmit,
    handleDelete,
    handleEdit,
    handleOpenDialog,
    handleCloseDialog,
    createMutation,
    updateMutation
  };
};
