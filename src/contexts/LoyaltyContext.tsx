// src/contexts/LoyaltyContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
// Import updated types
import { Tier, LoyaltyProfile, PointsTransaction, Reward } from '@/types/loyalty';

// Updated mock tier data using "Killa" field names
const silverTierMock: Tier = {
  id: 'silver',
  name: 'Silver',
  minKillaToAchieve: 0,
  killaToNextTier: 1000,
  iconName: 'ShieldCheckIcon'
};
const goldTierMock: Tier = {
  id: 'gold',
  name: 'Gold',
  minKillaToAchieve: 1000,
  killaToNextTier: 5000,
  iconName: 'ShieldCheckIcon'
};


type ProfileLoadingState = 'idle' | 'loading' | 'success' | 'error';

interface LoyaltyContextState {
  profile: LoyaltyProfile | null;
  profileLoadingState: ProfileLoadingState;
  profileError: string | null;

  pendingTransactions: PointsTransaction[];
  selectedRewards: Reward[];
  notifications: string[];
  walletStatus: 'connected' | 'disconnected' | 'connecting' | 'idle';
}

interface LoyaltyContextActions {
  refreshProfile: () => Promise<void>;
  queueNotification: (message: string) => void;
  clearProfileError: () => void;
}

type LoyaltyContextType = LoyaltyContextState & LoyaltyContextActions;

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [profileLoadingState, setProfileLoadingState] = useState<ProfileLoadingState>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);

  const [pendingTransactions, setPendingTransactions] = useState<PointsTransaction[]>([]);
  const [selectedRewards, setSelectedRewards] = useState<Reward[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [walletStatus, setWalletStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'idle'>('idle');

  const refreshProfile = useCallback(async () => {
    console.log('Context: refreshProfile called to fetch Killa profile');
    setProfileLoadingState('loading');
    setProfileError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Updated mock profile data with "Killa" field names
      const mockFetchedProfile: LoyaltyProfile = {
        userId: 'user-123-context',
        currentKilla: 820, // Renamed from currentPoints
        pendingKilla: 75,  // Renamed from pendingPoints
        lifetimeKilla: 2800, // Renamed from lifetimePoints
        joinedDate: new Date(Date.now() - 120 * 86400000).toISOString(),
        tier: silverTierMock,
      };
      setProfile(mockFetchedProfile);
      setProfileLoadingState('success');
    } catch (err) {
      console.error('Context: Failed to refresh Killa profile', err);
      setProfileError(err instanceof Error ? err.message : 'Failed to load Killa profile.');
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
        setProfileLoadingState('idle');
    }
  }, [profileLoadingState]);

  const contextValue: LoyaltyContextType = {
    profile,
    profileLoadingState,
    profileError,
    pendingTransactions,
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
