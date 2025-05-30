/**
 * @fileoverview This file defines the CopyrightFooter component, a simple
 * presentational component responsible for displaying the copyright notice.
 * It is typically used at the very bottom of a webpage.
 */
'use client';

/**
 * Props for the CopyrightFooter component.
 */
interface CopyrightFooterProps {
  /**
   * An object containing localized strings for the footer.
   * Expected structure:
   * ```
   * {
   *   footer: {
   *     rights: string // The "All rights reserved" or similar text.
   *   }
   * }
   * ```
   */
  dictionary: {
    footer: {
      rights: string;
    };
  };
}

/**
 * `CopyrightFooter` is a client-side presentational component that displays
 * the copyright notice.
 *
 * It dynamically calculates and displays the current year. The copyright
 * text (e.g., "All rights reserved.") is provided via the `dictionary` prop
 * for internationalization.
 *
 * @param {CopyrightFooterProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered copyright footer.
 */
export default function CopyrightFooter({ dictionary }: CopyrightFooterProps) {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="copyright-footer">
      <div className="container mx-auto">
        <p>&copy; {currentYear} E-Voque. {dictionary.footer.rights}</p>
      </div>
    </div>
  );
} 