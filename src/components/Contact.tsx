/**
 * @fileoverview This file defines the Contact component, a presentational
 * component responsible for displaying a contact section. This section typically
 * includes a title and a contact form. The component utilizes internationalization (i18n)
 * for its text content and `framer-motion` along with `react-intersection-observer`
 * for entry animations.
 */
'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';

/**
 * Props for the Contact component.
 */
interface ContactProps {
  /**
   * An object containing localized strings for the contact section.
   * Expected structure:
   * ```
   * {
   *   contact: {
   *     title: string, // Title for the contact section
   *     description: string, // A descriptive text (currently not used in this component version)
   *     form: {
   *       name: string,          // Label for the name input field
   *       email: string,         // Label for the email input field
   *       message?: string,       // Optional label for the message textarea
   *       submit: string,        // Text for the submit button
   *       namePlaceholder?: string, // Optional placeholder for the name input
   *       emailPlaceholder?: string // Optional placeholder for the email input
   *     }
   *   }
   * }
   * ```
   */
  dictionary: {
    contact: {
      title: string;
      description: string; // Although present in props, not actively used in this version's UI.
      form: {
        name: string;
        email: string;
        message?: string;
        submit: string;
        namePlaceholder?: string;
        emailPlaceholder?: string;
      };
    };
  };
}

/**
 * The `Contact` component renders a contact section, typically including a title
 * and a contact form.
 *
 * It uses `framer-motion` for animations that are triggered when the component
 * scrolls into view, managed by `react-intersection-observer`.
 * The form inputs (name, email, message) are managed using local React state (`formState`).
 * The `handleChange` function updates this state on input changes.
 * The `handleSubmit` function currently logs the form data to the console,
 * resets the form fields, and shows a simple alert confirming submission.
 *
 * Text content within the component is internationalized using the `dictionary` prop.
 *
 * @param {ContactProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered Contact section.
 */
export default function Contact({ dictionary }: ContactProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formState);
    // Reset form
    setFormState({ name: '', email: '', message: '' });
    // Show success message
    alert('Thank you for your message! We will get back to you soon.');
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex items-center">
        <div className="w-full max-w-2xl mx-auto">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              {dictionary.contact.title}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
          >
            <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-100">              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    {dictionary.contact.form.name}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    {dictionary.contact.form.email}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    {dictionary.contact.form.message || "Message"}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formState.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full btn-primary py-3 text-lg font-medium transition-transform hover:scale-105"
                >
                  {dictionary.contact.form.submit}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 