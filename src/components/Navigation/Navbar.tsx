/**
 * @fileoverview This file defines the Navbar component, a responsive, client-side
 * navigation bar fixed at the top of the page. It features dynamic styling changes
 * on scroll, internationalized text, a language switcher, and separate layouts
 * for desktop and mobile views, including an animated mobile menu.
 * It also includes smooth scrolling functionality for in-page anchor links.
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import LanguageSwitcher from '../LanguageSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Props for the Navbar component.
 */
interface NavbarProps {
  /**
   * An object containing localized strings for navigation and UI elements.
   * Expected structure:
   * ```
   * {
   *   nav: {
   *     home: string,         // Text for Home link (not directly used in this Navbar version)
   *     about: string,        // Text for About link (not directly used)
   *     services: string,     // Text for Services link (not directly used)
   *     wellness: string,     // Text for Wellness link (not directly used)
   *     contact: string,      // Text for Contact link (not directly used)
   *     apply: string,        // Text for "Apply" or "Apply here"
   *     login: string,        // Text for "Login"
   *     loginOrApply: string  // Text for the combined "Login / Apply" dropdown toggle
   *   }
   * }
   * ```
   */
  dictionary: {
    nav: {
      home: string;
      about: string;
      services: string;
      wellness: string;
      contact: string;
      apply: string;
      login: string;
      loginOrApply: string;
    };
  };
  /** The current locale string (e.g., "en", "es"), used for constructing localized links. */
  locale: string;
}

/**
 * Smoothly scrolls the window to a target Y position.
 * @param {number} start - The starting Y position of the scroll.
 * @param {number} end - The target Y position to scroll to.
 * @param {number} duration - The duration of the scroll animation in milliseconds.
 */
function smoothScrollTo(start: number, end: number, duration: number) {
  const startTime = performance.now();

  function scroll(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = easeInOutCubic(progress);
    window.scrollTo(0, start + (end - start) * ease);

    if (elapsed < duration) {
      requestAnimationFrame(scroll);
    }
  }

  requestAnimationFrame(scroll);
}

/**
 * Easing function for smooth scrolling (cubic ease-in-out).
 * @param {number} t - The progress of the animation (0 to 1).
 * @returns {number} The eased value.
 */
function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * `Navbar` is a client-side component that renders the main site navigation bar.
 * It is fixed at the top of the page and features a responsive design, adapting
 * its layout for desktop and mobile views. The navbar's appearance (background, shadow)
 * changes dynamically when the user scrolls.
 *
 * **State Management:**
 * - `isOpen`: Boolean, controls the visibility of the mobile navigation menu.
 * - `scrolled`: Boolean, true if the user has scrolled more than 10 pixels down, triggering style changes.
 * - `isLoginDropdownOpen`: Boolean, controls the visibility of the "Login / Apply" dropdown on desktop.
 * - `isContactInView`: Boolean, indicates if the contact section of the page is currently in the viewport.
 *   This state is passed to the `LanguageSwitcher` to adjust its text color for better contrast.
 *
 * **Scroll and Viewport Logic:**
 * - A `useEffect` hook listens to window scroll events.
 * - `handleScroll` updates the `scrolled` state based on `window.scrollY`.
 * - It also checks if the element with ID "contact" is in view and updates `isContactInView`.
 * - The `scrolled` state dynamically alters the navbar's background, blur, shadow, and padding.
 *
 * **Desktop Navigation (md breakpoint and up):**
 * - Displays the site logo, a `LanguageSwitcher` component, and a "Login / Apply" dropdown.
 * - The "Login / Apply" dropdown is toggled by `toggleLoginDropdown`. It contains:
 *   - A "Login" link to `/{locale}/login`.
 *   - An "Apply" link that uses `smoothScrollTo` to navigate to the `#contact` section on the current page.
 *
 * **Mobile Navigation (below md breakpoint):**
 * - Displays the site logo, a `LanguageSwitcher`, and a hamburger menu icon (`Bars3Icon` or `XMarkIcon`)
 *   to toggle the mobile menu via the `toggleMenu` function.
 * - The mobile menu itself is animated using `framer-motion` (`AnimatePresence` and `motion.div`)
 *   for a smooth slide-down/up effect. It contains "Login" and "Apply here" buttons.
 *
 * All user-facing text is internationalized using the `dictionary` prop.
 *
 * @param {NavbarProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered navigation bar.
 */
export default function Navbar({ dictionary, locale }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [isContactInView, setIsContactInView] = useState(false);

  function smoothScrollTo(start: number, end: number, duration: number) {
    const startTime = performance.now();
  
    function scroll(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);
      window.scrollTo(0, start + (end - start) * ease);
  
      if (elapsed < duration) {
        requestAnimationFrame(scroll);
      }
    }
  
    requestAnimationFrame(scroll);
  }
  
  function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      // Check if contact section is in view
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const rect = contactSection.getBoundingClientRect();
        const isInView = (
          rect.top <= window.innerHeight && 
          rect.bottom >= 0
        );
        setIsContactInView(isInView);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleLoginDropdown = () => {
    setIsLoginDropdownOpen(!isLoginDropdownOpen);
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-md shadow-md py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center">
            <div className="relative h-10 w-32">
              <Image 
                src="/images/logo.png" 
                alt="E-Voque Logo" 
                fill
                sizes="128px"
                priority
                style={{ objectFit: 'contain' }}
                className={`${scrolled ? '' : ''}`}
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <LanguageSwitcher isContactInView={isContactInView} />
            <div className="relative">
              <button
                onClick={toggleLoginDropdown}
                className={`flex items-center space-x-1 px-4 py-2 rounded-md ${
                  scrolled 
                  ? 'bg-[#01319c] text-white hover:bg-[#012b88]' 
                  : 'bg-[#01319c] text-white hover:bg-[#012b88]'
                } transition-colors`}
              >
                <span>{dictionary.nav.loginOrApply}</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
              {isLoginDropdownOpen && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white/90 backdrop-blur-md rounded-md shadow-lg z-10">
                  <Link
                    href={`/${locale}/login`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:bg-white/50"
                  >
                    {dictionary.nav.login}
                  </Link>
                  <Link
                    href={`/${locale}/#contact`}
                    onClick={() => {
                      const section = document.getElementById('contact');
                      if (section) {
                        const targetY = section.getBoundingClientRect().top + window.scrollY;
                        smoothScrollTo(window.scrollY, targetY, 1500); // duración en ms (más lenta)
                      }
                      setIsLoginDropdownOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:bg-white/50"
                  >
                    {dictionary.nav.apply}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <LanguageSwitcher isContactInView={isContactInView} />
            <button
              onClick={toggleMenu}
              className={`ml-4 focus:outline-none ${scrolled ? 'text-gray-700' : 'text-[hsla(225,55%,21%,1)]'}`}
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white/90 backdrop-blur-md shadow-lg"
          >
            <div className="px-4 py-2 space-y-1">
              <div className="space-y-2 mt-4">
                <Link
                  href={`/${locale}/login`}
                  className="block px-3 py-2 bg-[#01319c] text-white hover:bg-[#012b88] rounded-md text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href={`/${locale}/#contact`}
                  className="block px-3 py-2 bg-white text-[#01319c] border border-[#01319c] hover:bg-blue-50 rounded-md text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Apply here
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
} 