// src/components/loyaltyprogram/cards/PointsBalanceCard.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AwardIcon, HourglassIcon, TrendingUpIcon } from 'lucide-react'; // Example icons

// Assuming Tier might have more details later, for now, just a name.
// import { Tier } from '@/types/loyalty';

interface PointsBalanceCardProps {
  currentPoints: number;
  pendingPoints?: number;
  tierName?: string;
  // tierIconUrl?: string; // For future use
  isLoading?: boolean;
}

const PointsBalanceCard: React.FC<PointsBalanceCardProps> = ({
  currentPoints,
  pendingPoints,
  tierName,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Points Balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">
          Your Loyalty Wallet
        </CardTitle>
        <CardDescription>Overview of your points and tier status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Points Section */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-blue-700">Available Points</p>
            <p className="text-3xl font-extrabold text-blue-600">
              {currentPoints.toLocaleString()}
            </p>
          </div>
          <TrendingUpIcon className="w-10 h-10 text-blue-500" />
        </div>

        {/* Pending Points Section - Conditional */}
        {typeof pendingPoints === 'number' && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div>
              <p className="text-xs font-medium text-yellow-700">Pending Points</p>
              <p className="text-xl font-semibold text-yellow-600">
                {pendingPoints.toLocaleString()}
              </p>
            </div>
            <HourglassIcon className="w-6 h-6 text-yellow-500" />
          </div>
        )}

        {/* Tier Status Section - Conditional */}
        {tierName && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <p className="text-xs font-medium text-green-700">Current Tier</p>
              <p className="text-xl font-semibold text-green-600">
                {tierName}
              </p>
              {/* Placeholder for tier benefits link or info */}
              {/* <a href="#" className="text-xs text-green-500 hover:underline">View tier benefits</a> */}
            </div>
            <AwardIcon className="w-6 h-6 text-green-500" />
          </div>
        )}

        {!tierName && typeof pendingPoints !== 'number' && (
             <p className="text-sm text-gray-500 text-center">No pending points or tier information available.</p>
        )}

      </CardContent>
    </Card>
  );
};

export default PointsBalanceCard;
