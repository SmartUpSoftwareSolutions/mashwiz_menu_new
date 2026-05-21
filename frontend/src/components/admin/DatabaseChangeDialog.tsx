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
import { AlertTriangle } from "lucide-react";

interface DatabaseChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  currentDatabase?: string;
  newDatabase?: string;
}

export const DatabaseChangeDialog: React.FC<DatabaseChangeDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  currentDatabase,
  newDatabase,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-gray-900">
              Database Connection Changed
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-gray-600 space-y-3 pt-2">
            <p>
              The database credentials (email/password) have changed. This means you're
              connecting to a different database.
            </p>
            {currentDatabase && newDatabase && (
              <div className="bg-gray-50 p-3 rounded-md space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Current:</span>
                  <span className="font-medium">{currentDatabase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">New:</span>
                  <span className="font-medium text-blue-600">{newDatabase}</span>
                </div>
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
              <p className="text-amber-800 font-medium text-xs">
                ⚠️ Warning: This action will:
              </p>
              <ul className="list-disc list-inside text-amber-700 text-xs mt-2 space-y-1">
                <li>Delete all existing data in Supabase</li>
                <li>Sync fresh data from the new database</li>
                <li>Replace all menu items, categories, and locations</li>
              </ul>
            </div>
            <p className="font-medium text-gray-800">
              Do you want to continue and sync from the new database?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Confirm & Sync
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

