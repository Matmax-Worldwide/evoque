// src/app/[locale]/loyaltyprogram/layout.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoyaltyProgramLayout from './layout'; // Adjust path as necessary if it's default export
import { usePathname } from 'next/navigation'; // Mock this

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
  useParams: jest.fn(() => ({ locale: 'en' })), // Provide a default mock value
}));

// Mock any context providers that LoyaltyProgramLayout might eventually use directly or indirectly
// For now, we assume LoyaltyContextProvider is not yet implemented or used in the layout shell.
// If LoyaltyContextProvider were implemented and used:
// jest.mock('@/contexts/LoyaltyContext', () => ({
//   LoyaltyContextProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
// }));

// Mock any specific components imported directly by the layout if necessary
// jest.mock('@/components/loyaltyprogram/LoyaltyProgramSidebar', () => {
//   return {
//     __esModule: true,
//     default: jest.fn(() => <div data-testid="loyalty-sidebar-mock">SidebarMock</div>),
//   };
// });

describe('LoyaltyProgramLayout', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (usePathname as jest.Mock).mockReturnValue('/en/loyaltyprogram');
  });

  it('renders children correctly', async () => {
    // The params prop is a Promise, so we need to handle that for the async component
    const mockParams = Promise.resolve({ locale: 'en' });

    render(
      <LoyaltyProgramLayout params={mockParams}>
        <div data-testid="child-content">Hello World</div>
      </LoyaltyProgramLayout>
    );

    // Wait for any async operations in the layout to complete if necessary
    // For now, the layout is simple, but this is good practice
    // await screen.findByTestId('child-content'); // Example if layout itself was async

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders the main content area', async () => {
    const mockParams = Promise.resolve({ locale: 'en' });
    render(
      <LoyaltyProgramLayout params={mockParams}>
        <div>Test Child</div>
      </LoyaltyProgramLayout>
    );

    // Check for the <main> tag or a class associated with it
    const mainElement = screen.getByRole('main'); // Assumes <main> tag is used
    expect(mainElement).toBeInTheDocument();
  });
});
