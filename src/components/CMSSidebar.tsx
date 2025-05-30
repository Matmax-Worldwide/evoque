/**
 * @fileoverview This file defines the CMSSidebar component, the primary client-side
 * navigation sidebar for the "CMS" (Content Management System) module.
 * It handles internationalization for navigation item labels, manages active link
 * highlighting, integrates with an unsaved changes context to prevent accidental
 * data loss when navigating away from a page with pending edits, and provides
 * a collapsible interface for better space management.
 */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUnsavedChanges } from '@/contexts/UnsavedChangesContext';
import { UnsavedChangesAlert } from '@/components/cms/UnsavedChangesAlert';
import { 
  LayoutDashboard,
  FileText,
  Menu, 
  FormInput, 
  Image as ImageIcon, 
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  BookOpen,
  ChevronDown
} from 'lucide-react';

import {
  Sidebar, 
  SidebarProvider, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter,
  SidebarGroup,
  SidebarItem,
  SidebarCollapseButton,
  useSidebar
} from '@/components/ui/sidebar';

/**
 * Props for the CMSSidebar component.
 */
interface CMSSidebarProps {
  /**
   * Optional object containing localized strings for the sidebar item names.
   * If provided, it should contain a `cms` key with further nested keys
   * for each navigation item (e.g., `dashboard`, `pages`, `menus`, `forms`, `blog`, `media`, `settings`).
   */
  dictionary?: {
    cms?: {
      dashboard: string;
      pages: string;
      menus: string;
      forms: string;
      media: string;
      settings: string;
      blog: string;
    };
  };
  /** The current locale string (e.g., "en", "es"), used for constructing localized links. */
  locale: string;
}

/**
 * A custom wrapper for the `SidebarCollapseButton` that dynamically changes its icon
 * (PanelLeftOpen or PanelLeftClose) based on the sidebar's collapsed state,
 * obtained from `useSidebar` context. This component is identical in function
 * to one that might be used in other sidebars (e.g., BookingsSidebar).
 *
 * @param {object} props - Component props.
 * @param {string} [props.className=""] - Optional additional CSS classes for the button.
 * @returns {React.JSX.Element} The rendered collapsible button.
 */
function CollapsibleButton({ className = "" }) {
  const { collapsed } = useSidebar();
  
  return (
    <SidebarCollapseButton 
      icon={
        collapsed 
          ? <PanelLeftOpen className="h-4 w-4 sidebar-collapse-icon" /> 
          : <PanelLeftClose className="h-4 w-4 sidebar-collapse-icon" />
      }
      className={className}
    />
  );
}

/**
 * `CMSSidebar` is the main navigation sidebar component for the CMS module.
 * It provides structured navigation links to different CMS sections like Dashboard,
 * Pages, Menus, Forms, Blog, Media, and Settings. It handles active link highlighting,
 * integrates with an unsaved changes confirmation system, allows switching
 * to other application modules, and supports a collapsible interface.
 *
 * Key Features:
 * - Uses UI components from `@/components/ui/sidebar` for its overall structure and elements.
 * - Navigation items are localized using the `dictionary` prop. Default English labels
 *   are used if the dictionary is not provided.
 * - The `isActiveLink` internal function determines if a navigation item matches
 *   the current route (obtained via `usePathname`) for highlighting.
 * - **Unsaved Changes Integration**: Utilizes the `useUnsavedChanges` context.
 *   The `handleNavigation` function intercepts navigation. If `hasUnsavedChanges`
 *   is true, it prevents immediate navigation and displays an `UnsavedChangesAlert`.
 *   Users can then choose to save changes and continue (`handleSaveAndContinue`),
 *   discard changes (`handleDiscardChanges`), or cancel navigation (`handleCancelNavigation`).
 * - **Module Switcher**: A dropdown in the sidebar header allows users to navigate
 *   to other main modules of the application, such as Bookings or E-commerce.
 * - **Collapsible Behavior**: Employs `SidebarProvider` and the custom `CollapsibleButton`
 *   for collapsing and expanding the sidebar.
 *
 * It uses `usePathname` and `useRouter` from `next/navigation` for client-side
 * routing and determining the active link.
 *
 * @param {CMSSidebarProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered CMSSidebar component.
 */
