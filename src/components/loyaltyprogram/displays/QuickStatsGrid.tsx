// src/components/loyaltyprogram/displays/QuickStatsGrid.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
// StatDisplayItem is now imported from types/loyalty
import { type StatDisplayItem } from '@/types/loyalty';
import { type LucideIcon } from 'lucide-react';


interface QuickStatsGridProps {
  stats: StatDisplayItem[]; // Uses updated type
  isLoading?: boolean;
  gridCols?: string;
}

const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({
  stats,
  isLoading = false,
  gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}) => {
  if (isLoading) {
    return (
      <div className={`grid ${gridCols} gap-4 md:gap-6`}>
        {Array.from({ length: stats.length > 0 ? stats.length : 3 }).map((_, index) => (
          <Card key={index} className="shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-6 w-6 rounded-sm" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-1" />
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
                {/* Unit will now be "KLA" if passed from page.tsx for Killa stats */}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
export default QuickStatsGrid;
