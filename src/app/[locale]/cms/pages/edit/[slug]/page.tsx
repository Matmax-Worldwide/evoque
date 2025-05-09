'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  SaveIcon,
  ArrowLeftIcon,
  AlertCircleIcon,
  CheckIcon,
  FileTextIcon,
  LayoutIcon,
  PencilIcon,
  MoveIcon,
  PlusIcon,
  MinusIcon,
  Loader2Icon,
  ChevronRightIcon,
  SearchIcon,
  InfoIcon,
  AlignLeftIcon,
  GlobeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cmsOperations, PageData } from '@/lib/graphql-client';
import ManageableSection from '@/components/cms/ManageableSection';
import SectionManager from '@/components/cms/SectionManager';

// Define the component types that match SectionManager's ComponentType
type ComponentType = 'Hero' | 'Text' | 'Image' | 'Feature' | 'Testimonial' | 'Header' | 'Card';

interface ManageableSectionHandle {
  saveChanges: () => Promise<void>;
}

interface Section {
  id: string;
  sectionId: string;
  name: string;
  description?: string;
  order: number;
}

interface AvailableSection {
  sectionId: string;
  name: string;
  description?: string;
  components?: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
  }>;
}

interface SectionComponentData {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

// Add this interface right after the existing interfaces
interface ExtendedWindow extends Window {
  editSection?: (sectionId: string) => void;
}

// Section Preview Component
function SectionPreview({ sectionId, refreshKey }: { sectionId: string; refreshKey?: string | number }) {
  const [isLoading, setIsLoading] = useState(true);
  const [components, setComponents] = useState<SectionComponentData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sectionLoaded, setSectionLoaded] = useState(false);

  useEffect(() => {
    const loadSectionComponents = async () => {
      // Generate a unique operation ID for this load operation
      const loadId = `load-${Math.random().toString(36).substring(2, 9)}`;
      const startTime = Date.now();
      
      console.log(`⏳ [${loadId}] INICIO CARGA de componentes para sección '${sectionId}'`);
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Make sure to pass just the sectionId without query parameters
        // The resolver will handle cleaning the sectionId
        const cleanSectionId = sectionId.split('?')[0];
        console.log(`🔍 [${loadId}] Solicitando componentes para sección: ${cleanSectionId}`);
        
        // Call the getSectionComponents method from the GraphQL client
        const result = await cmsOperations.getSectionComponents(cleanSectionId);
        
        // Log diagnostic information about the response
        console.log(`✅ [${loadId}] Respuesta recibida después de ${Date.now() - startTime}ms`);
        console.log(`🔍 [${loadId}] Respuesta:`, result);
        
        if (!result) {
          console.error(`❌ [${loadId}] La respuesta es NULL o UNDEFINED`);
          setError('No se recibió respuesta del servidor');
          setComponents([]);
          setSectionLoaded(false);
          return;
        }
        
        // Check that the response has a components property that is an array
        if (!result.components) {
          console.error(`❌ [${loadId}] La respuesta NO contiene el campo 'components' o es NULL`);
          setError('La respuesta no contiene datos de componentes');
          setComponents([]);
          setSectionLoaded(false);
          return;
        }
        
        if (!Array.isArray(result.components)) {
          console.error(`❌ [${loadId}] El campo 'components' NO ES UN ARRAY, es:`, typeof result.components);
          setError(`El campo 'components' no es un array válido (${typeof result.components})`);
          setComponents([]);
          setSectionLoaded(false);
          return;
        }
        
        // Log component info
        if (result.components.length === 0) {
          console.warn(`⚠️ [${loadId}] Se recibió un array de componentes VACÍO`);
        } else {
          console.log(`✅ [${loadId}] Se recibieron ${result.components.length} componentes`);
          
          // Verify each component structure
          result.components.forEach((comp, idx) => {
            console.log(`🔍 [${loadId}] Componente #${idx+1}:`);
            console.log(`  - ID: ${comp.id || 'FALTA'}`);
            console.log(`  - Type: ${comp.type || 'FALTA'}`);
            console.log(`  - Data: ${comp.data ? 'PRESENTE' : 'FALTA'}`);
            
            if (!comp.id || !comp.type) {
              console.warn(`⚠️ [${loadId}] El componente #${idx+1} tiene estructura INCOMPLETA`);
            }
          });
        }
        
        // Set components state
        setComponents(result.components);
        setSectionLoaded(true);
        console.log(`✅ [${loadId}] CARGA COMPLETADA en ${Date.now() - startTime}ms`);
      } catch (error) {
        console.error(`❌ [${loadId}] ERROR al cargar componentes:`, error);
        setError(error instanceof Error ? error.message : 'Error desconocido al cargar componentes');
        setComponents([]);
        setSectionLoaded(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadSectionComponents();
  }, [sectionId, refreshKey]);

  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="mt-2 text-gray-500">Cargando componentes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-600 text-sm">
        <AlertCircleIcon className="h-5 w-5 inline-block mr-2" />
        Error: {error}
      </div>
    );
  }

