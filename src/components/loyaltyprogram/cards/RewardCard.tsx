// src/components/loyaltyprogram/cards/RewardCard.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // For category
import { Reward } from '@/types/loyalty'; // Using updated types
import { ShoppingCartIcon, ZapIcon } from 'lucide-react'; // ZapIcon for Killa

interface RewardCardProps {
  reward: Reward;
  onRedeem: (rewardId: string) => void;
  isRedeemDisabled?: boolean; // To disable redeem button e.g. insufficient Killa
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, onRedeem, isRedeemDisabled = false }) => {
  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200 ease-in-out rounded-lg group">
      <div className="relative w-full h-48 sm:h-56">
        <Image
          src={reward.imageUrl || '/placeholder-image.jpg'} // Ensure placeholder exists
          alt={reward.name}
          fill
          style={{ objectFit: 'cover' }}
          className="transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" // Basic responsive sizes
        />
        {reward.category && (
          <Badge variant="secondary" className="absolute top-2 right-2 bg-opacity-80">
            {reward.category}
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2 pt-4">
        <CardTitle
          className="text-md sm:text-lg font-semibold text-gray-800 leading-tight truncate group-hover:text-blue-600 transition-colors"
          title={reward.name}
        >
          {reward.name}
        </CardTitle>
        {reward.description && (
          <CardDescription className="text-xs text-gray-500 h-8 overflow-hidden text-ellipsis">
            {reward.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow py-2">
        <div className="flex items-center text-lg sm:text-xl font-bold text-blue-700">
          <ZapIcon className="h-5 w-5 mr-1.5 text-yellow-500" /> {/* Killa Icon */}
          {reward.killaRequired.toLocaleString()}
          <span className="ml-1 text-sm font-medium text-gray-600">KLA</span>
        </div>
        {/* Can add stock information here later if needed */}
        {/* {typeof reward.stock === 'number' && reward.stock > 0 && reward.stock < 10 && (
          <p className="text-xs text-orange-500 mt-1">Only {reward.stock} left!</p>
        )}
        {typeof reward.stock === 'number' && reward.stock === 0 && (
          <p className="text-xs text-red-500 mt-1">Out of stock</p>
        )} */}
      </CardContent>
      <CardFooter className="pt-3 pb-4 border-t bg-gray-50">
        <Button
          onClick={() => onRedeem(reward.id)}
          disabled={isRedeemDisabled || (typeof reward.stock === 'number' && reward.stock === 0) || !reward.isActive}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <ShoppingCartIcon className="mr-2 h-4 w-4" />
          Redeem
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RewardCard;
