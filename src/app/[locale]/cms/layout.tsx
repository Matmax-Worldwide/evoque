'use client';

import React from 'react';
import CMSSidebar from '@/components/CMSSidebar';
import { useParams } from 'next/navigation';
import { UnsavedChangesProvider } from '@/contexts/UnsavedChangesContext';

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <UnsavedChangesProvider>
      <div className="flex h-screen">
        <CMSSidebar locale={locale} />
        <div className="flex-1 overflow-auto">
        {/* This is a nested layout inside the admin layout */}
        {children}
        </div>
      </div>
    </UnsavedChangesProvider>
  );
} 