  // Section loaded successfully
  if (sectionLoaded) {
    console.log(`===== DEBUG SECTION COMPONENTS =====`);
    console.log(`🎯 Section ID: ${sectionId}`);
    console.log(`🎯 Components count: ${components.length}`);
    console.log(`🎯 Components array:`, components);
    console.log(`===== END DEBUG SECTION COMPONENTS =====`);
    
    // Check if components array really has valid items
    if (!components || components.length === 0) {
      return (
        <div className="py-8 text-center bg-amber-50 rounded-lg border-2 border-dashed border-amber-300">
          <LayoutIcon className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-amber-800 font-medium text-lg mb-1">Esta sección existe pero aún no tiene componentes</h3>
          <p className="text-amber-600 text-sm mb-4">Añade componentes para darle vida a esta sección</p>
          <button 
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors" 
            onClick={() => (window as ExtendedWindow).editSection?.(sectionId)}
          >
            <PlusIcon className="h-4 w-4 inline-block mr-1" />
            Añadir componentes
          </button>
          <p className="mt-3 text-xs text-amber-500">
            ID de sección: {sectionId.substring(0, 8)}...
          </p>
        </div>
      );
    }

    // Map the components to the format expected by SectionManager
    const mappedComponents = components.map(comp => ({
      id: comp.id,
      type: comp.type as ComponentType, // Cast to our local ComponentType
      data: comp.data || {}
    }));

    // We have components, display them using SectionManager directly
    return (
      <div className="bg-white rounded-md">
        <SectionManager 
          initialComponents={mappedComponents}
          isEditing={false}
        />
      </div>
    );
  }

  // Fallback if none of the above conditions are met
  return (
    <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <AlertCircleIcon className="h-8 w-8 text-amber-500 mx-auto mb-2" />
      <p className="text-gray-600">No se pudo cargar la vista previa de la sección</p>
      <p className="text-xs text-gray-500 mt-2">Intenta refrescar la página</p>
    </div>
  );
}

