/**
 * @fileoverview This file defines the WellnessBenefits component, a presentational
 * client-side component designed to showcase a list of "At-Home Wellness Programs".
 * It displays each program with a title, description, icon, duration, level, and a
 * placeholder image. The component uses `framer-motion` for animations, triggered
 * by `react-intersection-observer` when elements scroll into view. It concludes
 * with a call-to-action section.
 */
'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  HeartIcon,
  UserGroupIcon,
  SunIcon,
  MoonIcon,
  FireIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

/**
 * Props for the WellnessBenefits component.
 */
interface WellnessBenefitsProps {
  /**
   * Optional dictionary object for localized strings.
   * Currently, the main content (program details) is hardcoded in English.
   * This prop might be used for a main section title or other surrounding text
   * if the component were to be more deeply internationalized in the future.
   */
  dictionary?: any;
}

/**
 * The `WellnessBenefits` component is a presentational client-side component
 * that displays a grid of "At-Home Wellness Programs" and a final call to action.
 *
 * Content and Structure:
 * - A main title section for "At-Home Wellness Programs", which includes a subtitle
 *   and a "Powered by MatMax" attribution, all animated on view.
 * - A grid of wellness program cards. The details for these programs (icon, title,
 *   description, time, level, and an image placeholder) are currently hardcoded
 *   within the component in the `programs` array.
 * - Each program card is animated with a staggered effect using `framer-motion`
 *   when the grid scrolls into view (managed by `useInView`).
 * - A final call-to-action section encouraging users to "Start Your Wellness Journey Today"
 *   with a "Get Started" button. This button is currently presentational and does not
 *   have explicit navigation or action bound to it in this component.
 *
 * The `dictionary` prop is available for future internationalization of titles or
 * other text, though program-specific details are hardcoded.
 *
 * @param {WellnessBenefitsProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered WellnessBenefits section.
 */
export default function WellnessBenefits({ dictionary = {} }: WellnessBenefitsProps) {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const programs = [
    {
      icon: <SunIcon className="h-12 w-12 text-amber-500" />,
      title: "Morning Yoga",
      description: "Start your day with energizing yoga flows designed to awaken your body and mind.",
      time: "15-30 min",
      level: "All levels",
      image: (
        <div className="h-48 mb-6 bg-gradient-to-r from-amber-100 to-amber-50 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-amber-400 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
        </div>
      )
    },
    {
      icon: <FireIcon className="h-12 w-12 text-red-500" />,
      title: "Flexibility Training",
      description: "Increase your range of motion and prevent injuries with targeted stretching routines.",
      time: "20-40 min",
      level: "Beginner to advanced",
      image: (
        <div className="h-48 mb-6 bg-gradient-to-r from-red-100 to-orange-50 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-red-400 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      )
    },
    {
      icon: <MoonIcon className="h-12 w-12 text-indigo-500" />,
      title: "Guided Meditation",
      description: "Reduce stress and improve focus with guided mindfulness sessions for mental clarity.",
      time: "10-20 min",
      level: "All levels",
      image: (
        <div className="h-48 mb-6 bg-gradient-to-r from-indigo-100 to-purple-50 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-indigo-400 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
        </div>
      )
    },
    {
      icon: <ArrowPathIcon className="h-12 w-12 text-green-500" />,
      title: "Recovery Techniques",
      description: "Learn proper recovery methods to enhance performance and prevent burnout.",
      time: "15-25 min",
      level: "All levels",
      image: (
        <div className="h-48 mb-6 bg-gradient-to-r from-green-100 to-emerald-50 rounded-md overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-green-400 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        </div>
      )
    }
  ];

  const container = {
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
    <section id="wellness" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <HeartIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            At-Home Wellness Programs
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Enhance your well-being with our curated wellness programs designed for home practice.
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <span className="text-sm text-gray-500">Powered by</span>
            <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">MatMax</span>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          {programs.map((program, index) => (
            <motion.div
              key={index}
              variants={item}
              className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
            >
              {program.image}
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="bg-gray-50 p-3 rounded-full mr-4">
                    {program.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {program.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  {program.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>{program.time}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    <span>{program.level}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-primary-50 rounded-xl p-8 border border-primary-100"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Your Wellness Journey Today</h3>
              <p className="text-gray-600">
                Access all these programs and more with our subscription. No equipment needed, just your commitment to well-being.
              </p>
            </div>
            <div className="flex-shrink-0">
              <button className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-md transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 