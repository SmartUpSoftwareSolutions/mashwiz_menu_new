
import React from 'react';
import SearchBar from '@/components/admin/menuItems/SearchBar';

interface CustomerSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

const CustomerSearchBar: React.FC<CustomerSearchBarProps> = ({ 
  searchTerm, 
  onSearchChange, 
  onAddClick 
}) => {
  return (
    <SearchBar 
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      onAddClick={onAddClick}
    />
  );
};

export default CustomerSearchBar;
