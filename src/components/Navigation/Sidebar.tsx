/**
 * @fileoverview This file defines the Sidebar component, a generic, client-side,
 * collapsible navigation sidebar. Its content, including multi-level navigation links,
 * is dynamically generated from a `menu` object prop. It supports active link
 * highlighting and uses `lucide-react` for icons.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';
import { Menu, MenuItem } from '@/app/api/graphql/types'; // Assumed to be documented at source

/**
 * Props for the Sidebar component.
 * The `Menu` and `MenuItem` types are imported from '@/app/api/graphql/types'
 * and define the structure of the navigation menu data.
 */
interface SidebarProps {
  /** The `Menu` object that defines the navigation links and their hierarchy. */
  menu: Menu;
  /** Optional URL for the site/module logo displayed at the top of the sidebar. */
  logoUrl?: string;
  /**
   * Optional title for the sidebar, often the site or module name.
   * Defaults to `menu.name` if not provided.
   */
  title?: string;
  /** Optional additional CSS class names to apply to the sidebar's root aside element. */
  className?: string;
  /**
   * Optional boolean to enable or disable the sidebar's collapsibility.
   * Defaults to `true` (collapsible).
   */
  collapsible?: boolean;
  /**
   * Optional current locale string (e.g., "en", "es").
   * If not provided, it falls back to `useParams` to get the locale from the URL,
   * defaulting to 'en' if still unavailable. Used for constructing localized link URLs.
   */
  locale?: string;
}

/**
 * `Sidebar` is a client-side component that renders a configurable and collapsible
 * navigation sidebar. Its primary content (navigation links, hierarchy) is dynamically
 * generated based on the `menu` prop.
 *
 * **State Management:**
 * - `collapsed`: Boolean, controls the collapsed/expanded state of the entire sidebar.
 * - `expandedItems`: Record<string, boolean>, tracks the open/closed state of individual
 *   parent menu items (those with children) to manage submenu visibility.
 *
 * **Dynamic Menu Rendering (`renderMenuItems` function):**
 * - This is a recursive function that iterates through `menu.items` (and their children).
 * - For each `MenuItem`:
 *   - If it has `children`, it's rendered as an expandable section. A button with the item's title
 *     and a chevron icon (`ChevronDownIcon`/`ChevronUpIcon`) is displayed. Clicking this button
 *     toggles the item's expanded state (managed by `expandedItems` and `toggleExpand`).
 *     The children are then recursively rendered as a nested list if the parent is expanded and
 *     the sidebar itself is not fully collapsed.
 *   - If it has no `children`, it's rendered as a direct `Link`.
 * - **Active Link Detection**: The `isActive` function determines if a menu item's URL matches
 *   the current `pathname` (obtained via `usePathname`) to apply active link styling.
 *   It also ensures that parent items are automatically expanded if any of their children
 *   are the active link.
 * - **URL Construction**: Link URLs are derived from `item.url` if present, otherwise from
 *   `item.page.slug` (prefixed with the current `locale`). Defaults to '#' if neither is available.
 * - **Icon Display**: If `item.icon` is provided (expected to be a string name or representation),
 *   it's displayed next to the title (currently rendered as text, not an icon component).
 *
 * **Collapsible Behavior:**
 * - If `collapsible` prop is true (default), a collapse button (ChevronUpIcon/ChevronDownIcon, rotated)
 *   is shown in the header.
 * - Clicking this button toggles the `collapsed` state.
 * - When `collapsed` is true:
 *   - The sidebar width shrinks.
 *   - Item titles and the main sidebar title are hidden (using `sr-only` for accessibility or by not rendering).
 *   - The footer copyright text is hidden.
 *   - Submenus are not rendered even if their parent item is marked as expanded.
 *
 * **Header and Footer:**
 * - **Header**: Displays the `logoUrl` (if provided) and the `title`. It also contains the
 *   main sidebar collapse button. Content is hidden appropriately when collapsed.
 * - **Footer**: Displays a copyright notice with the current year and the `title`. This section
 *   is hidden when the sidebar is collapsed.
 *
 * It uses `useParams` (for locale fallback) and `usePathname` (for active link detection)
 * from `next/navigation`.
 *
 * @param {SidebarProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered sidebar component.
 */
