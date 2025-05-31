// src/components/loyaltyprogram/forms/TransactionFilters.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransactionFilters, { type TransactionFiltersState } from './TransactionFilters';
import { PointsTransactionType } from '@/types/loyalty';
import { format } from 'date-fns'; // Import format from date-fns

const mockAvailableTypes: Array<{ value: PointsTransactionType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'earn', label: 'Earn' },
  { value: 'redeem', label: 'Redeem' },
  { value: 'bonus', label: 'Bonus' },
];

// Mock Calendar and Popover to simplify testing date picking
jest.mock('@/components/ui/calendar', () => ({
    Calendar: ({ selected, onSelect }: { selected?: Date, onSelect: (date?: Date) => void }) => (
        <input
            type="date"
            data-testid="calendar-mock"
            value={selected ? selected.toISOString().split('T')[0] : ''}
            onChange={(e) => {
                // Ensure the date is created in UTC to avoid timezone issues in tests
                const value = e.target.value;
                if (value) {
                    const [year, month, day] = value.split('-').map(Number);
                    onSelect(new Date(Date.UTC(year, month - 1, day)));
                } else {
                    onSelect(undefined);
                }
            }}
        />
    )
}));
jest.mock('@/components/ui/popover', () => ({
    Popover: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-mock">{children}</div>,
    PopoverTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-trigger-mock">{children}</div>,
    PopoverContent: ({ children }: { children: React.ReactNode }) => <div data-testid="popover-content-mock">{children}</div>,
}));


describe('TransactionFilters', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  it('renders filter elements correctly', () => {
    render(
      <TransactionFilters
        onFiltersChange={mockOnFiltersChange}
        availableTypes={mockAvailableTypes}
      />
    );
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument();
  });

  it('initializes with default filter values', () => {
    render(
      <TransactionFilters
        onFiltersChange={mockOnFiltersChange}
        availableTypes={mockAvailableTypes}
      />
    );
    expect(screen.getByText('All Types')).toBeInTheDocument();
  });

  it('initializes with initialFilters prop', () => {
    const initial: TransactionFiltersState = {
        dateFrom: new Date(Date.UTC(2023, 2, 1)), // March 1st, 2023 UTC
        type: 'earn'
    };
    render(
      <TransactionFilters
        initialFilters={initial}
        onFiltersChange={mockOnFiltersChange}
        availableTypes={mockAvailableTypes}
      />
    );
    expect(screen.getByText(format(new Date(Date.UTC(2023, 2, 1)), "PPP"))).toBeInTheDocument();
    expect(screen.getByText('Earn')).toBeInTheDocument();
  });

  it('calls onFiltersChange with selected values when Apply is clicked', async () => {
    render(
      <TransactionFilters
        onFiltersChange={mockOnFiltersChange}
        availableTypes={mockAvailableTypes}
      />
    );

    // Open "From" date popover trigger (assuming the button itself is the trigger)
    const dateFromButton = screen.getAllByRole('button', { name: /Pick a date/i })[0];
    fireEvent.click(dateFromButton);

    const dateFromInput = screen.getAllByTestId('calendar-mock')[0];
    fireEvent.change(dateFromInput, { target: { value: '2023-01-01' } });

    const typeSelectTrigger = screen.getByRole('combobox');
    fireEvent.mouseDown(typeSelectTrigger);

    await waitFor(() => {
        expect(screen.getByText('Redeem')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Redeem'));

    fireEvent.click(screen.getByRole('button', { name: /Apply/i }));

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateFrom: new Date(Date.UTC(2023, 0, 1)), // Jan 1st, 2023 UTC
      dateTo: undefined,
      type: 'redeem',
    });
  });

  it('calls onFiltersChange with empty values when Clear Filters is clicked', () => {
     const initial: TransactionFiltersState = {
        dateFrom: new Date(Date.UTC(2023, 2, 1)),
        type: 'earn'
    };
    render(
      <TransactionFilters
        initialFilters={initial}
        onFiltersChange={mockOnFiltersChange}
        availableTypes={mockAvailableTypes}
      />
    );

    const clearButton = screen.getByRole('button', { name: /Clear/i });
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateFrom: undefined,
      dateTo: undefined,
      type: 'all',
    });

    expect(screen.getAllByText('Pick a date').length).toBe(2);
    expect(screen.getByText('All Types')).toBeInTheDocument();
  });

  it('Clear Filters button is only visible when filters are active', () => {
    const { rerender } = render(
      <TransactionFilters onFiltersChange={mockOnFiltersChange} availableTypes={mockAvailableTypes} />
    );
    expect(screen.queryByRole('button', { name: /Clear/i })).not.toBeInTheDocument();

    rerender(
      <TransactionFilters
        initialFilters={{ dateFrom: new Date() }}
        onFiltersChange={mockOnFiltersChange}
        availableTypes={mockAvailableTypes}
      />
    );
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
  });
});
