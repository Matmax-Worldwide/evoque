/**
 * @fileoverview This file defines the PageWrapper component, a client-side component
 * responsible for rendering page content composed of CMS sections. It also provides
 * an in-place editing experience when activated via a URL parameter (`?edit=true`),
 * allowing users to add, remove, and reorder sections on a page.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ManageableSection from '@/components/cms/ManageableSection';
import { cmsOperations } from '@/lib/graphql-client';
import {
  SaveIcon,
  EyeIcon,
  LayoutIcon,
  PlusIcon,
  XIcon,
  ArrowUpDownIcon,
  RefreshCwIcon
} from 'lucide-react';

/**
 * Props for the PageWrapper component.
 */
interface PageWrapperProps {
  /**
   * An array of objects defining the sections to be rendered on the page.
   * Each object should have:
   *  - `id`: A unique identifier for the section instance on the page.
   *  - `sectionId`: The identifier of the CMS section definition to render.
   *  - `order`: Optional number indicating the order of the section on the page.
   */
  pageSections: Array<{
    id: string;
    sectionId: string;
    order?: number;
  }>;
  /** Optional string, the unique ID of the current page being wrapped/edited. */
  pageId?: string;
  /** Optional string, the slug of the current page, used for display in edit mode. */
  pageSlug?: string;
  /**
   * Optional ReactNode. If provided, this content is rendered if no `pageSections`
   * are available and the component is not in edit mode.
   */
  children?: React.ReactNode;
}

/**
 * `PageWrapper` is a client-side component that serves a dual role:
 * 1. **Display Mode**: Renders a list of CMS sections that constitute a page.
 * 2. **Edit Mode**: Provides an in-place editing interface to manage these sections
 *    (add, remove, reorder), triggered by a `?edit=true` URL search parameter.
 *
 * It uses `useSearchParams` to detect edit mode, `ManageableSection` to render
 * individual sections (which can also enter an editing state for their internal components),
 * and `cmsOperations` for fetching available sections and potentially saving changes.
 *
 * @param {PageWrapperProps} props - The props for the component.
 * @returns {React.JSX.Element} The rendered page content, either in display or edit mode.
 */
