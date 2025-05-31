// src/components/loyaltyprogram/displays/RewardsCatalog.tsx
'use client';

import React, { useState } from 'react';
import { Reward } from '@/types/loyalty';
import RewardCard from '@/components/loyaltyprogram/cards/RewardCard';
import { Skeleton } from '@/components/ui/skeleton'; // For RewardCard skeleton
import { Button } from '@/components/ui/button';
import { LayoutGridIcon, ListIcon } from 'lucide-react';

interface RewardsCatalogProps {
  rewards: Reward[];
  onRedeemClick: (reward: Reward) => void; // To handle opening redemption modal
  isLoading?: boolean;
  // For future use, if parent wants to control disabled state of all cards
  // areRedeemActionsDisabled?: boolean;
}

type ViewMode = 'grid' | 'list'; // Not fully implemented in this step

// Card Skeleton for loading state of individual cards (if needed, but RewardCard has its own)
// This one is for the catalog's loading state.
const CardSkeleton = () => (
    <div className="border rounded-lg p-4 shadow" role="generic" aria-label="Loading reward card">
        <Skeleton className="h-40 w-full mb-3 animate-pulse" /> {/* Image */}
        <Skeleton className="h-5 w-3/4 mb-2 animate-pulse" />   {/* Title */}
        <Skeleton className="h-4 w-1/2 mb-3 animate-pulse" />   {/* Category/Description */}
        <Skeleton className="h-6 w-1/3 mb-4 animate-pulse" />   {/* Killa Required */}
        <Skeleton className="h-10 w-full animate-pulse" />      {/* Button */}
    </div>
  );

const RewardsCatalog: React.FC<RewardsCatalogProps> = ({
  rewards,
  onRedeemClick,
  isLoading = false,
  // areRedeemActionsDisabled = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid'); // Default to grid

  if (isLoading) {
    // Render skeletons for reward cards
    return (
      <div className="space-y-6">
        {/* Placeholder for View Toggle skeleton if it were more complex */}
        {/* <div className="flex justify-end mb-4"> <Skeleton className="h-10 w-24" /> </div> */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, index) => ( // Show 8 skeletons
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!rewards || rewards.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <h3 className="text-xl font-semibold mb-2">No Rewards Available</h3>
        <p>Please check back later or adjust your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">
          Available Rewards ({rewards.length})
        </h2>
        {/* View Toggle Placeholder - functionality for switching view is future enhancement */}
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <LayoutGridIcon className="h-4 w-4 mr-2" /> Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            disabled // List view not implemented yet
          >
            <ListIcon className="h-4 w-4 mr-2" /> List (Soon)
          </Button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onRedeem={() => onRedeemClick(reward)}
              // isRedeemDisabled={areRedeemActionsDisabled || !reward.isActive || (reward.stock !== undefined && reward.stock <= 0)}
            />
          ))}
        </div>
      ) : (
        // Placeholder for List View
        <div className="space-y-4">
          <p className="text-center text-gray-500 py-8">List view is coming soon!</p>
          {/* {rewards.map((reward) => (
            // Render a list item version of the reward
            <div key={reward.id} className="border p-4 rounded-lg flex justify-between items-center">
              <span>{reward.name} - {reward.killaRequired} KLA</span>
              <Button onClick={() => onRedeemClick(reward)} size="sm">Redeem</Button>
            </div>
          ))} */}
        </div>
      )}
    </div>
  );
};

export default RewardsCatalog;
