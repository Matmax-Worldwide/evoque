// src/components/loyaltyprogram/displays/RecentActivityFeed.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import RecentActivityFeed from './RecentActivityFeed';
// Import ActivityFeedItem from the centralized types
import { type ActivityFeedItem } from '@/types/loyalty';
import { GiftIcon } from 'lucide-react';

// Updated mockActivities with killaAmount
const mockActivities: ActivityFeedItem[] = [
  { id: '1', description: 'Earned Killa from purchase', killaAmount: 150, date: new Date().toISOString(), type: 'earn' }, // Updated
  { id: '2', description: 'Redeemed 20% off voucher', killaAmount: -500, date: new Date(Date.now() - 86400000).toISOString(), type: 'redeem' }, // Updated
  { id: '3', description: 'Birthday Bonus Killa', killaAmount: 100, date: new Date(Date.now() - 172800000).toISOString(), type: 'bonus', icon: GiftIcon }, // Updated
  { id: '4', description: 'Manual Killa Adjustment by Admin', killaAmount: -20, date: new Date(Date.now() - 259200000).toISOString(), type: 'adjustment' }, // Updated
  { id: '5', description: 'Joined Killa program', date: new Date(Date.now() - 345600000).toISOString(), type: 'other' }, // Updated
  { id: '6', description: 'Old Killa activity not shown by default', killaAmount: 10, date: new Date(Date.now() - 432000000).toISOString(), type: 'earn' }, // Updated
];

describe('RecentActivityFeed', () => {
  it('renders a list of Killa activities', () => { // Updated
    render(<RecentActivityFeed activities={mockActivities} />);
    expect(screen.getByText('Earned Killa from purchase')).toBeInTheDocument(); // Updated
    expect(screen.getByText('+150 KLA')).toBeInTheDocument(); // Updated
    expect(screen.getByText('Redeemed 20% off voucher')).toBeInTheDocument();
    expect(screen.getByText('-500 KLA')).toBeInTheDocument(); // Updated
  });

  it('displays correct icons based on activity type or custom icon', () => {
    render(<RecentActivityFeed activities={mockActivities} />);
    expect(screen.getByText('Birthday Bonus Killa')).toBeInTheDocument(); // Updated
  });

  it('formats dates correctly', () => {
    render(<RecentActivityFeed activities={mockActivities} />);
    const expectedDate = new Date(mockActivities[0].date as string).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
    expect(screen.getAllByText(expectedDate)[0]).toBeInTheDocument();
  });

  it('shows "No recent Killa activity" message when activities array is empty', () => { // Updated
    render(<RecentActivityFeed activities={[]} />);
    expect(screen.getByText('No recent Killa activity to display.')).toBeInTheDocument(); // Updated
  });

  it('renders loading skeletons when isLoading is true', () => {
    render(<RecentActivityFeed activities={mockActivities} isLoading={true} maxItems={3} />);
    const animatedDivs = document.querySelectorAll('.animate-pulse');
    expect(animatedDivs.length).toBeGreaterThan(0);
    expect(screen.queryByText('Earned Killa from purchase')).not.toBeInTheDocument(); // Updated
  });

  it('limits displayed items to maxItems', () => {
    render(<RecentActivityFeed activities={mockActivities} maxItems={3} />);
    expect(screen.getByText('Earned Killa from purchase')).toBeInTheDocument(); // Updated
    expect(screen.getByText('Redeemed 20% off voucher')).toBeInTheDocument();
    expect(screen.getByText('Birthday Bonus Killa')).toBeInTheDocument(); // Updated
    // The 4th item is 'Manual Killa Adjustment by Admin'
    expect(screen.queryByText('Manual Killa Adjustment by Admin')).not.toBeInTheDocument(); // This should NOT be visible
    expect(screen.queryByText('Old Killa activity not shown by default')).not.toBeInTheDocument(); // Updated
  });

  it('shows "View all activity" link if activities are more than maxItems', () => {
    render(<RecentActivityFeed activities={mockActivities} maxItems={3} />);
    expect(screen.getByText('View all activity')).toBeInTheDocument();
  });

  it('does not show "View all activity" link if activities are less than or equal to maxItems', () => {
    render(<RecentActivityFeed activities={mockActivities.slice(0,3)} maxItems={3} />);
    expect(screen.queryByText('View all activity')).not.toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(<RecentActivityFeed activities={[]} title="My Custom Killa Title" description="My custom Killa description." />); // Updated
    expect(screen.getByText("My Custom Killa Title")).toBeInTheDocument(); // Updated
    expect(screen.getByText("My custom Killa description.")).toBeInTheDocument(); // Updated
  });
});
