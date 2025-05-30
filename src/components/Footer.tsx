/**
 * @fileoverview This file defines the main site Footer component.
 * It is a client-side component responsible for displaying comprehensive footer
 * information including branding, social media links, multiple navigation columns
 * (main navigation, services, hidden/utility sections, contact info), and a bottom
 * bar with copyright notice and legal links (privacy, terms).
 * The component uses internationalization for its text content and lucide-react for icons.
 */
'use client';

import Link from 'next/link';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  EyeOff
} from 'lucide-react';

/**
 * Props for the Footer component.
 */
interface FooterProps {
  /**
   * An object containing localized strings for the footer.
   * Expected structure:
   * ```
   * {
   *   nav: {
   *     home: string,
   *     about: string,
   *     services: string,
   *     contact: string
   *   },
   *   footer: {
   *     rights: string,    // e.g., "All rights reserved"
   *     privacy: string,   // e.g., "Privacy Policy"
   *     terms: string      // e.g., "Terms of Service"
   *   }
   * }
   * ```
   */
  dictionary: {
    nav: {
      home: string;
      about: string;
      services: string;
      contact: string;
    };
    footer: {
      rights: string;
      privacy: string;
      terms: string;
    };
  };
  /** The current locale string (e.g., "en", "es"), used for constructing localized links. */
  locale: string;
}

/**
 * `Footer` is a client-side component that renders the main site footer.
 * It includes sections for branding, social media links, various navigation columns
 * (main site navigation, service links, potentially hidden or utility links, and contact information),
 * and a bottom bar with the copyright notice (dynamically displaying the current year)
 * and links to legal pages like privacy policy and terms of service.
 *
 * All textual content is internationalized using the `dictionary` prop.
 * Icons are sourced from the `lucide-react` library.
 *
 * @param {FooterProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered site footer.
 */
export default function Footer({ dictionary, locale }: FooterProps) {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    { icon: <Facebook size={20} />, url: 'https://facebook.com' },
    { icon: <Twitter size={20} />, url: 'https://twitter.com' },
    { icon: <Linkedin size={20} />, url: 'https://linkedin.com' },
    { icon: <Instagram size={20} />, url: 'https://instagram.com' },
  ];

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Logo and description */}
          <div className="col-span-1 md:col-span-1">
            <Link href={`/${locale}`} className="flex items-center">
              <span className="text-2xl font-bold text-white">E-Voque</span>
            </Link>
            <p className="mt-4 text-gray-400">
              Breaking language barriers through high-quality over-the-phone interpretation.
            </p>
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="text-xl">{link.icon}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}`} className="text-gray-400 hover:text-white transition-colors">
                  {dictionary.nav.home}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#about`} className="text-gray-400 hover:text-white transition-colors">
                  {dictionary.nav.about}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#services`} className="text-gray-400 hover:text-white transition-colors">
                  {dictionary.nav.services}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#contact`} className="text-gray-400 hover:text-white transition-colors">
                  {dictionary.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/services`} className="text-gray-400 hover:text-white transition-colors">
                  Medical Interpretation
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services`} className="text-gray-400 hover:text-white transition-colors">
                  Legal Interpretation
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services`} className="text-gray-400 hover:text-white transition-colors">
                  Business Interpretation
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/services`} className="text-gray-400 hover:text-white transition-colors">
                  Emergency Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Hidden Sections */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white flex items-center">
              <EyeOff size={16} className="mr-2" />
              Hidden Sections
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href={`/${locale}/hidden/services`} className="text-gray-400 hover:text-white transition-colors">
                  Services Section
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/hidden/wellness`} className="text-gray-400 hover:text-white transition-colors">
                  Wellness Programs
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/careers`} className="text-gray-400 hover:text-white transition-colors">
                  Careers at Teleperformance
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Contact</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">
                123 Interpretation St<br />
                San Francisco, CA 94105
              </li>
              <li className="text-gray-400">
                <a href="tel:+15551234567" className="hover:text-white transition-colors">
                  +1 (555) 123-4567
                </a>
              </li>
              <li className="text-gray-400">
                <a href="mailto:info@e-voque.com" className="hover:text-white transition-colors">
                  info@e-voque.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom footer */}
        <div className="pt-8 border-t border-gray-800 text-sm text-gray-400">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              &copy; {currentYear} E-Voque. {dictionary.footer.rights}.
            </div>
            <div className="flex space-x-6">
              <Link href={`/${locale}/privacy`} className="hover:text-white transition-colors">
                {dictionary.footer.privacy}
              </Link>
              <Link href={`/${locale}/terms`} className="hover:text-white transition-colors">
                {dictionary.footer.terms}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 