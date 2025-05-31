// src/components/loyaltyprogram/displays/TierProgressBar.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TrophyIcon, ShieldCheckIcon } from 'lucide-react';
// TierProgressDisplayInfo is now imported from types/loyalty
import { type TierProgressDisplayInfo } from '@/types/loyalty';


interface TierProgressBarProps extends TierProgressDisplayInfo { // Extended from imported type
  isLoading?: boolean;
  title?: string;
  description?: string;
}

const TierProgressBar: React.FC<TierProgressBarProps> = ({
  currentTierName,
  nextTierName,
  currentKillaInTier, // Changed
  killaNeededForNextTier, // Changed
  isLoading = false,
  title = "Your Tier Progress",
  description,
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-1" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-3 pt-2">
          <Skeleton className="h-4 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = killaNeededForNextTier > 0
    ? Math.min(Math.max((currentKillaInTier / killaNeededForNextTier) * 100, 0), 100)
    : 100;

  const killaToNext = Math.max(0, killaNeededForNextTier - currentKillaInTier); // Changed

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

        {killaNeededForNextTier > 0 || currentKillaInTier > 0 ? (
            <Progress value={progressPercentage} className="w-full h-3 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-600" />
        ) : (
            <div className="text-center text-sm text-gray-500 py-2">
                {currentTierName ? `You are at the highest tier: ${currentTierName}!` : "Tier information not available."}
            </div>
        )}

        {killaNeededForNextTier > 0 && killaToNext > 0 && nextTierName && (
          <p className="text-sm text-center text-gray-700">
            You need <span className="font-bold text-purple-600">{killaToNext.toLocaleString()}</span> more KLA to reach {nextTierName}. {/* Updated */}
          </p>
        )}
        {killaNeededForNextTier > 0 && killaToNext === 0 && nextTierName && (
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
