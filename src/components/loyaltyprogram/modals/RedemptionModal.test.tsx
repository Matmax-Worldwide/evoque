// src/components/loyaltyprogram/modals/RedemptionModal.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RedemptionModal from './RedemptionModal';
import { Reward } from '@/types/loyalty';

const mockReward: Reward = {
  id: 'rew100',
  name: 'Super Cool Gadget',
  description: 'A gadget that does super cool things.',
  killaRequired: 750,
  category: 'Gadgets',
  isActive: true, // Ensure isActive is true for redeem button to be enabled by default
  // stock is not explicitly set, so it's undefined, meaning effectively infinite/not a factor for disabling
};

describe('RedemptionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirmRedemption = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirmRedemption.mockClear();
  });

  it('does not render if isOpen is false', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={false}
        onClose={mockOnClose}
        onConfirmRedemption={mockOnConfirmRedemption}
      />
    );
    // Check for a role that AlertDialogContent would typically have.
    // If it's not specific, query for a more generic role or text.
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('does not render if reward is null', () => {
    render(
      <RedemptionModal
        reward={null}
        isOpen={true}
        onClose={mockOnClose}
        onConfirmRedemption={mockOnConfirmRedemption}
      />
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renders correctly when open and reward is provided', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirmRedemption={mockOnConfirmRedemption}
      />
    );

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Confirm Reward Redemption')).toBeInTheDocument(); // AlertDialogTitle
    expect(screen.getByText(mockReward.name)).toBeInTheDocument();
    expect(screen.getByText(/A gadget that does super cool things./i)).toBeInTheDocument();
    expect(screen.getByText(`Cost: ${mockReward.killaRequired.toLocaleString()} KLA`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm Redemption' })).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirmRedemption={mockOnConfirmRedemption}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirmRedemption with reward ID when Confirm Redemption button is clicked', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirmRedemption={mockOnConfirmRedemption}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Redemption' }));
    expect(mockOnConfirmRedemption).toHaveBeenCalledWith(mockReward.id);
  });

  it('shows loading state and disables buttons when isRedeeming is true', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirmRedemption={mockOnConfirmRedemption}
        isRedeeming={true}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirming.../i });
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();
    // Check for spinning icon more reliably
    const icon = confirmButton.querySelector('svg.animate-spin');
    expect(icon).toBeInTheDocument();


    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('does not call onConfirmRedemption if confirm is clicked while isRedeeming is true', () => {
    render(
      <RedemptionModal
        reward={mockReward}
        isOpen={true}
        onClose={mockOnClose}
        onConfirmRedemption={mockOnConfirmRedemption}
        isRedeeming={true}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Confirming.../i }));
    expect(mockOnConfirmRedemption).not.toHaveBeenCalled();
  });
});