const Sidebar: React.FC<SidebarProps> = ({
  menu,
  logoUrl,
  title = menu.name,
  className = '',
  collapsible = true,
  locale: propLocale
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const params = useParams();
  const pathname = usePathname();
  const locale = propLocale || params.locale as string || 'en';

  // Toggle a specific item's expanded state
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Check if a link is active
  const isActive = (url: string) => {
    const normalizedPathname = pathname.endsWith('/') ? pathname : pathname + '/';
    const normalizedUrl = url.endsWith('/') ? url : url + '/';
    return normalizedPathname.startsWith(normalizedUrl);
  };

  // Render menu items recursively
  const renderMenuItems = (items: MenuItem[], level = 0) => {
    return items.map(item => {
      // Determine the URL
      let url = '#';
      if (item.url) {
        url = item.url;
      } else if (item.page?.slug) {
        url = `/${locale}/${item.page.slug}`;
      }

      const hasChildren = item.children && item.children.length > 0;
      const isItemActive = isActive(url);
      const isExpanded = expandedItems[item.id] || false;

      // If any child is active, expand this item by default
      if (hasChildren && !expandedItems.hasOwnProperty(item.id)) {
        const anyChildActive = item.children?.some(child => {
          const childUrl = child.url || (child.page ? `/${locale}/${child.page.slug}` : '#');
          return childUrl !== '#' && isActive(childUrl);
        });
        
        if (anyChildActive) {
          setExpandedItems(prev => ({ ...prev, [item.id]: true }));
        }
      }

      return (
        <li key={item.id} className={`my-1 ${level > 0 ? 'ml-3' : ''}`}>
          {hasChildren ? (
            <div>
              <button 
                onClick={() => toggleExpand(item.id)}
                className={`flex items-center justify-between w-full p-2 rounded-md transition-colors
                  ${isItemActive || isExpanded ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'}`}
                style={{ 
                  color: isItemActive ? ( 'inherit') : 'inherit',
                  paddingLeft: `${level * 4 + 8}px` 
                }}
              >
                <div className="flex items-center">
                  {item.icon && (
                    <span className="mr-2 text-lg">{item.icon}</span>
                  )}
                  <span className={`${collapsed ? 'sr-only' : ''}`}>
                    {item.title}
                  </span>
                </div>
                {!collapsed && (isExpanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />)}
              </button>
              
              {isExpanded && !collapsed && (
                <ul className="mt-1">
                  {renderMenuItems(item.children || [], level + 1)}
                </ul>
              )}
            </div>
          ) : (
            <Link
              href={url}
              target={item.target || '_self'}
              className={`flex items-center p-2 rounded-md transition-colors ${
                isItemActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'
              }`}
              style={{ 
                color: isItemActive ? ('inherit') : 'inherit',
                paddingLeft: `${level * 4 + 8}px` 
              }}
            >
              {item.icon && (
                <span className="mr-2 text-lg">{item.icon}</span>
              )}
              <span className={`${collapsed ? 'sr-only' : ''}`}>
                {item.title}
              </span>
            </Link>
          )}
        </li>
      );
    });
  };

  return (
    <aside 
      className={`h-screen ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 border-r border-gray-200 ${className}`}
      style={{ 
        backgroundColor: '#ffffff',
        color: 'inherit'
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header with logo and title */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center">
            {logoUrl && (
              <div className={`relative h-8 w-8 flex-shrink-0 ${!collapsed && 'mr-2'}`}>
                <Image 
                  src={logoUrl}
                  alt={title}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
            )}
            {!collapsed && (
              <span className="font-semibold truncate">{title}</span>
            )}
          </Link>
          
          {/* Collapse button */}
          {collapsible && (
            <button 
              onClick={() => setCollapsed(!collapsed)} 
              className="p-1 rounded-md hover:bg-gray-100"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronDownIcon size={16} className="rotate-270" />
              ) : (
                <ChevronUpIcon size={16} className="rotate-90" />
              )}
            </button>
          )}
        </div>
        
        {/* Navigation menu */}
        <nav className="flex-1 p-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {renderMenuItems(menu.items)}
          </ul>
        </nav>
        
        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {new Date().getFullYear()} © {title}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar; 