// src/app/[locale]/signage/frontend/components/navigation/SignageSidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    TvIcon, ListVideoIcon, ListMusicIcon, SettingsIcon, LayoutDashboardIcon, CalendarDaysIcon // Added CalendarDaysIcon
} from 'lucide-react';

interface SignageSidebarProps {
  locale: string;
}

const SignageSidebar: React.FC<SignageSidebarProps> = ({ locale }) => {
  const pathname = usePathname();

  const navItems = [
    { href: `/${locale}/signage`, label: 'Overview', icon: LayoutDashboardIcon },
    { href: `/${locale}/signage/devices`, label: 'Devices', icon: TvIcon },
    { href: `/${locale}/signage/media`, label: 'Media Library', icon: ListVideoIcon },
    { href: `/${locale}/signage/playlists`, label: 'Playlists', icon: ListMusicIcon },
    { href: `/${locale}/signage/schedules`, label: 'Schedules', icon: CalendarDaysIcon }, // New Item
    // Future items
    // { href: `/${locale}/signage/analytics`, label: 'Analytics', icon: BarChart3Icon },
    { href: `/${locale}/signage/settings`, label: 'Settings', icon: SettingsIcon, isBottom: true },
  ];

  const isActive = (href: string) => {
    // Exact match for overview page, or if it's the base /signage path for a non-overview item (which means overview is active)
    if (href === `/${locale}/signage`) return pathname === href;

    // For other items, allow active if path starts with href.
    // This ensures /en/signage/devices/some-id is active for /en/signage/devices link.
    return pathname.startsWith(href);
  };


  return (
    <aside className="w-64 bg-gray-100 dark:bg-gray-800 p-4 border-r dark:border-gray-700 flex flex-col">
      <div className="mb-6">
        <Link href={`/${locale}/signage`} className="block"> {/* Make title a link to overview */}
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                Signage Module
            </h2>
        </Link>
      </div>

      <nav className="flex-grow space-y-1">
        {navItems.filter(item => !item.isBottom).map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                        ${isActive(item.href)
                          ? 'bg-blue-600 text-white dark:bg-blue-500 shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-1 pt-4 border-t dark:border-gray-700"> {/* Added padding-top and border */}
        {navItems.filter(item => item.isBottom).map((item) => (
           <Link
            key={item.label}
            href={item.href}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                        ${isActive(item.href)
                          ? 'bg-blue-600 text-white dark:bg-blue-500 shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
};

export default SignageSidebar;
