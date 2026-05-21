
import React, { useEffect, useMemo } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SocialLink } from "@/services/socialLinkServices";
import { SocialLinkFormValues, socialLinkSchema } from "@/hooks/useSocialLinks";
import { Share2, Loader2 } from "lucide-react";

interface SocialLinkFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingLink: SocialLink | null;
  onSubmit: (values: SocialLinkFormValues) => void;
  isPending: boolean;
}

export const SocialLinkFormDialog: React.FC<SocialLinkFormDialogProps> = ({
  isOpen,
  setIsOpen,
  editingLink,
  onSubmit,
  isPending
}) => {
  const defaultValues = useMemo<SocialLinkFormValues>(
    () => ({
      platform: "",
      url: ""
    }),
    []
  );

  const form = useForm<SocialLinkFormValues>({
    resolver: zodResolver(socialLinkSchema),
    defaultValues
  });

  useEffect(() => {
    if (editingLink) {
      form.reset({
        platform: editingLink.platform,
        url: editingLink.url,
      });
    } else {
      form.reset({
        platform: '',
        url: '',
      });
    }
  }, [editingLink, form]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-h-[90vh] overflow-hidden rounded-[28px] border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-orange-100 p-0 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-4 px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-slate-900">
                {editingLink ? "Edit Social Link" : "Add New Social Link"}
              </DialogTitle>
              <p className="text-sm text-slate-600">
                Capture social platform name and URL for quick access from the public site.
              </p>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 px-6 pb-6"
          >
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border border-orange-100 bg-white/85 p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
                    <FormLabel className="text-sm font-semibold text-slate-800">
                      Platform
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. facebook, instagram, tiktok"
                        {...field}
                        className="mt-2"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-slate-500">
                      Use lowercase words separated by underscores if needed (e.g. google_review).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem className="rounded-2xl border border-orange-100 bg-white/85 p-4 shadow-sm transition hover:border-orange-200 hover:shadow-md">
                    <FormLabel className="text-sm font-semibold text-slate-800">
                      URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://..."
                        {...field}
                        className="mt-2"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-slate-500">
                      Provide a full link so guests can be redirected instantly.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={handleClose}
                className="border-slate-200 text-slate-600 hover:bg-slate-100"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md transition hover:from-orange-600 hover:to-orange-700"
              >
                {isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingLink ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
