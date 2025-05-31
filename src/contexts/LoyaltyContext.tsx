// src/contexts/LoyaltyContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Tier, LoyaltyProfile, PointsTransaction, Reward } from '@/types/loyalty';

// Mock Tiers (already Killa-branded)
const silverTierMock: Tier = { id: 'silver', name: 'Silver', minKillaToAchieve: 0, killaToNextTier: 1000, iconName: 'ShieldCheckIcon' };

// Loading/Status types
type ProfileLoadingState = 'idle' | 'loading' | 'success' | 'error';
type WalletStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

interface LoyaltyContextState {
  profile: LoyaltyProfile | null;
  profileLoadingState: ProfileLoadingState;
  profileError: string | null;

  // Wallet States
  walletStatus: WalletStatus;
  connectedWalletAddress: string | null;
  walletError: string | null;

  // Other existing states (can be refined or removed if not globally needed)
  pendingTransactions: PointsTransaction[];
  selectedRewards: Reward[];
  notifications: string[];
}

interface LoyaltyContextActions {
  refreshProfile: () => Promise<void>;
  queueNotification: (message: string) => void;
  clearProfileError: () => void;

  // Wallet Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  clearWalletError: () => void;
}

type LoyaltyContextType = LoyaltyContextState & LoyaltyContextActions;

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Profile states
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [profileLoadingState, setProfileLoadingState] = useState<ProfileLoadingState>('idle');
  const [profileError, setProfileError] = useState<string | null>(null);

  // Wallet states
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('idle');
  const [connectedWalletAddress, setConnectedWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Other states
  const [pendingTransactions, setPendingTransactions] = useState<PointsTransaction[]>([]);
  const [selectedRewards, setSelectedRewards] = useState<Reward[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);


  // Profile Actions
  const refreshProfile = useCallback(async () => {
    console.log('Context: refreshProfile called to fetch Killa profile');
    setProfileLoadingState('loading');
    setProfileError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      const mockFetchedProfile: LoyaltyProfile = {
        userId: 'user-123-context',
        currentKilla: 820,
        pendingKilla: 75,
        lifetimeKilla: 2800,
        joinedDate: new Date(Date.now() - 120 * 86400000).toISOString(),
        tier: silverTierMock,
      };
      setProfile(mockFetchedProfile);
      setProfileLoadingState('success');
    } catch (err) {
      console.error('Context: Failed to refresh Killa profile', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load Killa profile.';
      setProfileError(errorMsg);
      setProfileLoadingState('error');
    }
  }, []);

  const clearProfileError = useCallback(() => {
    setProfileError(null);
    if(profileLoadingState === 'error') {
        setProfileLoadingState('idle');
    }
  }, [profileLoadingState]);

  // Wallet Actions Implementation
  const connectWallet = useCallback(async () => {
    console.log('Context: connectWallet action initiated');
    setWalletStatus('connecting');
    setWalletError(null);
    setConnectedWalletAddress(null); // Clear previous address during new attempt

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate Web3 provider interaction

      // Simulate success/failure
      if (Math.random() > 0.2) { // 80% success rate
        const mockAddress = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        setConnectedWalletAddress(mockAddress);
        setWalletStatus('connected');
        console.log('Context: Wallet connected successfully', mockAddress);
        // queueNotification(`Wallet ${mockAddress.substring(0,6)}...${mockAddress.substring(mockAddress.length-4)} connected!`);
      } else {
        throw new Error('Failed to connect to wallet. User rejected or provider error.');
      }
    } catch (err) {
      console.error('Context: connectWallet failed', err);
      const errorMsg = err instanceof Error ? err.message : 'An unknown wallet connection error occurred.';
      setWalletError(errorMsg);
      setWalletStatus('error');
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    console.log('Context: disconnectWallet action initiated');
    setConnectedWalletAddress(null);
    setWalletStatus('disconnected');
    setWalletError(null); // Clear any previous errors on disconnect
    // queueNotification('Wallet disconnected.');
  }, []);

  const clearWalletError = useCallback(() => {
    setWalletError(null);
    if(walletStatus === 'error') {
        setWalletStatus('idle'); // Reset to idle so user can try again
    }
  }, [walletStatus]);


  // Other Actions
  const queueNotification = useCallback((message: string) => {
    console.log('Context: queueNotification called with', message);
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(msg => msg !== message));
    }, 5000);
  }, []);


  const contextValue: LoyaltyContextType = {
    profile,
    profileLoadingState,
    profileError,
    walletStatus,
    connectedWalletAddress,
    walletError,
    pendingTransactions,
    selectedRewards,
    notifications,
    refreshProfile,
    queueNotification,
    clearProfileError,
    connectWallet,
    disconnectWallet,
    clearWalletError,
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
