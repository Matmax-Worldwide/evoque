// src/contexts/LoyaltyContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
// Assuming Tier and PointsTransaction types will be defined in src/types/loyalty.ts
// For now, we'll use placeholder types or any.
// import { Tier, PointsTransaction, Reward } from '@/types/loyalty';

// Placeholder types - replace with actual imports from '@/types/loyalty' when available
type Tier = any;
type PointsTransaction = any;
type Reward = any;

// 1. Define State and Action Interfaces
interface LoyaltyContextState {
  currentPoints: number | null;
  activeTier: Tier | null;
  pendingTransactions: PointsTransaction[];
  selectedRewards: Reward[];
  notifications: string[]; // Or a more complex Notification object
  walletStatus: 'connected' | 'disconnected' | 'connecting' | 'idle';
  isLoading: boolean;
  error: string | null;
}

interface LoyaltyContextActions {
  updateBalance: (points: number) => void;
  processRedemption: (rewardId: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  queueNotification: (message: string) => void;
  clearError: () => void;
  // Add other actions as needed
}

// Combine State and Actions for the context value
type LoyaltyContextType = LoyaltyContextState & LoyaltyContextActions;

// 2. Create the Context
const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

// 3. Implement the Context Provider
interface LoyaltyContextProviderProps {
  children: ReactNode;
}

export const LoyaltyContextProvider: React.FC<LoyaltyContextProviderProps> = ({ children }) => {
  const [currentPoints, setCurrentPoints] = useState<number | null>(null);
  const [activeTier, setActiveTier] = useState<Tier | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<PointsTransaction[]>([]);
  const [selectedRewards, setSelectedRewards] = useState<Reward[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [walletStatus, setWalletStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'idle'>('idle');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholder Actions
  const updateBalance = useCallback((points: number) => {
    console.log('Context: updateBalance called with', points);
    setCurrentPoints(prev => (prev || 0) + points); // Example update
  }, []);

  const processRedemption = useCallback(async (rewardId: string) => {
    console.log('Context: processRedemption called for rewardId', rewardId);
    setIsLoading(true);
    setError(null);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Example: Check if user has enough points, then deduct points, add reward to user profile
    // For now, just log and set loading state
    setIsLoading(false);
    // In a real scenario, you might throw an error or update state based on success
  }, []);

  const refreshProfile = useCallback(async () => {
    console.log('Context: refreshProfile called');
    setIsLoading(true);
    setError(null);
    // Simulate API call to fetch user's loyalty profile
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Example: update currentPoints, activeTier, etc.
    // setCurrentPoints(1000); // Dummy data
    // setActiveTier({ id: 'gold', name: 'Gold Tier' }); // Dummy data
    setIsLoading(false);
  }, []);

  const connectWallet = useCallback(async () => {
    console.log('Context: connectWallet called');
    setWalletStatus('connecting');
    setIsLoading(true);
    setError(null);
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    setWalletStatus('connected'); // or 'failed' and setError
    setIsLoading(false);
  }, []);

  const disconnectWallet = useCallback(() => {
    console.log('Context: disconnectWallet called');
    setWalletStatus('disconnected');
    // Clear any wallet-related state
  }, []);

  const queueNotification = useCallback((message: string) => {
    console.log('Context: queueNotification called with', message);
    setNotifications(prev => [...prev, message]);
    // Optional: auto-remove notification after some time
    setTimeout(() => {
      setNotifications(prev => prev.filter(msg => msg !== message));
    }, 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: LoyaltyContextType = {
    currentPoints,
    activeTier,
    pendingTransactions,
    selectedRewards,
    notifications,
    walletStatus,
    isLoading,
    error,
    updateBalance,
    processRedemption,
    refreshProfile,
    connectWallet,
    disconnectWallet,
    queueNotification,
    clearError,
  };

  return (
    <LoyaltyContext.Provider value={contextValue}>
      {children}
    </LoyaltyContext.Provider>
  );
};

// 4. Create a custom hook for easy consumption
export const useLoyaltyContext = (): LoyaltyContextType => {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error('useLoyaltyContext must be used within a LoyaltyContextProvider');
  }
  return context;
};
```
