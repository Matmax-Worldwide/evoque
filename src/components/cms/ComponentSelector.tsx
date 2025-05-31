'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Calendar, MapPin, Sparkles, Check } from 'lucide-react';
import { ComponentType } from '@/types/cms';
import { cn } from '@/lib/utils';

interface ComponentMeta {
  type: ComponentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  preview: React.ReactNode;
  disabled?: boolean;
}

interface ComponentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (componentType: ComponentType) => void;
  className?: string;
}

const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  className = ''
}) => {
  const [sliderPosition, setSliderPosition] = useState(0);

  // Component definitions
  const availableComponents: ComponentMeta[] = [
    {
      type: 'Header',
      title: 'Header Component',
      description: 'Navigation headers for the website',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 19H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-slate-500 bg-slate-100 border-slate-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-slate-50 to-slate-100 rounded-md opacity-50">
          <div className="flex justify-between items-center">
            <div className="w-8 h-3 bg-slate-300 rounded"></div>
            <div className="flex space-x-2">
              <div className="w-4 h-2 bg-slate-300 rounded"></div>
              <div className="w-4 h-2 bg-slate-300 rounded"></div>
              <div className="w-4 h-2 bg-slate-300 rounded"></div>
              <div className="w-6 h-2 bg-slate-400 rounded"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      type: 'Hero',
      title: 'Hero Component',
      description: 'Large banner sections for page headers',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-indigo-500 bg-indigo-100 border-indigo-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-md opacity-50">
          <div className="bg-indigo-200 w-full h-16 rounded-md mb-2 flex items-center justify-center">
            <div className="w-1/2 h-8 flex flex-col justify-center items-center">
              <div className="h-2 bg-indigo-300 rounded w-full mb-2"></div>
              <div className="h-1.5 bg-indigo-300 rounded w-3/4"></div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="h-4 w-16 bg-indigo-300 rounded-full"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Benefit',
      title: 'Benefit Component',
      description: 'Showcase the benefits of your product or service',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-teal-500 bg-teal-100 border-teal-200',
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-teal-50 to-teal-100 rounded-md">
          <div className="flex items-center justify-center mb-2">
            <div className="w-8 h-8 rounded-full bg-teal-200 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" className="text-teal-500">
                <path d="M9 11L12 14L22 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="h-2 bg-teal-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-1.5 bg-teal-200 rounded w-5/6 mx-auto"></div>
        </div>
      )
    },
    {
      type: 'Text',
      title: 'Text Component',
      description: 'For paragraphs, articles and general text content',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7V5H20V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 19H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-blue-500 bg-blue-100 border-blue-200',
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Text Component</h3>
          <div className="space-y-2">
            <div className="h-2 bg-blue-200 rounded w-3/4"></div>
            <div className="h-2 bg-blue-200 rounded"></div>
            <div className="h-2 bg-blue-200 rounded"></div>
            <div className="h-2 bg-blue-200 rounded w-5/6"></div>
            <div className="h-2 bg-blue-200 rounded w-4/6"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Image',
      title: 'Image Component',
      description: 'For displaying images and visual content',
      disabled: true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15L16 10L9 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-emerald-500 bg-emerald-100 border-emerald-200',
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-md">
          <div className="bg-emerald-200 w-full h-20 rounded-md flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15L16 10L9 17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="h-2 bg-emerald-200 rounded w-1/2 mt-2 mx-auto"></div>
        </div>
      )
    },
    {
      type: 'Feature',
      title: 'Feature Component',
      description: 'Highlight key features with icons and text',
      disabled: true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 12L10 8V16L16 12Z" fill="currentColor"/>
        </svg>
      ),
      color: 'text-amber-500 bg-amber-100 border-amber-200',
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-md">
          <div className="flex mb-2">
            <div className="w-6 h-6 rounded-full bg-amber-300 mr-2 flex-shrink-0"></div>
            <div>
              <div className="h-2 bg-amber-200 rounded w-20 mb-1"></div>
              <div className="h-1.5 bg-amber-200 rounded w-24"></div>
            </div>
          </div>
          <div className="flex mb-2">
            <div className="w-6 h-6 rounded-full bg-amber-300 mr-2 flex-shrink-0"></div>
            <div>
              <div className="h-2 bg-amber-200 rounded w-24 mb-1"></div>
              <div className="h-1.5 bg-amber-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      type: 'Testimonial',
      title: 'Testimonial Component',
      description: 'Display customer testimonials and reviews',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15C21 16.6569 19.6569 18 18 18H8L4 22V8C4 6.34315 5.34315 5 7 5H18C19.6569 5 21 6.34315 21 8V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-fuchsia-500 bg-fuchsia-100 border-fuchsia-200',
      disabled: true,
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 rounded-md opacity-50">
          <div className="text-fuchsia-700 mb-1 text-lg">&ldquo;</div>
          <p className="text-xs text-fuchsia-900 italic">This product has completely transformed our business processes.</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-fuchsia-200"></div>
            <div className="h-2 bg-fuchsia-200 rounded w-20"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Card',
      title: 'Card Component',
      description: 'Display information in card format',
      disabled: true,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 8H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 12H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 16H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-rose-500 bg-rose-100 border-rose-200',
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-md">
          <div className="bg-rose-200 w-full h-10 rounded-t-md"></div>
          <div className="p-2 border border-t-0 border-rose-200 rounded-b-md bg-white">
            <div className="h-2 bg-rose-200 rounded w-3/4 mb-2"></div>
            <div className="h-1.5 bg-rose-200 rounded w-full mb-1"></div>
            <div className="h-1.5 bg-rose-200 rounded w-4/5"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Footer',
      title: 'Footer Component',
      description: 'Page footer with links and copyright information',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 19H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M4 15H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-gray-500 bg-gray-100 border-gray-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-md opacity-50">
          <div className="mt-auto">
            <div className="h-px w-full bg-gray-200 mb-2"></div>
            <div className="flex justify-between items-center">
              <div className="w-20 h-2 bg-gray-300 rounded"></div>
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      type: 'Form',
      title: 'Form Component',
      description: 'Add forms for user interaction and data collection',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M7 8H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-purple-500 bg-purple-100 border-purple-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-md">
          <div className="h-2 bg-purple-200 rounded w-1/3 mb-3"></div>
          <div className="h-6 bg-white border border-purple-200 rounded mb-2"></div>
          <div className="h-6 bg-white border border-purple-200 rounded mb-2"></div>
          <div className="h-6 bg-white border border-purple-200 rounded mb-3"></div>
          <div className="w-1/3 h-8 bg-purple-500 rounded-md self-start"></div>
        </div>
      )
    },
    {
      type: 'Article',
      title: 'Article Component',
      description: 'Create rich articles with featured images, author info, and tags',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-cyan-600 bg-cyan-100 border-cyan-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-md">
          <div className="bg-cyan-200 w-full h-16 rounded-md mb-3"></div>
          <div className="h-3 bg-cyan-300 rounded w-3/4 mb-2"></div>
          <div className="h-2 bg-cyan-200 rounded w-1/2 mb-3"></div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-cyan-300"></div>
            <div className="h-1.5 bg-cyan-200 rounded w-16"></div>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 bg-cyan-200 rounded"></div>
            <div className="h-1.5 bg-cyan-200 rounded"></div>
            <div className="h-1.5 bg-cyan-200 rounded w-5/6"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Blog',
      title: 'Blog Component',
      description: 'Display posts from a selected blog with filters, search, and different layouts',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      color: 'text-purple-600 bg-purple-100 border-purple-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-md">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-purple-200 h-12 rounded"></div>
            <div className="bg-purple-200 h-12 rounded"></div>
            <div className="bg-purple-200 h-12 rounded"></div>
            <div className="bg-purple-200 h-12 rounded"></div>
          </div>
          <div className="mt-2 flex justify-center gap-1">
            <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
            <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
          </div>
        </div>
      )
    },
    {
      type: 'CtaButton',
      title: 'CtaButton Component',
      description: 'Add call-to-action buttons with dropdown links',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="8" width="18" height="8" rx="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 10l2 2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-green-500 bg-green-100 border-green-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-md">
          <div className="flex items-center justify-center">
            <div className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg">
              <div className="w-12 h-2 bg-white/80 rounded mr-2"></div>
              <div className="w-3 h-3 border-l border-b border-white/80 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      type: 'Video',
      title: 'Video Component',
      description: 'Add a video with customizable options',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 8L16 12L10 16V8Z" fill="currentColor"/>
        </svg>
      ),
      color: 'text-red-500 bg-red-100 border-red-200',
      disabled: false,
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-md">
          <div className="bg-red-200 w-full h-16 rounded-md mb-2 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-300 to-red-400 rounded-md opacity-60"></div>
            <div className="relative z-10 w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-500">
                <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="h-2 w-24 bg-red-300 rounded-full"></div>
          </div>
        </div>
      )
    },
    {
      type: 'Gallery',
      title: 'Gallery Component',
      description: 'Display multiple images in a grid format',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15L16 10L9 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: 'text-emerald-500 bg-emerald-100 border-emerald-200',
      preview: (
        <div className="flex flex-col p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-md">
          <div className="bg-emerald-200 w-full h-20 rounded-md flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="M21 15L16 10L9 17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="h-2 bg-emerald-200 rounded w-1/2 mt-2 mx-auto"></div>
        </div>
      )
    },
    {
      type: 'Calendar',
      title: 'Calendar Booking',
      description: 'Interactive booking calendar with multiple design templates for appointments and reservations',
      icon: <Calendar className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      preview: (
        <div className="w-full h-40 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-purple-500 rounded-full">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-purple-700">Book Your Experience</span>
          </div>
          
          {/* Progress indicators */}
          <div className="flex justify-between mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                i <= 2 ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i <= 2 ? <Check className="w-3 h-3" /> : i}
              </div>
            ))}
          </div>
          
          {/* Service selection grid */}
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-6 rounded-md text-xs flex items-center justify-center ${
                i === 1 ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {i === 1 ? <MapPin className="w-3 h-3" /> : <div className="w-3 h-3 bg-gray-300 rounded"></div>}
              </div>
            ))}
          </div>
          
          {/* Bottom action */}
          <div className="mt-2 bg-purple-500 text-white text-xs py-1 px-2 rounded text-center">
            Confirm Booking
          </div>
        </div>
      )
    },
    {
      type: 'Signage',
      title: 'Digital Signage',
      description: 'Digital signage management with device monitoring, media library, and playlist control',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 7V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      color: 'text-slate-500 bg-slate-100 border-slate-200',
      preview: (
        <div className="w-full h-40 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 flex items-center">
          <div className="flex-1 space-y-4">
            <div className="text-white">
              <div className="h-4 bg-white/80 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/60 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white/10 rounded p-2 text-center">
                  <div className="w-4 h-4 bg-white/60 rounded mx-auto mb-1"></div>
                  <div className="h-2 bg-white/40 rounded w-8 mx-auto mb-1"></div>
                  <div className="h-3 bg-white/60 rounded w-6 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="ml-4">
            <div className="bg-gray-800 rounded p-2 shadow-lg">
              <div className="w-16 h-10 bg-black rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="mt-1 flex justify-between text-xs">
                <div className="w-4 h-1 bg-gray-600 rounded"></div>
                <div className="w-6 h-1 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Ensure sliderPosition is in bounds
  useEffect(() => {
    if (sliderPosition < 0) {
      setSliderPosition(0);
    } else if (sliderPosition >= availableComponents.length) {
      setSliderPosition(availableComponents.length - 1);
    }
  }, [sliderPosition, availableComponents.length]);

  const handleSliderChange = (newPosition: number) => {
    setSliderPosition(newPosition);
  };

  const handleSelectComponent = () => {
    // Skip if the component is disabled
    if (availableComponents[sliderPosition].disabled) return;
    
    onSelect(availableComponents[sliderPosition].type);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft' && sliderPosition > 0) {
      handleSliderChange(sliderPosition - 1);
    } else if (e.key === 'ArrowRight' && sliderPosition < availableComponents.length - 1) {
      handleSliderChange(sliderPosition + 1);
    } else if (e.key === 'Enter') {
      handleSelectComponent();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] ${className}`} 
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{ isolation: 'isolate' }}
    >
      <div 
        className="bg-white rounded-xl p-4 shadow-2xl w-full max-w-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Select Component Type</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Slider View */}
        <div className="mb-6">
          <div className="relative rounded-xl border border-gray-200 p-4 bg-gray-50">
            {/* Preview of Current Component */}
            <div className="mb-4">
              {availableComponents[sliderPosition].preview}
            </div>
            
            {/* Component Info */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className={`mr-3 p-2 rounded-lg ${
                  availableComponents[sliderPosition].disabled 
                    ? 'bg-gray-200 text-gray-400' 
                    : availableComponents[sliderPosition].color
                }`}>
                  {availableComponents[sliderPosition].icon}
                </div>
                <div>
                  <h4 className={`font-medium ${availableComponents[sliderPosition].disabled ? 'text-gray-400' : ''}`}>
                    {availableComponents[sliderPosition].title}
                  </h4>
                  <p className={`text-sm ${availableComponents[sliderPosition].disabled ? 'text-gray-400' : 'text-gray-500'}`}>
                    {availableComponents[sliderPosition].description}
                  </p>
                  {availableComponents[sliderPosition].disabled && (
                    <p className="text-xs text-gray-500 mt-1">
                      Este componente estará disponible en próximas actualizaciones
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => handleSliderChange(sliderPosition - 1)}
                disabled={sliderPosition === 0}
                className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="text-sm text-gray-500">
                {sliderPosition + 1} of {availableComponents.length}
              </div>
              
              <button 
                onClick={() => handleSliderChange(sliderPosition + 1)}
                disabled={sliderPosition === availableComponents.length - 1}
                className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Thumbnail Navigation */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex space-x-2">
            {availableComponents.map((component, index) => (
              <button
                key={component.type}
                onClick={() => !component.disabled && handleSliderChange(index)}
                className={cn(
                  "flex-shrink-0 p-2 rounded-lg border-2 transition-all",
                  component.disabled 
                    ? "border-gray-200 cursor-not-allowed opacity-60" 
                    : sliderPosition === index 
                      ? "border-primary bg-primary/10" 
                      : "hover:bg-gray-100"
                )}
                disabled={component.disabled}
                title={component.disabled ? "Disponible próximamente" : component.title}
              >
                <div className={`w-10 h-10 rounded-md flex items-center justify-center ${
                  component.disabled ? 'text-gray-400 bg-gray-100 border-gray-200' : component.color
                }`}>
                  {component.icon}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectComponent}
            disabled={availableComponents[sliderPosition].disabled}
            className={`px-4 py-2 rounded-md ${
              availableComponents[sliderPosition].disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {availableComponents[sliderPosition].disabled
              ? 'Próximamente'
              : `Add ${availableComponents[sliderPosition].title}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentSelector;