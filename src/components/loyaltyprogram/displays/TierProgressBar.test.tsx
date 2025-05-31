// src/components/loyaltyprogram/displays/TierProgressBar.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import TierProgressBar, { type TierProgressBarProps } from './TierProgressBar';

// Mock the Progress component from ui
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress-bar" style={{ width: `${value}%` }}>
      {value}%
    </div>
  ),
}));

describe('TierProgressBar', () => {
  const defaultProps: TierProgressBarProps = {
    currentTierName: 'Silver',
    nextTierName: 'Gold',
    currentPointsInTier: 50,
    pointsNeededForNextTier: 100, // Total points in Silver tier range to reach Gold
    isLoading: false,
  };

  it('renders current and next tier names', () => {
    render(<TierProgressBar {...defaultProps} />);
    expect(screen.getByText(/Current Tier:/i)).toHaveTextContent('Silver');
    expect(screen.getByText(/Next Tier:/i)).toHaveTextContent('Gold');
  });

  it('calculates and displays progress percentage correctly', () => {
    render(<TierProgressBar {...defaultProps} />);
    // Progress component is mocked to display its value as text
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('50%');
  });

  it('displays points needed to reach the next tier', () => {
    render(<TierProgressBar {...defaultProps} />);
    expect(screen.getByText(/You need/i)).toHaveTextContent('50 more points to reach Gold.');
  });

  it('handles being at the start of a tier (0 points in tier)', () => {
    render(<TierProgressBar {...defaultProps} currentPointsInTier={0} />);
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('0%');
    expect(screen.getByText(/You need/i)).toHaveTextContent('100 more points to reach Gold.');
  });

  it('handles reaching the next tier exactly', () => {
    render(<TierProgressBar {...defaultProps} currentPointsInTier={100} />);
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('100%');
    expect(screen.getByText(/Congratulations! You've reached Gold!/i)).toBeInTheDocument();
  });

  it('handles exceeding points for next tier (should cap at 100%)', () => {
    render(<TierProgressBar {...defaultProps} currentPointsInTier={150} />);
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('100%');
    // Message might still say "Congratulations" if pointsToNext logic is based on pointsNeededForNextTier
     expect(screen.getByText(/Congratulations! You've reached Gold!/i)).toBeInTheDocument();
  });

  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(<TierProgressBar {...defaultProps} isLoading={true} />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText('Silver')).not.toBeInTheDocument();
  });

  it('handles being at the highest tier (no nextTierName)', () => {
    render(
      <TierProgressBar
        currentTierName="Platinum"
        currentPointsInTier={200} // Example points in this tier
        pointsNeededForNextTier={0} // Or indicate top tier some other way
        isLoading={false}
      />
    );
    expect(screen.getByText(/You are at the highest tier: Platinum!/i)).toBeInTheDocument();
    // Progress bar might not be shown or shown as full. Check specific logic.
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument(); // Based on current logic for pointsNeededForNextTier = 0
  });

  it('handles custom title and description', () => {
    render(<TierProgressBar {...defaultProps} title="My Progress" description="How close you are." />);
    expect(screen.getByText("My Progress")).toBeInTheDocument();
    expect(screen.getByText("How close you are.")).toBeInTheDocument();
  });

  it('renders correctly if only current tier is provided (no next tier)', () => {
    render(<TierProgressBar currentTierName="Bronze" currentPointsInTier={10} pointsNeededForNextTier={0} />);
    expect(screen.getByText(/You're doing great in the Bronze tier!/i)).toBeInTheDocument();
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('shows "Tier information not available" if no tier info is provided and not highest tier', () => {
    render(<TierProgressBar currentPointsInTier={0} pointsNeededForNextTier={0} />);
    expect(screen.getByText("Tier information not available.")).toBeInTheDocument();
  });
});
