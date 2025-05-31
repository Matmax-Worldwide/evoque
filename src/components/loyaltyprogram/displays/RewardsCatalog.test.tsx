// src/components/loyaltyprogram/displays/RewardsCatalog.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RewardsCatalog from './RewardsCatalog';
import { Reward } from '@/types/loyalty';

// Mock RewardCard to check if it's rendered with correct props
jest.mock('@/components/loyaltyprogram/cards/RewardCard', () => ({
  __esModule: true,
  default: jest.fn(({ reward, onRedeem }) => (
    <div data-testid={`reward-card-${reward.id}`}>
      <span>{reward.name}</span>
      <button onClick={() => onRedeem(reward.id)}>Redeem {reward.id}</button>
    </div>
  )),
}));

// Mock next/image for any underlying RewardCard usage if not already globally mocked
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img {...props} alt={props.alt || ''} />;
    },
}));


const mockRewards: Reward[] = [
  { id: 'rew1', name: 'Coffee Mug', killaRequired: 100, category: 'Merch', isActive: true },
  { id: 'rew2', name: '$5 Discount', killaRequired: 200, category: 'Discounts', isActive: true },
  { id: 'rew3', name: 'Premium Sticker Pack', killaRequired: 50, category: 'Merch', isActive: true },
];

describe('RewardsCatalog', () => {
  const mockOnRedeemClick = jest.fn();

  beforeEach(() => {
    mockOnRedeemClick.mockClear();
    // Clear RewardCard mock calls if needed
    (require('@/components/loyaltyprogram/cards/RewardCard').default as jest.Mock).mockClear();
  });

  it('renders a grid of RewardCard components by default', () => {
    render(<RewardsCatalog rewards={mockRewards} onRedeemClick={mockOnRedeemClick} />);

    expect(screen.getByText('Available Rewards (3)')).toBeInTheDocument();
    expect(screen.getByTestId('reward-card-rew1')).toBeInTheDocument();
    expect(screen.getByText('Coffee Mug')).toBeInTheDocument();
    expect(screen.getByTestId('reward-card-rew2')).toBeInTheDocument();
    expect(screen.getByText('$5 Discount')).toBeInTheDocument();
    expect(screen.getByTestId('reward-card-rew3')).toBeInTheDocument();
    expect(screen.getByText('Premium Sticker Pack')).toBeInTheDocument();

    // Check if RewardCard mock was called correctly for one item
    const RewardCardMock = require('@/components/loyaltyprogram/cards/RewardCard').default;
    expect(RewardCardMock).toHaveBeenCalledWith(
      expect.objectContaining({ reward: mockRewards[0] }),
      expect.anything() // Second argument for React context if any
    );
  });

  it('calls onRedeemClick with the correct reward when a RewardCard redeem is triggered', () => {
    render(<RewardsCatalog rewards={mockRewards} onRedeemClick={mockOnRedeemClick} />);
    // The mock RewardCard has a button "Redeem {reward.id}"
    const redeemButtonForRew1 = screen.getByRole('button', { name: 'Redeem rew1' });
    fireEvent.click(redeemButtonForRew1);
    expect(mockOnRedeemClick).toHaveBeenCalledWith(mockRewards[0]);
  });

  it('renders loading skeletons when isLoading is true', () => {
    render(<RewardsCatalog rewards={[]} isLoading={true} onRedeemClick={mockOnRedeemClick} />);
    // The catalog now renders its own CardSkeleton for each of 8 placeholders
    // Each CardSkeleton has role="generic" and aria-label="Loading reward card"
    const skeletonCards = screen.getAllByRole('generic', { name: 'Loading reward card' });
    expect(skeletonCards.length).toBe(8);

    // Check for animate-pulse on children of these skeletons
    skeletonCards.forEach(card => {
        expect(card.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    expect(screen.queryByText('Coffee Mug')).not.toBeInTheDocument();
  });

  it('renders "No Rewards Available" message when rewards array is empty and not loading', () => {
    render(<RewardsCatalog rewards={[]} isLoading={false} onRedeemClick={mockOnRedeemClick} />);
    expect(screen.getByText('No Rewards Available')).toBeInTheDocument();
    expect(screen.getByText('Please check back later or adjust your filters.')).toBeInTheDocument();
  });

  it('renders view toggle buttons (Grid active by default, List disabled)', () => {
    render(<RewardsCatalog rewards={mockRewards} onRedeemClick={mockOnRedeemClick} />);
    const gridButton = screen.getByRole('button', { name: /Grid/i });
    const listButton = screen.getByRole('button', { name: /List \(Soon\)/i });

    expect(gridButton).toBeInTheDocument();
    expect(listButton).toBeInTheDocument();

    expect(gridButton).toHaveClass('bg-blue-600'); // Active class
    expect(listButton).not.toHaveClass('bg-blue-600'); // Inactive class
    expect(listButton).toBeDisabled();
  });

  it('switches to list view placeholder when List button is clicked (if it were enabled)', () => {
    render(<RewardsCatalog rewards={mockRewards} onRedeemClick={mockOnRedeemClick} />);
    const listButton = screen.getByRole('button', { name: /List \(Soon\)/i });

    // If the button were enabled, this would test the switch:
    // fireEvent.click(listButton);
    // expect(screen.getByText(/List view is coming soon!/i)).toBeInTheDocument();
    // For now, we just confirm it's disabled as per current implementation
    expect(listButton).toBeDisabled();
  });
});
