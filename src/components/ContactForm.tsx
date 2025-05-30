/**
 * @fileoverview This file defines the ContactSection component, a client-side
 * component that renders a visually distinct contact form section.
 * It features a dark theme with animated background particles, uses framer-motion
 * for entry animations, and handles form submission. Submission can be processed
 * either via a GraphQL mutation to `/api/graphql` or through an optional callback function
 * provided via props. The component also manages and displays submission status.
 * Internationalization for text content is supported through a `dictionary` prop.
 */
'use client';

import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useInView } from 'react-intersection-observer';

/**
 * Props for the ContactSection component.
 */
interface ContactSectionProps {
  /**
   * An object containing localized strings for the contact section.
   * Expected structure:
   * ```
   * {
   *   contact: {
   *     title: string,         // Title for the contact section
   *     description: string,   // A descriptive text displayed below the title
   *     form: {
   *       name: string,          // Label for the first name input field
   *       lastName: string,      // Label for the last name input field
   *       email: string,         // Label for the email input field
   *       submit: string,        // Text for the submit button
   *       namePlaceholder: string, // Placeholder for the first name input
   *       lastNamePlaceholder: string, // Placeholder for the last name input
   *       emailPlaceholder: string // Placeholder for the email input
   *     }
   *   }
   * }
   * ```
   */
  dictionary: {
    contact: {
      title: string;
      description: string;
      form: {
        name: string;
        lastName: string;
        email: string;
        submit: string;
        namePlaceholder: string;
        lastNamePlaceholder: string;
        emailPlaceholder: string;
      };
    };
  };
  /**
   * Optional callback function to handle form submission.
   * If provided, this function will be called with the form data
   * ({ firstName, lastName, email }) instead of the default GraphQL mutation.
   * @param data - An object containing the submitted form data.
   */
  onSubmit?: (data: { firstName: string; lastName: string; email: string }) => void;
}

// GraphQL mutation for contact form submission
const SUBMIT_CONTACT_FORM = `
  mutation CreateContactFormSubmission($input: ContactFormSubmissionInput!) {
    createContactFormSubmission(input: $input) {
      id
      firstName
      lastName
      email
      createdAt
    }
  }
`;

/**
 * `ContactSection` is a client-side component that renders a visually distinct and animated
 * contact form section. It manages form input state, handles form submission (either via
 * a GraphQL mutation or a provided callback), and provides visual feedback on submission status.
 *
 * Features:
 * - **Styling**: Implements a dark theme with a gradient background and animated background particles.
 * - **Animations**: Uses `framer-motion` for entry animations of the section title and form,
 *   triggered by `react-intersection-observer`.
 * - **State Management**:
 *   - `formState`: Manages the values of the first name, last name, and email input fields.
 *   - `submitStatus`: Tracks the current state of form submission ('idle', 'submitting', 'success', 'error')
 *     and updates the submit button's appearance and text accordingly.
 * - **Submission Handling (`handleSubmit` function)**:
 *   - If an `onSubmit` prop (callback function) is provided, it calls this function with the form data
 *     and then resets the form. This allows for custom submission logic outside the component.
 *   - If `onSubmit` is not provided, it sends a GraphQL mutation (`SUBMIT_CONTACT_FORM`) to the
 *     `/api/graphql` endpoint with the form data.
 *   - On successful GraphQL submission, it updates `submitStatus` to 'success', resets the form,
 *     and then redirects the user to 'https://jobs.e-voque.com/' after a short delay.
 *   - On GraphQL error or network error, it updates `submitStatus` to 'error'.
 * - **Internationalization**: All display text (title, description, labels, placeholders, button text)
 *   is sourced from the `dictionary` prop.
 *
 * @param {ContactSectionProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered ContactSection component.
 */
