/**
 * @fileoverview This module provides utility functions for managing client-side
 * authorization headers. These functions are intended for browser environments
 * as they interact with `document.cookie` and `window.fetch`.
 */

// Utility functions for managing authorization headers

// Extend Window interface to include our custom properties
declare global {
  interface Window {
    __originalFetch?: typeof fetch;
  }
}

// SSR safe check
const isBrowser = typeof window !== 'undefined';

/**
 * Gets the current session token from cookies.
 * This function is browser-only due to its use of `document.cookie`.
 * @returns The session token string if found, otherwise null.
 */
export function getSessionToken(): string | null {
  if (!isBrowser) return null;
  
  try {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('session-token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1].trim();
    }
  } catch (error) {
    console.error('Error reading session token:', error);
  }
  
  return null;
}

/**
 * Sets the authorization header globally for all `fetch` requests.
 * This function is browser-only as it modifies `window.fetch`.
 * @param token - The token to set in the Authorization header. If null, it effectively clears the global header.
 * @returns void
 */
export function setGlobalAuthorizationHeader(token: string | null): void {
  if (!isBrowser) return;
  
  try {
    // Store the original fetch if not already stored
    if (!window.__originalFetch) {
      window.__originalFetch = window.fetch;
    }
    
    // Set up fetch interceptor
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      const headers = new Headers(init?.headers);
      
      // Only add authorization header if not already present and token exists
      if (!headers.has('authorization') && token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return window.__originalFetch!(input, { ...init, headers });
    };
    
    console.log('Global authorization header configured:', token ? 'with token' : 'cleared');
  } catch (error) {
    console.error('Error setting global authorization header:', error);
  }
}

/**
 * Clears the global authorization header by setting the token to null.
 * This function is browser-only.
 * @returns void
 */
export function clearGlobalAuthorizationHeader(): void {
  setGlobalAuthorizationHeader(null);
}

/**
 * Initializes the global authorization header by attempting to retrieve
 * the token from cookies and setting it.
 * This function is browser-only.
 * @returns void
 */
export function initializeAuthorizationHeader(): void {
  const token = getSessionToken();
  if (token) {
    setGlobalAuthorizationHeader(token);
  }
}

/**
 * Creates a headers object with an Authorization header if a session token is available.
 * This function is browser-only due to its use of `getSessionToken`.
 * @param additionalHeaders - Optional additional headers to include.
 * @returns A record of header key-value pairs.
 */
export function createAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
} 