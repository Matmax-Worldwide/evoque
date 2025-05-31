// src/components/loyaltyprogram/charts/KillaPointsChart.tsx
'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps, // For custom tooltip
} from 'recharts';
import { format, parseISO } from 'date-fns'; // For date formatting
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ChartDataItem {
  date: string; // Expects date strings like "YYYY-MM-DD" or "YYYY-MM" or "MMM YY" etc.
  earned: number;
  spent: number;
}

interface KillaPointsChartProps {
  data: ChartDataItem[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  // timeRange?: 'week' | 'month' | 'year'; // For future filtering logic, not used in chart rendering directly yet
  xAxisDataKey?: keyof ChartDataItem; // Default 'date'
  line1DataKey?: keyof ChartDataItem; // Default 'earned'
  line2DataKey?: keyof ChartDataItem; // Default 'spent'
  line1Name?: string; // Default 'Killa Earned'
  line2Name?: string; // Default 'Killa Spent'
  line1Color?: string; // Default '#82ca9d' (greenish)
  line2Color?: string; // Default '#8884d8' (purplish)
}

// Custom Tooltip for better display
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    // Attempt to format label if it's a date string
    let formattedLabel = label;
    try {
        // Assuming label might be "YYYY-MM-DD" or similar that parseISO can handle
        // Or it could be pre-formatted like "MMM YY"
        if (label && label.match(/^\d{4}-\d{2}-\d{2}/)) { // Basic check for YYYY-MM-DD
             formattedLabel = format(parseISO(label), 'MMM d, yyyy');
        } else if (label && label.match(/^\d{4}-\d{2}$/)) { // Basic check for YYYY-MM
             formattedLabel = format(parseISO(label + '-01'), 'MMM yyyy'); // Add day for parsing
        }
    } catch (e) {
        // If formatting fails, use label as is
    }

    return (
      <div className="bg-white p-3 shadow-lg rounded-md border border-gray-200">
        <p className="font-semibold text-gray-700">{formattedLabel}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value?.toLocaleString()} KLA`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const KillaPointsChart: React.FC<KillaPointsChartProps> = ({
  data,
  title = "Killa Activity Over Time",
  description = "Track your Killa earning and spending trends.",
  isLoading = false,
  xAxisDataKey = 'date',
  line1DataKey = 'earned',
  line2DataKey = 'spent',
  line1Name = "Killa Earned",
  line2Name = "Killa Spent",
  line1Color = "#22c55e", // Green 500
  line2Color = "#ef4444", // Red 500
}) => {

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-1" /> {/* Title */}
          <Skeleton className="h-4 w-1/2" /> {/* Description */}
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="h-[300px] w-full" /> {/* Chart Area */}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
         <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[300px] w-full flex items-center justify-center text-gray-500">
                    No data available to display the chart.
                </div>
            </CardContent>
        </Card>
    );
  }

  // Formatter for XAxis ticks - attempts to make dates more readable
  const xAxisTickFormatter = (tick: string) => {
    try {
        // Assuming tick is "YYYY-MM-DD" or "YYYY-MM"
        if (tick && tick.match(/^\d{4}-\d{2}-\d{2}/)) {
             return format(parseISO(tick), 'MMM d');
        } else if (tick && tick.match(/^\d{4}-\d{2}$/)) {
             return format(parseISO(tick + '-01'), 'MMM yy');
        }
        return tick; // Fallback for other formats like "Jan", "Feb"
    } catch (e) {
        return tick; // If parsing fails, return original tick
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}> {/* Adjusted left margin for YAxis */}
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
                dataKey={xAxisDataKey as string}
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={xAxisTickFormatter}
            />
            <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toLocaleString()}`}
                allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "14px", paddingTop: "10px" }} />
            <Line
              type="monotone"
              dataKey={line1DataKey as string}
              name={line1Name}
              stroke={line1Color}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 1, fill: line1Color }}
              activeDot={{ r: 6, strokeWidth: 1, fill: line1Color }}
            />
            <Line
              type="monotone"
              dataKey={line2DataKey as string}
              name={line2Name}
              stroke={line2Color}
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 1, fill: line2Color }}
              activeDot={{ r: 6, strokeWidth: 1, fill: line2Color }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default KillaPointsChart;
