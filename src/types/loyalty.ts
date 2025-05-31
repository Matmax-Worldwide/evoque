// src/types/loyalty.ts

/**
 * This file contains the core TypeScript interfaces for the Loyalty Program module.
 */

import { type LucideIcon } from 'lucide-react';

export interface Tier {
  id: string;
  name: string;
  description?: string;
  // Points required to enter this tier (absolute value from 0)
  minPoints: number;
  // Points required to enter the *next* tier (absolute value from 0)
  // If this is the highest tier, this might be undefined or Infinity
  pointsToNextTier?: number;
  benefits?: string[];
  iconName?: string; // For mapping to a LucideIcon or for an image URL
  multiplier?: number; // Points earning multiplier
}

export interface LoyaltyProfile {
  userId: string;
  currentPoints: number;
  pendingPoints?: number;
  lifetimePoints?: number;
  joinedDate?: string | Date; // ISO string or Date object
  tier?: Tier; // Embed Tier object or just tierId
  // Example if only tierId is stored and Tier details are fetched separately:
  // currentTierId?: string;
}

export type PointsTransactionType = 'earn' | 'redeem' | 'bonus' | 'adjustment' | 'other' | 'transfer_in' | 'transfer_out';

export interface PointsTransaction {
  id: string;
  type: PointsTransactionType;
  points: number; // Positive for earn/bonus/transfer_in, negative for redeem/transfer_out/adjustment
  description: string;
  transactionDate: string | Date; // ISO string or Date object
  relatedCampaignId?: string;
  relatedRewardId?: string;
  customIconName?: string; // Optional: if a specific icon other than type-default is needed
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  pointsRequired: number;
  category?: string; // e.g., 'Product', 'Service', 'Discount', 'Experience'
  imageUrl?: string; // URL for the reward image
  stock?: number; // Use -1 or undefined for unlimited stock
  isActive: boolean;
  validityStartDate?: string | Date;
  validityEndDate?: string | Date;
  // Potentially add more fields like:
  // vendor?: string;
  // termsAndConditions?: string;
}

export interface Campaign {
  // To be detailed when Campaign components are built
  id: string;
  name: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  type?: 'points_multiplier' | 'bonus_points' | 'product_discount' | 'event_access';
  isActive?: boolean;
}

export interface RedemptionRequest {
  // To be detailed when Redemption components/logic are built
  id: string;
  userId?: string;
  rewardId?: string;
  pointsSpent?: number;
  requestDate?: string | Date;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
}

export interface WalletConnection {
  // To be detailed later
  walletAddress?: string;
  provider?: string;
  connectedDate?: string | Date;
  isActive?: boolean;
}

export interface LoyaltyAnalytics {
  // To be detailed later
  totalPointsEarned?: number;
  // ... other analytics fields
}

export interface EarningRule {
  // To be detailed later
  id: string;
  action?: string;
  pointsEarned?: number;
  isActive?: boolean;
}

export interface NotificationPreferences {
  // To be detailed later
  userId?: string;
  emailNotifications?: {
    promotions?: boolean;
    pointsUpdates?: boolean;
    tierUpdates?: boolean;
  };
}

// StatItem for QuickStatsGrid - can remain local to component or be moved here if shared
export interface StatDisplayItem {
  id: string;
  label: string;
  value: string | number;
  icon?: LucideIcon;
  unit?: string;
  bgColor?: string;
  textColor?: string;
}

// ActivityItem for RecentActivityFeed - can remain local or be moved here
export interface ActivityFeedItem {
  id: string;
  description: string;
  points?: number;
  date: string | Date;
  icon?: LucideIcon; // Overrides type-default icon
  type?: PointsTransactionType; // Used for default icon and styling
}

// FeaturedRewardItem for FeaturedRewardsCarousel - can remain local or be moved here
export interface FeaturedCarouselRewardItem {
  id: string;
  name: string;
  pointsRequired: number;
  imageUrl?: string;
  category?: string;
}

// TierProgressBarProps related types - can remain local or be moved here if needed
export interface TierProgressDisplayInfo {
    currentTierName?: string;
    nextTierName?: string;
    currentPointsInTier: number;
    pointsNeededForNextTier: number;
}


// Ensure this file is updated with these refined interfaces.
// The interfaces for Campaign, RedemptionRequest etc. are still minimal placeholders.
// The local types from components (StatDisplayItem, ActivityFeedItem, etc.) are added here for potential broader use,
// but could also remain co-located with their components if not shared. For now, including them here for completeness
// of types related to what has been built.
