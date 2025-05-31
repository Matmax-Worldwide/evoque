// src/app/[locale]/loyaltyprogram/layout.tsx
'use client';

import { use } from 'react';
// import LoyaltyProgramSidebar from '@/components/loyaltyprogram/LoyaltyProgramSidebar';
// import { LoyaltyContextProvider } from '@/contexts/LoyaltyContext';

interface LoyaltyProgramLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default function LoyaltyProgramLayout({ children, params }: LoyaltyProgramLayoutProps) {
  const { locale } = use(params); // Ensure 'use' is imported from 'react'

  return (
    // <LoyaltyContextProvider> // To be implemented later
      <div className="flex h-screen bg-gray-50"> {/* Mimic structure from BookingsLayout */}
        {/* <LoyaltyProgramSidebar locale={locale} /> */} {/* To be implemented later */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    // </LoyaltyContextProvider> // To be implemented later
  );
}
