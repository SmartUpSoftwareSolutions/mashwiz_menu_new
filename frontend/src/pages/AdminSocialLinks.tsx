
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useSocialLinks } from '@/hooks/useSocialLinks';
import { SocialLinkFormDialog } from '@/components/admin/socialLinks/SocialLinkFormDialog';
import { SocialLinksTable } from '@/components/admin/socialLinks/SocialLinksTable';

const AdminSocialLinks = () => {
  const {
    socialLinks,
    isLoading,
    isOpen,
    setIsOpen,
    editingLink,
    onSubmit,
    handleDelete,
    handleEdit,
    handleOpenDialog,
    createMutation,
    updateMutation
  } = useSocialLinks();

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Manage Social Links</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleOpenDialog}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md transition hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Social Link
            </Button>
          </DialogTrigger>
          
          <SocialLinkFormDialog
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            editingLink={editingLink}
            onSubmit={onSubmit}
            isPending={isPending}
          />
        </Dialog>
      </div>

      <SocialLinksTable
        socialLinks={socialLinks}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
};

export default AdminSocialLinks;
