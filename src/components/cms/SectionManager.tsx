'use client';

import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  PlusCircle, 
  Trash2, 
  GripVertical, 
  Maximize,
  Minimize,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ComponentTitleInput from './ComponentTitleInput';
import { Button } from '@/components/ui/button';
import { FormStyles } from './sections/FormStyleConfig';
import { FormCustomConfig } from './sections/FormConfig';
import { FormDesignType } from './forms/MultiStepFormRenderer';
import { ComponentType, HeaderAdvancedOptions } from '@/types/cms';
import ComponentSelector from './ComponentSelector';

// Drag and Drop imports
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DraggableSyntheticListeners,
  KeyboardSensor
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Footer types for proper typing
interface SocialLink {
  type: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'github' | 'custom';
  url: string;
  icon?: string;
  label?: string;
}

interface FooterColumn {
  title: string;
  links: Array<{
    label: string;
    url: string;
  }>;
}

export interface Component {
  id: string;
  type: ComponentType;
  data: Record<string, unknown>;
  subtitle?: string;
}

// Dynamic imports for components - fallback to skeleton loading states
const componentMap = {
  // Header
  Header: dynamic(() => import('./sections/HeaderSection'), {
    loading: () => (
      <div className="w-full bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }),
  // Hero
  Hero: dynamic(() => import('./sections/HeroSection'), {
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full h-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex gap-4">
                <div className="w-32 h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-32 h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-80 h-80 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }),
  // Text
  Text: dynamic(() => import('./sections/TextSection'), {
    loading: () => (
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="w-2/3 h-10 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }),
  // Image
  Image: dynamic(() => import('./sections/ImageSection'), {
    loading: () => (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="w-full h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }),
  // Feature
  Feature: dynamic(() => import('./sections/FeatureSection'), {
    loading: () => (
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="w-64 h-10 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
            <div className="w-96 h-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
                <div className="w-32 h-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
                <div className="w-48 h-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }),
  // Testimonial
  Testimonial: dynamic(() => import('./sections/TestimonialSection'), {
    loading: () => (
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
            <div className="w-3/4 h-8 bg-gray-200 rounded mx-auto animate-pulse"></div>
            <div className="w-48 h-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }),
  // Card
  Card: dynamic(() => import('./sections/CardSection'), {
    loading: () => (
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="w-full h-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }),
  // Benefit
  Benefit: dynamic(() => import('./sections/BenefitSection'), {
    loading: () => (
      <div className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="w-56 h-10 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
            <div className="w-80 h-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg space-y-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="w-3/4 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }),
  // Form
  Form: dynamic(() => import('./sections/FormSection'), {
    loading: () => (
      <div className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-6 animate-pulse"></div>
              <div className="w-64 h-10 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
              <div className="w-80 h-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
            </div>
            
            {/* Multi-step form skeleton */}
            <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
              {/* Progress bar */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              
              {/* Step indicators */}
              <div className="flex justify-center space-x-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center">
                    <div className={`w-12 h-12 rounded-full animate-pulse ${i === 0 ? 'bg-blue-200' : 'bg-gray-200'}`}></div>
                    {i < 2 && <div className="w-16 h-1 bg-gray-200 mx-4 animate-pulse"></div>}
                  </div>
                ))}
              </div>
              
              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-full h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                ))}
              </div>
              
              {/* Navigation buttons */}
              <div className="flex justify-between pt-6">
                <div className="w-24 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="w-24 h-12 bg-blue-200 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }),
  // Footer
  Footer: dynamic(() => import('./sections/FooterSection'), {
    loading: () => (
      <div className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="w-32 h-8 bg-gray-700 rounded mb-6 animate-pulse"></div>
              <div className="w-48 h-4 bg-gray-700 rounded mb-3 animate-pulse"></div>
              <div className="w-40 h-4 bg-gray-700 rounded animate-pulse"></div>
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="w-28 h-6 bg-gray-700 rounded mb-6 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="w-24 h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-28 h-4 bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-700 pt-8 flex justify-between items-center">
            <div className="w-56 h-4 bg-gray-700 rounded animate-pulse"></div>
            <div className="flex space-x-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }),
  // Article
  Article: dynamic(() => import('./sections/ArticleSection'), {
    loading: () => (
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="w-3/4 h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }),
  // Blog
  Blog: dynamic(() => import('./sections/BlogSectionWrapper'), {
    loading: () => (
      <div className="w-full bg-white border rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="w-full h-32 bg-gray-200 rounded mb-3 animate-pulse"></div>
                <div className="w-3/4 h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }),
  // CtaButton
  CtaButton: dynamic(() => import('./sections/CtaButtonSection'), {
    loading: () => (
      <div className="w-full bg-white border rounded-lg shadow-sm">
        <div className="p-6 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-24 h-10 bg-blue-200 rounded animate-pulse"></div>
            <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }),
  // Video
  Video: dynamic(() => import('./sections/VideoSection'), {
    loading: () => (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-24 h-24 bg-gray-700 rounded-full mx-auto mb-6 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 bg-gray-500 rounded-full animate-pulse"></div>
          </div>
          <div className="w-64 h-8 bg-gray-700 rounded mx-auto mb-4 animate-pulse"></div>
          <div className="w-80 h-6 bg-gray-700 rounded mx-auto mb-4 animate-pulse"></div>
          <div className="w-96 h-4 bg-gray-700 rounded mx-auto animate-pulse"></div>
        </div>
      </div>
    )
  }),
  // Gallery
  Gallery: dynamic(() => import('./sections/GallerySection'), {
    loading: () => (
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="w-48 h-8 bg-gray-200 rounded mx-auto mb-4 animate-pulse"></div>
            <div className="w-64 h-6 bg-gray-200 rounded mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }),
  // Calendar
  Calendar: dynamic(() => import('./sections/CalendarSection'), {
    loading: () => (
      <div className="w-full max-w-3xl mx-auto bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 via-pink-400 to-purple-500 text-white p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
            <div className="w-64 h-8 bg-white/20 rounded animate-pulse"></div>
          </div>
          <div className="w-80 h-6 bg-white/20 rounded animate-pulse"></div>
        </div>
        <div className="p-6">
          <div className="flex justify-between mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 bg-gray-100 rounded-xl">
                  <div className="w-full h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="w-3/4 h-3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }),
  // Signage
  Signage: dynamic(() => import('./sections/SignageSection'), {
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="w-3/4 h-16 bg-gray-700 rounded animate-pulse"></div>
              <div className="w-full h-6 bg-gray-700 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-6 space-y-4">
                    <div className="w-8 h-8 bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-16 h-4 bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-12 h-8 bg-gray-600 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
              <div className="w-32 h-12 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="flex justify-center">
              <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
                <div className="w-80 h-48 bg-black rounded animate-pulse"></div>
                <div className="mt-2 flex justify-between">
                  <div className="w-16 h-3 bg-gray-600 rounded animate-pulse"></div>
                  <div className="w-20 h-3 bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }),
};

// Props for the SectionManager component
interface SectionManagerProps {
  initialComponents?: Component[];
  isEditing?: boolean;
  isMobilePreview?: boolean;
  onComponentsChange?: (components: Component[]) => void;
  componentClassName?: (type: string) => string;
  activeComponentId?: string | null;
  onClickComponent?: (componentId: string) => void;
  sectionBackground?: string;
  sectionBackgroundType?: 'image' | 'gradient';
}

// Utilidad para debounce
const useDebounce = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

// Crear un componente memoizado para el wrapper de cada componente
const ComponentWrapperMemo = memo(function ComponentWrapper({ 
  component, 
  isEditing, 
  children, 
  onRemove,
  isCollapsed = false,
  onToggleCollapse,
  isActive = false,
  onComponentClick,
  dragListeners
}: { 
  component: Component; 
  isEditing: boolean; 
  children: React.ReactNode; 
  onRemove: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (id: string, isCollapsed: boolean) => void;
  isActive?: boolean;
  onComponentClick?: (componentId: string) => void;
  dragListeners?: DraggableSyntheticListeners;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const title = (component.data.componentTitle as string) || `${component.type} Component`;
  
  const handleRemoveClick = () => {
    setConfirmOpen(true);
  };
  
  const handleConfirmRemove = () => {
    onRemove(component.id);
    setConfirmOpen(false);
  };
  
  const handleCancelRemove = () => {
    setConfirmOpen(false);
  };
  
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleCollapse) {
      onToggleCollapse(component.id, isCollapsed);
    }
  };

  
  const handleComponentClick = () => {
    if (onComponentClick) {
      onComponentClick(component.id);
    }
  };

  return (
    <div 
      className={cn(
        "component-wrapper relative border-2 rounded-lg mb-6 transition-all duration-300 hover:shadow-md group bg-white",
        isActive && "active-component border-blue-400 bg-blue-50/30 shadow-lg shadow-blue-100",
        !isActive && "border-slate-200 hover:border-slate-300",
        isCollapsed && "component-collapsed"
      )}
      data-component-id={component.id}
      onClick={handleComponentClick}
    >
      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Eliminar Componente
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                ¿Estás seguro de que quieres eliminar este componente? Esta acción no se puede deshacer.
              </p>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={handleCancelRemove}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleConfirmRemove}>
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isEditing && (
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div 
              className={cn(
                "p-1.5 rounded-md hover:bg-slate-200/70 transition-all duration-200",
                isCollapsed && dragListeners 
                  ? "cursor-grab active:cursor-grabbing touch-none drag-handle text-slate-600 hover:text-slate-800" 
                  : "cursor-default opacity-40 text-slate-400"
              )}
              title={isCollapsed ? "Arrastrar para reordenar" : "Solo se puede arrastrar cuando está colapsado"}
              onClick={(e) => e.stopPropagation()}
              {...(isCollapsed && dragListeners ? dragListeners : {})}
            >
              <GripVertical className="h-4 w-4" />
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleToggle(e);
              }}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 shadow-sm border",
                isCollapsed 
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-emerald-200" 
                  : "bg-orange-500 hover:bg-orange-600 text-white border-orange-600 shadow-orange-200"
              )}
              title={isCollapsed ? "Expandir componente" : "Colapsar componente"}
              aria-label={isCollapsed ? "Expandir componente" : "Colapsar componente"}
              data-collapsed={isCollapsed}
              data-component-id={component.id}
              type="button"
            >
              {isCollapsed ? (
                <Maximize className="h-4 w-4" />
              ) : (
                <Minimize className="h-4 w-4" />
              )}
            </button>
            
            <div className="text-sm font-semibold text-slate-700 flex-1 min-w-0">
              {isEditing ? (
                <ComponentTitleInput
                  componentId={component.id}
                  initialTitle={title}
                  componentType={component.type}
                />
              ) : (
                <span className="truncate">{title}</span>
              )}
            </div>
          </div>
          
          {isEditing && (
            <div className="flex items-center space-x-2">
          
              <button
                onClick={handleRemoveClick}
                className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-200 shadow-sm border border-red-600"
                aria-label="Eliminar componente"
                title="Eliminar componente"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className={cn(
        isEditing ? (!isCollapsed ? 'block p-6 bg-slate-50/30' : 'hidden') : 'block'
      )}>
        {children}
      </div>
    </div>
  );
});

// Sortable Component Wrapper
const SortableComponent = memo(function SortableComponent({
  component,
  isEditing,
  children,
  onRemove,
  onMoveUp,
  onMoveDown,
  isCollapsed,
  onToggleCollapse,
  isActive,
  onComponentClick,
}: {
  component: Component;
  isEditing: boolean;
  children: React.ReactNode;
  onRemove: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: (id: string, isCollapsed: boolean) => void;
  isActive?: boolean;
  onComponentClick?: (componentId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id: component.id,
    disabled: !isEditing || !isCollapsed, // Only enable dragging when collapsed
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : 'transform 200ms ease-in-out, opacity 150ms ease-in-out',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ComponentWrapperMemo
        component={component}
        isEditing={isEditing}
        onRemove={onRemove}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        isActive={isActive}
        onComponentClick={onComponentClick}
        dragListeners={isCollapsed ? listeners : undefined} // Only pass drag listeners when collapsed
      >
        {children}
      </ComponentWrapperMemo>
    </div>
  );
});

// Componente principal memoizado
function SectionManagerBase({ 
  initialComponents = [], 
  isEditing = false,
  isMobilePreview = false,
  onComponentsChange,
  componentClassName,
  activeComponentId,
  onClickComponent,
  sectionBackground,
  sectionBackgroundType
}: SectionManagerProps) {
  const [components, setComponents] = useState<Component[]>(initialComponents);
  // Track collapsed components by ID - initialize with empty set (all expanded)
  const [collapsedComponents, setCollapsedComponents] = useState<Set<string>>(new Set());
  // Track components that were explicitly collapsed by user clicks
  const [userCollapsedComponents, setUserCollapsedComponents] = useState<Set<string>>(new Set());
  // Referencia para guardar el elemento activo antes del autoguardado
  const activeElementRef = useRef<Element | null>(null);
  // Estado para controlar las actualizaciones debounced de los componentes
  const [pendingUpdate, setPendingUpdate] = useState<{component: Component, data: Record<string, unknown>} | null>(null);
  // Aplicar debounce al pendingUpdate para evitar actualizaciones demasiado frecuentes
  const debouncedPendingUpdate = useDebounce(pendingUpdate, 1000);
  
  // Drag and drop state
  const [draggedComponent, setDraggedComponent] = useState<Component | null>(null);
  const isDraggingRef = useRef(false);
  const isMovingRef = useRef(false); // Track if we're in the middle of a move operation
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Creamos un ID único para cada conjunto de componentes para optimizar
  const componentsDataString = useMemo(() => JSON.stringify(components), [components]);

  // Efecto para inicializar componentes iniciales
  useEffect(() => {
    if (initialComponents.length > 0) {
      // Store current collapse state before updating components
      const previousCollapsedState = new Set(collapsedComponents);
      const previousUserCollapsedState = new Set(userCollapsedComponents);
      
      setComponents(initialComponents);
      
      // If this is the first load (no previous state), collapse all components
      if (previousCollapsedState.size === 0) {
        const allComponentIds = new Set(initialComponents.map(c => c.id));
        setCollapsedComponents(allComponentIds);
        setUserCollapsedComponents(new Set());
      } else {
        // After loading components (e.g., after save), preserve existing collapse state
        // Only collapse NEW components that weren't in the previous state
        const newComponentIds = new Set<string>();
        
        initialComponents.forEach(component => {
          // If this component was previously collapsed, keep it collapsed
          if (previousCollapsedState.has(component.id)) {
            newComponentIds.add(component.id);
          }
          // If this component was previously expanded, keep it expanded
          else if (components.some(c => c.id === component.id)) {
            // Component exists and was expanded, don't add to collapsed set
          }
          // If this is a completely new component, collapse it by default
          else {
            newComponentIds.add(component.id);
          }
        });
        
        // Set collapsed components: preserve previous state + collapse new components
        setCollapsedComponents(newComponentIds);
        // Preserve user collapsed preferences
        setUserCollapsedComponents(previousUserCollapsedState);
      }
    }
  }, [initialComponents]);
  
  // Efecto para aplicar las actualizaciones debounced
  useEffect(() => {
    if (debouncedPendingUpdate) {
      const { component, data } = debouncedPendingUpdate;
      
      // Guardar referencia al elemento activo
      activeElementRef.current = document.activeElement;
      
      // Crear componente actualizado
      const updatedComponent = {
        ...component,
        data: { ...component.data, ...data }
      };
      
      // Preserve title if it exists
      if (component.data.componentTitle) {
        updatedComponent.data.componentTitle = component.data.componentTitle;
      }
      
      // Capture current collapse state to preserve it
      const currentlyCollapsed = collapsedComponents.has(component.id);
      
      // Actualizar componentes - FIX: Only update if data actually changed
      const stringifiedOriginalData = JSON.stringify(component.data);
      const stringifiedUpdatedData = JSON.stringify(updatedComponent.data);
      
      if (stringifiedOriginalData !== stringifiedUpdatedData) {
        setComponents(prevComponents => 
          prevComponents.map(c => 
            c.id === component.id ? updatedComponent : c
          )
        );
        
        // Maintain the collapse state after the update
        if (!currentlyCollapsed) {
          setCollapsedComponents(prev => {
            const newSet = new Set(prev);
            newSet.delete(component.id);
            return newSet;
          });
        }
      }
      
      // Limpiar el pendingUpdate
      setPendingUpdate(null);
    }
  }, [debouncedPendingUpdate]); // Only dependency should be the debounced update

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const component = components.find(c => c.id === active.id);
    setDraggedComponent(component || null);
    isDraggingRef.current = true;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setDraggedComponent(null);
    isDraggingRef.current = false;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = components.findIndex(c => c.id === active.id);
    const newIndex = components.findIndex(c => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      // Preserve current collapse state before reordering
      const currentCollapsedState = new Set(collapsedComponents);
      const currentUserCollapsedState = new Set(userCollapsedComponents);
      
      const newComponents = arrayMove(components, oldIndex, newIndex);
      setComponents(newComponents);
      
      // Maintain collapse state after drag and drop - don't expand any components
      setCollapsedComponents(currentCollapsedState);
      setUserCollapsedComponents(currentUserCollapsedState);
      
      // Notify parent of changes with a delay to ensure smooth animation
      if (onComponentsChange) {
        setTimeout(() => {
          onComponentsChange(newComponents);
        }, 150); // Slightly longer delay for smoother experience
      }
    }
  };

  // State for component selector
  const [isComponentSelectorOpen, setIsComponentSelectorOpen] = useState(false);

  // Handler for showing component selector
  const handleAddButtonClick = () => {
    setIsComponentSelectorOpen(true);
  };

  // Handler for adding components
  const handleAddComponent = (type: ComponentType = 'Text') => {
    // Generate a unique ID with crypto.randomUUID or a fallback
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto 
      ? crypto.randomUUID()
      : `temp-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the new component
    const newComponent: Component = {
      id,
      type,
      data: {
        ...(type === 'Benefit' ? {
          title: 'Feature Title',
          description: 'Description of this feature',
          iconType: 'CheckCircle',
          accentColor: '#01319c',
          backgroundColor: 'from-[#ffffff] to-[#f0f9ff]',
          showGrid: true,
          showDots: true,
        } : type === 'Article' ? {
          title: 'Article Title',
          subtitle: 'This is the article subtitle or summary that provides a brief overview',
          author: 'John Doe',
          authorImage: '',
          publishDate: new Date().toISOString().split('T')[0],
          readTime: '5 min read',
          content: 'Start writing your article content here...\n\nThis is a new paragraph in your article.',
          featuredImage: '',
          featuredImageAlt: '',
          tags: ['news', 'technology']
        } : type === 'Blog' ? {
          title: 'Blog',
          subtitle: 'Latest articles and insights',
          blogId: '',
          layout: 'grid',
          filtersEnabled: true,
          searchEnabled: true,
          postsPerPage: 9,
          showFeaturedImage: true,
          showAuthor: true,
          showDate: true,
          showTags: true,
          showExcerpt: true
        } : type === 'CtaButton' ? {
          buttonText: 'Get Started',
          buttonUrl: '#',
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF',
          borderRadius: 8,
          dropdownLinks: [],
          showDropdown: false
        } : type === 'Gallery' ? {
          title: 'Gallery',
          subtitle: 'Latest images and videos',
          images: [],
          layout: 'grid',
          columns: 3,
        } : type === 'Calendar' ? {
          designTemplate: 'beauty-salon',
          showLocationSelector: true,
          showServiceCategories: true,
          showStaffSelector: true,
          calendarId: '',
          locationId: '',
          serviceIds: [],
          theme: 'light' as const,
          customStyles: {}
        } : {}),
        componentTitle: `${type} Component`
      }
    };
    
    let updatedComponents: Component[];
    
    // Determine where to place the component based on its type
    if (type === 'Header') {
      // Place Header at the beginning
      updatedComponents = [newComponent, ...components];
    } else if (type === 'Footer') {
      // Place Footer at the end
      updatedComponents = [...components, newComponent];
    } else {
      // If there's a Header, place after Header
      // If there's a Footer, place before Footer
      const headerIndex = components.findIndex(c => c.type === 'Header');
      const footerIndex = components.findIndex(c => c.type === 'Footer');
      
      if (headerIndex !== -1 && footerIndex !== -1) {
        // If both Header and Footer exist, place in the middle
        updatedComponents = [
          ...components.slice(0, footerIndex),
          newComponent,
          ...components.slice(footerIndex)
        ];
      } else if (headerIndex !== -1) {
        // If only Header exists, place after Header
        updatedComponents = [
          ...components.slice(0, headerIndex + 1),
          newComponent,
          ...components.slice(headerIndex + 1)
        ];
      } else if (footerIndex !== -1) {
        // If only Footer exists, place before Footer
        updatedComponents = [
          ...components.slice(0, footerIndex),
          newComponent,
          ...components.slice(footerIndex)
        ];
      } else {
        // Default case: just append at the end
        updatedComponents = [...components, newComponent];
      }
    }
    
    // Update components array
    setComponents(updatedComponents);
    
    // Automatically collapse the new component for better editing experience
    setCollapsedComponents(prev => {
      const newSet = new Set(prev);
      newSet.add(newComponent.id);
      return newSet;
    });
    
    // Notify parent of changes if callback exists - MOVED OUTSIDE setState
    if (onComponentsChange) {
      // Use setTimeout to prevent render cycle issues
      setTimeout(() => {
        onComponentsChange(updatedComponents);
      }, 0);
    }
    
    // Close the component selector
      setIsComponentSelectorOpen(false);
  };

  // Efecto para restaurar el foco después de actualizar componentes
  useEffect(() => {
    // Si teníamos un elemento activo, restaurar el foco después de la actualización
    if (activeElementRef.current && activeElementRef.current instanceof HTMLElement) {
      const activeEl = activeElementRef.current;
      
      // Esperar a que el DOM se actualice
      setTimeout(() => {
        try {
          activeEl.focus();
          // Si es un elemento de entrada de texto, mover el cursor al final
          if (
            activeEl instanceof HTMLInputElement || 
            activeEl instanceof HTMLTextAreaElement
          ) {
            // Only set selection for text-type inputs that support it
            const inputType = activeEl.getAttribute('type');
            const isSelectable = !inputType || ['text', 'textarea', 'email', 'password', 'tel', 'url', 'search', 'number'].includes(inputType);
            
            if (isSelectable) {
              const length = activeEl.value.length;
              activeEl.selectionStart = length;
              activeEl.selectionEnd = length;
            }
          }
          
          // Limpiar la referencia
          activeElementRef.current = null;
        } catch (e) {
          console.error("Error restoring focus:", e);
        }
      }, 10);
    }
  }, [components]);

  // Efecto para enviar cambios al padre
  useEffect(() => {
    // Notificar al padre cuando los componentes cambian, si hay un callback
    if (onComponentsChange && components !== initialComponents) {
      onComponentsChange(components);
    }
  }, [components, onComponentsChange, initialComponents]);

  // Initialize components as collapsed by default
  useEffect(() => {
    // When components are loaded initially, collapse ALL components by default for better editing experience
    if (components.length > 0 && collapsedComponents.size === 0) {
      // Collapse ALL components by default - this provides a cleaner editing experience
      const allComponentIds = new Set(components.map(c => c.id));
      setCollapsedComponents(allComponentIds);
      // Clear user collapsed components to start fresh
      setUserCollapsedComponents(new Set());
      
      // Clear active component to ensure no component has the blue border outline
      if (onClickComponent) {
        onClickComponent(''); // Clear active component by setting empty string
      }
    }
  }, [componentsDataString, components, onClickComponent]);

  // Auto-expand active component (but respect user's explicit collapse actions)
  useEffect(() => {
    // Only auto-expand if there's an active component AND the user didn't explicitly collapse it
    // AND we're not in the initial load state AND the activeComponentId is not empty
    if (activeComponentId && 
        activeComponentId !== '' &&
        collapsedComponents.has(activeComponentId) && 
        !userCollapsedComponents.has(activeComponentId) &&
        collapsedComponents.size < components.length) { // Not in initial load state
      // Expand the active component if it's collapsed
      setCollapsedComponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(activeComponentId);
        return newSet;
      });
    }
  }, [activeComponentId, collapsedComponents, userCollapsedComponents, components.length]);

  // Handle collapsing/expanding components - ONLY called by explicit collapse toggle button
  const handleToggleCollapse = useCallback((componentId: string, isCollapsed: boolean) => {
    
    // Note: isCollapsed parameter now represents the CURRENT state, not the target state
    // So if isCollapsed is true, we need to expand it, and vice versa
    
    // Create new set from previous state
    setCollapsedComponents(prev => {
      const newSet = new Set(prev);
      
      // If currently collapsed, expand it (remove from set)
      // If currently expanded, collapse it (add to set)
      if (isCollapsed) {
        newSet.delete(componentId);
        
        // Remove from user collapsed components when explicitly expanded
        setUserCollapsedComponents(prevUserCollapsed => {
          const newUserCollapsed = new Set(prevUserCollapsed);
          newUserCollapsed.delete(componentId);
          return newUserCollapsed;
        });
      } else {
        newSet.add(componentId);
        
        // Add to user collapsed components when explicitly collapsed
        setUserCollapsedComponents(prevUserCollapsed => {
          const newUserCollapsed = new Set(prevUserCollapsed);
          newUserCollapsed.add(componentId);
          return newUserCollapsed;
        });
      }
      
      return newSet;
    });
  }, []);

  // Function to collapse all components
  const collapseAllComponents = useCallback(() => {
    // Get all component IDs
    const allComponentIds = new Set(components.map(c => c.id));
    
    // Update both state variables to collapse all components
    setCollapsedComponents(allComponentIds);
    setUserCollapsedComponents(allComponentIds);
    
    // Clear active component for cleaner experience
    if (onClickComponent) {
      onClickComponent('');
    }
  }, [components, onClickComponent]);

  // Function to expand all components
  const expandAllComponents = useCallback(() => {
    // Clear both sets to expand all components
    setCollapsedComponents(new Set());
    setUserCollapsedComponents(new Set());
    
    // Clear active component for cleaner experience
    if (onClickComponent) {
      onClickComponent('');
    }
  }, [onClickComponent]);

  // Agregar de vuelta el event listener para component:update-title
  useEffect(() => {
    const handleComponentTitleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        componentId: string;
        newTitle: string;
      }>;
      
      if (customEvent.detail) {
        const { componentId, newTitle } = customEvent.detail;

        setComponents(prev => {
          // Create a shallow copy to preserve component references
          const newComponents = [...prev];
          
          // Find the component to update
          const existingIndex = newComponents.findIndex(c => c.id === componentId);
          if (existingIndex !== -1) {
            // Create a new component object to avoid reference issues
            newComponents[existingIndex] = {
              ...newComponents[existingIndex],
              // Store title in data.componentTitle instead of in title property
              data: {
                ...newComponents[existingIndex].data,
                componentTitle: newTitle
              }
            };
            
            console.log(`[SectionManager] ✅ Component title updated successfully`);
          } else {
            console.warn(`[SectionManager] ⚠️ Component with ID ${componentId} not found`);
          }
          
          // Notify parent component of changes
          if (onComponentsChange) {
            setTimeout(() => {
              onComponentsChange(newComponents);
            }, 100);
          }
          
          return newComponents;
        });
      } else {
        console.error('[SectionManager] ❌ component:update-title event received without data');
      }
    };

    document.addEventListener('component:update-title', handleComponentTitleUpdate);
    
    return () => {
      document.removeEventListener('component:update-title', handleComponentTitleUpdate);
    };
  }, [onComponentsChange]);

  // Add event listener for component:add to handle optimistic UI updates
  useEffect(() => {
    const handleComponentAdd = (e: Event) => {
      const customEvent = e as CustomEvent<Component>;
      
      if (customEvent.detail) {
        const newComponent = customEvent.detail;
        console.log(`[SectionManager] 🚀 Adding component optimistically:`, newComponent);

        setComponents(prev => {
          // Check if component already exists to avoid duplicates
          const existingIndex = prev.findIndex(c => c.id === newComponent.id);
          if (existingIndex !== -1) {
            console.log(`[SectionManager] ⚠️ Component ${newComponent.id} already exists, skipping`);
            return prev;
          }

          // Add the new component to the end of the list
          const newComponents = [...prev, newComponent];
          
          console.log(`[SectionManager] ✅ Component added optimistically. Total components: ${newComponents.length}`);
          
          // Notify parent component of changes
          if (onComponentsChange) {
            setTimeout(() => {
              onComponentsChange(newComponents);
            }, 100);
          }
          
          return newComponents;
        });
      } else {
        console.error('[SectionManager] ❌ component:add event received without data');
      }
    };

    document.addEventListener('component:add', handleComponentAdd);
    
    return () => {
      document.removeEventListener('component:add', handleComponentAdd);
    };
  }, [onComponentsChange]);

  // Add event listener for component:remove to handle reverting optimistic UI updates
  useEffect(() => {
    const handleComponentRemove = (e: Event) => {
      const customEvent = e as CustomEvent<{ componentId: string }>;
      
      if (customEvent.detail && customEvent.detail.componentId) {
        const { componentId } = customEvent.detail;
        console.log(`[SectionManager] 🗑️ Removing component optimistically:`, componentId);

        setComponents(prev => {
          const newComponents = prev.filter(c => c.id !== componentId);
          
          console.log(`[SectionManager] ✅ Component removed optimistically. Total components: ${newComponents.length}`);
          
          // Notify parent component of changes
          if (onComponentsChange) {
            setTimeout(() => {
              onComponentsChange(newComponents);
            }, 100);
          }
          
          return newComponents;
        });
      } else {
        console.error('[SectionManager] ❌ component:remove event received without componentId');
      }
    };

    document.addEventListener('component:remove', handleComponentRemove);
    
    return () => {
      document.removeEventListener('component:remove', handleComponentRemove);
    };
  }, [onComponentsChange]);

  // Remove a component without triggering a full re-render of the section
  const removeComponent = useCallback((id: string) => {
    setComponents(prevComponents => {
      const newComponents = prevComponents.filter(comp => comp.id !== id);
      return newComponents;
    });
  }, []);

  // Creamos una función memoizada para actualizar los componentes de forma eficiente
  const handleUpdate = useCallback((component: Component, updatedData: Record<string, unknown>) => {
    // En lugar de actualizar inmediatamente, establecer un pendingUpdate
    setPendingUpdate({ component, data: updatedData });
  }, []);

  // Handle when a component is clicked
  const handleComponentClick = useCallback((componentId: string) => {
    // Set as active component
    if (onClickComponent) {
      onClickComponent(componentId);
    }
    
    // No longer collapse other components when one is clicked
    // Just set the active component and let explicit collapse/expand handle visibility
  }, [onClickComponent]);

  // Manejar el movimiento de componentes hacia arriba
  const handleMoveComponentUp = useCallback((componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    // No mover si es Header o si es el primer componente
    if (component.type === 'Header' || components.indexOf(component) === 0) {
      return;
    }
    
    // No mover si justo arriba hay un Header
    const index = components.indexOf(component);
    if (index <= 0) return;
    
    const prevComponent = components[index - 1];
    if (prevComponent.type === 'Header') {
      return;
    }
    
    // Set moving flag to prevent unwanted activations
    isMovingRef.current = true;
    
    // Preserve current collapse state before moving
    const currentCollapsedState = new Set(collapsedComponents);
    const currentUserCollapsedState = new Set(userCollapsedComponents);
    
    setComponents(prevComponents => {
      const newComponents = [...prevComponents];
      const temp = newComponents[index];
      newComponents[index] = newComponents[index - 1];
      newComponents[index - 1] = temp;
      
      // Notify parent with delay for smooth transition
      if (onComponentsChange) {
        setTimeout(() => {
          onComponentsChange(newComponents);
          // Reset moving flag after operation completes
          setTimeout(() => {
            isMovingRef.current = false;
          }, 100);
        }, 200);
      } else {
        // Reset moving flag if no parent callback
        setTimeout(() => {
          isMovingRef.current = false;
        }, 300);
      }
      
      return newComponents;
    });
    
    // Preserve collapse state during reordering - don't expand any components
    setCollapsedComponents(currentCollapsedState);
    setUserCollapsedComponents(currentUserCollapsedState);
  }, [components, onComponentsChange, collapsedComponents, userCollapsedComponents]);

  // Manejar el movimiento de componentes hacia abajo
  const handleMoveComponentDown = useCallback((componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    
    // No mover si es Footer o si es el último componente
    if (component.type === 'Footer' || components.indexOf(component) === components.length - 1) {
      return;
    }
    
    // No mover si justo abajo hay un Footer
    const index = components.indexOf(component);
    if (index >= components.length - 1) return;
    
    const nextComponent = components[index + 1];
    if (nextComponent.type === 'Footer') {
      return;
    }
    
    // Set moving flag to prevent unwanted activations
    isMovingRef.current = true;
    
    // Preserve current collapse state before moving
    const currentCollapsedState = new Set(collapsedComponents);
    const currentUserCollapsedState = new Set(userCollapsedComponents);
    
    setComponents(prevComponents => {
      const index = prevComponents.findIndex(component => component.id === componentId);
      if (index < 0 || index >= prevComponents.length - 1) return prevComponents;
      
      // Crear un nuevo array con el componente movido una posición hacia abajo
      const newComponents = [...prevComponents];
      const temp = newComponents[index];
      newComponents[index] = newComponents[index + 1];
      newComponents[index + 1] = temp;
      
      // Notify parent with delay for smooth transition
      if (onComponentsChange) {
        setTimeout(() => {
          onComponentsChange(newComponents);
          // Reset moving flag after operation completes
          setTimeout(() => {
            isMovingRef.current = false;
          }, 100);
        }, 200);
      } else {
        // Reset moving flag if no parent callback
        setTimeout(() => {
          isMovingRef.current = false;
        }, 300);
      }
      
      return newComponents;
    });
    
    // Preserve collapse state during reordering - don't expand any components
    setCollapsedComponents(currentCollapsedState);
    setUserCollapsedComponents(currentUserCollapsedState);
  }, [components, onComponentsChange, collapsedComponents, userCollapsedComponents]);

  // Render each component - usamos una función memoizada
  const renderComponent = useCallback((component: Component) => {
    if (!component || !component.type || !componentMap[component.type]) {
      return null;
    }

    // Allow component to be collapsed in edit mode
    const isComponentCollapsed = collapsedComponents.has(component.id);
    
    // Determine if this is Header, Footer, first or last component
    const isHeader = component.type === 'Header';
    const isFooter = component.type === 'Footer';
    const componentIndex = components.indexOf(component);
    const isFirst = componentIndex === 0;
    const isLast = componentIndex === components.length - 1;

    // Componente específico según el tipo
    const renderComponentContent = () => {
      // Only render content if the component is not collapsed in edit mode
      if (isEditing && isComponentCollapsed) {
        return null;
      }

      // Obtener las clases específicas para este tipo de componente
      const customClassName = componentClassName ? componentClassName(component.type) : '';
      
      // Aplicamos la clase personalizada al elemento contenedor
      const containerClass = customClassName || '';

      // Añadir atributos especiales para componentes en páginas LANDING
      const containerProps = {
        className: containerClass,
        'data-component-type': component.type.toLowerCase(),
        'data-component-id': component.id
      };

      switch(component.type) {
        case 'Hero': {
          const HeroComponent = componentMap.Hero;
          return (
            <div {...containerProps}>
            <HeroComponent 
              title={component.data.title as string || "Default Title"} 
              subtitle={component.data.subtitle as string || "Default Subtitle"}
              image={component.data.image as string}
              // Use component's own background if it exists, otherwise use section background
              backgroundImage={
                (component.data.backgroundImage as string) || 
                (!isEditing && sectionBackground ? sectionBackground : undefined)
              }
              backgroundType={
                (component.data.backgroundType as 'image' | 'gradient') || 
                (!isEditing && sectionBackgroundType ? sectionBackgroundType : 'gradient')
              }
              cta={component.data.cta as { text: string; url: string }}
              secondaryCta={component.data.secondaryCta as { text: string; url: string }}
              badgeText={component.data.badgeText as string}
              showAnimatedDots={component.data.showAnimatedDots as boolean}
              showIcon={component.data.showIcon as boolean}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Text': {
          const TextComponent = componentMap.Text;
          return (
            <div {...containerProps}>
            <TextComponent 
              title={component.data.title as string || "Default Title"} 
              content={component.data.content as string || "Default Content"}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        
        case 'Image': {
          const ImageComponent = componentMap.Image;
          return (
            <div {...containerProps}>
            <ImageComponent 
              src={component.data.src as string || ""} 
              alt={component.data.alt as string || ""}
              caption={component.data.caption as string || ""}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Feature': {
          const FeatureComponent = componentMap.Feature;
          return (
            <div {...containerProps}>
            <FeatureComponent 
              title={component.data.title as string || "Feature Title"} 
              description={component.data.description as string || "Feature Description"}
              icon={component.data.icon as string || "star"}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Testimonial': {
          const TestimonialComponent = componentMap.Testimonial;
          return (
            <div {...containerProps}>
            <TestimonialComponent 
              quote={component.data.quote as string || "Testimonial Quote"} 
              author={component.data.author as string || "Author Name"}
              role={component.data.role as string || ""}
              avatar={component.data.avatar as string || ""}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Card': {
          const CardComponent = componentMap.Card;
          return (
            <div {...containerProps}>
            <CardComponent 
              title={component.data.title as string || "Card Title"} 
              description={component.data.description as string || "Card Description"}
              image={component.data.image as string || ""}
              link={component.data.link as string || ""}
              buttonText={component.data.buttonText as string || ""}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Header': {
          const HeaderComponent = componentMap.Header;
          return (
            <div {...containerProps}>
            <HeaderComponent 
              title={component.data.title as string} 
              subtitle={component.data.subtitle as string} 
              menuId={component.data.menuId as string || ""} 
              backgroundColor={component.data.backgroundColor as string || "#ffffff"}
              textColor={component.data.textColor as string || "#000000"}
              logoUrl={component.data.logoUrl as string || ""}
              transparency={component.data.transparency as number || 0}
              headerSize={component.data.headerSize as 'sm' | 'md' | 'lg' || 'md'}
              menuAlignment={component.data.menuAlignment as 'left' | 'center' | 'right' || 'right'}
              menuButtonStyle={component.data.menuButtonStyle as 'default' | 'filled' | 'outline' || 'default'}
              mobileMenuStyle={component.data.mobileMenuStyle as 'fullscreen' | 'dropdown' | 'sidebar' || 'dropdown'}
              mobileMenuPosition={component.data.mobileMenuPosition as 'left' | 'right' || 'right'}
              transparentHeader={component.data.transparentHeader as boolean || false}
              borderBottom={component.data.borderBottom as boolean || false}
              fixedHeader={component.data.fixedHeader as boolean || false}
              advancedOptions={component.data.advancedOptions as HeaderAdvancedOptions || {}}
              menuIcon={component.data.menuIcon as string || 'Menu'}
              // Button configuration props
              showButton={component.data.showButton as boolean || false}
              buttonText={component.data.buttonText as string || ''}
              buttonAction={component.data.buttonAction as string || ''}
              buttonColor={component.data.buttonColor as string || '#3B82F6'}
              buttonTextColor={component.data.buttonTextColor as string || '#FFFFFF'}
              buttonSize={component.data.buttonSize as 'sm' | 'md' | 'lg' || 'md'}
              buttonBorderRadius={component.data.buttonBorderRadius as number || 0}
              buttonShadow={component.data.buttonShadow as 'none' | 'sm' | 'md' | 'lg' | 'xl' || 'none'}
              buttonBorderColor={component.data.buttonBorderColor as string || ''}
              buttonBorderWidth={component.data.buttonBorderWidth as number || 0}
              buttonWidth={component.data.buttonWidth as string || ''}
              buttonHeight={component.data.buttonHeight as string || ''}
              buttonPosition={component.data.buttonPosition as 'left' | 'center' | 'right' || 'right'}
              buttonDropdown={component.data.buttonDropdown as boolean || false}
              buttonDropdownItems={component.data.buttonDropdownItems as Array<{id: string; label: string; url: string}> || []}
              isEditing={isEditing}
              onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
            />
            </div>
          );
        }
        
        case 'Benefit': {
          const BenefitComponent = componentMap.Benefit;
          return (
            <div {...containerProps}>
              <BenefitComponent 
                title={component.data.title as string || "Benefit Title"} 
                description={component.data.description as string || "Benefit Description"}
                iconType={component.data.iconType as string || 'CheckCircle'}
                accentColor={component.data.accentColor as string || '#01319c'}
                // Use component's own background if it exists, otherwise use section background for gradient type
                backgroundColor={
                  (component.data.backgroundColor as string) || 
                  (!isEditing && sectionBackgroundType === 'gradient' && sectionBackground ? sectionBackground : 'from-[#ffffff] to-[#f0f9ff]')
                }
                // If section background is an image, pass it as backgroundImage
                backgroundImage={!isEditing && sectionBackgroundType === 'image' && sectionBackground ? sectionBackground : undefined}
                backgroundType={!isEditing && sectionBackgroundType ? sectionBackgroundType : undefined}
                showGrid={component.data.showGrid as boolean ?? true}
                showDots={component.data.showDots as boolean ?? true}
                gridDesign={component.data.gridDesign as 'basic' | 'diagonal' | 'dots' | 'circles' | 'wave' || 'basic'}
                isEditing={isEditing}
                onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
              />
            </div>
          );
        }
        
        case 'Footer': {
          const FooterComponent = componentMap.Footer;
          return (
            <div {...containerProps}>
              <FooterComponent 
                logoUrl={component.data.logoUrl as string}
                companyName={component.data.companyName as string || "Company Name"}
                copyright={component.data.copyright as string}
                socialLinks={component.data.socialLinks as SocialLink[]}
                columns={component.data.columns as FooterColumn[]}
                menuId={component.data.menuId as string}
                backgroundColor={component.data.backgroundColor as string || "#111827"}
                textColor={component.data.textColor as string || "#f9fafb"}
                showYear={component.data.showYear as boolean ?? true}
                isEditing={isEditing}
                onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
              />
            </div>
          );
        }
        
        case 'Form': {
          const FormComponent = componentMap.Form;
          return (
            <div {...containerProps}>
              <FormComponent
                title={component.data.title as string}
                description={component.data.description as string}
                formId={component.data.formId as string}
                styles={component.data.styles as FormStyles}
                customConfig={component.data.customConfig as FormCustomConfig}
                formDesign={component.data.formDesign as FormDesignType || 'modern'}
                showStepTitle={component.data.showStepTitle as boolean}
                formPadding={component.data.formPadding as 'none' | 'small' | 'medium' | 'large' | 'extra-large' || 'medium'}
                formMargin={component.data.formMargin as 'none' | 'small' | 'medium' | 'large' | 'extra-large' || 'medium'}
                showBorder={component.data.showBorder as boolean ?? true}
                borderRadius={component.data.borderRadius as 'none' | 'small' | 'medium' | 'large' | 'extra-large' || 'medium'}
                selectedIcon={component.data.selectedIcon as string}
                // Use component's own background if it exists, otherwise use section background
                backgroundImage={
                  (component.data.backgroundImage as string) || 
                  (!isEditing && sectionBackground ? sectionBackground : undefined)
                }
                backgroundType={
                  (component.data.backgroundType as 'image' | 'gradient') || 
                  (!isEditing && sectionBackgroundType ? sectionBackgroundType : undefined)
                }
                isEditing={isEditing}
                onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
              />
            </div>
          );
        }
        
        case 'Article': {
          const ArticleComponent = componentMap.Article;
          return (
            <div {...containerProps}>
              <ArticleComponent
                title={component.data.title as string}
                subtitle={component.data.subtitle as string}
                author={component.data.author as string}
                authorImage={component.data.authorImage as string}
                publishDate={component.data.publishDate as string}
                readTime={component.data.readTime as string}
                content={component.data.content as string || ''}
                featuredImage={component.data.featuredImage as string}
                featuredImageAlt={component.data.featuredImageAlt as string}
                tags={component.data.tags as string[] || []}
                isEditing={isEditing}
                onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
              />
            </div>
          );
        }
        
        case 'Blog': {
          const BlogComponent = componentMap.Blog;
          return (
            <div {...containerProps}>
              <BlogComponent
                title={component.data.title as string}
                subtitle={component.data.subtitle as string}
                blogId={component.data.blogId as string}
                layout={component.data.layout as 'grid' | 'list' | 'carousel' || 'grid'}
                filtersEnabled={component.data.filtersEnabled as boolean ?? true}
                searchEnabled={component.data.searchEnabled as boolean ?? true}
                postsPerPage={component.data.postsPerPage as number || 9}
                showFeaturedImage={component.data.showFeaturedImage as boolean ?? true}
                showAuthor={component.data.showAuthor as boolean ?? true}
                showDate={component.data.showDate as boolean ?? true}
                showTags={component.data.showTags as boolean ?? true}
                showExcerpt={component.data.showExcerpt as boolean ?? true}
                isEditing={isEditing}
                onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
              />
            </div>
          );
        }
        
        case 'CtaButton': {
          const CtaButtonComponent = componentMap.CtaButton;
          return (
            <div {...containerProps}>
              <CtaButtonComponent
                buttonText={component.data.buttonText as string}
                buttonUrl={component.data.buttonUrl as string}
                backgroundColor={component.data.backgroundColor as string}
                textColor={component.data.textColor as string}
                borderRadius={component.data.borderRadius as number}
                dropdownLinks={component.data.dropdownLinks as Array<{id: string; label: string; url: string}>}
                showDropdown={component.data.showDropdown as boolean}
                isEditing={isEditing}
                onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
              />
            </div>
          );
        }
        
        case 'Video': {
          const VideoComponent = componentMap.Video;
          return (
            <div {...containerProps}>
              <VideoComponent
                videoUrl={component.data.videoUrl as string}
                posterUrl={component.data.posterUrl as string}
                title={component.data.title as string}
                subtitle={component.data.subtitle as string}
                description={component.data.description as string}
                autoplay={component.data.autoplay as boolean ?? false}
                loop={component.data.loop as boolean ?? false}
                muted={component.data.muted as boolean ?? true}
                controls={component.data.controls as boolean ?? true}
                playsinline={component.data.playsinline as boolean ?? true}
                overlayEnabled={component.data.overlayEnabled as boolean ?? false}
                overlayColor={component.data.overlayColor as string ?? '#000000'}
                overlayOpacity={component.data.overlayOpacity as number ?? 50}
                textColor={component.data.textColor as string ?? '#ffffff'}
                textAlignment={component.data.textAlignment as 'left' | 'center' | 'right' ?? 'center'}
                contentPosition={component.data.contentPosition as 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' ?? 'center'}
                showPlayButton={component.data.showPlayButton as boolean ?? true}
                playButtonStyle={component.data.playButtonStyle as 'default' | 'filled' | 'outline' ?? 'filled'}
                playButtonSize={component.data.playButtonSize as 'sm' | 'md' | 'lg' ?? 'lg'}
                fullHeight={component.data.fullHeight as boolean ?? true}
                maxHeight={component.data.maxHeight as string ?? '100vh'}
                objectFit={component.data.objectFit as 'cover' | 'contain' | 'fill' ?? 'cover'}
                isEditing={isEditing}
                isMobilePreview={isMobilePreview}
                onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
              />
            </div>
          );
        }
        
        case 'Gallery': {
          const GalleryComponent = componentMap.Gallery;
          return (
            <div {...containerProps}>
              <GalleryComponent
                title={component.data.title as string}
                subtitle={component.data.subtitle as string}
                images={component.data.images as Array<{id: string; url: string; alt: string; caption?: string; title?: string}> || []}
                layout={component.data.layout as 'grid' | 'masonry' | 'carousel' | 'lightbox' || 'grid'}
                columns={component.data.columns as 2 | 3 | 4 | 5 || 3}
                spacing={component.data.spacing as 'none' | 'small' | 'medium' | 'large' || 'medium'}
                aspectRatio={component.data.aspectRatio as 'square' | 'landscape' | 'portrait' | 'auto' || 'square'}
                showCaptions={component.data.showCaptions as boolean ?? true}
                showTitles={component.data.showTitles as boolean ?? false}
                enableLightbox={component.data.enableLightbox as boolean ?? true}
                backgroundColor={component.data.backgroundColor as string || '#ffffff'}
                textColor={component.data.textColor as string || '#000000'}
                borderRadius={component.data.borderRadius as number || 8}
                showImageCount={component.data.showImageCount as boolean ?? false}
                autoplay={component.data.autoplay as boolean ?? false}
                autoplaySpeed={component.data.autoplaySpeed as number || 3000}
                showNavigation={component.data.showNavigation as boolean ?? true}
                showDots={component.data.showDots as boolean ?? true}
                isEditing={isEditing}
                onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
              />
            </div>
          );
        }
        
        case 'Calendar': {
          const CalendarComponent = componentMap.Calendar;
          return (
            <div {...containerProps}>
              <CalendarComponent
                calendarId={component.data.calendarId as string}
                locationId={component.data.locationId as string}
                serviceIds={component.data.serviceIds as string[]}
                theme={component.data.theme as 'light' | 'dark' || 'light'}
                showLocationSelector={component.data.showLocationSelector as boolean ?? true}
                showServiceCategories={component.data.showServiceCategories as boolean ?? true}
                showStaffSelector={component.data.showStaffSelector as boolean ?? true}
                designTemplate={component.data.designTemplate as 'beauty-salon' | 'medical' | 'fitness' | 'restaurant' | 'corporate' | 'spa' | 'automotive' | 'education' | 'modern' || 'beauty-salon'}
                customStyles={component.data.customStyles as Record<string, string> || {}}
                isEditing={isEditing}
                onUpdate={isEditing ? (data) => handleUpdate(component, data) : undefined}
              />
            </div>
          );
        }
        
        default: {
          return (
            <div {...containerProps} className={containerClass}>
              <div className="p-4 bg-warning/10 rounded-md border border-warning/20 mb-4">
                <div className="flex-1">
                  <span className="text-sm opacity-80">
                    {component.type}
                  </span>
                  <h4 className="text-base opacity-80 font-medium line-clamp-1 mb-1">
                    {(component.data.componentTitle as string) || `${component.type} Component`}
                  </h4>
                  <p className="text-warning-foreground text-sm">Componente desconocido</p>
                </div>
              </div>
            </div>
          );
        }
      }
    };

    if (isEditing) {
      return (
        <SortableComponent 
          key={component.id}
          component={component}
          isEditing={isEditing}
          onRemove={removeComponent}
          onMoveUp={!(isHeader || isFirst) ? handleMoveComponentUp : undefined}
          onMoveDown={!(isFooter || isLast) ? handleMoveComponentDown : undefined}
          isFirst={isFirst || isHeader}
          isLast={isLast || isFooter}
          isCollapsed={isComponentCollapsed}
          onToggleCollapse={handleToggleCollapse}
          isActive={activeComponentId === component.id}
          onComponentClick={handleComponentClick}
        >
          {renderComponentContent()}
        </SortableComponent>
      );
    } else {
      return (
        <div key={component.id}>
          {renderComponentContent()}
        </div>
      );
    }
  }, [
    isEditing, 
    handleUpdate, 
    removeComponent,
    handleMoveComponentUp, 
    handleMoveComponentDown, 
    components, 
    collapsedComponents, 
    handleToggleCollapse,
    componentClassName,
    activeComponentId,
    handleComponentClick,
    sectionBackground,
    sectionBackgroundType
  ]);


  // If we're editing, render the add component button and component list
  return (
    <div 
      className={cn(
        "section-manager w-full",
        isEditing && "editing-mode"
      )}
      data-section-manager="true"
      data-cms-editor={isEditing ? "true" : "false"}
    >
      {isEditing && (
        <div className="flex justify-between items-center mb-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-slate-800 mr-6">Page Components</h2>
            <div className="flex space-x-3">
              <button
                onClick={collapseAllComponents}
                className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-orange-600"
                title="Colapsar todos los componentes"
              >
                <ChevronsUp className="h-4 w-4 mr-2" />
                Colapsar todos
              </button>
              <button
                onClick={expandAllComponents}
                className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg border border-emerald-600"
                title="Expandir todos los componentes"
              >
                <ChevronsDown className="h-4 w-4 mr-2" />
                Expandir todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Components with Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col relative">
            {components.map((component) => 
              renderComponent(component)
            )}
          </div>
        </SortableContext>
        
        {/* Drag Overlay */}
        <DragOverlay>
          {draggedComponent ? (
            <div className="bg-white border-2 border-primary/50 rounded-lg shadow-lg p-4 opacity-90 transform rotate-1">
              <div className="flex items-center space-x-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-medium text-foreground">
                  {(draggedComponent.data.componentTitle as string) || `${draggedComponent.type} Component`}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Moving {draggedComponent.type} component...
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Component Type Selector Modal */}
      {isComponentSelectorOpen && (
        <ComponentSelector
          isOpen={isComponentSelectorOpen}
          onClose={() => setIsComponentSelectorOpen(false)}
          onSelect={handleAddComponent}
        />
      )}

      {isEditing && (
        <div className="mb-8 mt-4">
          <button
            onClick={handleAddButtonClick}
            className={cn(
              "flex items-center justify-center w-full py-4 px-6 rounded-xl border-2 border-dashed border-slate-300",
              "transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 group",
              "focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400",
              "bg-white shadow-sm hover:shadow-md"
            )}
          >
            <PlusCircle className="h-6 w-6 mr-3 text-slate-500 group-hover:text-blue-500 transition-colors duration-300" />
            <span className="text-base font-semibold text-slate-600 group-hover:text-blue-600 transition-colors duration-300">
              Add Component
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// Exportamos el componente memoizado
export default memo(SectionManagerBase); 