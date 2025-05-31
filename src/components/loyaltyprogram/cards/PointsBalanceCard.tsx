// src/components/loyaltyprogram/cards/PointsBalanceCard.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AwardIcon, HourglassIcon, TrendingUpIcon } from 'lucide-react';
// import { Tier } from '@/types/loyalty'; // Tier details might come from a fuller Profile type

interface PointsBalanceCardProps {
  currentKilla: number; // Changed from currentPoints
  pendingKilla?: number; // Changed from pendingPoints
  tierName?: string;
  isLoading?: boolean;
}

const PointsBalanceCard: React.FC<PointsBalanceCardProps> = ({
  currentKilla,
  pendingKilla,
  tierName,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card className="shadow-lg w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Killa Wallet</CardTitle> {/* Updated */}
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
          Your Killa Wallet
        </CardTitle>
        <CardDescription>Overview of your Killa and tier status.</CardDescription> {/* Updated */}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-blue-700">Available Killa</p> {/* Updated */}
            <p className="text-3xl font-extrabold text-blue-600">
              {currentKilla.toLocaleString()} <span className="text-lg font-semibold">KLA</span> {/* Updated */}
            </p>
          </div>
          <TrendingUpIcon className="w-10 h-10 text-blue-500" />
        </div>

        {typeof pendingKilla === 'number' && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div>
              <p className="text-xs font-medium text-yellow-700">Pending Killa</p> {/* Updated */}
              <p className="text-xl font-semibold text-yellow-600">
                {pendingKilla.toLocaleString()} <span className="text-sm font-medium">KLA</span> {/* Updated */}
              </p>
            </div>
            <HourglassIcon className="w-6 h-6 text-yellow-500" />
          </div>
        )}

        {tierName && (
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <p className="text-xs font-medium text-green-700">Current Tier</p>
              <p className="text-xl font-semibold text-green-600">
                {tierName}
              </p>
            </div>
            <AwardIcon className="w-6 h-6 text-green-500" />
          </div>
        )}

        {!tierName && typeof pendingKilla !== 'number' && (
             <p className="text-sm text-gray-500 text-center">No pending Killa or tier information available.</p> {/* Updated */}
        )}
      </CardContent>
    </Card>
  );
};
export default PointsBalanceCard;
