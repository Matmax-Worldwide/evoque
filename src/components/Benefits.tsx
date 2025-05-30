/**
 * @fileoverview This file defines the Benefits component, a multi-section landing page
 * component designed to showcase services and features. It includes:
 * - A hero section with introductory content and a call to action.
 * - An introduction section often featuring a background video.
 * - A list of benefits, each highlighted with an icon and description.
 * - A contact form for user inquiries.
 * The component utilizes internationalization (i18n) through a `dictionary` prop,
 * `framer-motion` for animations, and `react-intersection-observer` for triggering
 * animations and other effects (like footer visibility) based on scroll position.
 * It also contains logic to dynamically show/hide the main site footer based on
 * how far the user has scrolled past the contact form.
 */
'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  CogIcon,
  BoltIcon,
  CheckBadgeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from './ui/button';
import ContactForm from './ContactForm';

/**
 * Props for the Benefits component.
 */
interface BenefitsProps {
  /**
   * An object containing localized strings for the component.
   * This dictionary should have a nested structure for different sections:
   * - `hero`: Contains strings for the hero section (e.g., `tagline`, `title`, `subtitle`, `cta`).
   * - `benefits`: Contains strings for the benefits section (e.g., general `title`, `subtitle`, and specific benefit titles like `qualityTitle`, `securityTitle`, and descriptions).
   * - `contact`: Contains strings for the contact form section (e.g., `title`, `description`, and form field labels/placeholders like `name`, `email`, `submit`).
   */
  dictionary: {
    hero: {
      tagline: string;
      title: string;
      subtitle: string;
      cta: string;
    };
    benefits: {
      title: string;
      subtitle: string;
      qualityTitle: string;
      quality: string;
      speed: string;
      availability: string;
      languages: string;
      security: string;
      securityTitle: string;
      technology: string;
      connect: string;
      technologyTitle: string;
    };
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
  /** The current locale string (e.g., "en", "es"). */
  locale: string;
}

/**
 * Represents the structure of an individual benefit item to be displayed.
 */
interface BenefitItem {
  /** The title of the benefit. */
  title: string;
  /** A description of the benefit. */
  description: string;
  /** A ReactNode (typically an SVG icon) representing the benefit. */
  icon: React.ReactNode;
  /** Tailwind CSS gradient color string (e.g., "from-blue-500 to-blue-700"). */
  color: string;
  /** Tailwind CSS class for the icon's background color. */
  iconBg: string;
  /** Accent color string (hex or Tailwind color name) used for highlights. */
  accentColor: string;
  /** Flag indicating if this is a technology-related benefit (may influence styling). */
  isTech: boolean;
  /** Optional Tailwind CSS class for the title text color. */
  textColor?: string;
  /** Optional Tailwind CSS class for the description text color. */
  descriptionColor?: string;
  /** Optional flag for technology benefits that might use a lighter theme. */
  techLight?: boolean;
  /** `react-intersection-observer` ref and inView state for triggering animations. */
  ref: ReturnType<typeof useInView>;
}

/**
 * The `Benefits` component serves as a feature-rich, multi-section landing page element.
 * It orchestrates the display of a hero section, an introductory section (often with a video background),
 * a list of benefit items, and a contact form.
 *
 * This component heavily utilizes `framer-motion` for animations on most of its elements,
 * triggered by viewport visibility using `react-intersection-observer`.
 * It also implements custom logic to control the visibility of the main site footer
 * based on the user's scroll position relative to the contact form section.
 *
 * The textual content is internationalized via the `dictionary` prop.
 *
 * Note: This component contains a commented-out section (`cms-managed-sections`)
 * which appears to be intended for dynamically rendering CMS-managed content.
 *
 * @param {BenefitsProps} props - The props for the component.
 * @param {object} props.dictionary - An object containing localized strings for various parts of the component.
 * @param {string} props.locale - The current locale, used for potential locale-specific logic (though not directly used in rendering in this version).
 * @returns {React.JSX.Element} The rendered Benefits landing page component.
 */
export default function Benefits({ dictionary }: BenefitsProps) {

  const [isFlowCompleted, setIsFlowCompleted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Añadir esta variable para rastrear si ya se ha scrolleado más allá del contacto
  const [scrolledBeyondContact, setScrolledBeyondContact] = useState(false);

  const heroRef = useInView({ triggerOnce: false, threshold: 0.7 });
  const introRef = useInView({ triggerOnce: false, threshold: 0.7 });

  // const [cmsComponents, setCmsComponents] = useState<CMSComponent[]>([]);

  const benefitsList: BenefitItem[] = [
    {
      title: dictionary.benefits.qualityTitle,
      description: dictionary.benefits.quality,
      icon: <CheckBadgeIcon className="h-16 w-16 text-[#01319c]" />,
      color: "from-[#ffffff] to-[#f0f9ff]",
      iconBg: "bg-[#01319c]/10",
      accentColor: "#01319c",
      isTech: true,
      textColor: "text-gray-800",
      descriptionColor: "text-gray-600",
      ref: useInView({ triggerOnce: false, threshold: 0.5 }),
    },
    {
      title: dictionary.benefits.availability,
      description: dictionary.benefits.availability,
      icon: <ClockIcon className="h-16 w-16 text-[#01319c]" />,
      color: "from-[#ffffff] to-[#f0f9ff]",
      iconBg: "bg-[#14f195]/20",
      accentColor: "#01319c",
      isTech: true,
      ref: useInView({ triggerOnce: false, threshold: 0.5 }),
    },
    {
      title: dictionary.benefits.connect,
      description: dictionary.benefits.speed,
      icon: <BoltIcon className="h-16 w-16 text-[#01319c]" />,
      color: "from-[#ffffff] to-[#f0f9ff]",
      iconBg: "bg-[#e879f9]/20",
      accentColor: "#01319c",
      isTech: true,
      ref: useInView({ triggerOnce: false, threshold: 0.5 }),
    },
    {
      title: dictionary.benefits.securityTitle,
      description: dictionary.benefits.security,
      icon: <ShieldCheckIcon className="h-16 w-16 text-[#01319c]" />,
      color: "from-[#ffffff] to-[#f0f9ff]",
      iconBg: "bg-[#14f195]/20",
      accentColor: "#01319c",
      isTech: true,
      ref: useInView({ triggerOnce: false, threshold: 0.5 }),
    },
    {
      title: dictionary.benefits.technologyTitle,
      description: dictionary.benefits.technology,
      icon: <CogIcon className="h-16 w-16 text-[#01319c]" />,
      color: "from-[#ffffff] to-[#f0f9ff]",
      iconBg: "bg-[#0dfff7]/20",
      accentColor: "#01319c",
      isTech: true,
      ref: useInView({ triggerOnce: false, threshold: 0.5 }),
    },
  ];

  // Función para verificar la posición de scroll
  const checkScrollPosition = () => {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      // Añadir un margen de 100px después del final de la sección de contacto
      // para asegurarnos de que se ha scrolleado suficientemente
      const extraMargin = 100; // píxeles adicionales para mostrar el footer
      const scrolledBeyond = window.scrollY > contactSection.offsetTop + contactSection.offsetHeight + extraMargin;
      
      if (scrolledBeyond !== scrolledBeyondContact) {
        setScrolledBeyondContact(scrolledBeyond);
        updateFooterVisibility(scrolledBeyond);
      }
    }
  };

  // Función para actualizar la visibilidad del footer
  const updateFooterVisibility = (show: boolean) => {
    const mainFooter = document.getElementById('main-footer');
    if (mainFooter) {
      if (show) {
        setIsFlowCompleted(true);
        mainFooter.classList.remove('hidden');
        setTimeout(() => {
          mainFooter.classList.add('visible');
        }, 10);
      } else {
        setIsFlowCompleted(false);
        mainFooter.classList.remove('visible');
        setTimeout(() => {
          mainFooter.classList.add('hidden');
        }, 300);
      }
    }
  };

  // Añadir el evento de scroll
  useEffect(() => {
    window.addEventListener('scroll', checkScrollPosition);
    return () => {
      window.removeEventListener('scroll', checkScrollPosition);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrolledBeyondContact]); // Solo depende de scrolledBeyondContact para evitar actualizaciones innecesarias


  return (
    <div id="benefits" className="full-page-flow">
      {/* <section id="cms-managed-sections" className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto py-12 px-4">
          {isEditing && (
            <div className="bg-yellow-100 p-4 mb-4 rounded flex items-center justify-between">
              <p className="text-yellow-800">
                <strong>Edit Mode:</strong> You can add and remove components in this section.
                Press <kbd className="px-2 py-1 bg-yellow-200 rounded">Ctrl+Shift+E</kbd> to toggle edit mode.
              </p>
              <button 
                onClick={() => setIsEditing(false)}
                className="bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded"
              >
                Exit Edit Mode
              </button>
            </div>
          )}
          
          {isEditing && (
            <AdminControls 
              components={cmsComponents as Component[]}
              onSave={handleSaveComponents as (components: Component[]) => void}
              onLoad={handleLoadComponents as (components: Component[]) => void}
            />
          )}
          
          <SectionManager 
            initialComponents={cmsComponents as Component[]} 
            isEditing={isEditing} 
            onComponentsChange={(components) => {
              // Actualizar el estado local
              setCmsComponents(components as CMSComponent[]);
              
              // Si estamos en modo edición, guardar automáticamente los cambios
              if (isEditing) {
                // Usar setTimeout para no guardar en cada pequeño cambio, sino esperar un poco
                const timerId = setTimeout(() => {
                  // Guardar sin mostrar notificación para los guardados automáticos
                  guardarComponentesCMS(components, false);
                }, 2000); // Esperar 2 segundos después del último cambio
                
                // Limpiar el temporizador si hay más cambios antes de que pasen los 2 segundos
                return () => clearTimeout(timerId);
              }
            }}
          />
        </div>
      </section> */}

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-white to-blue-50">
        {/* Transición de degradado en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#e0f2fe] to-transparent z-10 pointer-events-none"></div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute top-20 left-10 w-20 h-20 rounded-full bg-[#01319c]/10 opacity-60"
            animate={{
              x: [0, 30, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute top-40 right-20 w-32 h-32 rounded-full bg-[#4f46e5]/10 opacity-60"
            animate={{
              x: [0, -40, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full bg-[#2563eb]/10 opacity-60"
            animate={{
              x: [0, 20, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              ref={heroRef.ref}
              initial={{ opacity: 0, y: 20 }}
              animate={heroRef.inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={heroRef.inView ? { x: 0, opacity: 1 } : { x: -10, opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mb-2 inline-block px-4 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
              >
                {dictionary.hero.tagline}
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                {dictionary.hero.title}
              </h1>
              <p className="mt-6 text-xl text-gray-600">
                {dictionary.hero.subtitle}
              </p>
              <motion.div 
                className="mt-8 flex flex-wrap gap-4"
                initial={{ opacity: 0 }}
                animate={heroRef.inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <Button
                  onClick={() => {
                    const section = document.getElementById('intro'); // o 'benefits' si prefieres
                    if (section) {
                      section.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="btn-primary text-lg px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-300 hover:-translate-y-1"
                >
                  {dictionary.hero.cta}
                </Button>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={heroRef.inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <motion.div 
                className="relative z-10 flex justify-center"
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <svg
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-auto max-w-md"
                >
                  {/* Background Circle */}
                  <circle cx="100" cy="100" r="95" stroke="#3B82F6" strokeWidth="5" fill="#F9FAFB" />

                  {/* Headset */}
                  <path
                    d="M50 80 C50 50, 150 50, 150 80 M50 120 C50 150, 150 150, 150 120"
                    stroke="#3B82F6"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle cx="45" cy="100" r="5" fill="#3B82F6" />
                  <circle cx="155" cy="100" r="5" fill="#3B82F6" />
                  <path
                    d="M70 140 L70 160 Q100 170, 130 160 L130 140"
                    stroke="#3B82F6"
                    strokeWidth="4"
                    fill="none"
                  />

                  {/* Chat bubbles */}
                  <rect x="60" y="40" width="40" height="20" rx="5" ry="5" fill="#8B5CF6" />
                  <rect x="100" y="50" width="40" height="20" rx="5" ry="5" fill="#3B82F6" />

                  {/* Tiny text indicators */}
                  <circle cx="70" cy="50" r="2" fill="#F9FAFB" />
                  <circle cx="80" cy="50" r="2" fill="#F9FAFB" />
                  <circle cx="90" cy="50" r="2" fill="#F9FAFB" />

                  <circle cx="110" cy="60" r="2" fill="#F9FAFB" />
                  <circle cx="120" cy="60" r="2" fill="#F9FAFB" />
                  <circle cx="130" cy="60" r="2" fill="#F9FAFB" />
                </svg>
              </motion.div>
              
              {/* Interactive elements */}
              <motion.div
                className="absolute -top-8 -right-8 w-16 h-16 bg-primary-200 rounded-full z-0"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute bottom-10 -left-8 w-12 h-12 bg-indigo-300 rounded-full z-0"
                animate={{
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              <motion.div
                className="absolute -bottom-4 right-12 w-8 h-8 bg-primary-300 rounded-md rotate-12 z-0"
                animate={{
                  rotate: [12, 45, 12],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </div>
        
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* Introducción de la sección */}
      <section id="intro" className="relative w-full h-screen overflow-hidden">
        {/* VIDEO DE FONDO */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/videos/video.mp4"
        >
          <source src="/videos/video.mp4" type="video/mp4" />
          <source src="/videos/evoque-interpretacion.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Capa encima del video para contraste */}
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center items-center text-center">
          <motion.div 
            ref={introRef.ref}
            initial={{ opacity: 0, y: 30 }}
            animate={introRef.inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-lg mb-6 tracking-tight leading-tight">
              {dictionary.benefits.title}
            </h2>
            <p className="text-2xl text-white/80 max-w-3xl mx-auto font-medium leading-relaxed">
              {dictionary.benefits.subtitle}
            </p>

            <motion.div
              className="mt-10"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg className="w-10 h-10 mx-auto text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </motion.div>
        </div>
      </section>
      {/* Beneficios individuales con scroll snap */}
      {benefitsList.map((benefit, index) => {
        // Determinar los colores de transición
        const nextIndex = (index + 1) % benefitsList.length;
        const prevIndex = (index - 1 + benefitsList.length) % benefitsList.length;
        const nextBenefit = benefitsList[nextIndex];
        const prevBenefit = benefitsList[prevIndex];
        const isFirstBenefit = index === 0;
        
        // Extraer los colores para transiciones basados en el "from-" color del gradiente
        const nextColorFrom = nextBenefit.color.split(' ')[1].replace('from-', '');
        const prevColorFrom = isFirstBenefit 
          ? '#f9fafb' // Color blanco para la transición desde la intro
          : prevBenefit.color.split(' ')[1].replace('from-', '');
        
        return (
          <section 
            key={index} 
            className="relative overflow-hidden"
          >
            {/* Transición de degradado en la parte superior - desde la sección anterior */}
            <div className="absolute top-0 left-0 right-0 h-32  pointer-events-none"
                 style={{ background: `linear-gradient(to bottom, ${prevColorFrom}, ${prevColorFrom}50, transparent)` }}></div>
            
            {/* Transición de degradado en la parte inferior - hacia la siguiente sección */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t z-20 pointer-events-none"
                 style={{ background: `linear-gradient(to top, ${nextColorFrom}, ${nextColorFrom}50, transparent)` }}></div>
            
            {/* Fondo principal */}
            <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-95 z-0`}></div>
            
            {/* Elementos decorativos tecnológicos adaptados a cada sección */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Patrón de cuadrícula */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute left-0 right-0 h-[1px] top-1/4" style={{ backgroundColor: benefit.accentColor }}></div>
                <div className="absolute left-0 right-0 h-[1px] top-2/4" style={{ backgroundColor: benefit.accentColor }}></div>
                <div className="absolute left-0 right-0 h-[1px] top-3/4" style={{ backgroundColor: benefit.accentColor }}></div>
                <div className="absolute top-0 bottom-0 w-[1px] left-1/4" style={{ backgroundColor: benefit.accentColor }}></div>
                <div className="absolute top-0 bottom-0 w-[1px] left-2/4" style={{ backgroundColor: benefit.accentColor }}></div>
                <div className="absolute top-0 bottom-0 w-[1px] left-3/4" style={{ backgroundColor: benefit.accentColor }}></div>
              </div>
              
              {/* Círculos tecnológicos */}
              <motion.div 
                className="absolute top-20 left-10 w-48 h-48 rounded-full border"
                style={{ borderColor: `${benefit.accentColor}30` }}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div 
                className="absolute bottom-20 right-10 w-64 h-64 rounded-full border"
                style={{ borderColor: `${benefit.accentColor}20` }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Partículas */}
              <motion.div 
                className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full"
                style={{ backgroundColor: benefit.accentColor }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div 
                className="absolute top-2/3 left-1/3 w-3 h-3 rounded-full"
                style={{ backgroundColor: benefit.accentColor }}
                animate={{
                  y: [0, 30, 0],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div 
                className="absolute top-1/2 right-1/3 w-1 h-1 rounded-full"
                style={{ backgroundColor: benefit.accentColor }}
                animate={{
                  x: [0, -15, 0],
                  y: [0, 15, 0],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative h-full flex flex-col justify-center">
              <div className={`flex flex-col items-center justify-center ${benefit.textColor || "text-white"} px-4 py-8 md:py-12`}>
                <motion.div
                  ref={benefit.ref.ref}
                  initial={{ opacity: 0, y: 50 }}
                  animate={benefit.ref.inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.7 }}
                  className={`mb-8 p-6 ${benefit.iconBg} rounded-full backdrop-blur-sm border`}
                  style={{ borderColor: `${benefit.accentColor}50` }}
                >
                  {benefit.icon}
                </motion.div>
                
                <motion.h3
                  initial={{ opacity: 0, y: 30 }}
                  animate={benefit.ref.inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className={`text-4xl md:text-5xl font-bold mb-6 text-center ${benefit.textColor || ""}`}
                  style={!benefit.textColor ? { color: benefit.accentColor } : {}}
                >
                  {benefit.title}
                </motion.h3>
                
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={benefit.ref.inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className={`text-xl md:text-2xl text-center max-w-3xl ${benefit.descriptionColor || "text-black"}`}
                >
                  {benefit.description || "Our highly trained interpreters provide accurate and culturally sensitive interpretations every time."}
                </motion.p>
                
                <motion.div
                  className="mt-16"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <svg 
                    className={`w-10 h-10 mx-auto ${benefit.textColor ? 'text-gray-400' : ''}`} 
                    style={!benefit.textColor ? { color: `${benefit.accentColor}70` } : {}}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Contact Form Section */}
      <section 
        id="contact" 
        className="relative overflow-hidden"
      >
       <ContactForm dictionary={dictionary}/>
      </section>

      {/* Simplified footer that shows while scrolling */}
      {isFlowCompleted && (
        <div id="mini-footer" className="bg-gradient-to-r from-[#01112A] to-[#01319c] text-white shadow-lg">
          <div className="text-center py-3">
            <p>© {new Date().getFullYear()} E-Voque. All rights reserved.</p>
          </div>
        </div>
      )}
    </div>
  );
} 