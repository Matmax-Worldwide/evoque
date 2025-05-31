// src/components/loyaltyprogram/charts/KillaPointsChart.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import KillaPointsChart from './KillaPointsChart';

// Mock Recharts ResponsiveContainer as it causes issues in JSDOM
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container-mock" style={{ width: '100%', height: '300px' }}>
        {children}
      </div>
    ),
  };
});

const mockData = [
  { date: '2023-01-01', earned: 100, spent: 50 },
  { date: '2023-01-02', earned: 150, spent: 70 },
  { date: '2023-01-03', earned: 120, spent: 60 },
];

const monthlyMockData = [
  { date: 'Jan 23', earned: 1000, spent: 500 }, // Assuming pre-formatted date for XAxis
  { date: 'Feb 23', earned: 1200, spent: 600 },
  { date: 'Mar 23', earned: 900, spent: 550 },
];


describe('KillaPointsChart', () => {
  it('renders the chart container and title/description', () => {
    render(<KillaPointsChart data={mockData} title="My Killa Stats" description="Jan activity" />);
    expect(screen.getByText('My Killa Stats')).toBeInTheDocument();
    expect(screen.getByText('Jan activity')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container-mock')).toBeInTheDocument();
  });

  it('renders loading skeleton when isLoading is true', () => {
    const { container } = render(<KillaPointsChart data={[]} isLoading={true} />);
    // Check for skeleton structure
    expect(container.querySelector('.h-6.w-3\\/4.mb-1')).toBeInTheDocument(); // Title skeleton
    expect(container.querySelector('.h-4.w-1\\/2')).toBeInTheDocument(); // Description skeleton
    expect(container.querySelector('.h-\\[300px\\].w-full')).toBeInTheDocument(); // Chart area skeleton
    expect(screen.queryByTestId('responsive-container-mock')).not.toBeInTheDocument(); // Chart itself not rendered
  });

  it('renders "No data available" message when data is empty', () => {
    render(<KillaPointsChart data={[]} />);
    expect(screen.getByText('No data available to display the chart.')).toBeInTheDocument();
  });

  // Testing the actual chart rendering (lines, points, axes) with Recharts in JSDOM is complex
  // and often not very reliable. We usually focus on whether the chart component is called
  // with the right data, or if key structural elements from Recharts are present.
  it('passes data to the chart (conceptual check via ResponsiveContainer)', () => {
    render(<KillaPointsChart data={mockData} />);
    // Check that ResponsiveContainer (mocked) is there, implying LineChart would receive data.
    expect(screen.getByTestId('responsive-container-mock')).toBeInTheDocument();
    // We could also check for Legend items if they are simple text
    expect(screen.getByText('Killa Earned')).toBeInTheDocument();
    expect(screen.getByText('Killa Spent')).toBeInTheDocument();
  });

  it('uses custom line names and colors if provided', () => {
    render(
      <KillaPointsChart
        data={mockData}
        line1Name="Gained"
        line2Name="Used"
        line1Color="blue"
        line2Color="orange"
      />
    );
    expect(screen.getByText('Gained')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
    // Verifying colors directly is hard without inspecting SVG attributes.
    // This test mainly ensures names are passed to Legend.
  });

  it('formats X-axis ticks for monthly data (conceptual)', () => {
    // This test relies on the mock of ResponsiveContainer and the LineChart structure
    // to ensure the component attempts to render with the formatted data.
    // Direct assertion of formatted ticks is complex with current mocking.
    render(<KillaPointsChart data={monthlyMockData} />);
    // If 'Jan 23' etc. are passed as dataKey 'date', the formatter should try to use them.
    // We can check if the XAxis is rendered (which is part of the mocked structure).
    // A more specific test would involve a deeper mock or snapshot testing.
    expect(screen.getByText('Killa Earned')).toBeInTheDocument(); // Confirms chart is trying to render
  });
});
