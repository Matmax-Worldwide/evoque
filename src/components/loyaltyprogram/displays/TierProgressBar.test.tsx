// src/components/loyaltyprogram/displays/TierProgressBar.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import TierProgressBar from './TierProgressBar';
// Import TierProgressDisplayInfo from the centralized types
import { type TierProgressDisplayInfo } from '@/types/loyalty';


jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress-bar" style={{ width: `${value}%` }}>
      {value}%
    </div>
  ),
}));

describe('TierProgressBar', () => {
  // Updated defaultProps with Killa branding
  const defaultProps: TierProgressDisplayInfo & { isLoading?: boolean } = { // Ensure isLoading is part of type for test
    currentTierName: 'Silver',
    nextTierName: 'Gold',
    currentKillaInTier: 50, // Updated
    killaNeededForNextTier: 100, // Updated
    isLoading: false,
  };

  it('renders current and next tier names', () => {
    render(<TierProgressBar {...defaultProps} />);
    expect(screen.getByText(/Current Tier:/i)).toHaveTextContent('Silver');
    expect(screen.getByText(/Next Tier:/i)).toHaveTextContent('Gold');
  });

  it('calculates and displays progress percentage correctly', () => {
    render(<TierProgressBar {...defaultProps} />);
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('50%');
  });

  it('displays KLA needed to reach the next tier', () => { // Updated
    render(<TierProgressBar {...defaultProps} />);
    expect(screen.getByText(/You need/i)).toHaveTextContent('50 more KLA to reach Gold.'); // Updated
  });

  it('handles being at the start of a tier (0 Killa in tier)', () => { // Updated
    render(<TierProgressBar {...defaultProps} currentKillaInTier={0} />); // Updated
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('0%');
    expect(screen.getByText(/You need/i)).toHaveTextContent('100 more KLA to reach Gold.'); // Updated
  });

  it('handles reaching the next tier exactly', () => {
    render(<TierProgressBar {...defaultProps} currentKillaInTier={100} />); // Updated
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('100%');
    expect(screen.getByText(/Congratulations! You've reached Gold!/i)).toBeInTheDocument();
  });

  it('handles exceeding Killa for next tier (should cap at 100%)', () => { // Updated
    render(<TierProgressBar {...defaultProps} currentKillaInTier={150} />); // Updated
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('100%');
    expect(screen.getByText(/Congratulations! You've reached Gold!/i)).toBeInTheDocument();
  });

  it('renders loading skeletons when isLoading is true', () => {
    render(<TierProgressBar {...defaultProps} isLoading={true} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText('Silver')).not.toBeInTheDocument();
  });

  it('handles being at the highest tier (no nextTierName)', () => {
    render(
      <TierProgressBar
        currentTierName="Platinum"
        currentKillaInTier={200} // Updated
        killaNeededForNextTier={0} // Updated
        isLoading={false}
      />
    );
    expect(screen.getByText(/You are at the highest tier: Platinum!/i)).toBeInTheDocument();
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('handles custom title and description', () => {
    render(<TierProgressBar {...defaultProps} title="My Killa Progress" description="How close you are to more Killa." />); // Updated
    expect(screen.getByText("My Killa Progress")).toBeInTheDocument(); // Updated
    expect(screen.getByText("How close you are to more Killa.")).toBeInTheDocument(); // Updated
  });

  it('renders correctly if only current tier is provided (no next tier)', () => {
    render(<TierProgressBar currentTierName="Bronze" currentKillaInTier={10} killaNeededForNextTier={0} />); // Updated
    expect(screen.getByText(/You're doing great in the Bronze tier!/i)).toBeInTheDocument();
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('shows "Tier information not available" if no tier info is provided and not highest tier', () => {
    render(<TierProgressBar currentKillaInTier={0} killaNeededForNextTier={0} />); // Updated
    expect(screen.getByText("Tier information not available.")).toBeInTheDocument();
  });
});
