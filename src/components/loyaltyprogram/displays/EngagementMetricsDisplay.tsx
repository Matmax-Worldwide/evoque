// src/components/loyaltyprogram/displays/EngagementMetricsDisplay.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersIcon, ShoppingCartIcon, ZapIcon, PercentIcon, TrendingUpIcon } from 'lucide-react'; // Example icons

export interface EngagementMetricItem {
  id: string;
  label: string;
  value: string | number;
  unit?: string; // e.g., "%"
  icon?: React.ElementType; // LucideIcon or other
  description?: string; // Optional small description or change indicator
  iconBgColor?: string;
  iconTextColor?: string;
}

export interface EngagementMetricsData {
    activeUsers?: EngagementMetricItem; // Making individual metrics optional
    redemptionRate?: EngagementMetricItem;
    campaignParticipationRate?: EngagementMetricItem;
    // Add more metrics as needed, e.g., averageKillaPerUser, pointsEarnedVsSpentRatio
    // For now, these are the three main ones from the plan.
}


interface EngagementMetricsDisplayProps {
  metrics: EngagementMetricsData;
  isLoading?: boolean;
  title?: string;
  description?: string;
  gridCols?: string; // e.g. 'md:grid-cols-3'
}

const EngagementMetricsDisplay: React.FC<EngagementMetricsDisplayProps> = ({
  metrics,
  isLoading = false,
  title = "Key Engagement Metrics",
  description = "Overview of user interaction with the Killa Program.",
  gridCols = 'md:grid-cols-3', // Default to 3 columns on medium screens
}) => {

  const metricItems: EngagementMetricItem[] = Object.values(metrics).filter(Boolean) as EngagementMetricItem[];

  if (isLoading) {
    const skeletonCount = 3; // Default number of metrics to show skeletons for
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-1/2 mb-1" /> {/* Title */}
          <Skeleton className="h-4 w-3/4" /> {/* Description */}
        </CardHeader>
        <CardContent className={`grid grid-cols-1 ${gridCols} gap-4 md:gap-6 pt-4`}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <Card key={index} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-2/3" /> {/* Label */}
                <Skeleton className="h-6 w-6 rounded-sm" /> {/* Icon */}
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-1" /> {/* Value */}
                <Skeleton className="h-4 w-full" /> {/* Description */}
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (metricItems.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[150px] w-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-md">
            No engagement metrics available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className={`grid grid-cols-1 ${gridCols} gap-4 md:gap-6 pt-4`}>
        {metricItems.map((metric) => {
            const IconComponent = metric.icon || TrendingUpIcon; // Default icon
            return (
            <Card key={metric.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {metric.label}
                </CardTitle>
                <div className={`p-1.5 rounded-md ${metric.iconBgColor || 'bg-gray-100'}`}>
                    <IconComponent className={`h-5 w-5 ${metric.iconTextColor || 'text-gray-500'}`} />
                </div>
                </CardHeader>
                <CardContent>
                <div className="text-2xl font-bold text-gray-800">
                    {metric.value}
                    {metric.unit && <span className="text-xs font-normal ml-1">{metric.unit}</span>}
                </div>
                {metric.description && (
                    <p className="text-xs text-muted-foreground pt-1">{metric.description}</p>
                )}
                </CardContent>
            </Card>
            );
        })}
        </CardContent>
    </Card>
  );
};

export default EngagementMetricsDisplay;
