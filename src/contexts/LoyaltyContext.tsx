// src/contexts/LoyaltyContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Tier, LoyaltyProfile, PointsTransaction, Reward } from '@/types/loyalty';

// Placeholder types if not fully defined - these should ideally come from a robust mock data source or API spec
const silverTierMock: Tier = { id: 'silver', name: 'Silver', minPoints: 0, pointsToNextTier: 1000, iconName: 'ShieldCheckIcon' };
const goldTierMock: Tier = { id: 'gold', name: 'Gold', minPoints: 1000, pointsToNextTier: 5000, iconName: 'ShieldCheckIcon' };


type ProfileLoadingState = 'idle' | 'loading' | 'success' | 'error';

interface LoyaltyContextState {
  profile: LoyaltyProfile | null;
  profileLoadingState: ProfileLoadingState;
  profileError: string | null;

  // Keep other states if they are truly global, or manage them locally in components
  pendingTransactions: PointsTransaction[]; // Example, might be fetched per page
  selectedRewards: Reward[]; // Example, likely UI state, not global data
  notifications: string[];
  walletStatus: 'connected' | 'disconnected' | 'connecting' | 'idle';
}

interface LoyaltyContextActions {
  refreshProfile: () => Promise<void>;
  // connectWallet: () => Promise<void>; // Keep if relevant
  // disconnectWallet: () => void; // Keep if relevant
  queueNotification: (message: string) => void;
  clearProfileError: () => void;
  // updateBalance: (points: number) => void; // This might be part of refreshProfile or specific mutations
  // processRedemption: (rewardId: string) => Promise<void>; // This is a specific action, likely not just context update
}

type LoyaltyContextType = LoyaltyContextState & LoyaltyContextActions;

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [profileLoadingState, setProfileLoadingState] = useState<ProfileLoadingState>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);

  // Other states - consider if they are truly global or should be local to specific components/pages
  const [pendingTransactions, setPendingTransactions] = useState<PointsTransaction[]>([]);
  const [selectedRewards, setSelectedRewards] = useState<Reward[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [walletStatus, setWalletStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'idle'>('idle');

  const refreshProfile = useCallback(async () => {
    console.log('Context: refreshProfile called');
    setProfileLoadingState('loading');
    setProfileError(null);
    try {
      // Simulate API call to fetch user's loyalty profile
      await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate delay

      // Mocked profile data
      const mockFetchedProfile: LoyaltyProfile = {
        userId: 'user-123-context',
        currentPoints: 820,
        pendingPoints: 75,
        lifetimePoints: 2800,
        joinedDate: new Date(Date.now() - 120 * 86400000).toISOString(),
        tier: silverTierMock, // Assigning the mock tier
      };
      setProfile(mockFetchedProfile);
      setProfileLoadingState('success');
    } catch (err) {
      console.error('Context: Failed to refresh profile', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to load profile.');
      setProfileLoadingState('error');
    }
  }, []);

  const queueNotification = useCallback((message: string) => {
    console.log('Context: queueNotification called with', message);
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(msg => msg !== message));
    }, 5000);
  }, []);

  const clearProfileError = useCallback(() => {
    setProfileError(null);
    if(profileLoadingState === 'error') {
        setProfileLoadingState('idle'); // Reset state if error is cleared
    }
  }, [profileLoadingState]);

  // Consider if an initial profile load is needed when context provider mounts
  // useEffect(() => {
  //   refreshProfile();
  // }, [refreshProfile]);


  const contextValue: LoyaltyContextType = {
    profile,
    profileLoadingState,
    profileError,
    pendingTransactions, // Pass through other states if kept global
    selectedRewards,
    notifications,
    walletStatus,
    refreshProfile,
    queueNotification,
    clearProfileError,
  };

  return (
    <LoyaltyContext.Provider value={contextValue}>
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyaltyContext = (): LoyaltyContextType => {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error('useLoyaltyContext must be used within a LoyaltyContextProvider');
  }
  return context;
};
