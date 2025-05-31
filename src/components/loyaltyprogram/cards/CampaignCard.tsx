// src/components/loyaltyprogram/cards/CampaignCard.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Campaign } from '@/types/loyalty'; // Using updated types
import CountdownTimer from '@/components/loyaltyprogram/common/CountdownTimer';
import { TagIcon, ZapIcon, GiftIcon, ExternalLinkIcon, PercentIcon } from 'lucide-react'; // Example icons

interface CampaignCardProps {
  campaign: Campaign;
  // onCampaignSelect?: (campaignId: string) => void; // If clicking card does something
}

// Simple MultiplierBadge-like display within the card
const renderMultiplierBadge = (multiplier?: number, type?: Campaign['type']) => {
  if (!multiplier || type !== 'killa_multiplier') return null;
  return (
    <div className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700 mr-2">
      <ZapIcon className="mr-1 h-3 w-3" />
      {multiplier}x KLA Multiplier
    </div>
  );
};

const renderBonusBadge = (bonusAmount?: number, type?: Campaign['type']) => {
    if (!bonusAmount || type !== 'bonus_killa') return null;
    return (
      <div className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 mr-2">
        <GiftIcon className="mr-1 h-3 w-3" />
        +{bonusAmount.toLocaleString()} KLA Bonus
      </div>
    );
};

// Placeholder for a discount badge if type is product_discount
const renderDiscountBadge = (type?: Campaign['type']) => {
    if (type !== 'product_discount') return null;
    return (
        <div className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 mr-2">
            <PercentIcon className="mr-1 h-3 w-3" />
            Special Discount
        </div>
    );
};


const CampaignCard: React.FC<CampaignCardProps> = ({ campaign /*, onCampaignSelect */ }) => {
  const { name, description, imageUrl, type, killaMultiplierValue, bonusKillaAmount, startDate, endDate } = campaign;

  const isTimeLimited = endDate;
  const now = new Date();
  const campaignHasEnded = endDate && new Date(endDate as string | Date) < now;
  const campaignHasNotStarted = startDate && new Date(startDate as string | Date) > now;

  let statusBadge = null;
  if (campaignHasEnded) {
    statusBadge = <span className="text-xs font-semibold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">Ended</span>;
  } else if (campaignHasNotStarted) {
    statusBadge = <span className="text-xs font-semibold text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Upcoming</span>;
  } else if (campaign.isActive === false) { // Explicitly not active but not ended/upcoming (e.g. paused)
    statusBadge = <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Inactive</span>;
  }


  return (
    <Card className={`flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 ease-in-out rounded-lg ${campaign.isActive === false || campaignHasEnded ? 'opacity-70 bg-gray-50' : ''}`}>
      {imageUrl && (
        <div className="relative w-full h-40 sm:h-48">
          <Image
            src={imageUrl || '/placeholder-image.jpg'}
            alt={name}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}
      {!imageUrl && ( // Placeholder if no image
         <div className="w-full h-40 sm:h-48 bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 flex items-center justify-center">
            <TagIcon className="h-16 w-16 text-purple-300" />
         </div>
      )}


      <CardHeader className="pb-3 pt-4">
        <div className="flex justify-between items-start">
            <CardTitle className="text-md md:text-lg font-bold text-gray-800 leading-tight" title={name}>
            {name}
            </CardTitle>
            {statusBadge}
        </div>
        {description && (
          <CardDescription className="text-sm text-gray-600 h-10 overflow-hidden text-ellipsis mt-1">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-grow py-2 space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
            {renderMultiplierBadge(killaMultiplierValue, type)}
            {renderBonusBadge(bonusKillaAmount, type)}
            {renderDiscountBadge(type)}
            {/* Add more badges for other campaign types */}
        </div>

        {isTimeLimited && !campaignHasEnded && !campaignHasNotStarted && (
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-500 mb-1">Ends in:</p>
            <CountdownTimer targetDate={endDate as string | Date} expiredText="Campaign Ended" />
          </div>
        )}
         {campaignHasNotStarted && startDate && (
            <div className="mt-2">
                <p className="text-xs font-medium text-gray-500 mb-1">Starts in:</p>
                <CountdownTimer targetDate={startDate as string | Date} expiredText="Campaign Started" />
            </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 mt-auto border-t bg-gray-50 p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          // onClick={() => onCampaignSelect?.(campaign.id)}
          // Disabled if not active or already ended for interaction
          disabled={campaign.isActive === false || campaignHasEnded}
        >
          View Details <ExternalLinkIcon className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CampaignCard;
