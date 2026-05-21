
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

const SearchBar = ({ searchTerm, onSearchChange, onAddClick }: SearchBarProps) => {
  const hasSearch = searchTerm.trim().length > 0;

  const handleClear = () => {
    onSearchChange("");
  };

  return (
    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
      <div className="relative flex-1 md:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-300" />
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-10 rounded-xl border border-orange-100 bg-white/85 pl-9 pr-20 text-sm text-slate-700 shadow-sm transition focus:border-orange-300 focus:ring-orange-200"
        />
        {hasSearch && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1.5 top-1/2 h-7 -translate-y-1/2 rounded-full border border-orange-100 px-3 text-xs font-semibold text-orange-600 hover:border-orange-200 hover:bg-orange-50"
          >
            Clear
          </Button>
        )}
      </div>
      <Button
        type="button"
        onClick={onAddClick}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-orange-600 hover:to-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"
      >
        <Plus className="h-4 w-4" /> Add Item
      </Button>
    </div>
  );
};

export default SearchBar;
