// src/components/loyaltyprogram/settings/WalletConnector.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WalletConnector from './WalletConnector';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext'; // To mock its return value

// Mock the LoyaltyContext
jest.mock('@/contexts/LoyaltyContext');

const mockUseLoyaltyContext = useLoyaltyContext as jest.Mock;

describe('WalletConnector', () => {
  const mockConnectWallet = jest.fn();
  const mockDisconnectWallet = jest.fn();
  const mockClearWalletError = jest.fn();

  const defaultContextValue = {
    walletStatus: 'idle',
    connectedWalletAddress: null,
    walletError: null,
    connectWallet: mockConnectWallet,
    disconnectWallet: mockDisconnectWallet,
    clearWalletError: mockClearWalletError,
    // Mock other context properties as needed, though not directly used by WalletConnector
    profile: null,
    profileLoadingState: 'idle',
    profileError: null,
    pendingTransactions: [],
    selectedRewards: [],
    notifications: [],
    refreshProfile: jest.fn(),
    queueNotification: jest.fn(),
    clearProfileError: jest.fn(),
  };

  beforeEach(() => {
    mockConnectWallet.mockClear();
    mockDisconnectWallet.mockClear();
    mockClearWalletError.mockClear();
    // Reset to default context value before each test
    mockUseLoyaltyContext.mockReturnValue(defaultContextValue);
  });

  it('renders "Connect Wallet" button when status is "idle"', () => {
    render(<WalletConnector />);
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument();
  });

  it('renders "Connect Wallet" button when status is "disconnected" and shows disconnected message', () => {
    mockUseLoyaltyContext.mockReturnValue({ ...defaultContextValue, walletStatus: 'disconnected' });
    render(<WalletConnector />);
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeInTheDocument();
    expect(screen.getByText('You have successfully disconnected your wallet.')).toBeInTheDocument();
  });

  it('calls connectWallet when "Connect Wallet" button is clicked (if not disabled by error)', () => {
    render(<WalletConnector />);
    fireEvent.click(screen.getByRole('button', { name: /Connect Wallet/i }));
    expect(mockConnectWallet).toHaveBeenCalledTimes(1);
  });

  it('renders loading state when status is "connecting"', () => {
    mockUseLoyaltyContext.mockReturnValue({ ...defaultContextValue, walletStatus: 'connecting' });
    render(<WalletConnector />);
    expect(screen.getByRole('button', { name: /Connecting.../i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Connecting.../i }).querySelector('svg[class*="animate-spin"]')).toBeInTheDocument();
  });

  it('renders connected state with address and Disconnect button when status is "connected"', () => {
    const mockAddress = '0x123abcDef456Ghi789jKlM0nOpQ1r2s3t4Uv'; // Example full address
    mockUseLoyaltyContext.mockReturnValue({
      ...defaultContextValue,
      walletStatus: 'connected',
      connectedWalletAddress: mockAddress,
    });
    render(<WalletConnector />);
    expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
    expect(screen.getByText('0x123a...t4Uv')).toBeInTheDocument(); // Truncated
    expect(screen.getByRole('button', { name: /Disconnect/i })).toBeInTheDocument();
  });

  it('calls disconnectWallet when "Disconnect" button is clicked', () => {
    mockUseLoyaltyContext.mockReturnValue({
      ...defaultContextValue,
      walletStatus: 'connected',
      connectedWalletAddress: '0x123abcDef456Ghi789jKlM0nOpQ1r2s3t4Uv',
    });
    render(<WalletConnector />);
    fireEvent.click(screen.getByRole('button', { name: /Disconnect/i }));
    expect(mockDisconnectWallet).toHaveBeenCalledTimes(1);
  });

  it('renders error state with message and Try Again/Dismiss buttons when status is "error"', () => {
    const errorMessage = 'User denied connection.';
    mockUseLoyaltyContext.mockReturnValue({
      ...defaultContextValue,
      walletStatus: 'error',
      walletError: errorMessage,
    });
    render(<WalletConnector />);
    expect(screen.getByText('Connection Failed:')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument();
    // Connect Wallet button should be disabled if error is present
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).toBeDisabled();
  });

  it('calls clearWalletError and connectWallet when "Try Again" is clicked in error state', () => {
    mockUseLoyaltyContext.mockReturnValue({
      ...defaultContextValue,
      walletStatus: 'error',
      walletError: 'Some error',
    });
    render(<WalletConnector />);
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(mockClearWalletError).toHaveBeenCalledTimes(1);
    expect(mockConnectWallet).toHaveBeenCalledTimes(1);
  });

   it('calls clearWalletError when "Dismiss" is clicked in error state', () => {
    mockUseLoyaltyContext.mockReturnValue({
      ...defaultContextValue,
      walletStatus: 'error',
      walletError: 'Some error',
    });
    render(<WalletConnector />);
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    expect(mockClearWalletError).toHaveBeenCalledTimes(1);
    // Connect Wallet button should become enabled after dismissing error
    // This requires re-rendering or checking the state change that enables the button
    mockUseLoyaltyContext.mockReturnValue({ ...defaultContextValue, walletStatus: 'idle', walletError: null });
    render(<WalletConnector />); // Simulate re-render after error is cleared
    expect(screen.getByRole('button', { name: /Connect Wallet/i })).not.toBeDisabled();
  });
});
