// src/types/loyalty.ts

/**
 * This file contains the core TypeScript interfaces for the Loyalty Program module.
 * Branding: Loyalty currency is "Killa", symbol "KLA".
 */

import { type LucideIcon } from 'lucide-react';

export interface Tier {
  id: string;
  name: string;
  description?: string;
  // Killa required to enter this tier (absolute value from 0)
  minKillaToAchieve: number;
  // Killa required to enter the *next* tier (absolute value from 0)
  // If this is the highest tier, this might be undefined or Infinity
  killaToNextTier?: number;
  benefits?: string[];
  iconName?: string; // For mapping to a LucideIcon or for an image URL
  multiplier?: number; // Killa earning multiplier
}

export interface LoyaltyProfile {
  userId: string;
  currentKilla: number;
  pendingKilla?: number;
  lifetimeKilla?: number;
  joinedDate?: string | Date; // ISO string or Date object
  tier?: Tier; // Embed Tier object or just tierId
}

// Consider if "Points" in this type name itself should change, e.g., KillaTransactionType
// For now, keeping as PointsTransactionType but the `points` field will change.
export type PointsTransactionType = 'earn' | 'redeem' | 'bonus' | 'adjustment' | 'other' | 'transfer_in' | 'transfer_out';

export interface PointsTransaction {
  id: string;
  type: PointsTransactionType;
  // Amount of Killa. Positive for earn/bonus/transfer_in, negative for redeem/transfer_out/adjustment
  killaAmount: number;
  description: string;
  transactionDate: string | Date; // ISO string or Date object
  relatedCampaignId?: string;
  relatedRewardId?: string;
  customIconName?: string;
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  killaRequired: number; // Killa needed to redeem this reward
  category?: string;
  imageUrl?: string;
  stock?: number;
  isActive: boolean;
  validityStartDate?: string | Date;
  validityEndDate?: string | Date;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  type?: 'killa_multiplier' | 'bonus_killa' | 'product_discount' | 'event_access'; // Updated type example
  isActive?: boolean;
  // Example: if type is killa_multiplier
  // killaMultiplierValue?: number;
  // Example: if type is bonus_killa
  // bonusKillaAmount?: number;
}

export interface RedemptionRequest {
  id: string;
  userId?: string;
  rewardId?: string;
  killaSpent?: number; // Killa spent for this redemption
  requestDate?: string | Date;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
}

export interface WalletConnection {
  walletAddress?: string;
  provider?: string;
  connectedDate?: string | Date;
  isActive?: boolean;
}

export interface LoyaltyAnalytics {
  totalKillaEarned?: number; // Example update
  totalKillaRedeemed?: number; // Example update
  // ... other analytics fields
}

export interface EarningRule {
  id: string;
  action?: string;
  killaEarned: number; // Killa earned for this action
  isActive?: boolean;
}

export interface NotificationPreferences {
  userId?: string;
  emailNotifications?: {
    promotions?: boolean;
    killaUpdates?: boolean; // Example update
    tierUpdates?: boolean;
  };
}

// --- Component-specific types (moved here for centralization) ---

export interface StatDisplayItem {
  id: string;
  label: string;
  value: string | number; // Value can be Killa amount or other metrics
  icon?: LucideIcon;
  unit?: string; // e.g., "KLA" for Killa, "%" for percentages
  bgColor?: string;
  textColor?: string;
}

export interface ActivityFeedItem {
  id: string;
  description: string;
  killaAmount?: number; // Killa involved in the activity
  date: string | Date;
  icon?: LucideIcon;
  type?: PointsTransactionType;
}

export interface FeaturedCarouselRewardItem {
  id: string;
  name: string;
  killaRequired: number; // Killa needed for this reward
  imageUrl?: string;
  category?: string;
}

export interface TierProgressDisplayInfo {
    currentTierName?: string;
    nextTierName?: string;
    currentKillaInTier: number; // Killa accumulated *within* the current tier range
    killaNeededForNextTier: number; // Total Killa (relative to current tier start) to reach next tier
}
