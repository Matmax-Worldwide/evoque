// src/components/loyaltyprogram/displays/QuickStatsGrid.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type LucideIcon } from 'lucide-react'; // Import LucideIcon type

export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  icon?: LucideIcon; // Optional: Lucide icon component
  unit?: string; // Optional: e.g., "pts", "%"
  bgColor?: string; // Optional: background color for the icon
  textColor?: string; // Optional: text color for the icon
}

interface QuickStatsGridProps {
  stats: StatItem[];
  isLoading?: boolean;
  gridCols?: string; // e.g., 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
}

const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({
  stats,
  isLoading = false,
  gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', // Default grid columns
}) => {
  if (isLoading) {
    return (
      <div className={`grid ${gridCols} gap-4 md:gap-6`}>
        {Array.from({ length: stats.length > 0 ? stats.length : 3 }).map((_, index) => (
          <Card key={index} className="shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-2/3" /> {/* Label */}
              <Skeleton className="h-6 w-6 rounded-sm" /> {/* Icon */}
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-1" /> {/* Value */}
              {/* <Skeleton className="h-4 w-full" /> Description or change - if any */}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No statistics available at the moment.
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} gap-4 md:gap-6`}>
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.id} className="shadow hover:shadow-lg transition-shadow duration-200 ease-in-out">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.label}
              </CardTitle>
              {IconComponent && (
                <div className={`p-2 rounded-md ${stat.bgColor || 'bg-gray-100'}`}>
                  <IconComponent className={`h-5 w-5 ${stat.textColor || 'text-gray-500'}`} />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-gray-800">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                {stat.unit && <span className="text-sm font-normal ml-1">{stat.unit}</span>}
              </div>
              {/* Optional: Add a description or comparison here if needed in the future */}
              {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default QuickStatsGrid;
