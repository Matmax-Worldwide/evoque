'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Helper function to set a cookie with better security practices
function setCookie(name: string, value: string, days: number) {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    return true;
  } catch (error) {
    console.error('Error setting cookie:', error);
    return false;
  }
}

export default function LoginPage() {
  const { locale } = useParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      console.log('Sending login request...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response received');

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store the user and token in the auth context
      if (data.user && data.token) {
        // First set the cookie
        const cookieSet = setCookie('session-token', data.token, 7); // 7 days expiry
        console.log('Set session-token cookie:', cookieSet ? 'Success' : 'Failed');
        
        // Then update auth context
        login(data.user, data.token);
        
        // Store login success in sessionStorage (this persists across a page refresh)
        sessionStorage.setItem('justLoggedIn', 'true');
        
        // Use window.location for a full page refresh instead of Next.js router
        // This prevents React hydration issues when transitioning after login
        window.location.href = `/${locale}/dashboard`;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <div
        className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b z-10 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, #1a253b, rgba(26, 37, 59, 0.5), transparent)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#01112A] via-[#01319c] to-[#1E0B4D] opacity-95 z-0" />
      
      {/* Stars animation effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.2, 1] }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10 px-4">
        <div className="flex flex-col items-center">
          <Link href={`/${locale}`}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Image 
              src="/logo.png" 
              alt="E-voque Logo" 
              width={150} 
              height={150}
              className="mb-6" 
            />
          </motion.div>
          </Link>
          
          <motion.h2 
            className="text-center text-3xl font-extrabold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Welcome Back
          </motion.h2>
          <motion.p
            className="mt-2 text-center text-sm text-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Sign in to access your account
          </motion.p>
        </div>
        
        <motion.div
          className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 shadow-2xl shadow-blue-500/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-400/30 backdrop-blur-sm p-4 border border-red-400/50">
                <div className="text-sm text-white">{error}</div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/50 transition-all duration-300"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/50 transition-all duration-300"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.03, boxShadow: '0 0 15px 5px rgba(59, 130, 246, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-md font-bold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 