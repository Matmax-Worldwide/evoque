/**
 * @fileoverview This file defines the Services component, a presentational
 * client-side component designed to showcase a list of services. It typically includes
 * a main title, a grid of individual service cards with icons, descriptions, and
 * placeholder images, and a featured service section. The component uses
 * internationalization for its text content and `framer-motion` along with
 * `react-intersection-observer` for entry animations.
 */
'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  BeakerIcon, 
  ScaleIcon, 
  BriefcaseIcon, 
  ShieldExclamationIcon 
} from '@heroicons/react/24/outline';

/**
 * Props for the Services component.
 */
interface ServicesProps {
  /**
   * An object containing localized strings for the services section.
   * Expected structure:
   * ```
   * {
   *   services: {
   *     title: string, // Main title for the services section
   *     medical: {
   *       title: string,       // Title for the medical service
   *       description: string  // Description for the medical service
   *     },
   *     legal: {
   *       title: string,       // Title for the legal service
   *       description: string  // Description for the legal service
   *     },
   *     business: {
   *       title: string,       // Title for the business service
   *       description: string  // Description for the business service
   *     },
   *     emergency: {
   *       title: string,       // Title for the emergency service
   *       description: string  // Description for the emergency service
   *     }
   *     // ... potentially other service categories
   *   }
   * }
   * ```
   */
  dictionary: {
    services: {
      title: string;
      medical: {
        title: string;
        description: string;
      };
      legal: {
        title: string;
        description: string;
      };
      business: {
        title: string;
        description: string;
      };
      emergency: {
        title: string;
        description: string;
      };
    };
  };
}

/**
 * The `Services` component is a presentational client-side component that displays
 * a list of services in a visually appealing grid format, along with a featured
 * service section. It utilizes animations for enhanced user experience.
 *
 * Content and Structure:
 * - A main title for the services section, animated on view.
 * - A grid of service cards. Each card in the `servicesList` array includes:
 *   - An `icon` (ReactNode, typically an SVG from Heroicons).
 *   - A `title` (localized string).
 *   - A `description` (localized string).
 *   - `color` and `iconBg` for styling the card's gradient background and icon background.
 *   - An `image` placeholder (ReactNode), which is currently a styled div with an SVG icon
 *     and a text label indicating it's an image placeholder (e.g., "Medical Image").
 *   - A "Learn more" button (currently not functional, for UI demonstration).
 * - The service cards are animated with a staggered effect using `framer-motion` when they
 *   scroll into view (managed by `useInView` from `react-intersection-observer`).
 * - A "Medical Interpretation Focus" section, which is a statically defined promotional block
 *   highlighting medical interpretation services, also animated on view.
 *
 * All textual content (titles, descriptions) is internationalized via the `dictionary` prop.
 *
 * @param {ServicesProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered Services section.
 */
export default function Services({ dictionary }: ServicesProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const servicesList = [
    {
      icon: <BeakerIcon className="h-10 w-10 text-primary-600" />,
      title: dictionary.services.medical.title,
      description: dictionary.services.medical.description,
      color: 'from-primary-50 to-indigo-100',
      iconBg: 'bg-primary-100',
      image: (
        <div className="h-48 mb-6 bg-gradient-to-r from-primary-200 to-primary-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-20 h-20 text-primary-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary-500 to-transparent h-12"></div>
          <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-primary-600 rounded px-2 py-1">Medical Image</div>
        </div>
      )
    },
    {
      icon: <ScaleIcon className="h-10 w-10 text-indigo-600" />,
      title: dictionary.services.legal.title,
      description: dictionary.services.legal.description,
      color: 'from-indigo-50 to-purple-100',
      iconBg: 'bg-indigo-100',
      image: (
        <div className="h-48 mb-6 bg-gradient-to-r from-indigo-200 to-indigo-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-20 h-20 text-indigo-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-500 to-transparent h-12"></div>
          <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-indigo-600 rounded px-2 py-1">Legal Image</div>
        </div>
      )
    },
    {
      icon: <BriefcaseIcon className="h-10 w-10 text-purple-600" />,
      title: dictionary.services.business.title,
      description: dictionary.services.business.description,
      color: 'from-purple-50 to-pink-100',
      iconBg: 'bg-purple-100',
      image: (
        <div className="h-48 mb-6 bg-gradient-to-r from-purple-200 to-purple-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-20 h-20 text-purple-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 to-transparent h-12"></div>
          <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-purple-600 rounded px-2 py-1">Business Image</div>
        </div>
      )
    },
    {
      icon: <ShieldExclamationIcon className="h-10 w-10 text-red-600" />,
      title: dictionary.services.emergency.title,
      description: dictionary.services.emergency.description,
      color: 'from-red-50 to-orange-100',
      iconBg: 'bg-red-100',
      image: (
        <div className="h-48 mb-6 bg-gradient-to-r from-red-200 to-red-100 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-20 h-20 text-red-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-500 to-transparent h-12"></div>
          <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-red-600 rounded px-2 py-1">Emergency Image</div>
        </div>
      )
    },
  ];

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <section id="services" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            {dictionary.services.title}
          </h2>
          <div className="mt-6 h-1 w-20 bg-primary-600 mx-auto rounded-full"></div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {servicesList.map((service, index) => (
            <motion.div
              key={index}
              variants={item}
              className={`bg-gradient-to-br ${service.color} p-8 rounded-lg shadow-md transition-transform hover:scale-105`}
            >
              {service.image}
              <div className="flex items-center mb-4">
                <div className={`${service.iconBg} h-12 w-12 rounded-full flex items-center justify-center mr-4`}>
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {service.title}
                </h3>
              </div>
              <p className="text-gray-700">
                {service.description}
              </p>
              <div className="mt-6">
                <button className="text-primary-600 font-medium hover:text-primary-700 transition-colors flex items-center">
                  Learn more
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 bg-primary-600 text-white p-8 rounded-lg overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <div className="flex items-center mb-6">
              <BeakerIcon className="h-12 w-12 mr-4 bg-white bg-opacity-20 text-white p-2 rounded-lg" />
              <h3 className="text-2xl font-bold">Medical Interpretation Focus</h3>
            </div>
            <p className="text-lg mb-6">
              We specialize in medical interpretation, providing healthcare providers with instant access to qualified medical interpreters who understand medical terminology and protocols.
            </p>
            <div className="bg-white text-primary-600 py-2 px-4 rounded-md inline-block font-medium hover:bg-opacity-90 transition-colors cursor-pointer">
              Learn more about our medical interpretation services
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 