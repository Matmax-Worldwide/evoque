// src/app/[locale]/loyaltyprogram/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import PointsBalanceCard from '@/components/loyaltyprogram/cards/PointsBalanceCard';
import QuickStatsGrid, { type StatDisplayItem } from '@/components/loyaltyprogram/displays/QuickStatsGrid';
import RecentActivityFeed, { type ActivityFeedItem } from '@/components/loyaltyprogram/displays/RecentActivityFeed';
import FeaturedRewardsCarousel, { type FeaturedCarouselRewardItem } from '@/components/loyaltyprogram/displays/FeaturedRewardsCarousel';
import TierProgressBar, { type TierProgressDisplayInfo } from '@/components/loyaltyprogram/displays/TierProgressBar';

import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { Tier, PointsTransaction, Reward } from '@/types/loyalty';

import { GiftIcon, StarIcon, UsersIcon, ShoppingBagIcon, TrendingUpIcon, ActivityIcon, RefreshCwIcon } from 'lucide-react';

const goldTierMock: Tier = { id: 'gold', name: 'Gold', minPoints: 1000, pointsToNextTier: 5000, iconName: 'ShieldCheckIcon' };
// Silver tier mock to ensure tierProgressData calculation has a base if profile.tier is silver
const silverTierMock: Tier = { id: 'silver', name: 'Silver', minPoints: 0, pointsToNextTier: 1000, iconName: 'ShieldCheckIcon' };


