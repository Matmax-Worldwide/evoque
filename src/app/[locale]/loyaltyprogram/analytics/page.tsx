// src/app/[locale]/loyaltyprogram/analytics/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import KillaPointsChart from '@/components/loyaltyprogram/charts/KillaPointsChart';
import EngagementMetricsDisplay, { type EngagementMetricsData, type EngagementMetricItem } from '@/components/loyaltyprogram/displays/EngagementMetricsDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group" // For time range filter
import { Label } from '@/components/ui/label'; // Import Label
import { RefreshCwIcon, UsersIcon, ShoppingCartIcon, ZapIcon, LineChartIcon } from 'lucide-react';

// Define ChartDataItem locally if not exported from KillaPointsChart or types
interface ChartDataItem {
  date: string; // "YYYY-MM-DD" for daily, "YYYY-MM" or "MMM YY" for monthly/yearly summaries
  earned: number;
  spent: number;
}

type TimeRange = '7d' | '30d' | '90d' | '12m'; // 7 days, 30 days, 90 days, 12 months

// Mock data generation functions
const generateChartData = (timeRange: TimeRange): ChartDataItem[] => {
  const now = new Date();
  let dataPoints = 7;
  let dateFormat: 'day' | 'week' | 'month' = 'day'; // Added 'week'

  switch (timeRange) {
    case '7d': dataPoints = 7; dateFormat = 'day'; break;
    case '30d': dataPoints = 30; dateFormat = 'day'; break;
    case '90d': dataPoints = 13; dateFormat = 'week'; break; // Approx 13 weeks in 90 days for better labeling
    case '12m': dataPoints = 12; dateFormat = 'month'; break;
  }

  return Array.from({ length: dataPoints }, (_, i) => {
    const date = new Date();
    if (dateFormat === 'day') date.setDate(now.getDate() - (dataPoints - 1 - i));
    if (dateFormat === 'week') date.setDate(now.getDate() - (dataPoints - 1 - i) * 7);
    if (dateFormat === 'month') {
        // Ensure month calculation correctly handles year rollovers
        let currentMonth = now.getMonth() - (dataPoints - 1 - i);
        let currentYear = now.getFullYear();
        date.setFullYear(currentYear, currentMonth, 1); // Set to first day of the month
    }

    let dateLabel: string;
    if (dateFormat === 'day') dateLabel = date.toISOString().split('T')[0]; // YYYY-MM-DD
    else if (dateFormat === 'week') dateLabel = `W${ Math.floor(i + (52 - dataPoints + 1)) % 52 || 52}`; // Simple week label W1, W2...
    else dateLabel = `${date.toLocaleString('default', { month: 'short' })} '${String(date.getFullYear()).slice(-2)}`; // MMM YY

    return {
      date: dateLabel,
      earned: Math.floor(Math.random() * 500) + (dateFormat === 'month' ? 2000 : (dateFormat === 'week' ? 500 : 50)),
      spent: Math.floor(Math.random() * 300) + (dateFormat === 'month' ? 1000 : (dateFormat === 'week' ? 200 : 20)),
    };
  });
};

const generateEngagementMetrics = (timeRange: TimeRange): EngagementMetricsData => {
  // Metrics might change based on time range, or be overall
  return {
    activeUsers: { id: 'active', label: 'Active Users', value: (Math.floor(Math.random() * 500) + 1000).toLocaleString(), icon: UsersIcon, description: `In selected period` },
    redemptionRate: { id: 'redeem-rate', label: 'Redemption Rate', value: (Math.random() * 30 + 10).toFixed(1), unit: '%', icon: ShoppingCartIcon, description: 'Killa spent vs earned' },
    campaignParticipationRate: { id: 'camp-participate', label: 'Campaign Participation', value: (Math.random() * 50 + 20).toFixed(1), unit: '%', icon: ZapIcon, description: 'Users in campaigns' },
  };
};


export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('30d');
  const [killaChartData, setKillaChartData] = useState<ChartDataItem[]>([]);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetricsData>({});

  const fetchAnalyticsData = useCallback(async (timeRange: TimeRange) => {
    setIsLoading(true);
    console.log(`Fetching analytics data for time range: ${timeRange}`);
    await new Promise(resolve => setTimeout(resolve, 750)); // Simulate API delay

    setKillaChartData(generateChartData(timeRange));
    setEngagementMetrics(generateEngagementMetrics(timeRange));

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalyticsData(selectedTimeRange);
  }, [selectedTimeRange, fetchAnalyticsData]);

  const handleTimeRangeChange = (value: string) => {
    if (value && ['7d', '30d', '90d', '12m'].includes(value)) {
      setSelectedTimeRange(value as TimeRange);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Killa Program Analytics</h1>
            <p className="text-gray-500">Insights into your loyalty program's performance.</p>
        </div>
        <Button variant="outline" onClick={() => fetchAnalyticsData(selectedTimeRange)} disabled={isLoading}>
          <RefreshCwIcon className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Time Range Filter */}
      <Card>
        <CardContent className="p-4 flex items-center space-x-3"> {/* Added flex and items-center */}
            <Label htmlFor="time-range-toggle" className="text-sm font-medium text-gray-700 whitespace-nowrap">Select Time Range:</Label> {/* Added whitespace-nowrap */}
            <ToggleGroup
                type="single"
                defaultValue={selectedTimeRange}
                onValueChange={handleTimeRangeChange}
                aria-label="Time range for analytics"
                id="time-range-toggle"
                className="flex-wrap sm:flex-nowrap" // Allow wrapping on small screens
            >
                <ToggleGroupItem value="7d" aria-label="Last 7 days">7D</ToggleGroupItem>
                <ToggleGroupItem value="30d" aria-label="Last 30 days">30D</ToggleGroupItem>
                <ToggleGroupItem value="90d" aria-label="Last 90 days">90D</ToggleGroupItem>
                <ToggleGroupItem value="12m" aria-label="Last 12 months">12M</ToggleGroupItem>
            </ToggleGroup>
        </CardContent>
      </Card>

      {/* Killa Points Chart Section */}
      <KillaPointsChart
        data={killaChartData}
        isLoading={isLoading}
        title="Killa Earned vs. Spent"
        description={`Showing data for the last ${selectedTimeRange.replace('d', ' days').replace('m', ' months')}`}
      />

      {/* Engagement Metrics Section */}
      <EngagementMetricsDisplay
        metrics={engagementMetrics}
        isLoading={isLoading}
        title="Key Engagement Metrics"
        description={`Overview for the last ${selectedTimeRange.replace('d', ' days').replace('m', ' months')}`}
        gridCols="sm:grid-cols-1 md:grid-cols-3"
      />

      {/* Placeholder for more advanced charts like ROI, Predictive Insights */}
      <Card className="shadow-md opacity-70">
        <CardHeader>
          <div className="flex items-center">
            <LineChartIcon className="h-6 w-6 mr-3 text-gray-400" />
            <div>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>ROI Calculators & Predictive Insights</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 italic">Coming Soon: Deeper insights including ROI and predictive analytics.</p>
        </CardContent>
      </Card>

    </div>
  );
}
