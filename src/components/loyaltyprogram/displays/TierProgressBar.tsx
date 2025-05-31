// src/components/loyaltyprogram/displays/TierProgressBar.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Assuming a Progress component exists
import { Skeleton } from '@/components/ui/skeleton';
import { TrophyIcon, ShieldCheckIcon } from 'lucide-react'; // Example icons

export interface TierProgressBarProps {
  currentTierName?: string;
  nextTierName?: string;
  currentPointsInTier: number; // Points accumulated *within* the current tier range
  pointsNeededForNextTier: number; // Total points from current tier's start to reach next tier
                                  // (i.e., nextTierStartPoints - currentTierStartPoints)
  isLoading?: boolean;
  title?: string;
  description?: string;
}

const TierProgressBar: React.FC<TierProgressBarProps> = ({
  currentTierName,
  nextTierName,
  currentPointsInTier,
  pointsNeededForNextTier,
  isLoading = false,
  title = "Your Tier Progress",
  description,
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-1" /> {/* Title */}
          <Skeleton className="h-4 w-1/2" /> {/* Description */}
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full" /> {/* Progress bar */}
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-4 w-2/3" /> {/* Points needed text */}
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = pointsNeededForNextTier > 0
    ? Math.min(Math.max((currentPointsInTier / pointsNeededForNextTier) * 100, 0), 100)
    : 100; // If no points needed (e.g., top tier), show 100% or handle differently

  const pointsToNext = Math.max(0, pointsNeededForNextTier - currentPointsInTier);

  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
            {currentTierName && <ShieldCheckIcon className="h-6 w-6 text-indigo-500" />}
        </div>
        {description && <CardDescription className="mt-1">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {currentTierName && (
          <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
            <span>Current Tier: <span className="font-bold text-indigo-600">{currentTierName}</span></span>
            {nextTierName && <span>Next Tier: <span className="font-bold text-purple-600">{nextTierName}</span></span>}
          </div>
        )}

        {pointsNeededForNextTier > 0 || currentPointsInTier > 0 ? (
            <Progress value={progressPercentage} className="w-full h-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-600" />
        ) : (
            <div className="text-center text-sm text-gray-500 py-2">
                {currentTierName ? `You are at the highest tier: ${currentTierName}!` : "Tier information not available."}
            </div>
        )}


        {pointsNeededForNextTier > 0 && pointsToNext > 0 && nextTierName && (
          <p className="text-sm text-center text-gray-700">
            You need <span className="font-bold text-purple-600">{pointsToNext.toLocaleString()}</span> more points to reach {nextTierName}.
          </p>
        )}
        {pointsNeededForNextTier > 0 && pointsToNext === 0 && nextTierName && (
          <p className="text-sm text-center text-green-600 font-semibold flex items-center justify-center">
            <TrophyIcon className="h-5 w-5 mr-2"/> Congratulations! You've reached {nextTierName}!
          </p>
        )}
         {!nextTierName && currentTierName && (
             <p className="text-sm text-center text-indigo-600 font-semibold">
                You're doing great in the {currentTierName} tier!
             </p>
         )}
      </CardContent>
    </Card>
  );
};

export default TierProgressBar;
