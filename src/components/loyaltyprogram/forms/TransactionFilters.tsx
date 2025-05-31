// src/components/loyaltyprogram/forms/TransactionFilters.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // For date inputs if no DatePicker
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PointsTransactionType } from '@/types/loyalty';
import { XIcon, FilterIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // For DatePicker
import { Calendar } from '@/components/ui/calendar'; // Assuming Calendar component exists
import { format } from 'date-fns'; // For formatting date
import { Card } from '@/components/ui/card';

export interface TransactionFiltersState {
  dateFrom?: Date;
  dateTo?: Date;
  type?: PointsTransactionType | 'all';
}

interface TransactionFiltersProps {
  initialFilters?: TransactionFiltersState;
  onFiltersChange: (filters: TransactionFiltersState) => void;
  // Provide available transaction types for the dropdown, including 'all'
  availableTypes: Array<{ value: PointsTransactionType | 'all'; label: string }>;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  initialFilters = { type: 'all' },
  onFiltersChange,
  availableTypes,
}) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(initialFilters.dateFrom);
  const [dateTo, setDateTo] = useState<Date | undefined>(initialFilters.dateTo);
  const [type, setType] = useState<PointsTransactionType | 'all'>(initialFilters.type || 'all');

  useEffect(() => {
    // If initialFilters prop changes, update internal state
    setDateFrom(initialFilters.dateFrom);
    setDateTo(initialFilters.dateTo);
    setType(initialFilters.type || 'all');
  }, [initialFilters]);

  const handleApplyFilters = () => {
    onFiltersChange({ dateFrom, dateTo, type });
  };

  const handleClearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setType('all');
    onFiltersChange({ dateFrom: undefined, dateTo: undefined, type: 'all' }); // Notify parent that filters are cleared
  };

  const hasActiveFilters = dateFrom || dateTo || (type && type !== 'all');

  return (
    <Card className="p-4 sm:p-6 shadow-md bg-white rounded-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        {/* Date From */}
        <div className="space-y-1.5">
          <Label htmlFor="dateFrom">From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="dateFrom"
                variant="outline"
                className={`w-full justify-start text-left font-normal ${!dateFrom && "text-muted-foreground"}`}
              >
                {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
                disabled={(date) => dateTo ? date > dateTo : false}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <Label htmlFor="dateTo">To</Label>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                id="dateTo"
                variant="outline"
                className={`w-full justify-start text-left font-normal ${!dateTo && "text-muted-foreground"}`}
              >
                {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                disabled={(date) => dateFrom ? date < dateFrom : false}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Transaction Type */}
        <div className="space-y-1.5">
          <Label htmlFor="transactionType">Type</Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as PointsTransactionType | 'all')}
          >
            <SelectTrigger id="transactionType" className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map((typeOption) => (
                <SelectItem key={typeOption.value} value={typeOption.value}>
                  {typeOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 items-end sm:pt-5"> {/* sm:pt-5 to align with labels on larger screens */}
             <Button onClick={handleApplyFilters} className="w-full sm:w-auto flex-grow bg-blue-600 hover:bg-blue-700">
                <FilterIcon className="mr-2 h-4 w-4" /> Apply
            </Button>
            {hasActiveFilters && (
                <Button variant="ghost" onClick={handleClearFilters} className="w-full sm:w-auto text-sm">
                    <XIcon className="mr-2 h-4 w-4" /> Clear
                </Button>
            )}
        </div>
      </div>
    </Card>
  );
};

export default TransactionFilters;
