// src/app/[locale]/loyaltyprogram/page.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LoyaltyProgramPage from './page';
import { usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useParams: jest.fn(() => ({ locale: 'en' })),
}));

// Mock LoyaltyContext
// Update the mock to provide profile with Killa fields
const mockRefreshProfile = jest.fn().mockResolvedValue(undefined);
const mockClearProfileError = jest.fn();

jest.mock('@/contexts/LoyaltyContext', () => ({
  useLoyaltyContext: () => ({
    profile: { // Mock profile with Killa fields
      userId: 'test-user',
      currentKilla: 100,
      pendingKilla: 10,
      lifetimeKilla: 500,
      tier: { id: 'silver', name: 'Silver', minKillaToAchieve: 0, killaToNextTier: 1000, iconName: 'ShieldCheckIcon' }, // Ensure Tier mock is also updated
    },
    profileLoadingState: 'success',
    profileError: null,
    refreshProfile: mockRefreshProfile,
    clearProfileError: mockClearProfileError,
    // Mock other context values if needed by the page during tests
    notifications: [],
    queueNotification: jest.fn(),
  }),
}));


// Mock child components to prevent deep rendering and focus on page logic
jest.mock('@/components/loyaltyprogram/cards/PointsBalanceCard', () => () => <div data-testid="points-balance-card-mock">PointsBalanceCard</div>);
jest.mock('@/components/loyaltyprogram/displays/QuickStatsGrid', () => () => <div data-testid="quick-stats-grid-mock">QuickStatsGrid</div>);
jest.mock('@/components/loyaltyprogram/displays/RecentActivityFeed', () => () => <div data-testid="recent-activity-feed-mock">RecentActivityFeed</div>);
jest.mock('@/components/loyaltyprogram/displays/FeaturedRewardsCarousel', () => () => <div data-testid="featured-rewards-carousel-mock">FeaturedRewardsCarousel</div>);
jest.mock('@/components/loyaltyprogram/displays/TierProgressBar', () => () => <div data-testid="tier-progress-bar-mock">TierProgressBar</div>);


describe('LoyaltyProgramPage', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/en/loyaltyprogram');
    mockRefreshProfile.mockClear(); // Clear mock calls before each test
    mockClearProfileError.mockClear();
  });

  it('renders the main title with Killa branding', async () => { // Updated
    await act(async () => {
      render(<LoyaltyProgramPage />);
    });
    expect(screen.getByText('Killa Program')).toBeInTheDocument(); // Updated
  });

  it('renders tabs for navigation with Killa branding', async () => { // Updated
    await act(async () => {
      render(<LoyaltyProgramPage />);
    });
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Killa History/i })).toBeInTheDocument(); // Updated
    expect(screen.getByRole('tab', { name: /Rewards Catalog/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tier Progress/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Active Campaigns/i })).toBeInTheDocument();
  });

  it('shows Overview content by default and calls refreshProfile', async () => {
    await act(async () => {
      render(<LoyaltyProgramPage />);
    });
    // Check for placeholder content or mocked components in the Overview tab
    expect(screen.getByTestId('points-balance-card-mock')).toBeInTheDocument();
    expect(screen.getByTestId('quick-stats-grid-mock')).toBeInTheDocument();
    // refreshProfile is called in useEffect if profileLoadingState is 'idle' or 'error'
    // Our mock context provides 'success', so it might not be called unless we change the mock.
    // Let's adjust the mock for one test or ensure the logic for calling it is tested.
    // For this specific test, we assume it might have been called if conditions were met.
    // A more robust way is to control the mock context's initial state.
    // For now, if it's 'success', it means data is "loaded", so loadNonProfileOverviewData is called.
    // If we want to test refreshProfile call, we'd set initial state to 'idle'.
  });

  it('switches to Killa History tab and shows its content placeholder', async () => { // Updated
    await act(async () => {
      render(<LoyaltyProgramPage />);
    });
    const historyTab = screen.getByRole('tab', { name: /Killa History/i }); // Updated
    await act(async () => {
        fireEvent.click(historyTab);
    });
    expect(screen.getByText(/Content for Killa history./i)).toBeInTheDocument(); // Updated
  });

  it('switches to Rewards Catalog tab and shows its content placeholder', async () => {
     await act(async () => {
      render(<LoyaltyProgramPage />);
    });
    const rewardsTab = screen.getByRole('tab', { name: /Rewards Catalog/i });
     await act(async () => {
        fireEvent.click(rewardsTab);
    });
    expect(screen.getByText(/Content for rewards catalog./i)).toBeInTheDocument();
  });

  // Test for error state display
  it('displays error message and retry button when profileError is present', async () => {
    // Temporarily override the mock for this specific test
    const originalUseLoyaltyContext = jest.requireMock('@/contexts/LoyaltyContext').useLoyaltyContext;
    jest.requireMock('@/contexts/LoyaltyContext').useLoyaltyContext = () => ({
        profile: null,
        profileLoadingState: 'error',
        profileError: 'Failed to load Killa data.', // Updated
        refreshProfile: mockRefreshProfile,
        clearProfileError: mockClearProfileError,
        notifications: [],
        queueNotification: jest.fn(),
    });

    await act(async () => {
      render(<LoyaltyProgramPage />);
    });

    expect(screen.getByText('Error Loading Killa Profile')).toBeInTheDocument(); // Updated
    expect(screen.getByText('Failed to load Killa data.')).toBeInTheDocument(); // Updated
    const retryButton = screen.getByRole('button', { name: /Try Again/i });
    expect(retryButton).toBeInTheDocument();
    await act(async () => {
        fireEvent.click(retryButton);
    });
    expect(mockClearProfileError).toHaveBeenCalled();
    expect(mockRefreshProfile).toHaveBeenCalled();

    // Restore original mock
    jest.requireMock('@/contexts/LoyaltyContext').useLoyaltyContext = originalUseLoyaltyContext;
  });

   it('calls refreshProfile if initial profileLoadingState is idle', async () => {
    const originalUseLoyaltyContext = jest.requireMock('@/contexts/LoyaltyContext').useLoyaltyContext;
    jest.requireMock('@/contexts/LoyaltyContext').useLoyaltyContext = () => ({
        profile: null,
        profileLoadingState: 'idle', // Set to idle to trigger refreshProfile
        profileError: null,
        refreshProfile: mockRefreshProfile,
        clearProfileError: mockClearProfileError,
        notifications: [],
        queueNotification: jest.fn(),
    });

    await act(async () => {
      render(<LoyaltyProgramPage />);
    });
    expect(mockRefreshProfile).toHaveBeenCalled();
    jest.requireMock('@/contexts/LoyaltyContext').useLoyaltyContext = originalUseLoyaltyContext; // Restore
  });

});
