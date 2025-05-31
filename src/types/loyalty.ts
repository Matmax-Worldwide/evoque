// src/types/loyalty.ts

/**
 * This file contains the core TypeScript interfaces for the Loyalty Program module.
 * These interfaces will be populated with specific properties as development progresses
 * and features are implemented.
 */

export interface LoyaltyProfile {
  // Example properties (to be refined):
  // userId: string;
  // currentPoints: number;
  // tierId?: string;
  // lifetimePoints?: number;
  // joinedDate?: Date;
}

export interface PointsTransaction {
  // Example properties:
  // id: string;
  // type: 'earn' | 'redeem' | 'transfer_in' | 'transfer_out' | 'bonus' | 'adjustment';
  // points: number;
  // description?: string;
  // transactionDate: Date;
  // relatedCampaignId?: string;
  // relatedRewardId?: string;
}

export interface Reward {
  // Example properties:
  // id: string;
  // name: string;
  // description?: string;
  // pointsRequired: number;
  // category?: string; // e.g., 'product', 'service', 'discount'
  // imageUrl?: string;
  // stock?: number; // -1 for unlimited
  // isActive: boolean;
  // validityStartDate?: Date;
  // validityEndDate?: Date;
}

export interface Tier {
  // Example properties:
  // id: string;
  // name: string;
  // description?: string;
  // pointsThreshold: number; // Points required to reach this tier
  // benefits: string[]; // List of benefits
  // iconUrl?: string;
  // multiplier?: number; // Points earning multiplier
}

export interface Campaign {
  // Example properties:
  // id: string;
  // name: string;
  // description?: string;
  // startDate: Date;
  // endDate: Date;
  // type: 'points_multiplier' | 'bonus_points' | 'product_discount' | 'event_access';
  // earningMultiplier?: number;
  // bonusPoints?: number;
  // eligibilityRules?: any; // Define specific rules later
  // isActive: boolean;
}

export interface RedemptionRequest {
  // Example properties:
  // id: string;
  // userId: string;
  // rewardId: string;
  // pointsSpent: number;
  // requestDate: Date;
  // status: 'pending' | 'approved' | 'rejected' | 'completed';
  // fulfillmentDetails?: any; // e.g., voucher code, shipping info
}

export interface WalletConnection {
  // Example properties:
  // walletAddress: string;
  // provider: 'metamask' | 'walletconnect' | string; // Can be extended
  // connectedDate: Date;
  // isActive: boolean;
}

export interface LoyaltyAnalytics {
  // This might be a collection of different stats rather than a single object
  // Example (could be part of a larger dashboard type):
  // totalPointsEarned?: number;
  // totalPointsRedeemed?: number;
  // activeUsers?: number;
  // redemptionRate?: number;
}

export interface EarningRule {
  // Example properties:
  // id: string;
  // action: string; // e.g., 'purchase', 'referral', 'social_share'
  // pointsEarned: number;
  // conditions?: any; // e.g., minimum purchase amount
  // isActive: boolean;
}

export interface NotificationPreferences {
  // Example properties:
  // userId: string;
  // emailNotifications: {
  //   promotions?: boolean;
  //   pointsUpdates?: boolean;
  //   tierUpdates?: boolean;
  // };
  // smsNotificationsEnabled?: boolean;
  // pushNotificationsEnabled?: boolean;
}

// Add other core types as identified in the guidelines or during development.
