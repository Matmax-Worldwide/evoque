'use client';

import { useEffect } from 'react';
import { initializeAuthorizationHeader } from '@/lib/auth-header';

/**
 * @fileoverview This component is responsible for initializing the global
 * authorization header for client-side API requests. It achieves this by
 * calling the `initializeAuthorizationHeader` utility function when the
 * component mounts. This is crucial for ensuring that authenticated API
 * requests can be made immediately after the application loads on the client side,
 * provided a session token exists.
 */
'use client';

import { useEffect } from 'react';
import { initializeAuthorizationHeader } from '@/lib/auth-header';

/**
 * The `AuthInitializer` component serves a single purpose: to initialize
 * the global authorization header for client-side API requests.
 *
 * It uses a `useEffect` hook that runs once when the component mounts.
 * Inside this hook, it calls `initializeAuthorizationHeader()`, which attempts
 * to retrieve a session token from cookies and set up the global `fetch`
 * interceptor to include the Authorization header in subsequent API calls.
 *
 * This component does not render any visual output (it returns `null`)
 * and does not accept any props. Its role is purely for the side effect of
 * initializing the authorization mechanism.
 *
 * @returns {null} This component does not render any UI.
 */
export function AuthInitializer() {
  useEffect(() => {
    // Initialize authorization header from stored token
    initializeAuthorizationHeader();
  }, []);

  // This component doesn't render anything
  return null;
} 