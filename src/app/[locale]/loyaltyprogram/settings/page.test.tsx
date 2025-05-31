// src/app/[locale]/loyaltyprogram/settings/page.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SettingsPage from './page'; // Assuming the page is default export from ./page.tsx
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';

// Mock child components
jest.mock('@/components/loyaltyprogram/forms/NotificationPreferencesForm', () => ({
  __esModule: true,
  default: ({ initialPreferences, onSave, isSaving }: any) => (
    <div data-testid="notification-prefs-form-mock">
      Notification Preferences Form (Saving: {isSaving ? 'true' : 'false'})
      <button onClick={() => onSave(initialPreferences)}>Save Notifications</button>
    </div>
  ),
}));

jest.mock('@/components/loyaltyprogram/settings/PrivacySettingsSection', () => ({
  __esModule: true,
  default: ({ initialSettings, onSave, isSaving }: any) => (
    <div data-testid="privacy-settings-section-mock">
      Privacy Settings Section (Saving: {isSaving ? 'true' : 'false'})
      <button onClick={() => onSave(initialSettings)}>Save Privacy</button>
    </div>
  ),
}));

jest.mock('@/components/loyaltyprogram/settings/WalletConnector', () => ({
  __esModule: true,
  default: () => <div data-testid="wallet-connector-mock">Wallet Connector</div>,
}));

// Mock LoyaltyContext - primarily for WalletConnector, but good practice for page tests
jest.mock('@/contexts/LoyaltyContext');
const mockUseLoyaltyContext = useLoyaltyContext as jest.Mock;

// Default mock context value
const defaultContextValue = {
  walletStatus: 'idle',
  connectedWalletAddress: null,
  walletError: null,
  connectWallet: jest.fn().mockResolvedValue(undefined),
  disconnectWallet: jest.fn(),
  clearWalletError: jest.fn(),
  // Mock other context properties minimally as page doesn't directly use them for rendering its structure
  profile: null,
  profileLoadingState: 'idle',
  profileError: null,
  refreshProfile: jest.fn().mockResolvedValue(undefined),
  queueNotification: jest.fn(),
  clearProfileError: jest.fn(),
};


describe('SettingsPage', () => {
  beforeEach(() => {
    // Reset context mock for each test
    mockUseLoyaltyContext.mockReturnValue(defaultContextValue);
    // Clear any other mocks if necessary, e.g., fetch simulation within the page
    jest.clearAllMocks();
    // Mock global setTimeout to control its execution in tests for save status messages
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
        jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders the main title and refresh button', async () => {
    await act(async () => {
        render(<SettingsPage />);
    });
    // Wait for initial loading to complete
    await waitFor(() => expect(screen.queryByText(/Loading your settings.../i)).not.toBeInTheDocument());

    expect(screen.getByText('Loyalty Program Settings')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh All Settings/i })).toBeInTheDocument();
  });

  it('renders all settings sections (mocked children)', async () => {
     await act(async () => {
        render(<SettingsPage />);
    });
    await waitFor(() => expect(screen.queryByText(/Loading your settings.../i)).not.toBeInTheDocument());

    expect(screen.getByTestId('notification-prefs-form-mock')).toBeInTheDocument();
    expect(screen.getByTestId('privacy-settings-section-mock')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-connector-mock')).toBeInTheDocument();
    expect(screen.getByText('API Key Management (For Partners)')).toBeInTheDocument(); // Placeholder title
  });

  it('simulates fetching initial settings and hides full page loader', async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    // Full page loader should be gone after initial load simulation
    await waitFor(() => expect(screen.queryByText(/Loading your settings.../i)).not.toBeInTheDocument());
    // Check if forms are rendered (implying data loaded into them)
    expect(screen.getByTestId('notification-prefs-form-mock')).toBeInTheDocument();
  });

  it('handles saving notification preferences and displays success message', async () => {
    await act(async () => {
        render(<SettingsPage />);
    });
    await waitFor(() => expect(screen.queryByText(/Loading your settings.../i)).not.toBeInTheDocument());

    const saveNotificationsButton = screen.getByRole('button', { name: 'Save Notifications' });
    await act(async () => {
        fireEvent.click(saveNotificationsButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Notification preferences saved successfully!')).toBeInTheDocument();
    }, { timeout: 2000 });

    act(() => { jest.advanceTimersByTime(5000); });
    await waitFor(() => {
        expect(screen.queryByText('Notification preferences saved successfully!')).not.toBeInTheDocument();
    });
  });

  it('handles saving privacy settings and displays error message (simulated)', async () => {
    const originalMathRandom = global.Math.random;
    global.Math.random = () => 0.1; // Force error (since success is > 0.2 in page)

    await act(async () => {
        render(<SettingsPage />);
    });
    await waitFor(() => expect(screen.queryByText(/Loading your settings.../i)).not.toBeInTheDocument());

    const savePrivacyButton = screen.getByRole('button', { name: 'Save Privacy' });
     await act(async () => {
        fireEvent.click(savePrivacyButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to save privacy settings. Please try again.')).toBeInTheDocument();
    }, { timeout: 2000 });

    global.Math.random = originalMathRandom; // Restore Math.random
  });

  it('calls fetchAllSettings when Refresh All Settings button is clicked', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    await act(async () => {
        render(<SettingsPage />);
    });
    await waitFor(() => expect(screen.queryByText(/Loading your settings.../i)).not.toBeInTheDocument());

    consoleSpy.mockClear();

    const refreshButton = screen.getByRole('button', { name: /Refresh All Settings/i });
    await act(async () => {
        fireEvent.click(refreshButton);
    });

    await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Fetching all settings...");
    });
    consoleSpy.mockRestore();
  });
});
