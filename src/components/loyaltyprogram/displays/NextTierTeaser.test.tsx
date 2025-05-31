// src/components/loyaltyprogram/displays/NextTierTeaser.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import NextTierTeaser from './NextTierTeaser';

// Mock the Progress component
jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: { value: number }) => (
    <div data-testid="progress-bar" style={{ width: `${value}%` }}>
      Progress: {value}%
    </div>
  ),
}));

describe('NextTierTeaser', () => {
  const defaultProps = {
    nextTierName: 'Gold',
    killaNeeded: 500,
    currentKillaProgress: 200,
    totalKillaForNextTierRange: 700, // e.g. Silver is 0-700, Gold starts at 700
    nextTierBenefitHighlight: 'Double KLA on all purchases!',
  };

  it('renders next tier name and Killa needed', () => {
    render(<NextTierTeaser {...defaultProps} />);
    expect(screen.getByText(/Almost there! Reach Gold Tier/i)).toBeInTheDocument();
    expect(screen.getByText((content) => content.startsWith('500') && content.includes('KLA more'))).toBeInTheDocument();
    expect(screen.getByText(/to unlock the Gold tier benefits!/i)).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(<NextTierTeaser {...defaultProps} title="Keep Going!" />);
    expect(screen.getByText('Keep Going!')).toBeInTheDocument();
  });

  it('renders progress bar with correct percentage and labels when progress data is provided', () => {
    render(<NextTierTeaser {...defaultProps} />);
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    // 200 / 700 = approx 28.57%, Math.round(28.57) = 29
    expect(progressBar).toHaveTextContent(`Progress: ${Math.round((200/700)*100)}%`);
    expect(screen.getByText('Current Progress')).toBeInTheDocument();
    expect(screen.getByText('200 / 700 KLA')).toBeInTheDocument();
  });

  it('does not render progress bar if totalKillaForNextTierRange is 0 or not provided', () => {
    render(<NextTierTeaser {...defaultProps} totalKillaForNextTierRange={0} />);
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();

    render(<NextTierTeaser {...defaultProps} totalKillaForNextTierRange={undefined} currentKillaProgress={undefined} />);
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  it('renders highlighted benefit when provided', () => {
    render(<NextTierTeaser {...defaultProps} />);
    expect(screen.getByText('Next tier includes:')).toBeInTheDocument();
    expect(screen.getByText('Double KLA on all purchases!')).toBeInTheDocument();
  });

  it('does not render benefit section if not provided', () => {
    render(<NextTierTeaser {...defaultProps} nextTierBenefitHighlight={undefined} />);
    expect(screen.queryByText('Next tier includes:')).not.toBeInTheDocument();
  });

  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(<NextTierTeaser {...defaultProps} isLoading={true} />);
    // Check for presence of skeleton elements by looking for animate-pulse class
    const animatedElements = container.querySelectorAll('.animate-pulse');
    expect(animatedElements.length).toBeGreaterThan(0);
    expect(screen.queryByText(/Almost there! Reach Gold Tier/i)).not.toBeInTheDocument();
  });

  it('renders "You\'re at the Top!" message if killaNeeded is 0 or less', () => {
    render(<NextTierTeaser {...defaultProps} killaNeeded={0} />);
    expect(screen.getByText("You're at the Top!")).toBeInTheDocument();
    expect(screen.getByText(/You've achieved the highest tier or completed your current progression!/i)).toBeInTheDocument();
  });

  it('renders "You\'re at the Top!" message if nextTierName is not provided (empty string)', () => {
    render(<NextTierTeaser {...defaultProps} nextTierName="" killaNeeded={100} />);
    expect(screen.getByText("You're at the Top!")).toBeInTheDocument();
  });
});
