// src/app/[locale]/loyaltyprogram/page.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoyaltyProgramPage from './page'; // Adjust path as necessary
import { usePathname } from 'next/navigation'; // Mock this

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useParams: jest.fn(() => ({ locale: 'en' })),
}));

// If LoyaltyProgramPage uses useLoyaltyContext, it needs to be wrapped in LoyaltyContextProvider
// For now, the page shell doesn't use it, but if it did:
// import { LoyaltyContextProvider } from '@/contexts/LoyaltyContext';
// const renderWithProviders = (ui: React.ReactElement) => {
//   return render(<LoyaltyContextProvider>{ui}</LoyaltyContextProvider>);
// };

describe('LoyaltyProgramPage', () => {
  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/en/loyaltyprogram');
  });

  it('renders the main title', () => {
    render(<LoyaltyProgramPage />);
    // Assuming the title "Loyalty Program" is present
    expect(screen.getByText('Loyalty Program')).toBeInTheDocument();
  });

  it('renders tabs for navigation', () => {
    render(<LoyaltyProgramPage />);
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Points History/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Rewards Catalog/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Tier Progress/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Active Campaigns/i })).toBeInTheDocument();
  });

  it('shows Overview content by default', () => {
    render(<LoyaltyProgramPage />);
    // Check for content unique to the Overview tab's placeholder
    expect(screen.getByText(/Content for the loyalty program overview will be displayed here./i)).toBeInTheDocument();
  });

  it('switches to Points History tab and shows its content', () => {
    render(<LoyaltyProgramPage />);
    const historyTab = screen.getByRole('tab', { name: /Points History/i });
    fireEvent.click(historyTab);
    expect(screen.getByText(/Content for points history will be displayed here./i)).toBeInTheDocument();
  });

  it('switches to Rewards Catalog tab and shows its content', () => {
    render(<LoyaltyProgramPage />);
    const rewardsTab = screen.getByRole('tab', { name: /Rewards Catalog/i });
    fireEvent.click(rewardsTab);
    expect(screen.getByText(/Content for rewards catalog will be displayed here./i)).toBeInTheDocument();
  });

  // Add similar tests for other tabs (Tiers, Campaigns)
});