export default function CMSSidebar({ dictionary, locale }: CMSSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Unsaved changes context
  const {
    hasUnsavedChanges,
    onSave,
    isSaving,
    setIsSaving,
    pendingNavigation,
    setPendingNavigation,
    showUnsavedAlert,
    setShowUnsavedAlert,
  } = useUnsavedChanges();
  
  // Default navigation items if dictionary is not provided
  const nav = dictionary?.cms || {
    dashboard: 'Dashboard',
    pages: 'Pages',
    menus: 'Menus',
    forms: 'Forms',
    media: 'Media',
    settings: 'Settings',
    blog: 'Blog',
    // Add new dictionary entries for Calendar if they are to be translated
    // For now, using hardcoded strings.
  };

  const navigationItems = [
    {
      name: nav.dashboard,
      href: `/${locale}/cms/`,
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      name: nav.pages,
      href: `/${locale}/cms/pages`,
      icon: <FileText className="h-4 w-4" />
    },
    {
      name: nav.menus,
      href: `/${locale}/cms/menus`,
      icon: <Menu className="h-4 w-4" />
    },
    {
      name: nav.forms,
      href: `/${locale}/cms/forms`,
      icon: <FormInput className="h-4 w-4" />
    },
    {
      name: nav.blog,
      href: `/${locale}/cms/blog`,
      icon: <BookOpen className="h-4 w-4" />
    },
    {
      name: nav.media,
      href: `/${locale}/cms/media`,
      icon: <ImageIcon className="h-4 w-4" />
    },
  ];

  const settingsNavItem = {
    name: nav.settings,
    href: `/${locale}/cms/settings`,
    icon: <Settings className="h-4 w-4" />
  };

  const isActiveLink = (path: string): boolean => {
    // Special case for dashboard - exact match only
    if (path === `/${locale}/cms/`) {
      return pathname === `/${locale}/cms` || pathname === `/${locale}/cms/`;
    }
    
    // For other links, check if pathname starts with the link path
    // and make sure it's either exact or followed by a / or nothing
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // Handle navigation with unsaved changes check
  const handleNavigation = (href: string, e: React.MouseEvent) => {
    // Check if we have unsaved changes and we're navigating away from current page
    if (hasUnsavedChanges && pathname !== href) {
      e.preventDefault();
      setPendingNavigation(href);
      setShowUnsavedAlert(true);
      return;
    }
  };

  // Handle unsaved changes alert actions
  const handleSaveAndContinue = async (): Promise<boolean> => {
    if (!onSave) return false;
    
    setIsSaving(true);
    try {
      const success = await onSave();
      if (success && pendingNavigation) {
        setShowUnsavedAlert(false);
        router.push(pendingNavigation);
        setPendingNavigation(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    if (pendingNavigation) {
      setShowUnsavedAlert(false);
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowUnsavedAlert(false);
    setPendingNavigation(null);
  };

  return (
    <>
      <UnsavedChangesAlert
        isVisible={showUnsavedAlert}
        onSave={handleSaveAndContinue}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelNavigation}
        isSaving={isSaving}
      />
    <SidebarProvider defaultCollapsed={false}>
      <Sidebar className="flex flex-col h-full relative">
        <SidebarHeader className="flex items-center justify-between p-3 pb-2">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative h-8 w-8 mr-2">
              <Image 
                src="/images/logo.png" 
                alt="E-Voque" 
                fill
                sizes="32px"
                priority
                style={{ objectFit: 'contain' }}
              />
            </div>
            
            {/* Dropdown Switcher */}
            <div className="relative flex-1">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-full text-lg font-semibold text-foreground sidebar-title hover:bg-gray-100 rounded-md px-2 py-1 transition-colors"
              >
                <span>CMS</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <Link
                    href={`/${locale}/bookings`}
                    className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>Bookings</span>
                  </Link>
                  <Link
                    href={`/${locale}/commerce`}
                    className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span>E-COMMERCE</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <CollapsibleButton className="sidebar-header-collapse-button" />
          </div>
        </SidebarHeader>
        
        {/* Button that will be positioned in the middle of the sidebar when collapsed */}
        <div className="sidebar-header-collapse-container">
          <CollapsibleButton />
        </div>
        
        <SidebarContent>
          <SidebarGroup title="Main Navigation">
            {navigationItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="block"
                onClick={(e) => handleNavigation(item.href, e)}
              >
                <SidebarItem 
                  icon={item.icon}
                  active={isActiveLink(item.href)}
                >
                  {item.name}
                </SidebarItem>
              </Link>
            ))}
          </SidebarGroup>
          <SidebarGroup title="Configuration">
            <Link
              key={settingsNavItem.name}
              href={settingsNavItem.href}
              className="block"
              onClick={(e) => handleNavigation(settingsNavItem.href, e)}
            >
              <SidebarItem
                icon={settingsNavItem.icon}
                active={isActiveLink(settingsNavItem.href)}
              >
                {settingsNavItem.name}
              </SidebarItem>
            </Link>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter>
          <Link 
            href={`/${locale}/dashboard`} 
            className="block w-full"
            onClick={(e) => handleNavigation(`/${locale}/dashboard`, e)}
          >
            <SidebarItem 
              icon={<LogOut className="h-4 w-4" />}
              className="text-muted-foreground hover:text-foreground"
            >
              Return to Dashboard
            </SidebarItem>
          </Link>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
    </>
  );
} 