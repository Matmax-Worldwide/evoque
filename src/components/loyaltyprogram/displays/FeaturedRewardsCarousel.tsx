// src/components/loyaltyprogram/displays/FeaturedRewardsCarousel.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'; // Assuming this exists
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image'; // For optimized images
import { Button } from '@/components/ui/button';
import { ShoppingCartIcon, InfoIcon } from 'lucide-react'; // Example icons

// Assuming Reward type will be more fleshed out in types/loyalty.ts
// For now, define a local version for props.
export interface FeaturedRewardItem {
  id: string;
  name: string;
  pointsRequired: number;
  imageUrl?: string; // URL to the reward image
  category?: string;
  // Add other relevant fields like short description, stock, etc. later
}

interface FeaturedRewardsCarouselProps {
  rewards: FeaturedRewardItem[];
  title?: string;
  description?: string;
  isLoading?: boolean;
  itemsToShow?: number; // Number of items visible at once in the carousel
}

const FeaturedRewardsCarousel: React.FC<FeaturedRewardsCarouselProps> = ({
  rewards,
  title = "Featured Rewards",
  description = "Check out these popular rewards you can redeem with your points.",
  isLoading = false,
  itemsToShow = 3, // Default for a common carousel view
}) => {
  if (isLoading) {
    return (
      <section aria-labelledby="featured-rewards-title" className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <h2 id="featured-rewards-title" className="text-2xl font-bold mb-1">{title}</h2>
          {description && <p className="text-muted-foreground mb-6">{description}</p>}
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${itemsToShow} gap-4`}>
            {Array.from({ length: itemsToShow }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-5 w-3/4 mb-1" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/3" />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!rewards || rewards.length === 0) {
    return (
      <section aria-labelledby="featured-rewards-title" className="py-6 md:py-8">
        <div className="container mx-auto px-4 text-center">
          <h2 id="featured-rewards-title" className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-gray-500">No featured rewards available at the moment. Check back soon!</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="featured-rewards-title" className="py-6 md:py-8 bg-slate-50 rounded-lg">
      <div className="container mx-auto px-4">
        <h2 id="featured-rewards-title" className="text-2xl font-bold mb-1 text-gray-800">{title}</h2>
        {description && <p className="text-gray-600 mb-6">{description}</p>}

        <Carousel
          opts={{
            align: "start",
            loop: rewards.length > itemsToShow, // Loop only if there are more items than visible
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {rewards.map((reward) => (
              <CarouselItem key={reward.id} className={`pl-4 basis-full sm:basis-1/2 md:basis-1/${itemsToShow}`}>
                <Card className="h-full flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200 ease-in-out rounded-lg">
                  <div className="relative w-full h-48">
                    <Image
                      src={reward.imageUrl || '/placeholder-image.jpg'} // Provide a fallback placeholder
                      alt={reward.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    {reward.category && (
                      <p className="text-xs text-blue-600 font-semibold mb-1 tracking-wide uppercase">
                        {reward.category}
                      </p>
                    )}
                    <CardTitle className="text-lg font-semibold text-gray-800 leading-tight truncate" title={reward.name}>
                      {reward.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-xl font-bold text-blue-700">
                      {reward.pointsRequired.toLocaleString()} pts
                    </p>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-3 border-t bg-gray-50 p-4">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      <InfoIcon className="mr-2 h-4 w-4" /> Details
                    </Button>
                    <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                      <ShoppingCartIcon className="mr-2 h-4 w-4" /> Redeem
                    </Button>
                  </CardFooter>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          {rewards.length > itemsToShow && (
            <>
              <CarouselPrevious className="absolute left-[-12px] md:left-[-20px] top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
              <CarouselNext className="absolute right-[-12px] md:right-[-20px] top-1/2 -translate-y-1/2 z-10 hidden sm:flex" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
};

export default FeaturedRewardsCarousel;
