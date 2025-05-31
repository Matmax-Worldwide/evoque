// src/app/[locale]/loyaltyprogram/campaigns/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ActiveCampaignsList from '@/components/loyaltyprogram/displays/ActiveCampaignsList';
import { Campaign } from '@/types/loyalty';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon } from 'lucide-react';
// Card components can be used for overall page structure if desired, like other pages
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Generate a diverse set of mock campaigns
const generateMockCampaigns = (count: number): Campaign[] => {
  const types: Campaign['type'][] = ['killa_multiplier', 'bonus_killa', 'product_discount', 'event_access'];
  const campaignNames = [
    'Weekend Killa Boost', 'Welcome Bonus Fest', 'Exclusive Gadget Discount', 'VIP Concert Access',
    'Double Killa Days', 'Refer-a-Friend Killa', 'Flash Sale on Electronics', 'Early Bird Movie Tickets'
  ];
  const descriptions = [
    'Earn double Killa on all purchases this weekend!',
    'Get a massive Killa bonus when you sign up during the fest!',
    'Unlock special discounts on select gadgets with your Killa status.',
    'Get exclusive access to VIP tickets for upcoming concerts.'
  ];

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    const name = campaignNames[i % campaignNames.length] + ` #${i + 1}`;
    // Ensure startDate can be in the past, present, or future for testing different states
    const startOffsetDays = Math.floor(Math.random() * 20) - 10; // -10 to +9 days from now
    const startDate = new Date(Date.now() + startOffsetDays * 24 * 60 * 60 * 1000);
    // Ensure endDate is after startDate
    const endOffsetDays = Math.floor(Math.random() * 20) + 1; // Ends in 1 to 20 days from startDate
    const endDate = new Date(startDate.getTime() + endOffsetDays * 24 * 60 * 60 * 1000);

    let campaignSpecifics: Partial<Campaign> = {};
    if (type === 'killa_multiplier') campaignSpecifics.killaMultiplierValue = Math.random() > 0.5 ? 1.5 : 2;
    if (type === 'bonus_killa') campaignSpecifics.bonusKillaAmount = (Math.floor(Math.random() * 10) + 1) * 50;


    return {
      id: `camp-${i + 1}`,
      name: name,
      description: descriptions[i % descriptions.length],
      type: type,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isActive: Math.random() > 0.15, // 85% active (but might be filtered by date)
      imageUrl: `/placeholder-image.jpg?camp=${i+1}`,
      ...campaignSpecifics,
    };
  });
};

const ALL_MOCK_CAMPAIGNS = generateMockCampaigns(8); // Simulate a dataset

export default function CampaignsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Simulate fetching campaigns
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600)); // Simulate API delay

    const now = new Date();
    const activeCampaigns = ALL_MOCK_CAMPAIGNS.filter(c => {
        // A campaign is considered for display if it's marked active AND
        // (has no start date OR start date is past/today) AND
        // (has no end date OR end date is future/today)
        const hasStarted = c.startDate ? new Date(c.startDate as string | Date) <= now : true;
        const hasNotEnded = c.endDate ? new Date(c.endDate as string | Date) > now : true;
        return c.isActive && hasStarted && hasNotEnded;
    });
    setCampaigns(activeCampaigns);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Active Killa Campaigns</h1>
        <Button variant="outline" onClick={fetchCampaigns} disabled={isLoading}>
          <RefreshCwIcon className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Campaigns
        </Button>
      </div>

      <ActiveCampaignsList
        campaigns={campaigns}
        isLoading={isLoading}
        // title="Explore Our Current Campaigns" // Optional: if you want a title within the list component
        gridCols="sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3" // Example of different grid cols
        emptyStateMessage="No active Killa campaigns right now. Please check back later!"
      />
    </div>
  );
}
