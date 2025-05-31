/**
 * @fileoverview This file defines the Footer component, a dynamic, client-side
 * site footer. Its content, including navigation links and title, and aspects of its
 * styling (like background and text color) are primarily driven by a `menu` object prop.
 * This allows for a configurable footer experience based on backend data.
 * It also includes standard footer elements like copyright information and legal links.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

/**
 * Defines the structure for an individual menu item within the footer.
 */
interface MenuItem {
  /** Unique identifier for the menu item. */
  id: string;
  /** The display title of the menu item. */
  title: string;
  /** Direct URL if the item links externally or to a non-page route. Null if `pageId` is used. */
  url: string | null;
  /** ID of an internal page this item links to. Null if `url` is used. */
  pageId: string | null;
  /** HTML target attribute for the link (e.g., '_blank', '_self'). */
  target: string | null;
  /** String identifier for an icon (currently not rendered in this footer version). */
  icon: string | null;
  /** Order in which the item should appear. */
  order: number;
  /** Optional array of child menu items for creating nested lists or columns. */
  children?: MenuItem[];
  /** Optional associated page data, typically including `id`, `title`, and `slug` if `pageId` is set. */
  page?: { id: string; title: string; slug: string };
}

/**
 * Defines the structure for a Menu object that drives the footer's content and style.
 */
interface Menu {
  /** Unique identifier for the menu. */
  id: string;
  /** Name of the menu, often used as a fallback title for the footer. */
  name: string;
  /** Location identifier for the menu (e.g., 'footer'), though not directly used for filtering in this component. */
  location: string | null;
  /** Array of `MenuItem` objects that constitute the links in the footer. */
  items: MenuItem[];
  /**
   * Optional styling information. While named `headerStyle`, this component repurposes
   * its `advancedOptions` for footer-specific styling like background and text color.
   * This is an unusual use of `headerStyle` for a footer, suggesting a shared data structure.
   */
  headerStyle?: {
    id: string;
    transparency?: number;
    headerSize?: string;
    menuAlignment?: string;
    menuButtonStyle?: string;
    mobileMenuStyle?: string;
    mobileMenuPosition?: string;
    transparentHeader?: boolean;
    borderBottom?: boolean;
    /**
     * Custom options, expected to contain `backgroundColor` and `textColor`
     * for styling the footer.
     */
    advancedOptions?: Record<string, unknown>;
  } | null;
}

/**
 * Props for the Footer component.
 */
interface FooterProps {
  /** The `Menu` object containing navigation items and styling information for the footer. */
  menu: Menu;
  /** Optional URL for the site logo to be displayed in the footer. */
  logoUrl?: string;
  /**
   * Optional title for the footer. Defaults to `menu.name` if not provided.
   * This is often the site or company name.
   */
  title?: string;
  /** Optional subtitle or tagline displayed below the footer title. */
  subtitle?: string;
  /**
   * Optional copyright text. If not provided, a default copyright notice
   * using the `title` (or `menu.name`) and the current year will be generated.
   */
  copyright?: string;
  /** Optional additional CSS class names to apply to the footer's root element. */
  className?: string;
  /**
   * Optional current locale string (e.g., "en", "es").
   * If not provided, it falls back to `useParams` to get the locale from the URL,
   * defaulting to 'en' if still unavailable. Used for constructing localized link URLs.
   */
  locale?: string;
}

