// src/components/loyaltyprogram/cards/RewardCard.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RewardCard from './RewardCard';
import { Reward } from '@/types/loyalty';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

const mockReward: Reward = {
  id: 'rew1',
  name: 'Deluxe Gadget Pro',
  description: 'The latest and greatest gadget for all your needs.',
  killaRequired: 1500,
  imageUrl: '/gadget.jpg',
  category: 'Electronics',
  isActive: true,
  stock: 10,
};

const mockOutOfStockReward: Reward = { ...mockReward, id: 'rew2', stock: 0, name: "Out of Stock Gadget"};
const mockInactiveReward: Reward = { ...mockReward, id: 'rew3', isActive: false, name: "Inactive Gadget"};


describe('RewardCard', () => {
  const mockOnRedeem = jest.fn();

  beforeEach(() => {
    mockOnRedeem.mockClear();
  });

  it('renders reward details correctly', () => {
    render(<RewardCard reward={mockReward} onRedeem={mockOnRedeem} />);

    expect(screen.getByAltText('Deluxe Gadget Pro')).toHaveAttribute('src', '/gadget.jpg');
    expect(screen.getByText('Deluxe Gadget Pro')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument(); // Category Badge
    expect(screen.getByText('1,500')).toBeInTheDocument(); // Killa amount
    // Check KLA symbol specifically, it's in a span next to the value
    const killaValueElement = screen.getByText('1,500');
    const klaUnitElement = killaValueElement.nextElementSibling;
    expect(klaUnitElement).toHaveTextContent('KLA');

    expect(screen.getByText('The latest and greatest gadget for all your needs.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Redeem/i })).toBeInTheDocument();
  });

  it('calls onRedeem with reward ID when Redeem button is clicked', () => {
    render(<RewardCard reward={mockReward} onRedeem={mockOnRedeem} />);
    const redeemButton = screen.getByRole('button', { name: /Redeem/i });
    fireEvent.click(redeemButton);
    expect(mockOnRedeem).toHaveBeenCalledWith('rew1');
  });

  it('disables Redeem button if isRedeemDisabled prop is true', () => {
    render(<RewardCard reward={mockReward} onRedeem={mockOnRedeem} isRedeemDisabled={true} />);
    expect(screen.getByRole('button', { name: /Redeem/i })).toBeDisabled();
  });

  it('disables Redeem button if reward stock is 0', () => {
    render(<RewardCard reward={mockOutOfStockReward} onRedeem={mockOnRedeem} />);
    expect(screen.getByRole('button', { name: /Redeem/i })).toBeDisabled();
    // Optionally, check for an "Out of stock" message if implemented in RewardCard
  });

  it('disables Redeem button if reward isActive is false', () => {
    render(<RewardCard reward={mockInactiveReward} onRedeem={mockOnRedeem} />);
    expect(screen.getByRole('button', { name: /Redeem/i })).toBeDisabled();
  });

  it('does not render description if not provided', () => {
    const rewardWithoutDesc: Reward = { ...mockReward, description: undefined };
    render(<RewardCard reward={rewardWithoutDesc} onRedeem={mockOnRedeem} />);
    expect(screen.queryByText('The latest and greatest gadget for all your needs.')).not.toBeInTheDocument();
  });

  it('does not render category badge if category is not provided', () => {
    const rewardWithoutCategory: Reward = { ...mockReward, category: undefined };
    render(<RewardCard reward={rewardWithoutCategory} onRedeem={mockOnRedeem} />);
    expect(screen.queryByText('Electronics')).not.toBeInTheDocument();
  });

  it('uses placeholder image if imageUrl is not provided', () => {
    const rewardWithoutImage: Reward = { ...mockReward, imageUrl: undefined };
    render(<RewardCard reward={rewardWithoutImage} onRedeem={mockOnRedeem} />);
    expect(screen.getByAltText(rewardWithoutImage.name)).toHaveAttribute('src', '/placeholder-image.jpg');
  });
});
