// src/components/loyaltyprogram/cards/CampaignCard.test.tsx
'use client';

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import CampaignCard from './CampaignCard';
import { Campaign } from '@/types/loyalty';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img src={props.src} alt={props.alt || ''} />,
}));

// Mock CountdownTimer
jest.mock('@/components/loyaltyprogram/common/CountdownTimer', () => ({
  __esModule: true,
  default: ({ targetDate, expiredText }: { targetDate: string | Date, expiredText: string }) => (
    <div data-testid="countdown-timer-mock">
      Counts down to: {new Date(targetDate).toISOString()}. Displays: {expiredText} when done.
    </div>
  ),
}));

const mockCampaign: Campaign = {
  id: 'camp1',
  name: 'Summer Killa Fest',
  description: 'Earn double Killa on all purchases this summer!',
  imageUrl: '/summer-fest.jpg',
  type: 'killa_multiplier',
  killaMultiplierValue: 2,
  startDate: new Date(Date.now() - 10 * 86400000).toISOString(), // Started 10 days ago
  endDate: new Date(Date.now() + 20 * 86400000).toISOString(), // Ends in 20 days
  isActive: true,
};

const bonusCampaign: Campaign = {
  id: 'camp-bonus',
  name: 'Signup Bonus Bonanza',
  description: 'Get extra Killa when you sign up new friends!',
  type: 'bonus_killa',
  bonusKillaAmount: 500,
  endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
  isActive: true,
};

const endedCampaign: Campaign = {
    ...mockCampaign,
    id: 'camp-ended',
    name: 'Winter Sale (Ended)',
    endDate: new Date(Date.now() - 1 * 86400000).toISOString(), // Ended yesterday
};

const upcomingCampaign: Campaign = {
    ...mockCampaign,
    id: 'camp-upcoming',
    name: 'Spring Fling (Upcoming)',
    startDate: new Date(Date.now() + 5 * 86400000).toISOString(), // Starts in 5 days
    endDate: new Date(Date.now() + 15 * 86400000).toISOString(),
};

const inactiveCampaign: Campaign = {
    ...mockCampaign,
    id: 'camp-inactive',
    name: 'Paused Campaign',
    isActive: false,
};


describe('CampaignCard', () => {
  it('renders campaign details correctly', () => {
    render(<CampaignCard campaign={mockCampaign} />);
    expect(screen.getByText('Summer Killa Fest')).toBeInTheDocument();
    expect(screen.getByText('Earn double Killa on all purchases this summer!')).toBeInTheDocument();
    const image = screen.getByAltText('Summer Killa Fest') as HTMLImageElement;
    expect(image.src).toContain('/summer-fest.jpg');
  });

  it('renders multiplier badge for killa_multiplier type', () => {
    render(<CampaignCard campaign={mockCampaign} />);
    expect(screen.getByText('2x KLA Multiplier')).toBeInTheDocument();
  });

  it('renders bonus badge for bonus_killa type', () => {
    render(<CampaignCard campaign={bonusCampaign} />);
    expect(screen.getByText('+500 KLA Bonus')).toBeInTheDocument();
  });

  it('renders CountdownTimer if endDate is provided and campaign is ongoing', () => {
    render(<CampaignCard campaign={mockCampaign} />);
    expect(screen.getByTestId('countdown-timer-mock')).toBeInTheDocument();
    expect(screen.getByText('Ends in:')).toBeInTheDocument();
  });

  it('renders CountdownTimer for startDate if campaign is upcoming', () => {
    render(<CampaignCard campaign={upcomingCampaign} />);
    expect(screen.getByTestId('countdown-timer-mock')).toBeInTheDocument();
    expect(screen.getByText('Starts in:')).toBeInTheDocument();
  });

  it('does not render CountdownTimer for endDate if campaign has ended', () => {
    render(<CampaignCard campaign={endedCampaign} />);
    expect(screen.queryByTestId('countdown-timer-mock')).not.toBeInTheDocument();
    expect(screen.queryByText('Ends in:')).not.toBeInTheDocument();
  });

  it('displays "Ended" status badge for ended campaigns', () => {
    render(<CampaignCard campaign={endedCampaign} />);
    expect(screen.getByText('Ended')).toBeInTheDocument();
  });

  it('displays "Upcoming" status badge for upcoming campaigns', () => {
    render(<CampaignCard campaign={upcomingCampaign} />);
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('displays "Inactive" status badge for inactive campaigns that are not ended/upcoming', () => {
    // Make sure it's not ended or upcoming for this test
    const currentlyActiveButPaused: Campaign = {
        ...inactiveCampaign,
        startDate: new Date(Date.now() - 86400000).toISOString(), // Started yesterday
        endDate: new Date(Date.now() + 86400000).toISOString(), // Ends tomorrow
    };
    render(<CampaignCard campaign={currentlyActiveButPaused} />);
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('View Details button is disabled for inactive campaigns', () => {
    render(<CampaignCard campaign={inactiveCampaign} />);
    expect(screen.getByRole('button', {name: /View Details/i})).toBeDisabled();
  });

  it('View Details button is disabled for ended campaigns', () => {
    render(<CampaignCard campaign={endedCampaign} />);
    expect(screen.getByRole('button', {name: /View Details/i})).toBeDisabled();
  });

  it('renders placeholder visual if no imageUrl is provided', () => {
    const noImageCampaign = { ...mockCampaign, imageUrl: undefined };
    render(<CampaignCard campaign={noImageCampaign} />);
    // Check for the placeholder, e.g., by looking for TagIcon's presence or a specific class
    // The placeholder is a div with a TagIcon SVG inside.
    const placeholderDiv = screen.getByRole('img', {hidden: true}); // The TagIcon is an img role by default from lucide
    expect(placeholderDiv.parentElement?.querySelector('svg.text-purple-300')).toBeInTheDocument();
  });
});
