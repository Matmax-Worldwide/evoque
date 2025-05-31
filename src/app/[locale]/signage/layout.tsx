// src/app/[locale]/signage/layout.tsx
'use client';

// import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext'; // Example if needed
import SignageSidebar from '@/app/[locale]/signage/frontend/components/navigation/SignageSidebar'; // Corrected path
import React, { use } from 'react';

interface SignageLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default function SignageLayout({ children, params }: SignageLayoutProps) {
  const { locale } = use(params);

  return (
    // <UnsavedChangesProvider> // Example if you have such a provider
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <SignageSidebar locale={locale} />
        <main className="flex-1 overflow-y-auto"> {/* Changed overflow-auto to overflow-y-auto for main content scroll */}
          <div className="p-6"> {/* Added padding here instead of directly on main if sidebar has fixed height issues */}
            {children}
          </div>
        </main>
      </div>
    // </UnsavedChangesProvider>
  );
}
