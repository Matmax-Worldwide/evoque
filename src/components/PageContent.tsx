/**
 * @fileoverview This file defines the PageContent component, a client-side
 * component responsible for managing a full-page scrolling experience. It orchestrates
 * navigation between different landing page sections (Hero, Benefits, Contact)
 * using mouse wheel, keyboard, and touch events. It features smooth scrolling,
 * section transition animations via framer-motion, a fixed navigation bar,
 * a visual progress indicator, and synchronization with URL hash fragments.
 */
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Navbar from './Navigation/Navbar';
import Hero from './Hero';
import Benefits from './Benefits';
import Contact from './Contact';
import { motion, AnimatePresence } from 'framer-motion';
import { Dictionary } from '../app/i18n';

/**
 * Props for the PageContent component.
 */
interface PageContentProps {
  /** The current locale string (e.g., "en", "es"), passed down to child components. */
  locale: string;
  /** The dictionary object containing localized strings, passed down to child components. */
  dictionary: Dictionary;
}

/**
 * `PageContent` is a client-side component that orchestrates a full-page scrolling
 * experience. It manages a series of sections (Hero, Benefits, Contact) and allows
 * users to navigate between them using mouse wheel, keyboard arrows, or touch swipes.
 *
 * Core Functionalities:
 * - **Section Definition**: The `sections` array (defined using `useMemo`) holds the
 *   configuration for each page section, including its ID and the component to render.
 *   Child components (`Hero`, `Benefits`, `Contact`) receive the `locale` and `dictionary` props.
 * - **State Management**:
 *   - `activeSection`: An integer representing the index of the currently visible section.
 *   - `isScrolling`: A boolean flag used as a debounce mechanism to prevent rapid
 *     section changes during scroll or swipe actions.
 * - **Event Handling for Navigation**:
 *   - `handleWheel`: Listens to mouse wheel events to navigate up/down sections.
 *   - `handleKeyDown`: Listens for ArrowUp, ArrowDown, PageUp, and PageDown keys for navigation.
 *   - `handleTouchStart` & `handleTouchEnd`: Manage touch swipe gestures for navigation on mobile devices.
 *   All navigation handlers update `activeSection` and set `isScrolling` temporarily.
 * - **URL Hash Synchronization**:
 *   - An effect updates `window.location.hash` to match the ID of the `activeSection`
 *     when it changes.
 *   - `handleHashChange` listens to `hashchange` browser events (e.g., from clicking
 *     a link with a hash or browser back/forward buttons) and updates `activeSection` accordingly.
 *     This also handles initial hash state on page load.
 * - **Smooth Scrolling**: A `useEffect` hook monitors `activeSection`. When it changes,
 *   it uses `scrollIntoView({ behavior: 'smooth' })` on the corresponding section's DOM element
 *   (referenced via `sectionRefs`) to smoothly scroll the new section into view.
 * - **Fixed Navbar**: Includes the `Navbar` component, which is fixed at the top of the page.
 * - **Progress Indicator**: Displays a vertical series of dots on the right side of the screen,
 *   highlighting the dot corresponding to the `activeSection`, allowing users to see their
 *   current position and click to navigate.
 * - **Animations**: Uses `framer-motion` (`AnimatePresence` and `motion.section` with `sectionVariants`)
 *   to apply transition animations (opacity and y-translation) when sections change.
 *
 * It uses `useRef` to store an array of references (`sectionRefs`) to the DOM elements of each
 * section, which is essential for the `scrollIntoView` functionality.
 *
 * @param {PageContentProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered full-page scrolling container with its sections.
 */
export default function PageContent({ locale, dictionary }: PageContentProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  
  // Secciones
  const sections = useMemo(() => [
    { id: 'home', component: <Hero dictionary={dictionary} locale={locale} /> },
    { id: 'benefits', component: <Benefits dictionary={dictionary} locale={locale} /> },
    { id: 'contact', component: <Contact dictionary={dictionary} /> },
  ], [dictionary, locale]);
  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (isScrolling) return;
      
      setIsScrolling(true);
      setTimeout(() => setIsScrolling(false), 800);
      
      if (e.deltaY > 0 && activeSection < sections.length - 1) {
        // Scroll down
        setActiveSection(prev => prev + 1);
      } else if (e.deltaY < 0 && activeSection > 0) {
        // Scroll up
        setActiveSection(prev => prev - 1);
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isScrolling) return;
      
      if ((e.key === 'ArrowDown' || e.key === 'PageDown') && activeSection < sections.length - 1) {
        e.preventDefault();
        setIsScrolling(true);
        setTimeout(() => setIsScrolling(false), 800);
        setActiveSection(prev => prev + 1);
      } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && activeSection > 0) {
        e.preventDefault();
        setIsScrolling(true);
        setTimeout(() => setIsScrolling(false), 800);
        setActiveSection(prev => prev - 1);
      }
    };
    
    // Función para manejar el desplazamiento táctil
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      if (Math.abs(diff) < 50) return; // Ignorar deslizamientos pequeños
      
      setIsScrolling(true);
      setTimeout(() => setIsScrolling(false), 800);
      
      if (diff > 0 && activeSection < sections.length - 1) {
        // Deslizar hacia arriba (scroll down)
        setActiveSection(prev => prev + 1);
      } else if (diff < 0 && activeSection > 0) {
        // Deslizar hacia abajo (scroll up)
        setActiveSection(prev => prev - 1);
      }
    };
    
    // Manejar navegación por hash URL
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const index = sections.findIndex(section => section.id === hash);
        if (index !== -1) {
          setActiveSection(index);
        }
      }
    };
    
    // Eventos
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('hashchange', handleHashChange);
    
    // Comprobar hash inicial
    handleHashChange();
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [activeSection, isScrolling, sections.length]);
  
  useEffect(() => {
    // Actualizar URL hash al cambiar de sección
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${sections[activeSection].id}`);
    }
  }, [activeSection, sections]);
  
  // Gestionar el scroll a la sección activa cuando cambia
  useEffect(() => {
    if (sectionRefs.current[activeSection]) {
      sectionRefs.current[activeSection]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [activeSection]);
  
  // Variantes para las animaciones de framer-motion
  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: -50,
      transition: { 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };
  
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar fijo en la parte superior */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar dictionary={dictionary} locale={locale} />
      </div>
      
      {/* Indicador de progreso */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-40 flex flex-col items-center space-y-3">
        {sections.map((section, index) => (
          <button
            key={index}
            onClick={() => setActiveSection(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              activeSection === index
                ? 'bg-primary-600 scale-125'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to ${section.id} section`}
          />
        ))}
      </div>
      
      {/* Contenido principal */}
      <div className="h-screen">
        <AnimatePresence mode="wait">
          <motion.section
            key={activeSection}
            className="h-screen pt-16 overflow-hidden"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            ref={el => sectionRefs.current[activeSection] = el}
          >
            {sections[activeSection].component}
          </motion.section>
        </AnimatePresence>
      </div>

    </div>
  );
} 