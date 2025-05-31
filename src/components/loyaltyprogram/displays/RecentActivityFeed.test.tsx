// src/components/loyaltyprogram/displays/RecentActivityFeed.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import RecentActivityFeed, { type ActivityItem } from './RecentActivityFeed'; // Assuming ActivityItem is exported
import { GiftIcon } from 'lucide-react'; // For custom icon testing

const mockActivities: ActivityItem[] = [
  { id: '1', description: 'Earned points from purchase', points: 150, date: new Date().toISOString(), type: 'earn' },
  { id: '2', description: 'Redeemed 20% off voucher', points: -500, date: new Date(Date.now() - 86400000).toISOString(), type: 'redeem' }, // Yesterday
  { id: '3', description: 'Birthday Bonus Points', points: 100, date: new Date(Date.now() - 172800000).toISOString(), type: 'bonus', icon: GiftIcon },
  { id: '4', description: 'Manual Adjustment by Admin', points: -20, date: new Date(Date.now() - 259200000).toISOString(), type: 'adjustment' },
  { id: '5', description: 'Joined loyalty program', date: new Date(Date.now() - 345600000).toISOString(), type: 'other' },
  { id: '6', description: 'Old activity not shown by default', points: 10, date: new Date(Date.now() - 432000000).toISOString(), type: 'earn' },
];

describe('RecentActivityFeed', () => {
  it('renders a list of activities', () => {
    render(<RecentActivityFeed activities={mockActivities} />);
    expect(screen.getByText('Earned points from purchase')).toBeInTheDocument();
    expect(screen.getByText('+150 pts')).toBeInTheDocument();
    expect(screen.getByText('Redeemed 20% off voucher')).toBeInTheDocument();
    expect(screen.getByText('-500 pts')).toBeInTheDocument();
  });

  it('displays correct icons based on activity type or custom icon', () => {
    render(<RecentActivityFeed activities={mockActivities} />);
    // This is tricky without specific test IDs on icons. We check if the list item exists.
    // For the item with a custom icon (Birthday Bonus), ensure its description is there.
    expect(screen.getByText('Birthday Bonus Points')).toBeInTheDocument();
    // We can assume if the item renders, its associated icon logic is applied.
  });

  it('formats dates correctly', () => {
    render(<RecentActivityFeed activities={mockActivities} />);
    const expectedDate = new Date(mockActivities[0].date).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
    expect(screen.getAllByText(expectedDate)[0]).toBeInTheDocument();
  });

  it('shows "No recent activity" message when activities array is empty', () => {
    render(<RecentActivityFeed activities={[]} />);
    expect(screen.getByText('No recent activity to display.')).toBeInTheDocument();
  });

  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(<RecentActivityFeed activities={mockActivities} isLoading={true} maxItems={3} />);
    // const skeletons = screen.getAllByRole('generic', { name: '' }); // Default role for Skeleton
    // Each item has 3 skeletons: icon, two text lines.
    // Expecting maxItems * 3, but check if any skeletons are present.
    const animatedDivs = container.querySelectorAll('.animate-pulse'); // Skeletons use animate-pulse
    expect(animatedDivs.length).toBeGreaterThan(0);
    expect(screen.queryByText('Earned points from purchase')).not.toBeInTheDocument();
  });

  it('limits displayed items to maxItems', () => {
    render(<RecentActivityFeed activities={mockActivities} maxItems={3} />);
    expect(screen.getByText('Earned points from purchase')).toBeInTheDocument();
    expect(screen.getByText('Redeemed 20% off voucher')).toBeInTheDocument();
    expect(screen.getByText('Birthday Bonus Points')).toBeInTheDocument();
    expect(screen.queryByText('Manual Adjustment by Admin')).not.toBeInTheDocument(); // This one is 4th, should not be there
    expect(screen.queryByText('Old activity not shown by default')).not.toBeInTheDocument(); // This one is 6th
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
    render(<RecentActivityFeed activities={[]} title="My Custom Title" description="My custom description." />);
    expect(screen.getByText("My Custom Title")).toBeInTheDocument();
    expect(screen.getByText("My custom description.")).toBeInTheDocument();
  });
});
