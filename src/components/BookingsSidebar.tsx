/**
 * @fileoverview This file defines the BookingsSidebar component, which serves as
 * the primary client-side navigation sidebar for the "Bookings" module of the application.
 * It handles internationalization for navigation item labels, manages active link
 * highlighting, integrates with an unsaved changes context to prevent accidental
 * data loss, and provides a collapsible interface.
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
  Calendar,
  MapPin,
  Users,
  Briefcase,
  UserCheck,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Clock,
  BarChart3,
  CreditCard,
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
 * Props for the BookingsSidebar component.
 */
interface BookingsSidebarProps {
  /**
   * Optional object containing localized strings for the sidebar item names.
   * If provided, it should contain a `bookings` key with further nested keys
   * for each navigation item (e.g., `dashboard`, `calendar`, `services`).
   */
  dictionary?: {
    bookings?: {
      dashboard: string;
      calendar: string;
      bookings: string;
      services: string;
      categories: string;
      locations: string;
      staff: string;
      rules: string;
      reports: string;
      payments: string;
    };
  };
  /** The current locale string (e.g., "en", "es"), used for constructing localized links. */
  locale: string;
}

/**
 * A custom wrapper for the `SidebarCollapseButton` that dynamically changes its icon
 * (PanelLeftOpen or PanelLeftClose) based on the sidebar's collapsed state,
 * obtained from `useSidebar` context.
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
 * `BookingsSidebar` is the main navigation sidebar component for the Bookings module.
 * It provides structured navigation links, handles active link highlighting,
 * integrates with an unsaved changes confirmation system, allows switching
 * to other modules (CMS, E-commerce), and supports a collapsible interface.
 *
 * Key Features:
 * - Uses UI components from `@/components/ui/sidebar` for its structure.
 * - Navigation items are grouped (Main, Management, Analytics) and their labels
 *   are localized using the `dictionary` prop. If no dictionary is provided,
 *   it falls back to default English labels.
 * - The `isActiveLink` internal function determines if a navigation item matches
 *   the current route (obtained via `usePathname`) for active state highlighting.
 * - **Unsaved Changes Integration**: It uses the `useUnsavedChanges` context.
 *   The `handleNavigation` function intercepts navigation attempts. If there are
 *   unsaved changes (`hasUnsavedChanges` is true), it prevents immediate navigation
 *   and displays an `UnsavedChangesAlert`.
 *   - `handleSaveAndContinue`: Attempts to save changes via `onSave` from the context. If successful, proceeds with the pending navigation.
 *   - `handleDiscardChanges`: Discards changes and proceeds with the pending navigation.
 *   - `handleCancelNavigation`: Cancels the pending navigation and hides the alert.
 * - **Module Switcher**: The sidebar header includes a dropdown menu to switch to
 *   other application modules like CMS or E-commerce.
 * - **Collapsible Behavior**: Leverages `SidebarProvider` and the custom `CollapsibleButton`
 *   to allow users to collapse and expand the sidebar.
 *
 * It relies on `usePathname` and `useRouter` from `next/navigation` for routing and
 * active link detection.
 *
 * @param {BookingsSidebarProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered BookingsSidebar component.
 */
export default function BookingsSidebar({ dictionary, locale }: BookingsSidebarProps) {
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
  const nav = dictionary?.bookings || {
    dashboard: 'Dashboard',
    calendar: 'Calendar',
    bookings: 'Bookings',
    services: 'Services',
    categories: 'Categories',
    locations: 'Locations',
    staff: 'Staff',
    rules: 'Rules',
    reports: 'Reports',
    payments: 'Payments',
  };

  const mainNavigationItems = [
    {
      name: nav.dashboard,
      href: `/${locale}/bookings`,
      icon: <LayoutDashboard className="h-4 w-4" />
    },
    {
      name: nav.calendar,
      href: `/${locale}/bookings/calendar`,
      icon: <Calendar className="h-4 w-4" />
    },
    {
      name: nav.bookings,
      href: `/${locale}/bookings/list`,
      icon: <BookOpen className="h-4 w-4" />
    },
  ];

  const managementItems = [
    {
      name: nav.services,
      href: `/${locale}/bookings/services`,
      icon: <Briefcase className="h-4 w-4" />
    },
    {
      name: nav.categories,
      href: `/${locale}/bookings/categories`,
      icon: <Users className="h-4 w-4" />
    },
    {
      name: nav.locations,
      href: `/${locale}/bookings/locations`,
      icon: <MapPin className="h-4 w-4" />
    },
    {
      name: nav.staff,
      href: `/${locale}/bookings/staff`,
      icon: <UserCheck className="h-4 w-4" />
    },
    {
      name: nav.rules,
      href: `/${locale}/bookings/rules`,
      icon: <Clock className="h-4 w-4" />
    },
  ];

  const analyticsItems = [
    {
      name: nav.reports,
      href: `/${locale}/bookings/reports`,
      icon: <BarChart3 className="h-4 w-4" />
    },
    {
      name: nav.payments,
      href: `/${locale}/bookings/payments`,
      icon: <CreditCard className="h-4 w-4" />
    },
  ];
  

  const isActiveLink = (path: string): boolean => {
    // Special case for dashboard - exact match only
    if (path === `/${locale}/bookings`) {
      return pathname === `/${locale}/bookings` || pathname === `/${locale}/bookings/`;
    }
    
    // For other links, check if pathname starts with the link path
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
                  <span>Bookings</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <Link
                      href={`/${locale}/cms`}
                      className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span>CMS</span>
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
            <SidebarGroup title="Main">
              {mainNavigationItems.map((item) => (
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
            
            <SidebarGroup title="Management">
              {managementItems.map((item) => (
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
            
            <SidebarGroup title="Analytics">
              {analyticsItems.map((item) => (
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