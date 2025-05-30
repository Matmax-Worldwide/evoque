/**
 * @fileoverview This file defines the AuthenticationGuard component, a client-side
 * guard used to protect child components or routes from unauthenticated access.
 * It checks the user's authentication status and redirects to a login page if
 * the user is not authenticated.
 */
'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useParams } from 'next/navigation';

interface AuthenticationGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * `AuthenticationGuard` is a client-side wrapper component that protects its
 * `children` from unauthenticated access.
 *
 * Behavior:
 * - It utilizes the `useAuth` hook to determine the user's authentication status (`isAuthenticated`)
 *   and whether the authentication state is still loading (`isLoading`).
 * - It maintains an internal `isChecking` state to manage its own readiness after `useAuth` finishes loading.
 * - If `isLoading` from `useAuth` or the internal `isChecking` state is true, it displays a loading indicator.
 * - Once loading is complete, if the user is not authenticated (`!isAuthenticated`), it redirects
 *   them to the specified `redirectTo` path. The redirection path is automatically localized
 *   using the current locale obtained from `useParams`.
 * - If the user is authenticated, it renders the `children` components.
 * - If not authenticated and after the redirect attempt, it renders `null`.
 *
 * It uses `useRouter` from `next/navigation` for client-side redirection and
 * `useParams` to get the current locale for constructing localized redirect paths.
 *
 * @param {AuthenticationGuardProps} props - The props for the component.
 * @param {ReactNode} props.children - The content or components to render if the user is authenticated.
 * @param {string} [props.redirectTo='/login'] - Optional. The path to redirect unauthenticated users to.
 *                                               Defaults to '/login'. This path will be prefixed with the current locale.
 * @returns {React.JSX.Element | null} The children if authenticated, a loading indicator, or null.
 */
const AuthenticationGuard = ({ children, redirectTo = '/login' }: AuthenticationGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string || 'en';

  useEffect(() => {
    // Only check once auth loading is complete
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to login page with the current locale
        const localizedRedirect = `/${locale}${redirectTo}`;
        router.replace(localizedRedirect);
      }
      setIsChecking(false);
    }
  }, [isAuthenticated, isLoading, router, redirectTo, locale]);

  // While we're checking authentication or loading, show a loading state
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    );
  }

  // If the user is authenticated, render the children
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthenticationGuard; 