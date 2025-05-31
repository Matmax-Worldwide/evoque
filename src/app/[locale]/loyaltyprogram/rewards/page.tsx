// src/app/[locale]/loyaltyprogram/rewards/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import CategoryFilter, { type CategoryFilterItem } from '@/components/loyaltyprogram/forms/CategoryFilter';
import RewardsCatalog from '@/components/loyaltyprogram/displays/RewardsCatalog';
import RedemptionModal from '@/components/loyaltyprogram/modals/RedemptionModal';
import { Reward } from '@/types/loyalty';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // For page structure
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, SearchIcon } from 'lucide-react'; // Added SearchIcon for potential search bar
import { Input } from '@/components/ui/input'; // For search bar

// Generate a diverse set of mock rewards
const generateMockRewards = (count: number): Reward[] => {
  const categories = ['Electronics', 'Vouchers', 'Merchandise', 'Experiences', 'Services'];
  const rewardNames = [
    'Smart Speaker Mini', '$25 Gift Card', 'Loyalty Program T-Shirt', 'VIP Event Ticket', 'Consultation Hour',
    'Wireless Earbuds', '$50 Dining Voucher', 'Branded Cap', 'Adventure Park Pass', 'Online Course Access',
    'Portable Charger', '$100 Travel Credit', 'Collectible Figurine', 'Backstage Meet & Greet', 'Premium Subscription'
  ];
  return Array.from({ length: count }, (_, i) => {
    const category = categories[i % categories.length];
    const name = rewardNames[i % rewardNames.length] + ` #${i+1}`;
    return {
      id: `rew-${i + 1}`,
      name: name,
      description: `Get this exclusive ${name.toLowerCase()} with your Killa! Limited time offer.`,
      killaRequired: (Math.floor(Math.random() * 20) + 1) * 100 + 500, // 500 to 2500 KLA
      category: category,
      imageUrl: `/placeholder-image.jpg?id=${i+1}`, // Unique placeholder
      isActive: Math.random() > 0.1, // 90% active
      stock: Math.random() > 0.2 ? Math.floor(Math.random() * 50) + 1 : 0, // 20% out of stock
    };
  });
};

const ALL_MOCK_REWARDS = generateMockRewards(25); // Simulate a dataset

const extractCategories = (rewards: Reward[]): CategoryFilterItem[] => {
  const uniqueCategories = new Set<string>();
  rewards.forEach(reward => {
    if (reward.category) uniqueCategories.add(reward.category);
  });
  const sortedCategories = Array.from(uniqueCategories).sort();
  return [
    { value: 'all', label: 'All Categories' },
    ...sortedCategories.map(cat => ({ value: cat, label: cat })),
  ];
};


export default function RewardsCatalogPage() {
  const { profile, refreshProfile } = useLoyaltyContext(); // Get user's Killa balance
  const userKillaBalance = profile?.currentKilla ?? 0;

  const [isLoading, setIsLoading] = useState(true);
  const [allRewards, setAllRewards] = useState<Reward[]>([]);
  const [availableCategories, setAvailableCategories] = useState<CategoryFilterItem[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedRewardForModal, setSelectedRewardForModal] = useState<Reward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false); // For modal's confirm button loading state

  // Simulate fetching rewards and categories
  const fetchRewards = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
    setAllRewards(ALL_MOCK_REWARDS);
    setAvailableCategories(extractCategories(ALL_MOCK_REWARDS));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRewards();
    if (!profile) { // Fetch profile if not already loaded (e.g. direct navigation to this page)
        refreshProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRewards, profile]); // Removed refreshProfile from deps to avoid loop if profile context updates itself

  const displayedRewards = useMemo(() => {
    return allRewards
      .filter(reward => selectedCategory === 'all' || reward.category === selectedCategory)
      .filter(reward => reward.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allRewards, selectedCategory, searchTerm]);

  const handleCategoryChange = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleRedeemClick = (reward: Reward) => {
    setSelectedRewardForModal(reward);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRewardForModal(null);
  };

  const handleConfirmRedemption = async (rewardId: string) => {
    setIsRedeeming(true);
    console.log(`Attempting to redeem reward ID: ${rewardId} for user: ${profile?.userId}`);
    // Simulate API call for redemption
    await new Promise(resolve => setTimeout(resolve, 1500));
    // TODO: Handle success/failure, update userKillaBalance (likely by re-calling refreshProfile)
    // For now, just log and close modal
    alert(`Redemption for reward "${selectedRewardForModal?.name}" (ID: ${rewardId}) would be processed here.`);
    setIsRedeeming(false);
    handleCloseModal();
    refreshProfile(); // Refresh profile to update Killa balance after redemption
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Rewards Catalog</h1>
        <Button variant="outline" onClick={fetchRewards} disabled={isLoading}>
          <RefreshCwIcon className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Rewards
        </Button>
      </div>

      <Card className="p-4 sm:p-6 shadow-md bg-white rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-6">
            <div className="md:col-span-2">
                 <CategoryFilter
                    categories={availableCategories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={handleCategoryChange}
                    title="Browse by Category"
                />
            </div>
            <div className="relative">
                <Input
                    type="search"
                    placeholder="Search rewards by name..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
        </div>


        <RewardsCatalog
            rewards={displayedRewards}
            onRedeemClick={handleRedeemClick}
            userKillaBalance={userKillaBalance}
            isLoading={isLoading}
        />
      </Card>

      {selectedRewardForModal && (
        <RedemptionModal
          reward={selectedRewardForModal}
          userKillaBalance={userKillaBalance}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirmRedemption={handleConfirmRedemption}
          isRedeeming={isRedeeming}
        />
      )}
    </div>
  );
}
