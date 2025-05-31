// src/components/loyaltyprogram/forms/CategoryFilter.tsx
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select';
import { FilterIcon } from 'lucide-react';

export interface CategoryOption {
  value: string; // Typically the category ID or a unique key, 'all' for all categories
  label: string; // User-friendly display name
}

interface CategoryFilterProps {
  categories: CategoryOption[]; // Includes an "All Categories" option
  selectedCategory?: string; // The value of the currently selected category
  onCategoryChange: (categoryValue: string) => void;
  title?: string;
  placeholder?: string;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  title = "Filter by Category",
  placeholder = "Select a category"
}) => {
  // Ensure there's always a valid selection for the Select component,
  // defaulting to the first category if selectedCategory is undefined or not in the list.
  // Often, the first category is an "All" type.
  const currentSelection = selectedCategory && categories.some(c => c.value === selectedCategory)
    ? selectedCategory
    : categories.length > 0 ? categories[0].value : '';

  if (!categories || categories.length === 0) {
    return null; // Don't render if no categories are provided
  }

  return (
    <div className="space-y-2 w-full md:w-auto md:min-w-[250px]">
      {title && <Label htmlFor="category-filter-select" className="text-sm font-medium flex items-center"><FilterIcon className="h-4 w-4 mr-2 text-gray-500"/>{title}</Label>}
      <Select
        value={currentSelection}
        onValueChange={onCategoryChange}
      >
        <SelectTrigger id="category-filter-select" className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {/* Optional: Add a group label if needed, e.g., <SelectLabel>Categories</SelectLabel> */}
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategoryFilter;
