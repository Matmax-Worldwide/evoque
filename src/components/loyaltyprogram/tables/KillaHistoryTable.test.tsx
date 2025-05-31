// src/components/loyaltyprogram/tables/KillaHistoryTable.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import KillaHistoryTable from './KillaHistoryTable';
import { PointsTransaction } from '@/types/loyalty'; // Using updated types

const mockTransactions: PointsTransaction[] = [
  { id: '1', transactionDate: '2023-01-15T10:00:00Z', description: 'Earned from order #123', type: 'earn', killaAmount: 100 },
  { id: '2', transactionDate: '2023-01-10T14:30:00Z', description: 'Redeemed for $5 Coupon', type: 'redeem', killaAmount: -50 },
  { id: '3', transactionDate: '2023-01-20T09:00:00Z', description: 'Welcome Bonus Killa', type: 'bonus', killaAmount: 200 },
];

describe('KillaHistoryTable', () => {
  it('renders transactions correctly', () => {
    render(<KillaHistoryTable transactions={mockTransactions} />);
    expect(screen.getByText('Earned from order #123')).toBeInTheDocument();
    expect(screen.getByText('+100 KLA')).toBeInTheDocument();
    expect(screen.getByText('Redeemed for $5 Coupon')).toBeInTheDocument();
    expect(screen.getByText('-50 KLA')).toBeInTheDocument();
    expect(screen.getByText('Welcome Bonus Killa')).toBeInTheDocument();
    expect(screen.getByText('+200 KLA')).toBeInTheDocument();
  });

  it('renders "No Killa transaction history found." when no transactions are provided', () => {
    render(<KillaHistoryTable transactions={[]} />);
    expect(screen.getByText('No Killa transaction history found.')).toBeInTheDocument();
  });

  it('sorts by date by default (descending)', () => {
    render(<KillaHistoryTable transactions={mockTransactions} />);
    const rows = screen.getAllByRole('row'); // Includes header row
    // Expect 'Welcome Bonus Killa' (Jan 20) first, then 'Earned from order #123' (Jan 15), then 'Redeemed for $5 Coupon' (Jan 10)
    expect(rows[1].textContent).toContain('Welcome Bonus Killa');
    expect(rows[2].textContent).toContain('Earned from order #123');
    expect(rows[3].textContent).toContain('Redeemed for $5 Coupon');
  });

  it('sorts by Killa Amount when header is clicked', () => {
    render(<KillaHistoryTable transactions={mockTransactions} />);
    const killaAmountHeader = screen.getByText(/Killa Amount/i).closest('div'); // Click the div containing the text and icon
    expect(killaAmountHeader).toBeInTheDocument();

    // Click once for ascending
    fireEvent.click(killaAmountHeader!);
    let rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('-50 KLA'); // Redeemed
    expect(rows[2].textContent).toContain('+100 KLA'); // Earned
    expect(rows[3].textContent).toContain('+200 KLA'); // Bonus

    // Click again for descending
    fireEvent.click(killaAmountHeader!);
    rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('+200 KLA'); // Bonus
    expect(rows[2].textContent).toContain('+100 KLA'); // Earned
    expect(rows[3].textContent).toContain('-50 KLA'); // Redeemed
  });

  it('sorts by Date when Date header is clicked (toggles order)', () => {
    render(<KillaHistoryTable transactions={mockTransactions} />);
    const dateHeader = screen.getByText(/Date/i).closest('div'); // Click the div
    expect(dateHeader).toBeInTheDocument();


    // Default is desc. Click once for asc.
    fireEvent.click(dateHeader!);
    let rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('Redeemed for $5 Coupon'); // Jan 10
    expect(rows[2].textContent).toContain('Earned from order #123'); // Jan 15
    expect(rows[3].textContent).toContain('Welcome Bonus Killa');   // Jan 20

    // Click again for desc.
    fireEvent.click(dateHeader!);
    rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('Welcome Bonus Killa');   // Jan 20
    expect(rows[2].textContent).toContain('Earned from order #123'); // Jan 15
    expect(rows[3].textContent).toContain('Redeemed for $5 Coupon'); // Jan 10
  });

  it('renders pagination controls if props are provided and totalPages > 1', () => {
    const mockOnPageChange = jest.fn();
    render(
      <KillaHistoryTable
        transactions={mockTransactions}
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );
    expect(screen.getByRole('button', { name: /Previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('disables pagination buttons correctly', () => {
    render(
      <KillaHistoryTable
        transactions={mockTransactions}
        currentPage={1}
        totalPages={2}
        onPageChange={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Next/i })).not.toBeDisabled();

    // Re-render for the second case
    render(
      <KillaHistoryTable
        transactions={mockTransactions}
        currentPage={2}
        totalPages={2}
        onPageChange={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /Previous/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
  });

  it('does not render pagination controls if totalPages is 1 or less, or props missing', () => {
    render(<KillaHistoryTable transactions={mockTransactions} currentPage={1} totalPages={1} />);
    expect(screen.queryByRole('button', { name: /Previous/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument();

    render(<KillaHistoryTable transactions={mockTransactions} />); // No pagination props
    expect(screen.queryByRole('button', { name: /Previous/i })).not.toBeInTheDocument();
  });

  it('formats transaction types for display', () => {
    const customTransactions: PointsTransaction[] = [
        { id: '1', transactionDate: '2023-01-15T10:00:00Z', description: 'Test', type: 'transfer_in', killaAmount: 100 },
        { id: '2', transactionDate: '2023-01-10T14:30:00Z', description: 'Test 2', type: 'earn', killaAmount: -50 },
    ];
    render(<KillaHistoryTable transactions={customTransactions} />);
    expect(screen.getByText('Transfer In')).toBeInTheDocument();
    expect(screen.getByText('Earn')).toBeInTheDocument();
  });

});
