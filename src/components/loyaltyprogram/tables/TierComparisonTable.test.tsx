// src/components/loyaltyprogram/tables/TierComparisonTable.test.tsx
'use client';

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import TierComparisonTable from './TierComparisonTable';
import { Tier } from '@/types/loyalty';

const mockTiers: Tier[] = [
  { id: 'bronze', name: 'Bronze', minKillaToAchieve: 0, killaToNextTier: 500, benefits: ['Basic Support', 'Newsletter Access'], multiplier: 1 },
  { id: 'silver', name: 'Silver', minKillaToAchieve: 500, killaToNextTier: 2000, benefits: ['Priority Support', 'Early Access to Sales', '5% Killa Bonus'], multiplier: 1.2 },
  { id: 'gold', name: 'Gold', minKillaToAchieve: 2000, benefits: ['Dedicated Support', 'Exclusive Event Invites', '10% Killa Bonus', 'Free Shipping'], multiplier: 1.5 }, // killaToNextTier might be undefined for top tier
];

describe('TierComparisonTable', () => {
  it('renders tier names as column headers in sorted order', () => {
    render(<TierComparisonTable tiers={mockTiers} />);
    // Tiers are sorted by minKillaToAchieve
    const headers = screen.getAllByRole('columnheader');
    expect(headers[1]).toHaveTextContent('Bronze'); // First after "Feature"
    expect(headers[2]).toHaveTextContent('Silver');
    expect(headers[3]).toHaveTextContent('Gold');
  });

  it('renders Killa to Achieve for each tier', () => {
    render(<TierComparisonTable tiers={mockTiers} />);
    // Find the row for "Killa to Achieve"
    const killaToAchieveRow = screen.getByText('Killa to Achieve').closest('tr');
    expect(killaToAchieveRow).toBeInTheDocument();

    if (killaToAchieveRow) {
        expect(within(killaToAchieveRow).getByText('0 KLA')).toBeInTheDocument(); // Bronze
        expect(within(killaToAchieveRow).getByText('500 KLA')).toBeInTheDocument(); // Silver
        expect(within(killaToAchieveRow).getByText('2,000 KLA')).toBeInTheDocument(); // Gold
    }
  });

  it('renders Killa Multiplier for each tier', () => {
    render(<TierComparisonTable tiers={mockTiers} />);
    const multiplierRow = screen.getByText('Killa Multiplier').closest('tr');
    expect(multiplierRow).toBeInTheDocument();

    if (multiplierRow) {
        expect(within(multiplierRow).getByText('1x')).toBeInTheDocument();
        expect(within(multiplierRow).getByText('1.2x')).toBeInTheDocument();
        expect(within(multiplierRow).getByText('1.5x')).toBeInTheDocument();
    }
  });

  it('renders a subset of benefits for each tier', () => {
    render(<TierComparisonTable tiers={mockTiers} />);
    const benefitsRow = screen.getByText('Key Benefits').closest('tr');
    expect(benefitsRow).toBeInTheDocument();

    if (benefitsRow) {
        // Bronze benefits
        expect(within(benefitsRow).getByText('Basic Support')).toBeInTheDocument();
        expect(within(benefitsRow).getByText('Newsletter Access')).toBeInTheDocument();
        // Gold benefits (check for truncation)
        expect(within(benefitsRow).getByText('Dedicated Support')).toBeInTheDocument();
        expect(within(benefitsRow).getByText('Exclusive Event Invites')).toBeInTheDocument();
        expect(within(benefitsRow).getByText('10% Killa Bonus')).toBeInTheDocument();
        expect(within(benefitsRow).getByText('+ 1 more...')).toBeInTheDocument(); // Gold has 4 benefits, shows 3 + more
    }
  });

  it('highlights the current tier column', () => {
    render(<TierComparisonTable tiers={mockTiers} currentTierId="silver" />);
    const silverHeader = screen.getByRole('columnheader', { name: 'Silver' });
    expect(silverHeader).toHaveClass('text-indigo-700');
    expect(silverHeader).toHaveClass('bg-indigo-50');

    // Check a cell in the Silver column for background
    const multiplierRow = screen.getByText('Killa Multiplier').closest('tr');
    if (multiplierRow) {
        const silverMultiplierCell = within(multiplierRow).getByText('1.2x').closest('td');
        expect(silverMultiplierCell).toHaveClass('bg-indigo-50');
    }
  });

  it('renders "No tier information available" message when no tiers are provided', () => {
    render(<TierComparisonTable tiers={[]} />);
    expect(screen.getByText('No tier information available to compare.')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(<TierComparisonTable tiers={mockTiers} title="Our Awesome Tiers" description="Compare them now!" />);
    expect(screen.getByText("Our Awesome Tiers")).toBeInTheDocument();
    expect(screen.getByText("Compare them now!")).toBeInTheDocument();
  });

  it('renders tier icons', () => {
    render(<TierComparisonTable tiers={mockTiers} />);
    const tierIconRow = screen.getByText('Tier Icon').closest('tr');
    expect(tierIconRow).toBeInTheDocument();
    if (tierIconRow) {
        const cells = within(tierIconRow).getAllByRole('cell');
        // cells[0] is the "Tier Icon" label cell
        expect(cells[1].querySelector('svg')).toBeInTheDocument(); // Bronze icon
        expect(cells[2].querySelector('svg')).toBeInTheDocument(); // Silver icon
        expect(cells[3].querySelector('svg')).toBeInTheDocument(); // Gold icon
    }
  });
});