export default function PageWrapper({ pageSections = [], pageSlug, children }: PageWrapperProps) {
  const searchParams = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(false);
  const [sections, setSections] = useState(pageSections);
  /** State for storing all CMS sections available to be added to the page. */
  const [availableSections, setAvailableSections] = useState<Array<{id: string, sectionId: string, name: string}>>([]);
  /** State to indicate if available sections are currently being loaded. */
  const [isLoading, setIsLoading] = useState(false);
  /** State to indicate if changes are currently being saved. */
  const [isSaving, setIsSaving] = useState(false);
  /** State to control the visibility of the "Add Section" modal. */
  const [showAddSection, setShowAddSection] = useState(false);
  /** State for displaying success or error notifications after save attempts. */
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  /**
   * State to track which sections have pending changes that need to be saved.
   * Keys are section IDs (or a special format for removed sections), value is boolean.
   */
  const [sectionChanges, setSectionChanges] = useState<Record<string, boolean>>({});
  
  /**
   * Effect to detect the `?edit=true` URL search parameter.
   * If present, it sets `isEditMode` to true and triggers loading of available sections.
   */
  useEffect(() => {
    const editParam = searchParams.get('edit');
    setIsEditMode(editParam === 'true');
    
    // Cargar secciones disponibles si estamos en modo de edición
    if (editParam === 'true') {
      loadAvailableSections();
    }
  }, [searchParams]);
  
  /**
   * Fetches all available CMS sections from the backend using `cmsOperations.getAllCMSSections`.
   * Used to populate the "Add Section" modal in edit mode.
   */
  const loadAvailableSections = async () => {
    try {
      setIsLoading(true);
      const sectionsData = await cmsOperations.getAllCMSSections();
      
      if (Array.isArray(sectionsData)) {
        const formattedSections = sectionsData.map(section => ({
          id: section.id, // This is the CMSSection's own database ID
          sectionId: section.sectionId, // This is the user-defined identifier for the section type
          name: section.name || section.sectionId // Display name for the section
        }));
        setAvailableSections(formattedSections);
      }
    } catch (error) {
      console.error('Error loading available sections:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Callback function passed to `ManageableSection` to indicate that
   * a section's internal content (components) has changed.
   * Marks the section as having pending changes in `sectionChanges`.
   * @param sectionId - The `sectionId` (identifier for the section type) of the modified section.
   */
  const handleSectionChange = useCallback((sectionId: string) => {
    setSectionChanges(prev => ({
      ...prev,
      [sectionId]: true
    }));
  }, []);
  
  /**
   * Adds a new section to the page's section list in edit mode.
   * A temporary unique ID is generated for the new section instance.
   * @param sectionData - An object containing `id` (CMSSection's DB ID) and `sectionId` (section type identifier)
   *                      of the section definition to add.
   */
  const addSection = (sectionData: {id: string, sectionId: string}) => {
    const newSection = {
      id: `temp-${Date.now()}`, // Temporary unique ID for this instance on the page
      sectionId: sectionData.sectionId, // The type of section to render
      order: sections.length
    };
    
    setSections(prev => [...prev, newSection]);
    setShowAddSection(false);
    
    // Marcar como cambiada
    setSectionChanges(prev => ({
      ...prev,
      [sectionData.sectionId]: true // Track that this type of section might need its component list saved
    }));
  };
  
  /**
   * Removes a section from the page's section list at the given index in edit mode.
   * Marks the removal as a change to be saved.
   * @param index - The index of the section to remove from the `sections` array.
   */
  const removeSection = (index: number) => {
    const updatedSections = [...sections];
    const removedSection = updatedSections.splice(index, 1)[0];
    setSections(updatedSections);
    
    // Marcar para guardar estos cambios
    if (removedSection) {
      setSectionChanges(prev => ({
        ...prev,
        [`removed-${removedSection.id}`]: true // Track removal for persistence
      }));
    }
  };
  
  /**
   * Moves a section up or down in the page's section list in edit mode.
   * Updates the `order` property of all affected sections and marks them as changed.
   * @param index - The current index of the section to move.
   * @param direction - Either 'up' or 'down'.
   */
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedSections = [...sections];
    const section = updatedSections[index];
    
    updatedSections.splice(index, 1);
    updatedSections.splice(newIndex, 0, section);
    
    // Actualizar orden
    const reorderedSections = updatedSections.map((section, idx) => ({
      ...section,
      order: idx
    }));
    
    setSections(reorderedSections);
    
    // Marcar todos como cambiados porque el orden ha cambiado
    const changes = reorderedSections.reduce((acc, section) => {
      acc[section.sectionId] = true; // Track that these sections (by type) might need re-saving due to order change
      return acc;
    }, {} as Record<string, boolean>);
    
    setSectionChanges(prev => ({
      ...prev,
      ...changes
    }));
  };
  
  /**
   * Simulates saving all pending changes to the page structure and section content.
   * In a real implementation, this would involve API calls to persist:
   * - The new order and list of sections associated with the `pageId`.
   * - Any changes to components within sections that were marked in `sectionChanges`.
   * Displays a success or error notification.
   */
  const saveChanges = async () => {
    setIsSaving(true);
    
    try {
      // TODO: Implement actual API calls to save:
      // 1. The `sections` array (order and section IDs) associated with `pageId`.
      //    This might involve updating a Page record with its new section associations.
      // 2. For each sectionId in `Object.keys(sectionChanges)` where value is true (and not 'removed-'),
      //    potentially re-save the components of that `ManageableSection` if its internal save is not automatic.
      //    The current `handleSectionChange` marks a sectionId when its components change.
      //    The `ManageableSection` itself might handle its own component saving via cmsOperations.saveSectionComponents.
      //    This `saveChanges` function would then primarily be for the page's structure (section list and order).
      console.log('Simulating save for page structure:', sections);
      console.log('Tracked section content changes (sectionId: true if components changed):', sectionChanges);

      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación
      
      setNotification({
        type: 'success',
        message: 'Todos los cambios guardados correctamente'
      });
      
      // Limpiar registro de cambios
      setSectionChanges({});
      
      // Auto-ocultar la notificación después de 3 segundos
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error saving page changes:', error);
      setNotification({
        type: 'error',
        message: 'Error al guardar los cambios'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Display Mode: If not in edit mode and no sections are defined for the page,
  // render provided children or nothing.
  if ((!sections || sections.length === 0) && !isEditMode) {
    return <>{children}</>;
  }

  return (
    <div className="page-editor">
      {isEditMode && (
        <div className="sticky top-0 bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
          <div className="text-lg font-medium flex items-center">
            <LayoutIcon className="h-5 w-5 mr-2" />
            {pageSlug ? `Editando: /${pageSlug}` : 'Editor de Página'}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => window.location.href = window.location.pathname}
              className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Vista Previa
            </button>
            <button
              onClick={saveChanges}
              disabled={isSaving || Object.keys(sectionChanges).length === 0}
              className={`flex items-center px-4 py-2 rounded-md ${
                Object.keys(sectionChanges).length === 0
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Notificación */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-md shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
          : 'bg-red-100 text-red-800 border-l-4 border-red-500'
        }`}>
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-auto -mx-1.5 -my-1.5 rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className={isEditMode ? 'pt-16 pb-24' : ''}>
        {/* Modo de edición - mostrar secciones */}
        {isEditMode ? (
          <div className="space-y-8">
            {sections.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No hay secciones en esta página</p>
                <p className="text-sm text-gray-400 mt-2">Haz clic en &ldquo;Añadir Sección&rdquo; para comenzar</p>
              </div>
            )}
            
            {sections.map((section, index) => (
              <div key={section.id} className="relative border-2 border-dashed border-blue-200 rounded-lg mb-8">
                {/* Controles de sección */}
                <div className="absolute -top-3 right-3 flex items-center space-x-1 z-10">
                  <button
                    onClick={() => moveSection(index, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded-full ${
                      index === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                    title="Mover arriba"
                  >
                    <ArrowUpDownIcon className="h-4 w-4 transform rotate-180" />
                  </button>
                  <button
                    onClick={() => moveSection(index, 'down')}
                    disabled={index === sections.length - 1}
                    className={`p-1 rounded-full ${
                      index === sections.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                    title="Mover abajo"
                  >
                    <ArrowUpDownIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removeSection(index)}
                    className="p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                    title="Eliminar sección"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Componente editable */}
                <ManageableSection
                  key={section.sectionId}
                  sectionId={section.sectionId}
                  isEditing={true}
                  onComponentsChange={() => handleSectionChange(section.sectionId)}
                />
              </div>
            ))}
            
            {/* Botón para añadir nueva sección */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowAddSection(!showAddSection)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Añadir Sección
              </button>
            </div>
            
            {/* Selector de secciones */}
            {showAddSection && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Seleccionar Sección</h3>
                    <button
                      onClick={() => setShowAddSection(false)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <XIcon className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableSections.map((section) => (
                        <div
                          key={section.id}
                          onClick={() => addSection(section)}
                          className="p-4 border rounded-md cursor-pointer hover:border-blue-300 hover:bg-blue-50"
                        >
                          <h4 className="font-medium">{section.name}</h4>
                          <p className="text-sm text-gray-500 truncate">
                            {section.sectionId}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Modo normal - renderizar las secciones en modo visualización
          <div className="space-y-8">
            {sections.map((section) => (
              <ManageableSection
                key={section.id}
                sectionId={section.sectionId}
                isEditing={false}
              />
            ))}
            {children}
          </div>
        )}
      </div>
      
      {/* Botón flotante para entrar en modo edición (solo visible cuando no estamos en modo edición) */}
      {!isEditMode && pageSlug && (
        <div className="fixed bottom-8 right-8">
          <a
            href={`?edit=true`}
            className="flex items-center px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Editar Página
          </a>
        </div>
      )}
    </div>
  );
} 