// src/components/loyaltyprogram/displays/QuickStatsGrid.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import QuickStatsGrid, { StatItem } from './QuickStatsGrid'; // Import StatItem
import { GiftIcon, StarIcon, UsersIcon } from 'lucide-react'; // Example icons for testing

const mockStats: StatItem[] = [
  { id: '1', label: 'Lifetime Points', value: 10500, icon: StarIcon, unit: 'pts' },
  { id: '2', label: 'Total Redemptions', value: 25, icon: GiftIcon },
  { id: '3', label: 'Tier Progress', value: '60%', icon: UsersIcon, unit: '%' },
];

describe('QuickStatsGrid', () => {
  it('renders all provided stats correctly', () => {
    render(<QuickStatsGrid stats={mockStats} />);

    expect(screen.getByText('Lifetime Points')).toBeInTheDocument();
    expect(screen.getByText('10,500')).toBeInTheDocument();
    expect(screen.getByText('pts')).toBeInTheDocument(); // Check unit

    expect(screen.getByText('Total Redemptions')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    expect(screen.getByText('Tier Progress')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument(); // Value includes unit here due to string type
  });

  it('renders icons when provided', () => {
    render(<QuickStatsGrid stats={mockStats} />);
    // Check if elements that would host icons are present.
    // A more robust test would involve checking for specific SVG content or data-testid on icons.
    // For now, we assume if the stats render, their associated icons (if any) passed as components do too.
    // Example: Check if the parent of the icon is there (CardHeader)
    mockStats.forEach(stat => {
      const statLabel = screen.getByText(stat.label);
      // Find the card containing this label
      const card = statLabel.closest('.shadow'); // Assuming Card has 'shadow' class
      expect(card).toBeInTheDocument();
      if (stat.icon) {
        // This is a bit tricky without data-testid on icons.
        // We can check that the card header (where icon is) exists within this card.
        const header = card?.querySelector('.pb-2'); // CardHeader has pb-2
        expect(header).toBeInTheDocument();
      }
    });
  });

  it('renders loading skeletons when isLoading is true', () => {
    // Pass a non-empty array to stats to ensure skeletons are rendered for each stat
    const { container } = render(<QuickStatsGrid stats={mockStats} isLoading={true} />);

    // const skeletons = screen.getAllByRole('generic', { name: '' }); // Skeleton has role="generic" and no explicit name by default
    // Each card has 3 skeleton elements (label, icon, value)
    // So, for 3 stats, we expect 3 * 3 = 9 skeleton parts if we were very specific
    // Or, more simply, check if there are multiple skeleton elements.
    // A better test uses data-testid on skeleton groups or checks for animate-pulse.
    const animatedDivs = container.querySelectorAll('.animate-pulse'); // Skeletons use animate-pulse
    expect(animatedDivs.length).toBeGreaterThan(0); // Check that some pulse animations are present
    // Specifically, each skeleton part (label, icon, value) within each card should be a pulsing div.
    // For 3 stats, 3 cards. Each card has 3 skeleton components (label, icon container, value).
    // The label skeleton has one div, icon has one, value has one. So, 3 * 3 = 9 pulsing divs.
    // However, the CardHeader itself also has a div, and CardContent has a div.
    // The skeletons are: Label (1 div), Icon (1 div), Value (1 div) per card.
    // Let's count skeleton components more directly based on their structure.
    const labelSkeletons = container.querySelectorAll('.h-5.w-2\\/3'); // Label skeleton class
    const iconSkeletons = container.querySelectorAll('.h-6.w-6.rounded-sm'); // Icon skeleton class
    const valueSkeletons = container.querySelectorAll('.h-8.w-1\\/2.mb-1'); // Value skeleton class
    expect(labelSkeletons.length).toBe(mockStats.length);
    expect(iconSkeletons.length).toBe(mockStats.length);
    expect(valueSkeletons.length).toBe(mockStats.length);

    expect(screen.queryByText('Lifetime Points')).not.toBeInTheDocument(); // Actual data shouldn't be visible
  });

  it('renders a message when no stats are provided', () => {
    render(<QuickStatsGrid stats={[]} />);
    expect(screen.getByText('No statistics available at the moment.')).toBeInTheDocument();
  });

  it('applies custom grid column classes', () => {
    const { container } = render(
      <QuickStatsGrid stats={mockStats} gridCols="grid-cols-1 lg:grid-cols-4" />
    );
    // The main div holding the grid
    const gridContainer = container.firstChild as HTMLElement;
    expect(gridContainer).toHaveClass('grid-cols-1');
    expect(gridContainer).toHaveClass('lg:grid-cols-4');
  });
});
