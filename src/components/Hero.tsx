/**
 * @fileoverview This file defines the Hero component, a client-side, full-screen
 * hero section for the website. It features internationalized text content,
 * animations powered by framer-motion, and call-to-action buttons.
 * It also includes an illustrative SVG component.
 */
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

/**
 * Props for the Hero component.
 */
interface HeroProps {
  /**
   * An object containing localized strings for the hero section.
   * Expected structure:
   * ```
   * {
   *   hero: {
   *     title: string,    // Main headline
   *     subtitle: string, // Supporting text below the headline
   *     cta: string       // Text for the primary call-to-action button (e.g., "Register")
   *   }
   * }
   * ```
   */
  dictionary: {
    hero: {
      title: string;
      subtitle: string;
      cta: string;
    };
  };
  /** The current locale string (e.g., "en", "es"), used for constructing localized links. */
  locale: string;
}

/**
 * `InterpretationSVG` is a presentational SVG component used as a visual
 * illustration within the Hero section. It depicts a headset and chat bubbles,
 * symbolizing interpretation or communication services.
 *
 * @param {React.SVGProps<SVGSVGElement>} props - Standard React SVG props that can be passed to an SVG element.
 * @returns {React.JSX.Element} The rendered SVG illustration.
 */
function InterpretationSVG(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="95" stroke="#3B82F6" strokeWidth="5" fill="#F9FAFB" />

      {/* Headset */}
      <path
        d="M50 80 C50 50, 150 50, 150 80 M50 120 C50 150, 150 150, 150 120"
        stroke="#3B82F6"
        strokeWidth="4"
        fill="none"
      />
      <circle cx="45" cy="100" r="5" fill="#3B82F6" />
      <circle cx="155" cy="100" r="5" fill="#3B82F6" />
      <path
        d="M70 140 L70 160 Q100 170, 130 160 L130 140"
        stroke="#3B82F6"
        strokeWidth="4"
        fill="none"
      />

      {/* Chat bubbles */}
      <rect x="60" y="40" width="40" height="20" rx="5" ry="5" fill="#8B5CF6" />
      <rect x="100" y="50" width="40" height="20" rx="5" ry="5" fill="#3B82F6" />

      {/* Tiny text indicators */}
      <circle cx="70" cy="50" r="2" fill="#F9FAFB" />
      <circle cx="80" cy="50" r="2" fill="#F9FAFB" />
      <circle cx="90" cy="50" r="2" fill="#F9FAFB" />

      <circle cx="110" cy="60" r="2" fill="#F9FAFB" />
      <circle cx="120" cy="60" r="2" fill="#F9FAFB" />
      <circle cx="130" cy="60" r="2" fill="#F9FAFB" />
    </svg>
  );
}

/**
 * The `Hero` component renders the main hero section of the website.
 * It is designed to be full-screen and visually engaging, featuring animated
 * background elements, internationalized text content, and clear calls to action.
 *
 * Visual Elements:
 * - **Animated Background**: Subtle, continuously moving decorative shapes to add visual interest.
 * - **Main Content Area**:
 *   - A hardcoded tagline: "Professional Interpretation".
 *   - A dynamic title and subtitle, sourced from the `dictionary` prop.
 *   - Two call-to-action (CTA) buttons:
 *     - "Register" (text from `dictionary.hero.cta`), linking to `/{locale}/register`.
 *     - "Explore Services", linking to `/{locale}/services`.
 * - **Illustration**: The `InterpretationSVG` component is displayed alongside the text content,
 *   with a subtle scale animation on hover, managed by the `isHovered` state.
 *
 * Animations are implemented using `framer-motion` for both the background elements
 * and the main content's entry animation.
 *
 * @param {HeroProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered Hero section.
 */
export default function Hero({ dictionary, locale }: HeroProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative h-screen w-full bg-gradient-to-b from-white to-blue-50 overflow-hidden flex items-center">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary-100 opacity-60"
          animate={{
            x: [0, 30, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-32 h-32 rounded-full bg-indigo-100 opacity-60"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full bg-blue-100 opacity-60"
          animate={{
            x: [0, 20, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-2 inline-block px-4 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
            >
              Professional Interpretation
            </motion.div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              {dictionary.hero.title}
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              {dictionary.hero.subtitle}
            </p>
            <motion.div 
              className="mt-8 flex flex-wrap gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <Link
                href={`/${locale}/register`}
                className="btn-primary text-lg px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1"
              >
                {dictionary.hero.cta}
              </Link>
              <Link
                href={`/${locale}/services`}
                className="border-2 border-gray-300 text-gray-700 text-lg px-6 py-3 rounded-lg hover:bg-gray-50 transform transition-all duration-300 hover:-translate-y-1"
              >
                Explore Services
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <motion.div 
              className="relative z-10 flex justify-center"
              animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <InterpretationSVG className="w-full h-auto max-w-md" />
            </motion.div>
            
            {/* Interactive elements */}
            <motion.div
              className="absolute -top-8 -right-8 w-16 h-16 bg-primary-200 rounded-full z-0"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-10 -left-8 w-12 h-12 bg-indigo-300 rounded-full z-0"
              animate={{
                y: [0, 10, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            <motion.div
              className="absolute -bottom-4 right-12 w-8 h-8 bg-primary-300 rounded-md rotate-12 z-0"
              animate={{
                rotate: [12, 45, 12],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
} 