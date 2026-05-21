
import React, { memo, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { CustomerDetails } from '@/services/customerService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Edit, Trash2, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface CustomersTableProps {
  customers: CustomerDetails[];
  isLoading: boolean;
  searchTerm: string;
  onEditCustomer: (customer: CustomerDetails) => void;
  onDeleteCustomer: (id: string) => void;
}

const CustomersTableComponent: React.FC<CustomersTableProps> = ({
  customers,
  isLoading,
  searchTerm,
  onEditCustomer,
  onDeleteCustomer
}) => {
  const normalizedCustomers = customers ?? [];
  const trimmedSearch = searchTerm.trim().toLowerCase();
  const hasSearch = trimmedSearch.length > 0;

  const filteredCustomers = useMemo(() => {
    if (!normalizedCustomers.length) return [];

    if (!trimmedSearch) return normalizedCustomers;

    return normalizedCustomers.filter((customer) => {
      const first = customer.first_name?.toLowerCase() ?? '';
      const last = customer.last_name?.toLowerCase() ?? '';
      const email = customer.email?.toLowerCase() ?? '';
      const phone = customer.phone ?? '';
      return (
        first.includes(trimmedSearch) ||
        last.includes(trimmedSearch) ||
        email.includes(trimmedSearch) ||
        phone.includes(trimmedSearch)
      );
    });
  }, [normalizedCustomers, trimmedSearch]);

  const renderContact = useCallback((customer: CustomerDetails) => {
    return (
      <div className="space-y-1">
        {customer.email && <div className="text-sm text-slate-700">{customer.email}</div>}
        {customer.phone && <div className="text-sm text-slate-500">{customer.phone}</div>}
      </div>
    );
  }, []);

  const totalCustomers = normalizedCustomers.length;
  const filteredCount = filteredCustomers.length;
  const showEmptyState = !isLoading && totalCustomers === 0;
  const showFilteredEmptyState = !isLoading && totalCustomers > 0 && filteredCount === 0;
  const columnCount = 4;

  const skeletonRows = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={`customer-skeleton-${index}`}>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded-full" />
              <Skeleton className="h-3 w-56 rounded-full" />
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-3 w-48 rounded-full" />
              <Skeleton className="h-3 w-32 rounded-full" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-32 rounded-full" />
          </TableCell>
          <TableCell>
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </TableCell>
        </TableRow>
      )),
    []
  );

  const renderRows = () => {
    if (isLoading) {
      return skeletonRows;
    }

    if (showEmptyState) {
      return (
        <TableRow>
          <TableCell colSpan={columnCount} className="py-12 text-center">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Users className="h-10 w-10 text-orange-300" />
              <div>
                <p className="text-sm font-medium text-slate-700">No customers yet</p>
                <p className="text-xs text-slate-500">
                  Export or register a customer to see them listed here.
                </p>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (showFilteredEmptyState) {
      return (
        <TableRow>
          <TableCell colSpan={columnCount} className="py-10 text-center">
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Search className="h-8 w-8 text-orange-300" />
              <p className="text-sm font-medium text-slate-700">
                No customers match “{searchTerm}”
              </p>
              <p className="text-xs text-slate-500">
                Try adjusting the search or clearing filters.
              </p>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    return filteredCustomers.map((customer) => {
      const fullName = `${customer.first_name} ${customer.last_name}`.trim();
      const createdAt = format(new Date(customer.created_at), 'PPp');

      return (
        <TableRow key={customer.id} className="hover:bg-orange-50/30 transition-colors">
          <TableCell>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-800">{fullName}</div>
              {customer.notes && (
                <div className="max-w-sm truncate text-xs text-slate-500">
                  {customer.notes}
                </div>
              )}
            </div>
          </TableCell>
          <TableCell>{renderContact(customer)}</TableCell>
          <TableCell>
            <div className="text-xs text-slate-500">{createdAt}</div>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditCustomer(customer)}
                      className="h-8 w-8 rounded-full border-orange-100 text-orange-600 hover:border-orange-200 hover:bg-orange-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p>Edit customer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteCustomer(customer.id)}
                      className="h-8 w-8 rounded-full border-orange-100 text-red-500 hover:border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p>Delete customer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-3xl border border-orange-100 bg-white/90 p-6 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-900">Customers</h2>
              <Badge
                variant="outline"
                className="border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-orange-600"
              >
                CRM
              </Badge>
            </div>
            <p className="text-sm text-slate-600">
              Track contact information, notes, and join dates for every guest.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600"
          >
            Total: {totalCustomers}
          </Badge>
          {hasSearch && (
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-600"
            >
              Showing {filteredCount}
            </Badge>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-orange-100 bg-white/85 p-5 shadow-sm">
        <Separator className="mb-4 bg-orange-100" />
        <div className="overflow-hidden rounded-2xl border border-orange-100 bg-white/95 shadow-sm">
          <ScrollArea className="w-full">
            <div className="min-w-[860px]">
              <Table>
                <TableHeader className="bg-orange-50/40">
                  <TableRow className="text-[11px] uppercase tracking-wide text-slate-500">
                    <TableHead className="px-4 py-3">Name</TableHead>
                    <TableHead className="px-4 py-3">Contact</TableHead>
                    <TableHead className="px-4 py-3">Created At</TableHead>
                    <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderRows()}</TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

const CustomersTable = memo(CustomersTableComponent);

export default CustomersTable;
