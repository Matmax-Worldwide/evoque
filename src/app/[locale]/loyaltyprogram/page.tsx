// src/app/[locale]/loyaltyprogram/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import PointsBalanceCard from '@/components/loyaltyprogram/cards/PointsBalanceCard';
import QuickStatsGrid from '@/components/loyaltyprogram/displays/QuickStatsGrid';
import RecentActivityFeed from '@/components/loyaltyprogram/displays/RecentActivityFeed';
import FeaturedRewardsCarousel from '@/components/loyaltyprogram/displays/FeaturedRewardsCarousel';
import TierProgressBar from '@/components/loyaltyprogram/displays/TierProgressBar';

// Import updated types and context hook
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import {
    Tier,
    LoyaltyProfile,
    PointsTransaction, // Type name itself not changed, but internal fields are
    Reward,
    StatDisplayItem, // Assuming these specific component types are also updated or use Killa fields
    ActivityFeedItem,
    FeaturedCarouselRewardItem,
    TierProgressDisplayInfo
} from '@/types/loyalty';

// Lucide icons for mock data
import { GiftIcon, StarIcon, UsersIcon, ShoppingBagIcon, TrendingUpIcon, ActivityIcon, RefreshCwIcon } from 'lucide-react';

// Mock Tier data using Killa fields
const goldTierMock: Tier = { id: 'gold', name: 'Gold', minKillaToAchieve: 1000, killaToNextTier: 5000, iconName: 'ShieldCheckIcon' };
const silverTierMock: Tier = { id: 'silver', name: 'Silver', minKillaToAchieve: 0, killaToNextTier: 1000, iconName: 'ShieldCheckIcon' };


