/**
 * @fileoverview This file defines the NavigationHeader component, a responsive,
 * client-side navigation header that is fixed at the top of the page.
 * Its structure, including multi-level dropdown menus, is dynamically generated
 * from a `menu` object prop. The header also features scroll-based style changes
 * (e.g., background, padding, shadow) for a modern user experience.
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDownIcon, MenuIcon, XIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Menu, MenuItem } from '@/app/api/graphql/types'; // Assumed to be documented at source

/**
 * Props for the NavigationHeader component.
 * The `Menu` and `MenuItem` types are imported from '@/app/api/graphql/types'
 * and are expected to define the structure of the navigation menu data.
 */
interface NavigationHeaderProps {
  /**
   * The `Menu` object that defines the navigation links and their hierarchy.
   * This object typically contains an array of `MenuItem` objects.
   */
  menu: Menu;
  /** Optional URL for the site logo to be displayed in the header. */
  logoUrl?: string;
  /**
   * Optional title for the header, often the site or company name.
   * Defaults to `menu.name` if not provided.
   */
  title?: string;
  /** Optional subtitle or tagline displayed below the header title. */
  subtitle?: string;
  /** Optional additional CSS class names to apply to the header's root element. */
  className?: string;
  /**
   * Optional current locale string (e.g., "en", "es").
   * If not provided, it falls back to `useParams` to get the locale from the URL,
   * defaulting to 'en' if still unavailable. Used for constructing localized link URLs.
   */
  locale?: string;
}

/**
 * `NavigationHeader` is a client-side component that renders a dynamic and responsive
 * main navigation header. It is fixed to the top and changes its styling based on scroll position.
 * The navigation links, including multi-level dropdowns, are generated from the `menu` prop.
 *
 * **State Management:**
 * - `isScrolled`: Boolean, true if the page has been scrolled more than 10 pixels,
 *   triggering style changes (background, padding, shadow).
 * - `isMobileMenuOpen`: Boolean, controls the visibility of the collapsible mobile menu.
 * - `openDropdowns`: Record<string, boolean>, tracks the open/closed state of individual
 *   dropdown menus (identified by `MenuItem.id`) for both desktop and mobile.
 *
 * **Dynamic Menu Rendering:**
 * - The `renderMenuItem` function is a recursive helper that generates the navigation UI.
 *   - For `MenuItem` objects with `children`, it creates a dropdown trigger (button with title and ChevronDownIcon).
 *     The visibility of these dropdowns is managed by the `openDropdowns` state and the `toggleDropdown` function.
 *     - On desktop, nested dropdowns are typically shown on hover (CSS-driven via `group-hover`) for the first level.
 *     - On mobile, or for deeper nested dropdowns on desktop, they are toggled by click.
 *   - For `MenuItem` objects without `children`, it renders a direct `Link`.
 *   - Link URLs are constructed using `item.url` if present, otherwise from `item.page.slug`
 *     prefixed with the current `locale`. Defaults to '#' if neither is available.
 *
 * **Responsive Behavior:**
 * - **Desktop View (md breakpoint and up):** Displays a horizontal list of primary menu items.
 *   Top-level items with children show dropdowns on hover/click.
 * - **Mobile View (below md breakpoint):** Displays a hamburger icon (`MenuIcon`). Clicking it
 *   toggles the `isMobileMenuOpen` state, showing or hiding a collapsible menu panel
 *   that lists all navigation items vertically. Dropdowns within the mobile menu are click-to-open.
 * - A click-outside listener (in `useEffect`) closes the mobile menu if a click occurs
 *   outside the header area.
 *
 * **Scroll Effects:**
 * - A `useEffect` hook listens to window scroll events. If `window.scrollY > 10`,
 *   the `isScrolled` state is set to true, which applies styling changes to the header
 *   (e.g., reduced padding, blurred background, shadow).
 *
 * It uses `useParams` from `next/navigation` as a fallback to determine the current `locale`
 * if not provided via props.
 *
 * @param {NavigationHeaderProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered navigation header.
 */
const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  menu,
  logoUrl,
  title = menu.name,
  subtitle,
  className = '',
  locale: propLocale
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const params = useParams();
  const locale = propLocale || params.locale as string || 'en';
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Toggle dropdown menu
  const toggleDropdown = (id: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };

  // Render a single menu item (can be recursive for children)
  const renderMenuItem = (item: MenuItem, isDropdown = false, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const itemUrl = item.url || (item.page ? `/${locale}/${item.page.slug}` : '#');
    
    if (hasChildren) {
      return (
        <li key={item.id} className="relative group">
          <button
            onClick={() => toggleDropdown(item.id)}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors ${
              isDropdown 
                ? 'hover:bg-black/5 w-full text-left' 
                : 'hover:text-primary'
            }`}
            style={{ color: 'inherit' }}
          >
            {item.title}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${openDropdowns[item.id] ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Desktop dropdown (on hover) */}
          {!isMobileMenuOpen && level === 0 && (
            <div className="hidden group-hover:block absolute left-0 top-full min-w-[200px] bg-white shadow-lg rounded-md overflow-hidden z-50">
              <ul className="py-1">
                {item.children?.map(child => renderMenuItem(child, true, level + 1))}
              </ul>
            </div>
          )}
          
          {/* Mobile/Clicked dropdown */}
          {(isMobileMenuOpen || level > 0) && openDropdowns[item.id] && (
            <ul className={`${level > 0 ? 'pl-4' : 'border-l-2 border-primary/20 pl-2 ml-2 mt-1'}`}>
              {item.children?.map(child => renderMenuItem(child, true, level + 1))}
            </ul>
          )}
        </li>
      );
    }
    
    return (
      <li key={item.id}>
        <Link
          href={itemUrl}
          target={item.target || '_self'}
          className={`block px-4 py-2 text-sm font-medium transition-colors ${
            isDropdown 
              ? 'hover:bg-black/5 w-full' 
              : 'hover:text-primary'
          }`}
          style={{ color: 'inherit' }}
          onClick={() => closeAllDropdowns()}
        >
          {item.title}
        </Link>
      </li>
    );
  };

  return (
    <header 
      ref={headerRef}
      className={`w-full transition-all duration-300 ${
        isScrolled ? 'py-2 backdrop-blur-md shadow-md' : 'py-5'
      } ${className}`}
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: 'inherit',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backdropFilter: 'blur(8px)'
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link href={`/${locale}`} className="flex items-center gap-3">
            {logoUrl && (
              <div className="relative h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                <Image
                  src={logoUrl}
                  alt={title}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-lg md:text-xl font-bold" style={{ color: 'inherit' }}>{title}</h1>
              {subtitle && (
                <p className="text-xs md:text-sm opacity-80" style={{ color: 'inherit' }}>{subtitle}</p>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className="flex items-center space-x-1">
              {menu.items.map(item => renderMenuItem(item))}
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <XIcon className="h-6 w-6" style={{ color: 'inherit' }} />
            ) : (
              <MenuIcon className="h-6 w-6" style={{ color: 'inherit' }} />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-200 fixed top-[4rem] left-0 right-0 bg-white shadow-lg z-[45]">
            <ul className="space-y-1 pt-2">
              {menu.items.map(item => renderMenuItem(item))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default NavigationHeader; 