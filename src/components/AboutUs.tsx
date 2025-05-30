/**
 * @fileoverview This file defines the AboutUs component, which displays
 * an "About Us" section tailored for Teleperformance. It highlights career
 * benefits and includes a call to action for potential job applicants.
 * The component uses framer-motion for animations and react-intersection-observer
 * to trigger animations when the component comes into view.
 */
'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { PhoneIcon, BriefcaseIcon, AcademicCapIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

/**
 * The `AboutUs` component is a presentational component designed to showcase
 * information about career opportunities and benefits at Teleperformance.
 *
 * It utilizes `framer-motion` for entry animations of its main sections and
 * individual benefit cards. These animations are triggered when the component
 * scrolls into the viewport, managed by the `react-intersection-observer` hook.
 *
 * This component does not accept any props.
 *
 * @returns React.JSX.Element - The rendered About Us section.
 */
export default function AboutUs() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const careerBenefits = [
    {
      icon: <PhoneIcon className="h-8 w-8 text-primary-600" />,
      title: 'Flexible Schedules',
      description: 'Perfect for students! Work part-time or full-time with shifts that fit your academic schedule.',
    },
    {
      icon: <BriefcaseIcon className="h-8 w-8 text-primary-600" />,
      title: 'Launch Your Career',
      description: 'Gain valuable customer service and language skills that employers value worldwide.',
    },
    {
      icon: <AcademicCapIcon className="h-8 w-8 text-primary-600" />,
      title: 'Paid Training',
      description: 'Receive comprehensive paid training and ongoing professional development opportunities.',
    },
    {
      icon: <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />,
      title: 'Competitive Pay',
      description: 'Earn while you learn with competitive compensation and regular performance bonuses.',
    },
  ];

  return (
    <section id="about" ref={ref} className="py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Jump-start Your Career with Teleperformance
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to work with a global leader in customer experience management? Join our diverse team of young professionals!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {careerBenefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: index * 0.1 + 0.4 }}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary-100 mb-4 mx-auto">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                {benefit.title}
              </h3>
              <p className="text-gray-600 text-center">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 bg-primary-600 text-white p-8 rounded-lg shadow-lg overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary-400 rounded-full opacity-20"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary-400 rounded-full opacity-20"></div>
          
          <h3 className="text-2xl font-bold mb-4 relative z-10">Join Our Team Today!</h3>
          <p className="text-lg relative z-10">
            At Teleperformance, we believe in empowering young talent. Whether you&apos;re a student looking for flexible work or a recent graduate starting your career path, we offer the perfect environment to grow your skills and build your future.
          </p>
          <div className="mt-6 relative z-10">
            <button className="bg-white text-primary-600 px-6 py-3 rounded-lg font-bold hover:bg-primary-50 transition-colors duration-300">
              Apply Now
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 