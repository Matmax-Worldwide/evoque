// src/components/loyaltyprogram/displays/EngagementMetricsDisplay.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import EngagementMetricsDisplay, { type EngagementMetricsData, type EngagementMetricItem } from './EngagementMetricsDisplay';
import { UsersIcon, ShoppingCartIcon, ZapIcon } from 'lucide-react';

const mockMetricsData: EngagementMetricsData = {
  activeUsers: {
    id: 'active-users',
    label: 'Active Users This Month',
    value: '1,250',
    icon: UsersIcon,
    description: '+15% from last month',
    iconBgColor: 'bg-blue-100',
    iconTextColor: 'text-blue-600',
  },
  redemptionRate: {
    id: 'redemption-rate',
    label: 'Redemption Rate',
    value: '25.5',
    unit: '%',
    icon: ShoppingCartIcon,
    description: 'Of available Killa',
    iconBgColor: 'bg-green-100',
    iconTextColor: 'text-green-600',
  },
  campaignParticipationRate: {
    id: 'campaign-participation',
    label: 'Campaign Participation',
    value: '60',
    unit: '%',
    icon: ZapIcon,
    description: 'Average across active campaigns',
    iconBgColor: 'bg-orange-100',
    iconTextColor: 'text-orange-600',
  },
};

const partialMockMetricsData: EngagementMetricsData = {
  activeUsers: {
    id: 'active-users',
    label: 'Active Users This Month',
    value: '1,250',
    icon: UsersIcon,
  }
};


describe('EngagementMetricsDisplay', () => {
  it('renders all provided metrics correctly', () => {
    render(<EngagementMetricsDisplay metrics={mockMetricsData} />);

    expect(screen.getByText('Active Users This Month')).toBeInTheDocument();
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByText('+15% from last month')).toBeInTheDocument();

    expect(screen.getByText('Redemption Rate')).toBeInTheDocument();
    expect(screen.getByText('25.5')).toBeInTheDocument();
    // Check for the '%' unit specifically. The value itself is '25.5'
    const redemptionRateValue = screen.getByText('25.5');
    expect(redemptionRateValue.nextElementSibling).toHaveTextContent('%');


    expect(screen.getByText('Campaign Participation')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    // Check for icons (conceptual - by checking their card is there)
    expect(screen.getByText('Active Users This Month').closest('div.shadow-sm')).toBeInTheDocument();
  });

  it('renders only provided metrics if some are missing', () => {
    render(<EngagementMetricsDisplay metrics={partialMockMetricsData} />);
    expect(screen.getByText('Active Users This Month')).toBeInTheDocument();
    expect(screen.queryByText('Redemption Rate')).not.toBeInTheDocument();
    expect(screen.queryByText('Campaign Participation')).not.toBeInTheDocument();
  });

  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(<EngagementMetricsDisplay metrics={{}} isLoading={true} />); // Pass empty metrics to trigger default skeleton count
    // Each skeleton card has multiple elements with .animate-pulse. We count the card containers.
    // The skeleton structure is Card > CardHeader (Skeleton, Skeleton) > CardContent (Skeleton, Skeleton)
    // We are looking for the individual metric card skeletons
    const metricCardSkeletons = container.querySelectorAll('div.shadow-sm'); // Each skeleton metric is a Card with shadow-sm
    expect(metricCardSkeletons.length).toBe(3); // Default skeletonCount is 3

    // Ensure actual data isn't visible
    expect(screen.queryByText('Active Users This Month')).not.toBeInTheDocument();
  });

  it('renders "No engagement metrics available" message when metrics object is effectively empty', () => {
    render(<EngagementMetricsDisplay metrics={{}} />); // Empty object
    expect(screen.getByText('No engagement metrics available.')).toBeInTheDocument();

    render(<EngagementMetricsDisplay metrics={{ activeUsers: undefined }} />); // Object with undefined metric
    expect(screen.getByText('No engagement metrics available.')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(<EngagementMetricsDisplay metrics={mockMetricsData} title="Loyalty Stats" description="Key performance indicators." />);
    expect(screen.getByText("Loyalty Stats")).toBeInTheDocument();
    expect(screen.getByText("Key performance indicators.")).toBeInTheDocument();
  });

  it('applies custom grid column classes', () => {
    const { container } = render(
      <EngagementMetricsDisplay metrics={mockMetricsData} gridCols="md:grid-cols-2" />
    );
    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('md:grid-cols-2');
    expect(gridContainer).not.toHaveClass('md:grid-cols-3'); // Default is 3
  });
});
