/**
 * @fileoverview This file defines the LanguageSwitcher component, a client-side
 * UI element that allows users to switch the application's language/locale.
 * It displays the current language and provides a dropdown menu to select from
 * available locales. The component can dynamically adjust its text color based on
 * the visibility of a contact section to ensure contrast.
 */
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { locales } from '../app/i18n';
import { useState } from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

/**
 * Props for the LanguageSwitcher component.
 */
interface LanguageSwitcherProps {
  /**
   * Optional boolean flag (defaults to `false`) indicating whether a contact section
   * (or any other section with a potentially conflicting background) is currently in view.
   * If true, the switcher's text color will be adjusted (e.g., to white) for better visibility.
   */
  isContactInView?: boolean;
}

/**
 * `LanguageSwitcher` is a client-side component that provides a user interface
 * for selecting the application's language/locale.
 *
 * It displays the currently selected language and, when clicked, reveals a dropdown
 * menu with all available languages defined in `src/app/i18n/locales`.
 *
 * Core Logic:
 * - **Current Locale Detection**: It determines the `currentLocale` by parsing the
 *   current URL's pathname using `usePathname`.
 * - **Dropdown Management**: The `isOpen` state, managed by `useState`, controls the
 *   visibility of the language selection dropdown. The `toggleDropdown` function
 *   toggles this state.
 * - **Language Change (`changeLanguage` function)**: When a new language is selected,
 *   this function constructs the new URL path by replacing the current locale segment
 *   in the pathname with the newly selected locale. It then uses `router.push`
 *   (from `next/navigation`) to navigate to the new path, effectively changing the language.
 * - **Language Name Display (`getLanguageName` utility)**: This internal utility function
 *   converts locale codes (e.g., "en", "es") into user-friendly display names
 *   (e.g., "English", "Español").
 * - **Dynamic Styling**: The text color of the switcher dynamically changes based on the
 *   `isContactInView` prop to ensure good visibility against different background colors.
 *
 * Dependencies:
 * - `useRouter` and `usePathname` from `next/navigation` for routing and path information.
 * - `locales` array from `../app/i18n` which lists the available locales for the application.
 *
 * @param {LanguageSwitcherProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered language switcher UI.
 */
export default function LanguageSwitcher({ isContactInView = false }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Extract the current locale from the pathname
  const currentPathnameParts = pathname.split('/');
  const currentLocale = currentPathnameParts[1] || 'en'; // Default to 'en' if not found

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const changeLanguage = (locale: string) => {
    if (!pathname) return;
    
    // Replace the current locale in the pathname with the new locale
    const newPathnameParts = [...currentPathnameParts];
    newPathnameParts[1] = locale;
    const newPathname = newPathnameParts.join('/');
    
    router.push(newPathname);
    setIsOpen(false);
  };

  const getLanguageName = (locale: string) => {
    switch (locale) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      default:
        return locale.toUpperCase();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className={`flex items-center space-x-1 text-sm font-medium transition-colors duration-300 ${
          isContactInView 
            ? 'text-white hover:text-gray-200' 
            : 'text-[hsla(225,55%,21%,1)] hover:text-[hsla(225,55%,21%,0.8)]'
        }`}
        aria-expanded={isOpen}
      >
        <GlobeAltIcon className={`h-5 w-5 ${isContactInView ? 'text-white' : ''}`} />
        <span>{getLanguageName(currentLocale)}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 w-40 bg-white rounded-md shadow-lg z-10">
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => changeLanguage(locale)}
              className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-100 ${
                locale === currentLocale ? 'font-bold' : 'font-normal'
              }`}
            >
              {getLanguageName(locale)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 