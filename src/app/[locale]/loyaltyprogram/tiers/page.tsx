// src/app/[locale]/loyaltyprogram/tiers/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { Tier, LoyaltyProfile } from '@/types/loyalty'; // Using updated types

import TierComparisonTable from '@/components/loyaltyprogram/tables/TierComparisonTable';
import BenefitsHighlight from '@/components/loyaltyprogram/displays/BenefitsHighlight';
import NextTierTeaser from '@/components/loyaltyprogram/displays/NextTierTeaser';
import TierProgressBar from '@/components/loyaltyprogram/displays/TierProgressBar'; // Re-using this for current progress

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, ZapIcon, AwardIcon } from 'lucide-react';

// Mock data for all available tiers
const bronzeTierMock: Tier = { id: 'bronze', name: 'Bronze', minKillaToAchieve: 0, killaToNextTier: 500, benefits: ['Basic Support', 'Newsletter Access', '5 KLA Welcome Bonus'], multiplier: 1 };
const silverTierMock: Tier = { id: 'silver', name: 'Silver', minKillaToAchieve: 500, killaToNextTier: 2000, benefits: ['Priority Support', 'Early Access to Sales', 'Monthly 50 KLA Bonus', 'Community Access'], multiplier: 1.2 };
const goldTierMock: Tier = { id: 'gold', name: 'Gold', minKillaToAchieve: 2000, killaToNextTier: 10000, benefits: ['Dedicated Support Manager', 'Exclusive Event Invites', 'Quarterly 250 KLA Gift', 'Free Shipping on all orders', 'Premium Content Access'], multiplier: 1.5 };
const platinumTierMock: Tier = { id: 'platinum', name: 'Platinum', minKillaToAchieve: 10000, benefits: ['VIP Support Line', 'All Gold Benefits', 'Annual Loyalty Gift', 'Personalized Offers', 'Highest KLA Multiplier'], multiplier: 2 }; // Highest tier, killaToNextTier is undefined

const ALL_MOCK_TIERS: Tier[] = [bronzeTierMock, silverTierMock, goldTierMock, platinumTierMock];

export default function TiersPage() {
  const { profile, profileLoadingState, refreshProfile } = useLoyaltyContext();

  const [allTiers, setAllTiers] = useState<Tier[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(true); // For fetching all tier definitions

  const fetchAllTiersData = useCallback(async () => {
    setIsLoadingTiers(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setAllTiers(ALL_MOCK_TIERS);
    setIsLoadingTiers(false);
  },[]);

  useEffect(() => {
    fetchAllTiersData();
    if (!profile && profileLoadingState === 'idle') {
      refreshProfile();
    }
  }, [profile, profileLoadingState, refreshProfile, fetchAllTiersData]);

  const currentTier = useMemo(() => profile?.tier, [profile]);

  const nextTierDetails = useMemo(() => {
    if (!currentTier || !currentTier.killaToNextTier) return null;
    const nextTier = allTiers.find(t => t.minKillaToAchieve === currentTier.killaToNextTier);
    return nextTier || null;
  }, [currentTier, allTiers]);

  const tierProgressInfo = useMemo(() => {
    if (!profile || !currentTier) return null;

    const currentKillaInTier = profile.currentKilla - currentTier.minKillaToAchieve;
    const killaNeededForNextTierRange = nextTierDetails
        ? nextTierDetails.minKillaToAchieve - currentTier.minKillaToAchieve
        : 0;

    return {
      currentTierName: currentTier.name,
      nextTierName: nextTierDetails?.name,
      currentKillaInTier: Math.max(0, currentKillaInTier),
      killaNeededForNextTier: Math.max(0, killaNeededForNextTierRange),
    };
  }, [profile, currentTier, nextTierDetails]);

  const killaNeededForTeaser = useMemo(() => {
      if (!profile || !currentTier || !nextTierDetails) return 0;
      return Math.max(0, nextTierDetails.minKillaToAchieve - profile.currentKilla);
  }, [profile, currentTier, nextTierDetails]);


  const isLoadingPage = profileLoadingState === 'loading' || profileLoadingState === 'idle' || isLoadingTiers;

  const handleRefresh = () => {
      console.log("Refreshing Tiers Page data...");
      if (!profile || profileLoadingState !== 'loading') {
          refreshProfile();
      }
      if (!isLoadingTiers) { // Avoid re-fetching if already in progress by fetchAllTiersData
          fetchAllTiersData();
      }
  };


  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Loyalty Tiers</h1>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoadingPage}>
          <RefreshCwIcon className={`mr-2 h-4 w-4 ${isLoadingPage ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Current Tier Progress Display Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <AwardIcon className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
                <CardTitle className="text-xl font-bold">Your Current Standing</CardTitle>
                <CardDescription>Your progress and benefits in the Killa Program.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoadingPage && !tierProgressInfo && (
            <TierProgressBar currentKillaInTier={0} killaNeededForNextTier={0} isLoading={true} title="Loading Your Tier Info..." />
          )}
          {tierProgressInfo && (
            <TierProgressBar
              {...tierProgressInfo}
              isLoading={profileLoadingState === 'loading' || profileLoadingState === 'idle'}
              title="Your Current Tier Progress"
            />
          )}
          {currentTier && currentTier.benefits && (
            <BenefitsHighlight
              benefits={currentTier.benefits}
              tierName={currentTier.name}
              title={`Benefits of ${currentTier.name} Tier`}
              layout="grid"
            />
          )}
          {!currentTier && !isLoadingPage && (
            <p className="text-center text-gray-500 py-4">Could not load your current tier information.</p>
          )}
        </CardContent>
      </Card>

      {/* Next Tier Teaser Section */}
      {nextTierDetails && killaNeededForTeaser > 0 && (
        <NextTierTeaser
          nextTierName={nextTierDetails.name}
          killaNeeded={killaNeededForTeaser}
          currentKillaProgress={tierProgressInfo?.currentKillaInTier}
          totalKillaForNextTierRange={tierProgressInfo?.killaNeededForNextTier}
          nextTierBenefitHighlight={nextTierDetails.benefits ? nextTierDetails.benefits[0] : undefined} // Tease first benefit
          isLoading={isLoadingPage}
        />
      )}
       {currentTier && !nextTierDetails && !isLoadingPage && ( // At highest tier
           <NextTierTeaser
              nextTierName="" // Signal highest tier
              killaNeeded={0}
              isLoading={false}
            />
       )}


      {/* Tier Comparison Table Section */}
      <TierComparisonTable
        tiers={allTiers}
        currentTierId={currentTier?.id}
        // Pass isLoadingTiers to TierComparisonTable as it might have its own skeleton for when allTiers are loading
        // For now, TierComparisonTable shows "No tier information" if tiers array is empty.
        // A more specific isLoading prop could be added to TierComparisonTable if it had internal skeletons.
        // isLoading={isLoadingTiers}
      />
    </div>
  );
}