export default function LoyaltyProgramPage() {
  const [activeTab, setActiveTab] = useState('overview');
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
      // Determine next tier based on current tier for mock purposes
      const nextT = currentTier.id === silverTierMock.id ? goldTierMock : undefined;

      const pointsInCurrentTier = profile.currentPoints - currentTier.minPoints;
      // Ensure pointsNeededForNext is based on the difference between next tier's minPoints and current tier's minPoints
      const pointsNeededForNext = nextT ? (nextT.minPoints - currentTier.minPoints) : 0;

      setTierProgressData({
        currentTierName: currentTier.name,
        nextTierName: nextT?.name,
        currentPointsInTier: pointsInCurrentTier >= 0 ? pointsInCurrentTier : 0,
        pointsNeededForNextTier: pointsNeededForNext > 0 ? pointsNeededForNext : 0,
      });
    } else if (profile) { // Has profile but no tier info (e.g. new user before tier assignment)
        setTierProgressData({
            currentPointsInTier: profile.currentPoints, // Show all points if no tier
            pointsNeededForNextTier: silverTierMock.minPoints - profile.currentPoints > 0 ? silverTierMock.minPoints - profile.currentPoints : 0, // Points to reach first tier
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

    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay

    // Update mockStats to use profile data where applicable
    let progressPercentageValue = 'N/A';
    if (tierProgressData && tierProgressData.pointsNeededForNextTier > 0) {
        progressPercentageValue = `${Math.round((tierProgressData.currentPointsInTier / tierProgressData.pointsNeededForNextTier) * 100)}%`;
    } else if (tierProgressData && tierProgressData.pointsNeededForNextTier === 0 && tierProgressData.currentTierName) {
        // If at a tier and no points needed for next (could be highest, or next tier not defined for mock)
        progressPercentageValue = '100%';
    }


    setMockStats([
      { id: 'lifetime', label: 'Lifetime Points', value: profile?.lifetimePoints?.toLocaleString() ?? 'N/A', icon: StarIcon, unit: 'pts', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
      { id: 'redemptions', label: 'Total Redemptions', value: 12, icon: ShoppingBagIcon, bgColor: 'bg-green-100', textColor: 'text-green-600' }, // Placeholder
      { id: 'next_tier_prog', label: `Progress to ${tierProgressData?.nextTierName || 'Next Tier'}`, value: progressPercentageValue, icon: TrendingUpIcon, bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
    ]);
    setLocalStatsLoading(false);

    setMockActivities([
      { id: 'act1', description: 'Signed up for newsletter', points: 50, date: new Date(Date.now() - 1 * 86400000).toISOString(), type: 'bonus' },
      { id: 'act2', description: 'Purchased item "Super Widget"', points: 200, date: new Date(Date.now() - 2 * 86400000).toISOString(), type: 'earn' },
      { id: 'act3', description: 'Redeemed "Free Coffee"', points: -50, date: new Date(Date.now() - 3 * 86400000).toISOString(), type: 'redeem' },
    ]);
    setLocalActivitiesLoading(false);

    setMockRewards([
      { id: 'rew1', name: 'Deluxe Coffee Maker', pointsRequired: 2500, imageUrl: '/placeholder-image.jpg', category: 'Electronics' },
      { id: 'rew2', name: '$20 Off Coupon', pointsRequired: 1000, imageUrl: '/placeholder-image.jpg', category: 'Discounts' },
    ]);
    setLocalRewardsLoading(false);

  }, [profile, tierProgressData]);

  useEffect(() => {
    if (activeTab === 'overview') {
      if (profileLoadingState === 'idle' || profileLoadingState === 'error') {
        // Only call refreshProfile if it's truly idle or was an error, not if it's already success or loading
        refreshProfile();
      }
      // loadNonProfileOverviewData should be called regardless of profileLoadingState if tab is overview,
      // as it might have its own data sources or use parts of profile that are available.
      // However, its internal logic now depends on `profile` and `tierProgressData` for some stats.
      if(profileLoadingState === 'success' || profile) { // Call once profile is available or successfully loaded
          loadNonProfileOverviewData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profileLoadingState, profile, refreshProfile, loadNonProfileOverviewData]);


  const pageIsLoading = profileLoadingState === 'loading' || profileLoadingState === 'idle';
  // Individual sections have their own loaders for non-profile data for now.

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Loyalty Program
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6 bg-white p-1 rounded-lg shadow">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Points History</TabsTrigger>
          <TabsTrigger value="rewards">Rewards Catalog</TabsTrigger>
          <TabsTrigger value="tiers">Tier Progress</TabsTrigger>
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          {profileError && (
            <Card className="bg-red-50 border-red-500">
              <CardHeader><CardTitle className="text-red-700">Error Loading Profile</CardTitle></CardHeader>
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
                currentPoints={profile?.currentPoints ?? 0}
                pendingPoints={profile?.pendingPoints}
                tierName={profile?.tier?.name}
                isLoading={pageIsLoading && !profile} // Show loading if page is loading AND profile isn't set yet
              />
            </div>
            <div className="lg:col-span-2">
              {tierProgressData && ( // Render only if tierProgressData is available
                <TierProgressBar
                  {...tierProgressData}
                  isLoading={pageIsLoading && !profile}
                />
              )}
              {/* Skeleton for TierProgressBar if profile is loading and tierProgressData not yet computed */}
              {(pageIsLoading && !tierProgressData && !profileError) && (
                <TierProgressBar currentPointsInTier={0} pointsNeededForNextTier={0} isLoading={true} />
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
        <TabsContent value="history" className="mt-4"><Card><CardHeader><CardTitle>Points History</CardTitle></CardHeader><CardContent><p>Content for points history.</p></CardContent></Card></TabsContent>
        <TabsContent value="rewards" className="mt-4"><Card><CardHeader><CardTitle>Rewards Catalog</CardTitle></CardHeader><CardContent><p>Content for rewards catalog.</p></CardContent></Card></TabsContent>
        <TabsContent value="tiers" className="mt-4"><Card><CardHeader><CardTitle>Tier Progress</CardTitle></CardHeader><CardContent><p>Content for tier progress.</p></CardContent></Card></TabsContent>
        <TabsContent value="campaigns" className="mt-4"><Card><CardHeader><CardTitle>Active Campaigns</CardTitle></CardHeader><CardContent><p>Content for active campaigns.</p></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
```
