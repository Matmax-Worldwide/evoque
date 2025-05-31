// src/components/loyaltyprogram/displays/ActiveCampaignsList.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import ActiveCampaignsList from './ActiveCampaignsList';
import { Campaign } from '@/types/loyalty';

// Mock CampaignCard to simplify testing ActiveCampaignsList logic
jest.mock('@/components/loyaltyprogram/cards/CampaignCard', () => ({
  __esModule: true,
  default: ({ campaign }: { campaign: Campaign }) => (
    <div data-testid={`campaign-card-${campaign.id}`}>
      <h4>{campaign.name}</h4>
    </div>
  ),
}));

const mockCampaigns: Campaign[] = [
  { id: 'camp1', name: 'Summer Splash', description: 'Cool summer deals', isActive: true, type: 'killa_multiplier', killaMultiplierValue: 1.5 },
  { id: 'camp2', name: 'Winter Wonder', description: 'Warm winter offers', isActive: true, type: 'bonus_killa', bonusKillaAmount: 100 },
  { id: 'camp3', name: 'Spring Fling', description: 'Fresh spring savings', isActive: true, type: 'product_discount' },
];

describe('ActiveCampaignsList', () => {
  it('renders a list of CampaignCards', () => {
    render(<ActiveCampaignsList campaigns={mockCampaigns} />);
    expect(screen.getByTestId('campaign-card-camp1')).toBeInTheDocument();
    expect(screen.getByText('Summer Splash')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-card-camp2')).toBeInTheDocument();
    expect(screen.getByText('Winter Wonder')).toBeInTheDocument();
    expect(screen.getByTestId('campaign-card-camp3')).toBeInTheDocument();
    expect(screen.getByText('Spring Fling')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<ActiveCampaignsList campaigns={mockCampaigns} title="Current Promotions" />);
    expect(screen.getByText('Current Promotions')).toBeInTheDocument();
  });

  it('renders default empty state message when no campaigns are provided', () => {
    render(<ActiveCampaignsList campaigns={[]} />);
    expect(screen.getByText('No active campaigns at the moment. Check back soon!')).toBeInTheDocument();
  });

  it('renders custom empty state message when provided', () => {
    render(<ActiveCampaignsList campaigns={[]} emptyStateMessage="All quiet on the campaign front!" />);
    expect(screen.getByText('All quiet on the campaign front!')).toBeInTheDocument();
  });

  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(<ActiveCampaignsList campaigns={mockCampaigns} isLoading={true} />);
    // Check for multiple skeleton elements (e.g., based on the Card structure in skeleton)
    const skeletons = container.querySelectorAll('.overflow-hidden .animate-pulse'); // A bit generic, but targets CampaignCard-like skeletons
    expect(skeletons.length).toBeGreaterThan(0); // Expecting 3 card skeletons (3 * number of pulse elements per card skeleton)
    expect(screen.queryByText('Summer Splash')).not.toBeInTheDocument();
  });

  it('applies custom grid column classes', () => {
    const { container } = render(
      <ActiveCampaignsList campaigns={mockCampaigns} gridCols="sm:grid-cols-1 md:grid-cols-4" />
    );
    // The main div holding the grid
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('sm:grid-cols-1');
    expect(gridContainer).toHaveClass('md:grid-cols-4');
  });
});