/**
 * `Footer` is a client-side component that renders a configurable site footer.
 * Its structure, content (like navigation links and title), and aspects of its styling
 * (background and text color) are primarily driven by the `menu` object prop.
 *
 * **Dynamic Content & Structure:**
 * - The footer title defaults to `menu.name` if not explicitly provided via the `title` prop.
 * - Navigation links are sourced from `menu.items`. The `groupMenuItems` function organizes these
 *   items into up to 4 columns for display. It prioritizes items that themselves have `children`
 *   to form these columns. If fewer than 4 such items exist, it takes top-level items without
 *   children to fill the remaining columns.
 * - The `renderItemGroup` function takes a (potentially grouped) `MenuItem` and renders it as a
 *   column, displaying its `title` as the column header and its `children` as the list of links.
 * - Link URLs are dynamically constructed:
 *   - If `item.url` is present, it's used directly.
 *   - If `item.page.slug` is present, a localized path `/{locale}/{slug}` is created.
 *   - Defaults to '#' if neither is available.
 *
 * **Dynamic Styling:**
 * - The overall background color and text color of the footer are determined by
 *   `menu.headerStyle.advancedOptions.backgroundColor` and `menu.headerStyle.advancedOptions.textColor`
 *   respectively. Default colors (`#f8fafc` for background, `#1e293b` for text) are used if these options
 *   are not set. This is an unconventional use of `headerStyle` for footer styling, implying
 *   a shared data structure that might be used for headers elsewhere.
 *
 * **Static & Other Elements:**
 * - Displays a logo if `logoUrl` is provided.
 * - Shows a subtitle if the `subtitle` prop is provided.
 * - The copyright notice in the bottom bar dynamically displays the current year. If the `copyright`
 *   prop is not set, it defaults to using the footer `title`.
 * - "Privacy Policy" and "Terms of Service" links in the bottom bar are currently hardcoded
 *   and do not use the `menu.items` data.
 *
 * It uses `useParams` from `next/navigation` as a fallback to determine the current `locale`
 * if not provided via props.
 *
 * @param {FooterProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered dynamic footer component.
 */
const Footer: React.FC<FooterProps> = ({
  menu,
  logoUrl,
  title = menu.name,
  subtitle,
  copyright,
  className = '',
  locale: propLocale
}) => {
  const params = useParams();
  const locale = propLocale || params.locale as string || 'en';
  const currentYear = new Date().getFullYear();

  // Get styled colors from headerStyle.advancedOptions or use defaults
  const backgroundColor = menu.headerStyle?.advancedOptions?.backgroundColor as string || '#f8fafc';
  const textColor = menu.headerStyle?.advancedOptions?.textColor as string || '#1e293b';

  // Group menu items for responsive display
  const groupMenuItems = () => {
    // For items with children, use them directly
    const groupedItems = menu.items
      .filter(item => item.children && item.children.length > 0)
      .slice(0, 4); // Limit to 4 main groups

    // If we have less than 4 groups, add some top-level items
    if (groupedItems.length < 4) {
      const topLevelItems = menu.items
        .filter(item => !item.children || item.children.length === 0)
        .slice(0, 4 - groupedItems.length);
      
      // Convert top-level items to "groups" with one item
      const singleItemGroups = topLevelItems.map(item => ({
        ...item,
        children: [item]
      }));
      
      return [...groupedItems, ...singleItemGroups];
    }

    return groupedItems;
  };

  const groupedItems = groupMenuItems();

  // Process an array of items into a single column
  const renderItemGroup = (item: MenuItem) => {
    const children = item.children || [];
    
    return (
      <div key={item.id} className="mb-8 md:mb-0">
        <h3 className="text-base font-bold mb-4" style={{ color: textColor || 'inherit' }}>
          {item.title}
        </h3>
        <ul className="space-y-3">
          {children.map(child => {
            // Determine URL for the child
            const childUrl = child.url || (child.page ? `/${locale}/${child.page.slug}` : '#');
            
            return (
              <li key={child.id}>
                <Link 
                  href={childUrl}
                  target={child.target || '_self'}
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: textColor ? `${textColor}99` : 'inherit' }}
                >
                  {child.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <footer 
      className={`py-12 ${className}`}
      style={{ 
        backgroundColor: backgroundColor,
        color: textColor
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Footer top section with logo and navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and Company Info */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="flex items-start">
              {logoUrl && (
                <div className="relative h-12 w-12 mr-3 flex-shrink-0">
                  <Image
                    src={logoUrl}
                    alt={title}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
              )}
            </Link>
            <h2 className="mt-4 text-lg font-bold" style={{ color: textColor || 'inherit' }}>
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm" style={{ color: textColor ? `${textColor}99` : 'inherit' }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Navigation Columns */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {groupedItems.map(renderItemGroup)}
          </div>
        </div>

        {/* Footer bottom with copyright */}
        <div className="mt-12 pt-8 border-t border-gray-200/30">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm mb-4 md:mb-0" style={{ color: textColor ? `${textColor}99` : 'inherit' }}>
              © {currentYear} {copyright || title}. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {/* Social icons - This could be extracted from menu items with specific URLs or icons */}
              <a 
                href="#" 
                className="text-sm hover:opacity-80"
                style={{ color: textColor ? `${textColor}99` : 'inherit' }}
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className="text-sm hover:opacity-80"
                style={{ color: textColor ? `${textColor}99` : 'inherit' }}
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 