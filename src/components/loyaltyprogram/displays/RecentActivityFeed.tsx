// src/components/loyaltyprogram/displays/RecentActivityFeed.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpCircleIcon, ArrowDownCircleIcon, GiftIcon, AlertCircleIcon, type LucideIcon } from 'lucide-react';
// ActivityFeedItem is now imported from types/loyalty
import { type ActivityFeedItem, type PointsTransactionType } from '@/types/loyalty';


interface RecentActivityFeedProps {
  activities: ActivityFeedItem[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  maxItems?: number;
}

const typeToIconMap: Record<PointsTransactionType, LucideIcon> = { // Used PointsTransactionType
  earn: ArrowUpCircleIcon,
  redeem: ArrowDownCircleIcon,
  bonus: GiftIcon,
  adjustment: AlertCircleIcon,
  other: AlertCircleIcon,
  transfer_in: ArrowUpCircleIcon, // Added
  transfer_out: ArrowDownCircleIcon, // Added
};

const typeToColorMap: Record<PointsTransactionType, string> = {
    earn: 'text-green-500',
    redeem: 'text-red-500',
    bonus: 'text-indigo-500',
    adjustment: 'text-yellow-600',
    other: 'text-gray-500',
    transfer_in: 'text-green-500', // Added
    transfer_out: 'text-red-500', // Added
};

const killaAmountToColor = (amount?: number): string => { // Renamed from pointsToColor
    if (amount === undefined) return 'text-gray-500';
    if (amount > 0) return 'text-green-600 font-semibold';
    if (amount < 0) return 'text-red-600 font-semibold';
    return 'text-gray-500';
}

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  title = "Recent Killa Activity", // Updated
  description = "Latest Killa transactions.", // Updated
  isLoading = false,
  maxItems = 5,
}) => {
  const displayedActivities = activities.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: maxItems }).map((_, index) => (
            <div key={index} className="flex items-center space-x-3 py-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!displayedActivities || displayedActivities.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-center py-6 text-gray-500">No recent Killa activity to display.</p> {/* Updated */}
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
      <CardContent>
        <ul className="divide-y divide-gray-200">
          {displayedActivities.map((activity) => {
            const IconComponent = activity.icon || (activity.type ? typeToIconMap[activity.type] : AlertCircleIcon);
            const iconColor = activity.type ? typeToColorMap[activity.type] : 'text-gray-500';
            return (
              <li key={activity.id} className="py-3 sm:py-4 hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`p-1.5 rounded-full bg-opacity-20 ${iconColor.replace('text-', 'bg-')}`}>
                     <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {new Date(activity.date as string).toLocaleDateString(undefined, { // Cast to string if Date object
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </p>
                  </div>
                  {typeof activity.killaAmount === 'number' && ( // Changed from points
                    <div className={`text-sm ${killaAmountToColor(activity.killaAmount)} whitespace-nowrap`}> {/* Updated */}
                      {activity.killaAmount > 0 ? '+' : ''}
                      {activity.killaAmount.toLocaleString()} KLA {/* Updated */}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {activities.length > maxItems && (
             <div className="pt-4 text-center">
                <a href="#" className="text-sm text-blue-600 hover:underline">
                    View all activity
                </a>
             </div>
        )}
      </CardContent>
    </Card>
  );
};
export default RecentActivityFeed;
