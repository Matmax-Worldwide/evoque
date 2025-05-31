// src/components/loyaltyprogram/displays/NextTierTeaser.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress'; // Optional: if showing mini progress
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRightCircleIcon, GiftIcon, ZapIcon } from 'lucide-react'; // Example icons

interface NextTierTeaserProps {
  nextTierName: string;
  killaNeeded: number; // Killa still needed to reach the next tier
  currentKillaProgress?: number; // Killa accumulated within the current tier's span towards next tier
  totalKillaForNextTierRange?: number; // Total Killa span of the current tier (NextTierMinKilla - CurrentTierMinKilla)
  nextTierBenefitHighlight?: string;
  isLoading?: boolean;
  title?: string;
}

const NextTierTeaser: React.FC<NextTierTeaserProps> = ({
  nextTierName,
  killaNeeded,
  currentKillaProgress,
  totalKillaForNextTierRange,
  nextTierBenefitHighlight,
  isLoading = false,
  title,
}) => {
  const displayTitle = title || `Almost there! Reach ${nextTierName} Tier`;

  let progressPercentage: number | undefined = undefined;
  if (typeof currentKillaProgress === 'number' && typeof totalKillaForNextTierRange === 'number' && totalKillaForNextTierRange > 0) {
    progressPercentage = Math.min(Math.max((currentKillaProgress / totalKillaForNextTierRange) * 100, 0), 100);
  }


  if (isLoading) {
    return (
      <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-1" /> {/* Title */}
          <Skeleton className="h-4 w-1/2" /> {/* Killa Needed */}
        </CardHeader>
        <CardContent className="space-y-2 p-5"> {/* Added p-5 for consistency with non-loading state */}
          {totalKillaForNextTierRange && <Skeleton className="h-3 w-full rounded-full" />} {/* Progress Bar */}
          <Skeleton className="h-4 w-2/3" /> {/* Benefit Highlight */}
        </CardContent>
      </Card>
    );
  }

  if (!nextTierName || (typeof killaNeeded === 'number' && killaNeeded <= 0)) {
    // If no next tier, or killaNeeded is 0 or less (meaning tier is reached or surpassed)
    // This component might not be rendered by parent logic, but handle gracefully.
    return (
         <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 text-center p-6 rounded-lg">
            <GiftIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <CardTitle className="text-xl font-semibold text-green-700">You're at the Top!</CardTitle>
            <CardDescription className="text-green-600 mt-1">
                You've achieved the highest tier or completed your current progression!
            </CardDescription>
        </Card>
    );
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-1 rounded-lg">
      <CardContent className="p-5">
        <div className="flex items-center mb-3">
            <ZapIcon className="h-6 w-6 text-purple-600 mr-3" />
            <CardTitle className="text-lg font-semibold text-purple-700">{displayTitle}</CardTitle>
        </div>

        <p className="text-2xl font-bold text-gray-800 mb-1">
          {killaNeeded.toLocaleString()} <span className="text-base font-medium text-gray-600">KLA more</span>
        </p>
        <p className="text-xs text-gray-500 mb-3">
          to unlock the <span className="font-semibold">{nextTierName}</span> tier benefits!
        </p>

        {progressPercentage !== undefined && totalKillaForNextTierRange && totalKillaForNextTierRange > 0 && (
          <div className="my-3">
            <Progress value={progressPercentage} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-pink-500 [&>div]:to-rose-500" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Current Progress</span>
                <span>{currentKillaProgress?.toLocaleString()} / {totalKillaForNextTierRange.toLocaleString()} KLA</span>
            </div>
          </div>
        )}

        {nextTierBenefitHighlight && (
          <div className="mt-4 pt-3 border-t border-purple-200">
            <p className="text-sm font-semibold text-gray-700 mb-1">Next tier includes:</p>
            <div className="flex items-center text-sm text-purple-600">
              <GiftIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{nextTierBenefitHighlight}</span>
            </div>
          </div>
        )}

        {/* Optional: Add a CTA button if relevant */}
        {/*
        <Button variant="link" size="sm" className="mt-4 p-0 h-auto text-purple-600 hover:text-purple-700">
          Learn more about {nextTierName} <ArrowRightCircleIcon className="ml-1 h-4 w-4" />
        </Button>
        */}
      </CardContent>
    </Card>
  );
};

export default NextTierTeaser;
