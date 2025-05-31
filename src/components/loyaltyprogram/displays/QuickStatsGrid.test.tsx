// src/components/loyaltyprogram/displays/QuickStatsGrid.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import QuickStatsGrid from './QuickStatsGrid';
// Import StatDisplayItem from the centralized types
import { type StatDisplayItem } from '@/types/loyalty';
import { GiftIcon, StarIcon, UsersIcon } from 'lucide-react';

// Updated mockStats with Killa branding
const mockStats: StatDisplayItem[] = [
  { id: '1', label: 'Lifetime Killa', value: 10500, icon: StarIcon, unit: 'KLA' }, // Updated
  { id: '2', label: 'Total Redemptions', value: 25, icon: GiftIcon }, // No change if label is generic
  { id: '3', label: 'Tier Progress', value: '60%', icon: UsersIcon, unit: '%' }, // No change if label is generic
];

describe('QuickStatsGrid', () => {
  it('renders all provided stats correctly', () => {
    render(<QuickStatsGrid stats={mockStats} />);

    expect(screen.getByText('Lifetime Killa')).toBeInTheDocument(); // Updated
    expect(screen.getByText('10,500')).toBeInTheDocument();
    // Check for the KLA unit associated with '10,500'
    const valueElement = screen.getByText('10,500');
    const unitElement = valueElement.nextElementSibling; // Assuming unit is a sibling span
    expect(unitElement).toHaveTextContent('KLA');


    expect(screen.getByText('Total Redemptions')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    expect(screen.getByText('Tier Progress')).toBeInTheDocument();
    // For "60%", the % is part of the value string itself as per mockStats
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('renders icons when provided', () => {
    render(<QuickStatsGrid stats={mockStats} />);
    mockStats.forEach(stat => {
      const statLabel = screen.getByText(stat.label);
      const card = statLabel.closest('.shadow');
      expect(card).toBeInTheDocument();
      if (stat.icon) {
        const header = card?.querySelector('.pb-2');
        expect(header).toBeInTheDocument();
      }
    });
  });

  it('renders loading skeletons when isLoading is true', () => {
    render(<QuickStatsGrid stats={mockStats} isLoading={true} />);
    const animatedDivs = document.querySelectorAll('.animate-pulse');
    expect(animatedDivs.length).toBeGreaterThan(0);
    expect(screen.queryByText('Lifetime Killa')).not.toBeInTheDocument(); // Updated
  });

  it('renders a message when no stats are provided', () => {
    render(<QuickStatsGrid stats={[]} />);
    expect(screen.getByText('No statistics available at the moment.')).toBeInTheDocument();
  });

  it('applies custom grid column classes', () => {
    const { container } = render(
      <QuickStatsGrid stats={mockStats} gridCols="grid-cols-1 lg:grid-cols-4" />
    );
    const gridContainer = container.firstChild as HTMLElement;
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('lg:grid-cols-4');
  });
});
