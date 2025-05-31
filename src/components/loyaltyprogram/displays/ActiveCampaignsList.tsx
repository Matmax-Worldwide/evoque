// src/components/loyaltyprogram/displays/ActiveCampaignsList.tsx
'use client';

import React from 'react';
import { Campaign } from '@/types/loyalty';
import CampaignCard from '@/components/loyaltyprogram/cards/CampaignCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'; // For skeleton structure

interface ActiveCampaignsListProps {
  campaigns: Campaign[];
  isLoading?: boolean;
  gridCols?: string; // e.g., 'sm:grid-cols-2 lg:grid-cols-3'
  title?: string;
  emptyStateMessage?: string;
  // onCampaignSelect?: (campaignId: string) => void; // If needed in future
}

const ActiveCampaignsList: React.FC<ActiveCampaignsListProps> = ({
  campaigns,
  isLoading = false,
  gridCols = 'sm:grid-cols-2 lg:grid-cols-3', // Default to responsive 2 or 3 columns
  title, // Optional title for the section
  emptyStateMessage = "No active campaigns at the moment. Check back soon!",
  // onCampaignSelect,
}) => {
  if (isLoading) {
    const skeletonCount = 3; // Show a few skeletons
    return (
      <div className="space-y-6">
        {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
        <div className={`grid grid-cols-1 ${gridCols} gap-4 md:gap-6`}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-40 sm:h-48 w-full" /> {/* Image Placeholder */}
              <CardHeader className="pb-3 pt-4">
                <Skeleton className="h-5 w-3/4 mb-1" /> {/* Title */}
                <Skeleton className="h-4 w-full mt-1" /> {/* Description line 1 */}
                <Skeleton className="h-4 w-2/3 mt-1" /> {/* Description line 2 */}
              </CardHeader>
              <CardContent className="py-2 space-y-2">
                <Skeleton className="h-5 w-1/2" /> {/* Badge placeholder */}
                <Skeleton className="h-8 w-full" /> {/* Countdown placeholder */}
              </CardContent>
              <CardFooter className="pt-3 mt-auto border-t p-3">
                <Skeleton className="h-9 w-full" /> {/* Button Placeholder */}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="space-y-6">
        {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
          <h3 className="text-lg font-medium">{emptyStateMessage}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {title && <h2 className="text-xl font-semibold text-gray-800">{title}</h2>}
      <div className={`grid grid-cols-1 ${gridCols} gap-4 md:gap-6`}>
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            // onCampaignSelect={onCampaignSelect} // Pass down if needed
          />
        ))}
      </div>
    </div>
  );
};

export default ActiveCampaignsList;
