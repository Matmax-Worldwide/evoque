// src/components/loyaltyprogram/tables/KillaHistoryTable.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button }
from '@/components/ui/button'; // For sorting and pagination buttons
import { ArrowUpDownIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { PointsTransaction, PointsTransactionType } from '@/types/loyalty'; // Using updated types

interface KillaHistoryTableProps {
  transactions: PointsTransaction[];
  caption?: string;
  // Props for pagination to be handled by parent, table just displays controls if needed
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

type SortKey = 'transactionDate' | 'killaAmount' | 'description' | 'type';
type SortOrder = 'asc' | 'desc';

const killaAmountToColor = (amount?: number): string => {
    if (amount === undefined) return 'text-gray-500';
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-500';
};

// Helper to format transaction type for display if needed
const formatTransactionType = (type: PointsTransactionType): string => {
    // Capitalize first letter and replace underscores with spaces
    return type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const KillaHistoryTable: React.FC<KillaHistoryTableProps> = ({
  transactions,
  caption,
  currentPage, // Example: 1
  totalPages,  // Example: 5
  onPageChange, // Example: (newPage) => console.log('Change to page', newPage)
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('transactionDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'transactionDate') {
        // Ensure date objects are properly compared
        valA = new Date(a.transactionDate as string).getTime();
        valB = new Date(b.transactionDate as string).getTime();
      } else if (sortKey === 'description' || sortKey === 'type') {
        // Ensure string comparison is case-insensitive for potentially better UX
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
      }


      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB);
      }
      // Ensure numbers are correctly compared
      if (typeof valA === 'number' && typeof valB === 'number') {
        return valA - valB;
      }
      return 0;
    });

    if (sortOrder === 'desc') {
      return sorted.reverse();
    }
    return sorted;
  }, [transactions, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDownIcon className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortOrder === 'asc' ? <ArrowUpIcon className="ml-2 h-4 w-4" /> : <ArrowDownIcon className="ml-2 h-4 w-4" />;
  };

  if (!transactions || transactions.length === 0) {
    return <p className="text-center py-8 text-gray-500">No Killa transaction history found.</p>;
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          {caption && <caption className="mt-4 text-sm text-muted-foreground">{caption}</caption>}
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('transactionDate')}
              >
                <div className="flex items-center">Date {renderSortIcon('transactionDate')}</div>
              </TableHead>
              <TableHead
                 className="cursor-pointer hover:bg-gray-50"
                 onClick={() => handleSort('description')}
              >
                <div className="flex items-center">Description {renderSortIcon('description')}</div>
              </TableHead>
              <TableHead
                 className="cursor-pointer hover:bg-gray-50"
                 onClick={() => handleSort('type')}
              >
                <div className="flex items-center">Type {renderSortIcon('type')}</div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('killaAmount')}
              >
                <div className="flex items-center justify-end">Killa Amount {renderSortIcon('killaAmount')}</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-slate-50">
                <TableCell className="font-medium">
                  {new Date(transaction.transactionDate as string).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{formatTransactionType(transaction.type)}</TableCell>
                <TableCell className={`text-right font-semibold ${killaAmountToColor(transaction.killaAmount)}`}>
                  {transaction.killaAmount > 0 ? '+' : ''}
                  {transaction.killaAmount.toLocaleString()} KLA
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Pagination Controls Placeholder */}
      {currentPage && totalPages && onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default KillaHistoryTable;
