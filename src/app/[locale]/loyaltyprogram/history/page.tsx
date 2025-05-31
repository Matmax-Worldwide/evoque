// src/app/[locale]/loyaltyprogram/history/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import KillaHistoryTable from '@/components/loyaltyprogram/tables/KillaHistoryTable';
import TransactionFilters, { type TransactionFiltersState } from '@/components/loyaltyprogram/forms/TransactionFilters';
import ExportButton, { type ExportFormat } from '@/components/loyaltyprogram/common/ExportButton';
import { PointsTransaction, PointsTransactionType } from '@/types/loyalty';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // For page structure
import { Button } from '@/components/ui/button'; // For potential future use e.g. manual refresh
import { RefreshCwIcon } from 'lucide-react';

// Generate a larger set of mock transactions
const generateMockTransactions = (count: number): PointsTransaction[] => {
  const types: PointsTransactionType[] = ['earn', 'redeem', 'bonus', 'adjustment', 'transfer_in', 'transfer_out'];
  const descriptions = [
    'Purchase at Store XYZ', 'Redeemed $10 Coupon', 'Welcome Killa Bonus', 'Admin Killa Correction',
    'Killa received from John D.', 'Killa sent to Jane D.', 'Monthly Tier Killa', 'Special Event Killa'
  ];
  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    let killaAmount: number;
    switch (type) {
      case 'earn': killaAmount = Math.floor(Math.random() * 200) + 50; break;
      case 'redeem': killaAmount = -(Math.floor(Math.random() * 100) + 20); break;
      case 'bonus': killaAmount = Math.floor(Math.random() * 100) + 10; break;
      case 'adjustment': killaAmount = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 50) + 5); break;
      case 'transfer_in': killaAmount = Math.floor(Math.random() * 100) + 20; break;
      case 'transfer_out': killaAmount = -(Math.floor(Math.random() * 80) + 10); break;
      default: killaAmount = 0;
    }
    return {
      id: `txn-${i + 1}`,
      transactionDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      description: descriptions[i % descriptions.length] + (type === 'earn' ? ` #${Math.floor(Math.random() * 1000)}` : ''),
      type: type,
      killaAmount: killaAmount,
    };
  });
};

const ALL_MOCK_TRANSACTIONS = generateMockTransactions(50); // Simulate a larger dataset
const ITEMS_PER_PAGE = 10;

const availableTransactionTypes: Array<{ value: PointsTransactionType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'earn', label: 'Earn' },
  { value: 'redeem', label: 'Redeem' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
];

export default function KillaHistoryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<TransactionFiltersState>({ type: 'all' });
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered and paginated transactions for display
  const [displayedTransactions, setDisplayedTransactions] = useState<PointsTransaction[]>([]);
  const [totalPages, setTotalPages] = useState(0);

  const processAndSetTransactions = useCallback(() => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      let filtered = [...ALL_MOCK_TRANSACTIONS];

      // Apply date filters
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom!);
        // Set to start of the day for comparison
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(t => new Date(t.transactionDate as string) >= fromDate);
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo!);
        // Set to end of the day for comparison
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(t => new Date(t.transactionDate as string) <= toDate);
      }

      // Apply type filter
      if (filters.type && filters.type !== 'all') {
        filtered = filtered.filter(t => t.type === filters.type);
      }

      // Calculate total pages based on filtered results
      const newTotalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
      setTotalPages(newTotalPages);

      // Apply pagination
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setDisplayedTransactions(filtered.slice(startIndex, endIndex));

      setIsLoading(false);
    }, 500); // Simulate network delay
  }, [filters, currentPage]);

  useEffect(() => {
    processAndSetTransactions();
  }, [processAndSetTransactions]); // Rerun when filters or currentPage change (via processAndSetTransactions dependency)


  const handleFiltersChange = (newFilters: TransactionFiltersState) => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
    setFilters(newFilters);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleExport = (format: ExportFormat) => {
    // Placeholder for actual export logic
    console.log(`Exporting ${displayedTransactions.length} transactions as ${format}...`, filters);
    alert(`Simulating export of ${displayedTransactions.length} transactions as ${format}.
Filters applied: ${JSON.stringify(filters)}`);
    // In a real app, this would trigger a download or API call.
  };

  const handleRefresh = () => {
      console.log("Refreshing Killa History data...");
      // In a real app, this might refetch from an API. Here, just re-process.
      setCurrentPage(1); // Reset to page 1 on refresh with current filters
      processAndSetTransactions();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Killa History</h1>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCwIcon className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin': ''}`} />
                Refresh
            </Button>
            <ExportButton onExport={handleExport} disabled={isLoading || displayedTransactions.length === 0} />
        </div>
      </div>

      <TransactionFilters
        initialFilters={filters}
        onFiltersChange={handleFiltersChange}
        availableTypes={availableTransactionTypes}
      />

      {/* Add a loading state for the table */}
      {isLoading && (
        <div className="text-center py-10">
          <RefreshCwIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Loading Killa history...</p>
        </div>
      )}

      {!isLoading && (
        <KillaHistoryTable
          transactions={displayedTransactions}
          caption="Your recent Killa transactions."
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