// Main Component
export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const { locale, slug } = params;
  
  // Page data state
  const [pageData, setPageData] = useState<PageData>({
    id: '',
    title: '',
    slug: '',
    description: '',
    template: 'default',
    isPublished: false,
    pageType: 'CONTENT',
    locale: locale as string,
    sections: [],
    metaTitle: '',
    metaDescription: '',
    featuredImage: ''
  });
  
  // UI states
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExitConfirmationOpen, setIsExitConfirmationOpen] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState('');
  
  // Section management states
  const [availableSections, setAvailableSections] = useState<AvailableSection[]>([]);
  const [pageSections, setPageSections] = useState<Section[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [selectedTemplateSection, setSelectedTemplateSection] = useState<string>('');
  const [forceReloadSection, setForceReloadSection] = useState(false);
  
  // Delete confirmation states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);
  
  // Reference to the section editor
  const sectionRef = useRef<ManageableSectionHandle>(null);
  
  // New states for section creation
  const [showCreateSectionDialog, setShowCreateSectionDialog] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDescription, setNewSectionDescription] = useState('');
  const [isCreatingSection, setIsCreatingSection] = useState(false);

  // Fetch page data by slug
  useEffect(() => {
    const fetchPageData = async () => {
      if (!slug) return;
      
      console.log(`Fetching page data for slug: ${slug}`);
      setIsLoading(true);
      
      try {
        const pageResult = await cmsOperations.getPageBySlug(slug as string);
        
        if (!pageResult) {
          console.error(`No page found with slug: ${slug}`);
          setNotification({
            type: 'error',
            message: `No se encontró ninguna página con slug: ${slug}`
          });
          return;
        }
        
        console.log('Page data loaded:', pageResult);
        
        // Set the page data
        setPageData(pageResult);
        
        // Process sections data
        const sections = Array.isArray(pageResult.sections) 
          ? pageResult.sections.map((section: string | { id: string; title?: string; order?: number }, index: number) => {
              // Handle different section data structures
              if (typeof section === 'string') {
                // Simple string ID format
                return {
                  id: `section-${index}`,
                  sectionId: section,
                  name: `Sección ${index + 1}`,
                  order: index
                };
              } else if (typeof section === 'object' && section !== null) {
                // Object format with ID and other properties
                return {
                  id: `section-${index}`,
                  sectionId: section.id || '',
                  name: section.title || `Sección ${index + 1}`,
                  description: '',
                  order: section.order !== undefined ? section.order : index
                };
              }
              return null;
            }).filter(Boolean) as Section[]
          : [];
        
        console.log(`Processed ${sections.length} sections`);
        setPageSections(sections);
      } catch (error) {
        console.error('Error loading page data:', error);
        setNotification({
          type: 'error',
          message: 'Error al cargar los datos de la página'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [slug]);

  // Load available sections
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setIsLoadingSections(true);
        const sectionsData = await cmsOperations.getAllCMSSections();
        
        if (Array.isArray(sectionsData)) {
          console.log(`Fetched ${sectionsData.length} available sections`);
          const formattedSections = sectionsData.map(section => ({
            sectionId: section.id,
            name: section.name || section.id,
            description: section.description || '',
            components: Array.isArray(section.components) ? section.components : []
          }));
          setAvailableSections(formattedSections);
        } else {
          console.error('Invalid response format for sections:', sectionsData);
        }
      } catch (error) {
        console.error('Error loading sections:', error);
        setNotification({
          type: 'error',
          message: 'No se pudieron cargar las secciones disponibles'
        });
      } finally {
        setIsLoadingSections(false);
      }
    };

    fetchSections();
  }, []);
  
  // Exit confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // Handle title change and auto-generate slug if not manually edited
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const currentSlug = pageData.slug;
    
    // If the current slug matches the original slug from the database, 
    // then update it with the new title
    const shouldUpdateSlug = 
      !currentSlug || 
      currentSlug === generateSlug(pageData.title || '');
    
    setPageData(prev => ({
      ...prev,
      title: newTitle,
      ...(shouldUpdateSlug ? { slug: generateSlug(newTitle) } : {})
    }));
    
    setHasUnsavedChanges(true);
  };
  
  // Handle general input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPageData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setPageData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };
  
  // Handle checkbox/switch changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setPageData(prev => ({ ...prev, [name]: checked }));
    setHasUnsavedChanges(true);
  };
  
  // Add section to page
  const handleAddSection = () => {
    if (!selectedTemplateSection) return;
    
    const selectedSection = availableSections.find(s => s.sectionId === selectedTemplateSection);
    if (!selectedSection) return;
    
    const newSection: Section = {
      id: `temp-${Date.now()}`,
      sectionId: selectedSection.sectionId,
      name: selectedSection.name,
      description: selectedSection.description,
      order: pageSections.length
    };
    
    setPageSections(prev => [...prev, newSection]);
    setHasUnsavedChanges(true);
    setShowAddSectionDialog(false);
    setSelectedTemplateSection('');
    
    console.log(`Añadida sección: ${newSection.name} (${newSection.sectionId})`);
  };
  
  // Move a section up or down
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === pageSections.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedSections = [...pageSections];
    
    // Swap the sections
    [updatedSections[index], updatedSections[newIndex]] = 
      [updatedSections[newIndex], updatedSections[index]];
    
    // Update order property
    updatedSections.forEach((section, idx) => {
      section.order = idx;
    });
    
    setPageSections(updatedSections);
    setHasUnsavedChanges(true);
    
    console.log(`Sección ${pageSections[index].name} movida ${direction === 'up' ? 'arriba' : 'abajo'}`);
  };
  
  // Remove section from page
  const handleRemoveSection = (sectionId: string) => {
    const sectionToRemove = pageSections.find(s => s.sectionId === sectionId);
    if (sectionToRemove) {
      setSectionToDelete(sectionToRemove);
      setIsDeleteConfirmOpen(true);
    }
  };
  
  // Confirm section removal
  const confirmDeleteSection = () => {
    if (!sectionToDelete) return;
    
    console.log(`Eliminando sección: ${sectionToDelete.name} (${sectionToDelete.sectionId})`);
    
    setPageSections(prev => prev
      .filter(s => s.sectionId !== sectionToDelete.sectionId)
      .map((section, index) => ({ ...section, order: index }))
    );
    
    setIsDeleteConfirmOpen(false);
    setSectionToDelete(null);
    setHasUnsavedChanges(true);
  };
  
  // Cancel section removal
  const cancelDeleteSection = () => {
    setIsDeleteConfirmOpen(false);
    setSectionToDelete(null);
  };
  
  // Edit a section
  const handleEditSection = (sectionId: string) => {
    console.log(`📝 Editando sección: ${sectionId}`);
    
    // Check if section exists in our loaded sections
    const sectionExists = pageSections.some(s => s.sectionId === sectionId);
    if (!sectionExists) {
      console.warn(`⚠️ La sección con ID ${sectionId} no existe en la página actual. Esto puede ser un error.`);
    }
    
    // Navigate to the section editor tab
    setEditingSectionId(sectionId);
    setActiveTab('editor');
    
    // Scroll to the section editor
    setTimeout(() => {
      document.getElementById('section-editor')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Save section changes
  const handleSaveSectionChanges = async () => {
    if (!sectionRef.current) return;
    
    try {
      console.log(`Guardando cambios en sección: ${editingSectionId}`);
      setIsSaving(true);
      
      await sectionRef.current.saveChanges();
      
      setEditingSectionId(null);
      setActiveTab('sections');
      setForceReloadSection(!forceReloadSection);
      
      setNotification({
        type: 'success',
        message: 'Cambios en la sección guardados correctamente'
      });
      
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (error) {
      console.error('Error al guardar cambios en la sección:', error);
      
      setNotification({
        type: 'error',
        message: 'No se pudieron guardar los cambios en la sección'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Save the entire page (update instead of create)
  const handleSavePage = async () => {
    if (!pageData.title) {
      setNotification({
        type: 'error',
        message: 'Por favor, ingresa un título para la página'
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      console.log('Preparando datos para actualizar página...');
      
      // Map sections to the format expected by the API
      const formattedSections = pageSections.map((section, index) => ({
        id: section.id && !section.id.startsWith('temp-') ? section.id : undefined,
        order: index,
        title: section.name || `Sección ${index + 1}`,
        componentType: 'CUSTOM',
        isVisible: true,
        data: { sectionId: section.sectionId } // Store the sectionId in the data field
      }));
      
      console.log(`Actualizando página con ${formattedSections.length} secciones`);
      
      // Create the page input with the correctly formatted sections
      const pageInput = {
        title: pageData.title,
        slug: pageData.slug,
        description: pageData.description,
        template: pageData.template,
        isPublished: pageData.isPublished,
        pageType: pageData.pageType,
        locale: pageData.locale,
        metaTitle: pageData.metaTitle || undefined,
        metaDescription: pageData.metaDescription || undefined,
        featuredImage: pageData.featuredImage || undefined,
        sections: formattedSections // This matches the expected format
      };
      
      console.log('Datos de la página a actualizar:', pageInput);
      
      const result = await cmsOperations.updatePage(pageData.id, pageInput);
      
      if (result && result.success) {
        console.log('Página actualizada exitosamente:', result);
        
        setNotification({
          type: 'success',
          message: 'Página actualizada exitosamente'
        });
        
        setHasUnsavedChanges(false);
        
        // Navigate to the pages list after a short delay
        setTimeout(() => {
          router.push(`/${locale}/cms/pages`);
        }, 2000);
      } else {
        throw new Error(result?.message || 'Error al actualizar la página');
      }
    } catch (error) {
      console.error('Error al actualizar la página:', error);
      
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al actualizar la página'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle cancel/back button
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setRedirectTarget(`/${locale}/cms/pages`);
      setIsExitConfirmationOpen(true);
    } else {
      router.push(`/${locale}/cms/pages`);
    }
  };
  
  // Confirm exit without saving
  const handleConfirmExit = () => {
    setIsExitConfirmationOpen(false);
    
    if (redirectTarget) {
      router.push(redirectTarget);
    }
  };
  
  // Cancel exit
  const handleCancelExit = () => {
    setIsExitConfirmationOpen(false);
    setRedirectTarget('');
  };
  
  // Create a new section
  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      setNotification({
        type: 'error',
        message: 'Debes proporcionar un nombre para la sección'
      });
      return;
    }
    
    // Generate a section ID from the name
    const sectionId = `section-${newSectionName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')}-${Date.now()}`;
      
    setIsCreatingSection(true);
    
    try {
      console.log(`Creando nueva sección "${newSectionName}" con ID: ${sectionId}`);
      
      // Create empty section in the CMS
      const result = await cmsOperations.saveSectionComponents(sectionId, []);
      
      if (result && result.success) {
        console.log('Sección creada exitosamente:', sectionId);
        
        // Add the new section to the available sections list
        const newSection: AvailableSection = {
          sectionId: sectionId,
          name: newSectionName,
          description: newSectionDescription
        };
        
        setAvailableSections(prev => [...prev, newSection]);
        
        // Directly add this section to the page
        const newPageSection: Section = {
          id: `temp-${Date.now()}`, 
          sectionId: sectionId,
          name: newSectionName,
          description: newSectionDescription,
          order: pageSections.length
        };
        
        setPageSections(prev => [...prev, newPageSection]);
        setHasUnsavedChanges(true);
        
        // Clear form and close dialog
        setNewSectionName('');
        setNewSectionDescription('');
        setShowCreateSectionDialog(false);
        
        // Show success notification
        setNotification({
          type: 'success',
          message: `Sección "${newSectionName}" creada y añadida a la página`
        });
        
        setTimeout(() => {
          setNotification(null);
        }, 3000);
        
        // Open section editor
        setEditingSectionId(sectionId);
        setActiveTab('editor');
      } else {
        throw new Error(result?.message || 'Error al crear la sección');
      }
    } catch (error) {
      console.error('Error al crear la sección:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Error al crear la sección'
      });
    } finally {
      setIsCreatingSection(false);
    }
  };
  
  // Render a section preview
  const renderSectionPreview = (section: Section, index: number) => {
    return (
      <div 
        key={`${section.id}-${forceReloadSection}`} 
        className="relative border rounded-lg overflow-hidden group mb-8"
      >
        {/* Section identifier */}
        <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-br z-10">
          {index + 1}. {section.name}
        </div>
        
        {/* Section controls */}
        <div className="absolute top-2 right-2 flex space-x-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditSection(section.sectionId)}
            className="h-8 w-8 p-0"
            title="Editar sección"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          
          {index > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveSection(index, 'up')}
              className="h-8 w-8 p-0"
              title="Mover arriba"
            >
              <MoveIcon className="h-4 w-4 transform rotate-180" />
            </Button>
          )}
          
          {index < pageSections.length - 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveSection(index, 'down')}
              className="h-8 w-8 p-0"
              title="Mover abajo"
            >
              <MoveIcon className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRemoveSection(section.sectionId)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            title="Eliminar sección"
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Section content */}
        <div className="p-6 pt-10">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <SectionPreview 
              sectionId={section.sectionId} 
              refreshKey={forceReloadSection ? 'refresh' : 'initial'} 
            />
          </div>
        </div>
      </div>
    );
  };

  // Set up the editSection global function
  useEffect(() => {
    // Define a function to handle editing sections directly from previews
    const handleEditSection = (sectionId: string) => {
      console.log(`📝 Editando sección: ${sectionId}`);
      
      // Check if section exists in our loaded sections
      const sectionExists = pageSections.some(s => s.sectionId === sectionId);
      if (!sectionExists) {
        console.warn(`⚠️ La sección con ID ${sectionId} no existe en la página actual. Esto puede ser un error.`);
      }
      
      // Navigate to the section editor tab
      setEditingSectionId(sectionId);
      setActiveTab('editor');
      
      // Scroll to the section editor
      setTimeout(() => {
        document.getElementById('section-editor')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };
    
    // Make it available globally for the section previews
    (window as ExtendedWindow).editSection = handleEditSection;
    
    // Clean up on unmount
    return () => {
      delete (window as ExtendedWindow).editSection;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2Icon className="h-12 w-12 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Cargando datos de la página...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleCancel}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <h1 className="text-2xl font-bold">
            Editar página: {pageData.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <div className="text-amber-600 bg-amber-50 text-sm px-3 py-1 rounded-full flex items-center">
              <AlertCircleIcon className="h-4 w-4 mr-1" />
              <span>Cambios sin guardar</span>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleSavePage}
            disabled={isSaving}
            className="flex items-center gap-1"
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full mr-1"></span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4" />
                <span>Guardar cambios</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Notification */}
      {notification && (
        <div 
          className={`p-3 rounded-md ${
            notification.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          } flex items-center`}
        >
          {notification.type === 'success' ? (
            <CheckIcon className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircleIcon className="h-5 w-5 mr-2" />
          )}
          {notification.message}
        </div>
      )}
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="details" className="flex items-center">
            <FileTextIcon className="h-4 w-4 mr-2" />
            <span>Detalles</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center">
            <LayoutIcon className="h-4 w-4 mr-2" />
            <span>Secciones</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center">
            <SearchIcon className="h-4 w-4 mr-2" />
            <span>SEO</span>
          </TabsTrigger>
          <TabsTrigger value="editor" disabled={!editingSectionId} className="flex items-center">
            <PencilIcon className="h-4 w-4 mr-2" />
            <span>Editor de sección</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Page Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la página</CardTitle>
              <CardDescription>
                Edita la información básica de la página.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título de la página</Label>
                  <Input
                    id="title"
                    name="title"
                    value={pageData.title}
                    onChange={handleTitleChange}
                    placeholder="Ingresa el título de la página"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={pageData.slug}
                    onChange={handleInputChange}
                    placeholder="url-slug-de-la-pagina"
                  />
                  <p className="text-sm text-gray-500">
                    URL: /{locale}/{pageData.slug || 'url-slug'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={pageData.description || ''}
                    onChange={handleInputChange}
                    placeholder="Breve descripción de la página"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template">Plantilla</Label>
                  <Select 
                    name="template" 
                    value={pageData.template || 'default'} 
                    onValueChange={(value) => handleSelectChange('template', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Por defecto</SelectItem>
                      <SelectItem value="landing">Landing Page</SelectItem>
                      <SelectItem value="sidebar">Con barra lateral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pageType">Tipo de página</Label>
                  <Select 
                    name="pageType" 
                    value={pageData.pageType} 
                    onValueChange={(value) => handleSelectChange('pageType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo de página" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTENT">Página de contenido</SelectItem>
                      <SelectItem value="LANDING">Landing Page</SelectItem>
                      <SelectItem value="BLOG">Página de blog</SelectItem>
                      <SelectItem value="HOME">Página de inicio</SelectItem>
                      <SelectItem value="CONTACT">Página de contacto</SelectItem>
                      <SelectItem value="SERVICES">Página de servicios</SelectItem>
                      <SelectItem value="ABOUT">Página de acerca de</SelectItem>
                      <SelectItem value="CUSTOM">Página personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublished"
                    checked={pageData.isPublished}
                    onCheckedChange={(checked) => handleCheckboxChange('isPublished', checked)}
                  />
                  <Label htmlFor="isPublished">Publicada</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={() => setActiveTab('sections')} className="flex items-center">
                <span>Continuar a Secciones</span>
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Secciones de la página</CardTitle>
              <CardDescription>
                Añade, edita y organiza las secciones de la página.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pageSections.length > 0 ? (
                <div className="space-y-4">
                  {pageSections.map((section, index) => 
                    renderSectionPreview(section, index)
                  )}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <LayoutIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No hay secciones todavía</h3>
                  <p className="text-gray-500 mb-4">Añade secciones para construir el contenido de tu página</p>
                </div>
              )}
              
              <div className="flex gap-2 mt-6">
                <Button 
                  onClick={() => setShowAddSectionDialog(true)}
                  className="flex-1"
                  variant="outline"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Añadir sección existente
                </Button>
                
                <Button 
                  onClick={() => setShowCreateSectionDialog(true)}
                  className="flex-1"
                  variant="default"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Crear nueva sección
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('details')}>
                Volver a Detalles
              </Button>
              <Button 
                variant="default" 
                onClick={handleSavePage}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información SEO</CardTitle>
              <CardDescription>
                Configura cómo se mostrará tu página en los resultados de búsqueda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Meta Title */}
                <div className="space-y-2">
                  <Label htmlFor="metaTitle" className="flex items-center">
                    <InfoIcon className="h-4 w-4 mr-2" />
                    <span>Título meta</span>
                  </Label>
                  <Input
                    id="metaTitle"
                    name="metaTitle"
                    value={pageData.metaTitle || ''}
                    onChange={handleInputChange}
                    placeholder="Título para motores de búsqueda"
                  />
                  <p className="text-sm text-gray-500">
                    {!pageData.metaTitle && "Si se deja vacío, se utilizará el título de la página"}
                  </p>
                </div>
                
                {/* Meta Description */}
                <div className="space-y-2">
                  <Label htmlFor="metaDescription" className="flex items-center">
                    <AlignLeftIcon className="h-4 w-4 mr-2" />
                    <span>Descripción meta</span>
                  </Label>
                  <Textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={pageData.metaDescription || ''}
                    onChange={handleInputChange}
                    placeholder="Descripción para motores de búsqueda"
                    rows={3}
                  />
                  <p className="text-sm text-gray-500">
                    {!pageData.metaDescription && "Si se deja vacío, se utilizará la descripción de la página"}
                  </p>
                </div>

                {/* Featured Image */}
                <div className="space-y-2">
                  <Label htmlFor="featuredImage" className="flex items-center">
                    <GlobeIcon className="h-4 w-4 mr-2" />
                    <span>URL de imagen destacada</span>
                  </Label>
                  <Input
                    id="featuredImage"
                    name="featuredImage"
                    value={pageData.featuredImage || ''}
                    onChange={handleInputChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>
              </div>

              {/* Search result preview */}
              <div className="mt-8 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Vista previa en resultados de búsqueda</h3>
                <div className="p-4 border border-gray-200 rounded bg-white">
                  <div className="text-blue-600 text-lg font-medium line-clamp-1">
                    {pageData.metaTitle || pageData.title || 'Título de la página'}
                  </div>
                  <div className="text-green-600 text-sm line-clamp-1">
                    {`/${locale}/${pageData.slug || 'url-pagina'}`}
                  </div>
                  <div className="text-gray-700 text-sm mt-1 line-clamp-2">
                    {pageData.metaDescription || pageData.description || 'Descripción de la página...'}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab('details')}>
                Volver a Detalles
              </Button>
              <Button onClick={() => setActiveTab('sections')} className="flex items-center">
                <span>Continuar a Secciones</span>
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Section Editor Tab */}
        <TabsContent value="editor" className="space-y-6">
          {activeTab === 'editor' && (
            <div id="section-editor" className="mb-6 space-y-4">
              <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md mb-4">
                <h3 className="font-medium mb-1">Editor de sección</h3>
                <p className="text-xs">ID: {editingSectionId}</p>
              </div>
              
              {editingSectionId ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Editar sección</CardTitle>
                    <CardDescription>
                      {pageSections.find(s => s.sectionId === editingSectionId)?.name || editingSectionId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-amber-50 border-2 border-dashed border-amber-200 p-6 rounded-lg">
                      <div className="text-center text-gray-500 mb-4 text-sm">
                        🖋️ Modo de edición - Edita los componentes de la sección
                      </div>
                      
                      <div className="bg-white rounded-lg shadow-sm p-6">
                        <ManageableSection
                          ref={sectionRef}
                          sectionId={editingSectionId}
                          isEditing={true}
                          autoSave={false}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditingSectionId(null);
                        setActiveTab('sections');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      variant="default"
                      onClick={handleSaveSectionChanges}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full mr-1"></span>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        'Guardar cambios'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <LayoutIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No hay sección seleccionada</h3>
                  <p className="text-gray-500 mb-4">Selecciona una sección para editar</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Section Dialog */}
      <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir sección</DialogTitle>
            <DialogDescription>
              Selecciona una sección para añadir a tu página.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isLoadingSections ? (
              <div className="flex justify-center items-center py-8">
                <Loader2Icon className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <Select 
                value={selectedTemplateSection} 
                onValueChange={setSelectedTemplateSection}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una plantilla de sección" />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map(section => (
                    <SelectItem key={section.sectionId} value={section.sectionId}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddSectionDialog(false);
                setSelectedTemplateSection('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleAddSection}
              disabled={!selectedTemplateSection}
            >
              Añadir sección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Section Confirmation */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar sección</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar esta sección de la página?
              <br />
              <span className="font-medium">{sectionToDelete?.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteSection}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSection}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Exit Confirmation */}
      <AlertDialog open={isExitConfirmationOpen} onOpenChange={setIsExitConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-amber-600">
              <AlertCircleIcon className="h-5 w-5 mr-2" />
              <span>Cambios sin guardar</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar. ¿Qué deseas hacer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleCancelExit}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExit}
              className="bg-red-600 hover:bg-red-700"
            >
              Salir sin guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Create Section Dialog */}
      <Dialog open={showCreateSectionDialog} onOpenChange={setShowCreateSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nueva sección</DialogTitle>
            <DialogDescription>
              Crea una nueva sección vacía que podrás editar después
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newSectionName">Nombre de la sección</Label>
              <Input
                id="newSectionName"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Ej: Banner Principal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newSectionDescription">Descripción (opcional)</Label>
              <Textarea
                id="newSectionDescription"
                value={newSectionDescription}
                onChange={(e) => setNewSectionDescription(e.target.value)}
                placeholder="Breve descripción de la sección"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateSectionDialog(false);
                setNewSectionName('');
                setNewSectionDescription('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateSection}
              disabled={isCreatingSection || !newSectionName.trim()}
            >
              {isCreatingSection ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-20 border-t-white rounded-full mr-1"></span>
                  <span>Creando...</span>
                </>
              ) : 'Crear sección'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
