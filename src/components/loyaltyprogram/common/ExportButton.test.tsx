// src/components/loyaltyprogram/common/ExportButton.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExportButton, { type ExportFormat } from './ExportButton';

describe('ExportButton', () => {
  const mockOnExport = jest.fn();

  beforeEach(() => {
    mockOnExport.mockClear();
  });

  it('renders the export button with default text', () => {
    render(<ExportButton onExport={mockOnExport} />);
    expect(screen.getByRole('button', { name: /Export Data/i })).toBeInTheDocument();
  });

  it('is disabled when the disabled prop is true', () => {
    render(<ExportButton onExport={mockOnExport} disabled={true} />);
    expect(screen.getByRole('button', { name: /Export Data/i })).toBeDisabled();
  });

  it('shows loading state and is disabled when isLoading prop is true', () => {
    render(<ExportButton onExport={mockOnExport} isLoading={true} />);
    expect(screen.getByRole('button', { name: /Exporting.../i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exporting.../i })).toBeDisabled();
    // Check for spinning icon (presence of animate-spin class)
    // Note: querySelector might be more robust if the SVG structure is complex or changes
    const button = screen.getByRole('button', { name: /Exporting.../i });
    const icon = button.querySelector('svg'); // Find the SVG element within the button
    expect(icon).toHaveClass('animate-spin');
  });

  it('opens dropdown and calls onExport with "csv" when "Export as CSV" is clicked', () => {
    render(<ExportButton onExport={mockOnExport} />);
    const mainButton = screen.getByRole('button', { name: /Export Data/i });
    fireEvent.click(mainButton); // Open dropdown

    const exportCsvButton = screen.getByRole('menuitem', { name: 'Export as CSV' }); // Use role 'menuitem'
    expect(exportCsvButton).toBeInTheDocument();
    fireEvent.click(exportCsvButton);

    expect(mockOnExport).toHaveBeenCalledWith('csv');
  });

  it('opens dropdown and calls onExport with "pdf" when "Export as PDF" is clicked', () => {
    render(<ExportButton onExport={mockOnExport} />);
    const mainButton = screen.getByRole('button', { name: /Export Data/i });
    fireEvent.click(mainButton); // Open dropdown

    const exportPdfButton = screen.getByRole('menuitem', { name: 'Export as PDF' }); // Use role 'menuitem'
    expect(exportPdfButton).toBeInTheDocument();
    fireEvent.click(exportPdfButton);

    expect(mockOnExport).toHaveBeenCalledWith('pdf');
  });

  it('dropdown menu items are disabled when isLoading is true', () => {
    render(<ExportButton onExport={mockOnExport} isLoading={true} />);
    const mainButton = screen.getByRole('button', { name: /Exporting.../i });
    fireEvent.click(mainButton); // Open dropdown

    const exportCsvButton = screen.getByRole('menuitem', { name: 'Export as CSV' });
    expect(exportCsvButton).toHaveAttribute('aria-disabled', 'true');

    const exportPdfButton = screen.getByRole('menuitem', { name: 'Export as PDF' });
    expect(exportPdfButton).toHaveAttribute('aria-disabled', 'true');

    // Attempt to click and ensure onExport is not called
    fireEvent.click(exportCsvButton);
    expect(mockOnExport).not.toHaveBeenCalled();
    fireEvent.click(exportPdfButton);
    expect(mockOnExport).not.toHaveBeenCalled();
  });
});
