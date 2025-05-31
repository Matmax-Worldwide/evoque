// src/components/loyaltyprogram/common/ExportButton.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export type ExportFormat = 'csv' | 'pdf';

interface ExportButtonProps {
  onExport?: (format: ExportFormat) => void;
  disabled?: boolean;
  isLoading?: boolean; // For showing a loading state on the button
}

const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  disabled = false,
  isLoading = false,
}) => {
  const handleExport = (format: ExportFormat) => {
    if (onExport) {
      console.log(`Exporting data as ${format}...`); // Placeholder action
      onExport(format);
    } else {
      console.warn(`No onExport handler provided for format: ${format}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isLoading}>
          <DownloadIcon className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Exporting...' : 'Export Data'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isLoading} // This should correctly disable the item
        >
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isLoading} // This should correctly disable the item
        >
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