export default function LoyaltyProgramPage() {
  const [activeTab, setActiveTab] = useState('overview');
  // Use updated context which provides profile with Killa fields
  const { profile, profileLoadingState, profileError, refreshProfile, clearProfileError } = useLoyaltyContext();

  const [localStatsLoading, setLocalStatsLoading] = useState(true);
  const [mockStats, setMockStats] = useState<StatDisplayItem[]>([]);

  const [localActivitiesLoading, setLocalActivitiesLoading] = useState(true);
  const [mockActivities, setMockActivities] = useState<ActivityFeedItem[]>([]);

  const [localRewardsLoading, setLocalRewardsLoading] = useState(true);
  const [mockRewards, setMockRewards] = useState<FeaturedCarouselRewardItem[]>([]);

  const [tierProgressData, setTierProgressData] = useState<TierProgressDisplayInfo | null>(null);

  useEffect(() => {
    if (profile && profile.tier) {
      const currentTier = profile.tier;
      const nextT = currentTier.id === silverTierMock.id ? goldTierMock : undefined;

      // Use Killa field names from profile
      const currentKilla = profile.currentKilla || 0;
      const killaInCurrentTier = currentKilla - currentTier.minKillaToAchieve;
      const killaNeededForNext = nextT ? (nextT.minKillaToAchieve - currentTier.minKillaToAchieve) : 0;

      setTierProgressData({
        currentTierName: currentTier.name,
        nextTierName: nextT?.name,
        currentKillaInTier: killaInCurrentTier >= 0 ? killaInCurrentTier : 0,
        killaNeededForNextTier: killaNeededForNext > 0 ? killaNeededForNext : 0,
      });
    } else if (profile) {
        const currentKilla = profile.currentKilla || 0;
        setTierProgressData({
            currentKillaInTier: currentKilla,
            // Calculate Killa needed to reach the first tier (Silver)
            killaNeededForNextTier: silverTierMock.minKillaToAchieve > currentKilla ? silverTierMock.minKillaToAchieve - currentKilla : 0,
            nextTierName: silverTierMock.name,
        });
    } else {
      setTierProgressData(null);
    }
  }, [profile]);


  const loadNonProfileOverviewData = useCallback(async () => {
    setLocalStatsLoading(true);
    setLocalActivitiesLoading(true);
    setLocalRewardsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    let progressPercentageValue = 'N/A';
    if (tierProgressData && tierProgressData.killaNeededForNextTier > 0) {
        progressPercentageValue = `${Math.round((tierProgressData.currentKillaInTier / tierProgressData.killaNeededForNextTier) * 100)}%`;
    } else if (tierProgressData && tierProgressData.killaNeededForNextTier === 0 && tierProgressData.currentTierName) {
        progressPercentageValue = '100%';
    }

    setMockStats([
      // Use Killa field names from profile
      { id: 'lifetime', label: 'Lifetime Killa', value: profile?.lifetimeKilla?.toLocaleString() ?? 'N/A', icon: StarIcon, unit: 'KLA', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
      { id: 'redemptions', label: 'Total Redemptions', value: 12, icon: ShoppingBagIcon, bgColor: 'bg-green-100', textColor: 'text-green-600' },
      { id: 'next_tier_prog', label: `Progress to ${tierProgressData?.nextTierName || 'Next Tier'}`, value: progressPercentageValue, icon: TrendingUpIcon, bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
    ]);
    setLocalStatsLoading(false);

    setMockActivities([
      // Use killaAmount
      { id: 'act1', description: 'Signed up for newsletter', killaAmount: 50, date: new Date(Date.now() - 1 * 86400000).toISOString(), type: 'bonus' },
      { id: 'act2', description: 'Purchased item "Super Widget"', killaAmount: 200, date: new Date(Date.now() - 2 * 86400000).toISOString(), type: 'earn' },
      { id: 'act3', description: 'Redeemed "Free Coffee"', killaAmount: -50, date: new Date(Date.now() - 3 * 86400000).toISOString(), type: 'redeem' },
    ]);
    setLocalActivitiesLoading(false);

    setMockRewards([
      // Use killaRequired
      { id: 'rew1', name: 'Deluxe Coffee Maker', killaRequired: 2500, imageUrl: '/placeholder-image.jpg', category: 'Electronics' },
      { id: 'rew2', name: '$20 Off Coupon', killaRequired: 1000, imageUrl: '/placeholder-image.jpg', category: 'Discounts' },
    ]);
    setLocalRewardsLoading(false);

  }, [profile, tierProgressData]);

  useEffect(() => {
    if (activeTab === 'overview') {
      if (profileLoadingState === 'idle' || profileLoadingState === 'error') {
        refreshProfile();
      }
      if(profileLoadingState === 'success' || profile) {
          loadNonProfileOverviewData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profileLoadingState, profile, refreshProfile, loadNonProfileOverviewData]);

  const pageIsLoading = profileLoadingState === 'loading' || profileLoadingState === 'idle';

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Killa Program {/* Updated Title */}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6 bg-white p-1 rounded-lg shadow">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Killa History</TabsTrigger> {/* Updated */}
          <TabsTrigger value="rewards">Rewards Catalog</TabsTrigger>
          <TabsTrigger value="tiers">Tier Progress</TabsTrigger>
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {profileError && (
            <Card className="bg-red-50 border-red-500">
              <CardHeader><CardTitle className="text-red-700">Error Loading Killa Profile</CardTitle></CardHeader> {/* Updated */}
              <CardContent className="space-y-3">
                <p className="text-red-600">{profileError}</p>
                <Button onClick={() => { clearProfileError(); refreshProfile(); }} variant="destructive">
                  <RefreshCwIcon className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <PointsBalanceCard
                // Pass Killa-branded props
                currentKilla={profile?.currentKilla ?? 0}
                pendingKilla={profile?.pendingKilla}
                tierName={profile?.tier?.name}
                isLoading={pageIsLoading && !profile}
              />
            </div>
            <div className="lg:col-span-2">
              {tierProgressData && (
                <TierProgressBar
                  // Pass Killa-branded props from tierProgressData
                  currentTierName={tierProgressData.currentTierName}
                  nextTierName={tierProgressData.nextTierName}
                  currentKillaInTier={tierProgressData.currentKillaInTier}
                  killaNeededForNextTier={tierProgressData.killaNeededForNextTier}
                  isLoading={pageIsLoading && !profile}
                />
              )}
              {(pageIsLoading && !tierProgressData && !profileError) && (
                <TierProgressBar currentKillaInTier={0} killaNeededForNextTier={0} isLoading={true} /> // Updated props
              )}
            </div>
          </div>

          <QuickStatsGrid
            stats={mockStats}
            isLoading={localStatsLoading || (pageIsLoading && mockStats.length === 0)}
            gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          />
          <RecentActivityFeed
            activities={mockActivities}
            isLoading={localActivitiesLoading || (pageIsLoading && mockActivities.length === 0)}
            maxItems={5}
          />
          <FeaturedRewardsCarousel
            rewards={mockRewards}
            isLoading={localRewardsLoading || (pageIsLoading && mockRewards.length === 0)}
            itemsToShow={3}
          />
        </TabsContent>

        {/* Placeholder content for other tabs */}
        <TabsContent value="history" className="mt-4">
          <Card><CardHeader><CardTitle>Killa History</CardTitle></CardHeader><CardContent><p>Content for Killa history.</p></CardContent></Card> {/* Updated */}
        </TabsContent>
        <TabsContent value="rewards" className="mt-4">
          <Card><CardHeader><CardTitle>Rewards Catalog</CardTitle></CardHeader><CardContent><p>Content for rewards catalog.</p></CardContent></Card>
        </TabsContent>
        <TabsContent value="tiers" className="mt-4">
          <Card><CardHeader><CardTitle>Tier Progress</CardTitle></CardHeader><CardContent><p>Content for tier progress.</p></CardContent></Card>
        </TabsContent>
        <TabsContent value="campaigns" className="mt-4">
          <Card><CardHeader><CardTitle>Active Campaigns</CardTitle></CardHeader><CardContent><p>Content for active campaigns.</p></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

```
