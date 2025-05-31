/**
 * @fileoverview This file defines the ModernLoader component, a client-side
 * custom loading indicator. It offers multiple visual styles (variants),
 * an optional text message, and an optional progress bar display.
 * Animations are implemented using `framer-motion`.
 */
'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Props for the ModernLoader component.
 */
interface ModernLoaderProps {
  /**
   * The visual style of the loader.
   * - 'apple': An Apple-style spinning loader with a pulsing background and centered message/progress.
   * - 'netflix': A Netflix-style loader with three vertical pulsing bars.
   * - 'google': A Google-style loader with a multi-colored circular spinner.
   * - 'minimal': A simple circular border spinner.
   * @default 'apple'
   */
  variant?: 'apple' | 'netflix' | 'google' | 'minimal';
  /**
   * Optional text message displayed with the loader.
   * @default 'Cargando...'
   */
  message?: string;
  /**
   * Optional current progress value (0-100).
   * Only displayed if `showProgress` is true and `variant` is 'apple'.
   */
  progress?: number;
  /**
   * Whether to display the progress bar and percentage.
   * Currently effective only for the 'apple' variant.
   * @default false
   */
  showProgress?: boolean;
  /**
   * Size of the loader animation.
   * 'sm': Small
   * 'md': Medium
   * 'lg': Large
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /** Optional additional CSS classes for custom styling of the loader container. */
  className?: string;
}

/**
 * `ModernLoader` is a client-side component that displays a versatile and animated
 * loading indicator. It supports multiple visual styles (`variant`), can show a
 * custom message, and optionally display a progress bar (primarily for the 'apple' variant).
 *
 * Internal Loader Style Functions:
 * - `AppleLoader`: Renders an Apple-inspired circular spinner with a pulsing background,
 *   a message, and an optional progress bar. Typically covers the full screen.
 * - `NetflixLoader`: Renders a Netflix-inspired loader with three red vertical bars
 *   animating their scale. Typically covers the full screen.
 * - `GoogleLoader`: Renders a Google-inspired loader with a circular spinner composed
 *   of four colored arcs. Typically covers the full screen.
 * - `MinimalLoader`: Renders a simple, unopinionated circular border spinner that can be
 *   embedded within other components (does not cover full screen by default).
 *
 * The `variant` prop determines which of these loader styles is rendered.
 * Animations are powered by `framer-motion`.
 *
 * @param {ModernLoaderProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered loading indicator.
 */
const ModernLoader: React.FC<ModernLoaderProps> = ({
  variant = 'apple',
  message = 'Cargando...',
  progress,
  showProgress = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const AppleLoader = () => (
    <div className={`fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999] ${className}`}>
      <div className="text-center">
        {/* Apple-style spinning loader */}
        <div className="relative mb-8">
          <motion.div
            className={`${sizeClasses[size]} mx-auto`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <svg
              className="w-full h-full text-white"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="60 20"
                className="opacity-75"
              />
            </svg>
          </motion.div>
          
          {/* Pulsing background circle */}
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} mx-auto rounded-full bg-white/10`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-white text-lg font-medium mb-4"
        >
          {message}
        </motion.div>

        {/* Progress bar */}
        {showProgress && progress !== undefined && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-64 mx-auto"
          >
            <div className="bg-white/20 rounded-full h-1 overflow-hidden">
              <motion.div
                className="bg-white h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <div className="text-white/70 text-sm mt-2">
              {progress}%
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );

  const NetflixLoader = () => (
    <div className={`fixed inset-0 bg-black flex items-center justify-center z-[9999] ${className}`}>
      <div className="text-center">
        <div className="flex space-x-1 mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-8 bg-red-600 rounded"
              animate={{
                scaleY: [1, 2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-xl font-bold"
        >
          {message}
        </motion.div>
      </div>
    </div>
  );

  const GoogleLoader = () => (
    <div className={`fixed inset-0 bg-white flex items-center justify-center z-[9999] ${className}`}>
      <div className="text-center">
        <div className="relative mb-8">
          <motion.div
            className={`${sizeClasses[size]} mx-auto`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <svg className="w-full h-full" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#4285f4"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="15 85"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#ea4335"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="15 85"
                strokeDashoffset="25"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#fbbc04"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="15 85"
                strokeDashoffset="50"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#34a853"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="15 85"
                strokeDashoffset="75"
                fill="none"
              />
            </svg>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-700 text-lg font-medium"
        >
          {message}
        </motion.div>
      </div>
    </div>
  );

  const MinimalLoader = () => (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );

  switch (variant) {
    case 'apple':
      return <AppleLoader />;
    case 'netflix':
      return <NetflixLoader />;
    case 'google':
      return <GoogleLoader />;
    case 'minimal':
      return <MinimalLoader />;
    default:
      return <AppleLoader />;
  }
};

export default ModernLoader; 