export default function ContactSection({ dictionary, onSubmit }: ContactSectionProps) {
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const { ref: contactRef, inView } = useInView({ threshold: 0.3 });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If custom onSubmit is provided, use that instead
    if (onSubmit) {
      onSubmit(formState);
      setFormState({ firstName: '', lastName: '', email: '' });
      return;
    }
    
    // Otherwise use GraphQL mutation
    try {
      setSubmitStatus('submitting');
      
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: SUBMIT_CONTACT_FORM,
          variables: {
            input: {
              firstName: formState.firstName,
              lastName: formState.lastName,
              email: formState.email,
            },
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        setSubmitStatus('error');
        return;
      }
      
      console.log('Contact form submission successful:', result.data);
      setSubmitStatus('success');
      setFormState({ firstName: '', lastName: '', email: '' });
      
      // Redirigir después de un breve delay opcional (por UX)
      setTimeout(() => {
        window.location.href = 'https://jobs.e-voque.com/';
      }, 500); // puedes ajustar el delay (ms) o quitarlo si quieres que sea instantáneo
      
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    }
  };

  return (
    <section id="contact" className="relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b z-10 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, #1a253b, rgba(26, 37, 59, 0.5), transparent)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#01112A] via-[#01319c] to-[#1E0B4D] opacity-95 z-0" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          // Use seeded values based on index instead of random
          const width = 1 + ((i * 7) % 3);
          const height = 1 + ((i * 13) % 3);
          const left = ((i * 17) % 100);
          const top = ((i * 23) % 100);
          const duration = 2 + ((i * 11) % 3);
          const delay = (i * 19) % 2;
          
          return (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${width}px`,
                height: `${height}px`,
                left: `${left}%`,
                top: `${top}%`,
              }}
              animate={{ opacity: [0.1, 0.8, 0.1], scale: [1, 1.2, 1] }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: delay,
              }}
            />
          );
        })}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex flex-col justify-center">
        <div className="w-full max-w-2xl mx-auto px-4 py-8 md:py-0 flex flex-col sm:flex-row sm:items-center justify-center md:justify-between items-center gap-4">
          <motion.div
            ref={contactRef}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.7 }}
              className="mb-6 p-5 bg-white/10 backdrop-blur-sm rounded-full w-min mx-auto border border-white/30 shadow-lg shadow-blue-500/20"
            >
              <PaperAirplaneIcon className="h-14 w-14 text-white" />
            </motion.div>

            <h2 className="text-xl md:text-4xl lg:text-3xl font-bold text-white mb-2 drop-shadow-md">
              {dictionary.contact.title}
            </h2>
            <p className="text-sm md:text-md text-white/80 max-w-xl mx-auto mb-8">
              {dictionary.contact.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full"
          >
            <div className="w-full max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-white mb-1">
                    {dictionary.contact.form.name}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formState.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/50 transition-all duration-300"
                    placeholder={dictionary.contact.form.namePlaceholder}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-white mb-1">
                    {dictionary.contact.form.lastName}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formState.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/50 transition-all duration-300"
                    placeholder={dictionary.contact.form.lastNamePlaceholder}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-1">
                    {dictionary.contact.form.email}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formState.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border-white/20 bg-white/10 text-white rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white/50 transition-all duration-300"
                    placeholder={dictionary.contact.form.emailPlaceholder}
                  />
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.03, boxShadow: '0 0 15px 5px rgba(59, 130, 246, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitStatus === 'submitting'}
                  className={`w-full bg-gradient-to-r ${
                    submitStatus === 'success' 
                      ? 'from-green-600 to-green-700'
                      : submitStatus === 'error'
                      ? 'from-red-600 to-red-700'
                      : 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  } text-white py-3 px-6 rounded-md font-bold text-lg shadow-lg shadow-blue-500/30 transition-all duration-300`}
                >
                  {submitStatus === 'submitting' 
                    ? 'Sending...' 
                    : submitStatus === 'success'
                    ? '¡Message Sent!'
                    : submitStatus === 'error'
                    ? 'Error - Try Again' 
                    : dictionary.contact.form.submit}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}