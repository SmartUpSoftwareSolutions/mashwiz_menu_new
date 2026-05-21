import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2 } from "lucide-react";

interface SyncConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const SyncConfirmationDialog: React.FC<SyncConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-gray-900">
              Confirm Sync All Branches
            </AlertDialogTitle>
          </div>
          <div className="text-sm text-gray-600 space-y-3 pt-2">
            <AlertDialogDescription>
              You are about to sync all branches from the ERP database. This action will:
            </AlertDialogDescription>
            <div className="bg-red-50 border border-red-200 p-3 rounded-md">
              <p className="text-red-800 font-medium text-xs mb-2">
                ⚠️ Warning: This will DELETE all existing data in Supabase:
              </p>
              <ul className="list-disc list-inside text-red-700 text-xs space-y-1">
                <li>All menu items (item_master)</li>
                <li>All categories (item_main_group)</li>
                <li>All locations (locations)</li>
              </ul>
              <p className="text-red-800 font-medium text-xs mt-3">
                After deletion, fresh data will be synced from the ERP database.
              </p>
            </div>
            <AlertDialogDescription className="font-medium text-gray-800">
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Confirm & Sync
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

