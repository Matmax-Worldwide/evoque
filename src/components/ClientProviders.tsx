/**
 * @fileoverview This component serves as a wrapper to provide essential client-side
 * context providers to parts of the application, or potentially the entire application.
 * It currently includes `SessionProvider` from NextAuth.js for managing user sessions
 * and a `React.Suspense` boundary with a skeleton loader fallback to handle
 * lazy-loaded components or data fetching states.
 */
'use client';

import { SessionProvider } from 'next-auth/react';
import { Suspense, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Props for the ClientProviders component.
 */
interface ClientProvidersProps {
  /** The child components or content to be wrapped by the client-side providers. */
  children: ReactNode;
}

/**
 * `ClientProviders` is a client-side component ('use client') designed to wrap
 * its `children` with essential context providers required for the application.
 *
 * Its primary roles are:
 * 1. **Session Management**: It wraps the `children` with `SessionProvider` from
 *    `next-auth/react`, making session data (like user authentication status)
 *    available throughout the component tree via hooks like `useSession`.
 * 2. **Suspense Handling**: It further wraps the `children` (inside `SessionProvider`)
 *    with `React.Suspense`. This allows descendant components to utilize `React.lazy`
 *    for code splitting or to perform data fetching that suspends. While suspended,
 *    a fallback UI consisting of skeleton loaders (using `Skeleton` from `ui/skeleton`)
 *    is displayed to indicate loading.
 *
 * @param {ClientProvidersProps} props - The props for the component.
 * @returns {React.JSX.Element} The children components wrapped with SessionProvider and Suspense.
 */
export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <SessionProvider>
      <Suspense fallback={
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      }>
        {children}
      </Suspense>
    </SessionProvider>
  );
} 