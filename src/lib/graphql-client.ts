import { updateCMSSection } from './cms-update';
import { deletePageWithSections } from './cms-page-delete';
import { optimizedQueries } from './graphql-optimizations';

// Import form types
import {
  FormBase,
  FormStepBase,
  FormFieldBase,
  FormSubmissionBase,
  FormResult,
  FormStepResult,
  FormFieldResult,
  FormSubmissionResult,
  FormInput,
  FormStepInput,
  FormFieldInput,
  FormSubmissionInput,
  FormSubmissionStats
} from '@/types/forms';

import { Blog, Post } from '@/types/blog';

// Import calendar types
import {
  StaffProfileInput,
  CalendarStaffProfile,
  CalendarUser,
  CalendarLocation,
  CalendarStaffScheduleInput
} from '@/types/calendar';

// Función simple para realizar solicitudes GraphQL
export async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  timeout: number = 10000 // Default 10 second timeout
): Promise<T> {
  // Generar un ID único para esta solicitud para facilitar el seguimiento en logs
  const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 gqlRequest [${requestId}] - Query: ${query.substring(0, 50).replace(/\s+/g, ' ')}...`);
      console.log(`🔍 gqlRequest [${requestId}] - Variables: ${JSON.stringify(variables).substring(0, 100)}...`);
      console.log(`🔍 gqlRequest [${requestId}] - Timeout: ${timeout}ms`);
    }
    
    // Create an AbortController to handle request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ Request timeout: ${timeout}ms exceeded for [${requestId}]`);
      controller.abort();
    }, timeout);

    // Check if this is a public operation that doesn't require authentication
    const isPublicOperation = (
      query.includes('getPageBySlug') || 
      query.includes('getSectionComponents') || 
      query.includes('submitForm') || 
      query.includes('getMenus') ||
      query.includes('formBySlug') ||
      query.includes('getFormById') ||
      query.includes('form(id:') ||
      query.includes('forms') ||
      query.includes('formFields') ||
      query.includes('formSteps') ||
      query.includes('formStep') ||
      query.includes('GetForm') ||
      query.includes('FormStep') ||
      query.includes('FormField') ||
      query.includes('menus') ||
      query.includes('getAllCMSPages') ||
      query.includes('GetBlogs') ||
      query.includes('GetBlog') ||
      query.includes('GetPosts') ||
      query.includes('GetPostBySlug') ||
      query.includes('posts') ||
      query.includes('blog') ||
      query.includes('postBySlug')
    );

    // Get session token from cookies if available and not a public operation
    const getToken = () => {
      if (!isPublicOperation && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('session-token='));
        if (tokenCookie) {
          return tokenCookie.split('=')[1].trim();
        }
      }
      return null;
    };
    
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Determine the GraphQL endpoint URL
    const getGraphQLUrl = () => {
      // If we're on the server (no window object), use absolute URL
      if (typeof window === 'undefined') {
        // In production, use the deployment URL or localhost for development
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NODE_ENV === 'production'
          ? 'https://your-domain.com' // Replace with your actual domain
          : 'http://localhost:3000';
        return `${baseUrl}/api/graphql`;
      }
      // On the client, use relative URL
      return '/api/graphql';
    };
    
    const graphqlUrl = getGraphQLUrl();
    
    try {
      console.log(`🔄 Starting GraphQL request [${requestId}] to ${graphqlUrl}`);
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: controller.signal,
        // Add cache control to improve performance for repeated queries
        cache: 'default',
      });
      
      // Clear the timeout as the request completed
      clearTimeout(timeoutId);
      
      // Handle non-ok responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GraphQL HTTP error ${response.status} for [${requestId}]:`, errorText);
        
        // For public operations, return empty result instead of throwing
        if (isPublicOperation) {
          console.warn(`HTTP error in public operation [${requestId}], returning empty result`);
          return {} as T;
        }
        
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      console.log(`✅ GraphQL request completed [${requestId}]`);
      const responseData = await response.json();
      
      // Check for GraphQL errors
      if (responseData.errors && responseData.errors.length > 0) {
        const errorMessages = responseData.errors.map((e: { message: string }) => e.message).join(', ');
        console.error(`GraphQL errors for [${requestId}]:`, errorMessages);
        
        // For public operations, handle auth errors gracefully
        if (isPublicOperation && (errorMessages.includes('Not authenticated') || errorMessages.includes('Unauthorized'))) {
          console.warn(`Authentication error in public operation [${requestId}], continuing with partial data`);
          // Return partial data if available, or empty object
          return (responseData.data || {}) as T;
        }
        
        // For form operations, don't throw to prevent UI breakage
        if ((query.includes('form') || query.includes('Form')) && 
            (errorMessages.includes('Not authenticated') || errorMessages.includes('Unauthorized'))) {
          console.warn(`Form auth error [${requestId}], returning empty result`);
          return {} as T;
        }
        
        throw new Error(`GraphQL errors: ${errorMessages}`);
      }
      
      // Return the data property or the entire response if data is not present
      return responseData.data || responseData as T;
    } catch (error) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // Special handling for abort errors (timeouts)
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(`⚠️ Request timed out after ${timeout}ms [${requestId}]`);
        throw new Error(`La solicitud GraphQL excedió el tiempo límite de ${timeout}ms`);
      }
      
      // For public operations, swallow errors and return empty result
      if (isPublicOperation) {
        console.warn(`Error in public operation [${requestId}], returning empty result:`, error);
        return {} as T;
      }
      
      throw error;
    }
  } catch (error) {
    // Format the error for better debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`GraphQL error [${requestId}]:`, errorMessage);
    
    // Check if this is a query about forms and return empty data instead of throwing
    if (query.toLowerCase().includes('form')) {
      console.warn(`Form query error, returning empty result:`, errorMessage);
      return {} as T;
    }
    
    // Rethrow with more context
    throw new Error(`Error en solicitud GraphQL: ${errorMessage}`);
  }
}

// Interfaz para los componentes del CMS
export interface CMSComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

// Estructura de un componente de la base de datos
export interface CMSComponentDB {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  icon?: string;
  schema?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Estructura de una página CMS
export interface CMSPageDB {
  id: string;
  title: string;
  slug: string;
  description?: string;
  template?: string;
  isPublished: boolean;
  publishDate?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  pageType: string;
  locale?: string; // Add locale property
  createdAt: string;
  updatedAt: string;
  sections?: Array<{id: string; order?: number}>;
}

// Input para crear/actualizar componentes
export interface CMSComponentInput {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  schema?: Record<string, unknown>;
  icon?: string;
}

// Resultado de operaciones con componentes
export interface CMSComponentResult {
  success: boolean;
  message: string;
  component: CMSComponentDB | null;
}

// Actualizar según la nueva estructura de relaciones
export interface CMSSectionComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface CMSSectionResult {
  components: CMSSectionComponent[];
  lastUpdated: string | null;
}

// Definir la estructura de respuesta esperada para las importaciones dinámicas
interface SectionComponentsResponse {
  getSectionComponents?: {
    components: CMSComponent[];
    lastUpdated: string | null;
  };
}

// Interfaces for page data
export interface PageData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  template?: string;
  isPublished: boolean;
  publishDate?: string | null;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  parentId?: string | null;
  order?: number;
  pageType: string;
  locale?: string;
  scrollType?: 'normal' | 'smooth';
  createdAt?: string;
  updatedAt?: string;
  isDefault?: boolean;
  sections?: Array<{
    id: string;
    sectionId: string;
    name?: string;
    order: number;
    // Otra metadata relevante
  }>; // Adaptado a la estructura de CMSSection
  seo?: {
    title?: string; // Add title (same as metaTitle)
    description?: string; // Add description (same as metaDescription)
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
}

export interface SectionData {
  id: string;
  title?: string;
  order: number;
  components: CMSComponent[];
  backgroundImage?: string;
  backgroundType?: string;
}

// Generic GraphQL response type
interface GraphQLResponse<T> {
  data?: {
    [key: string]: T;
  };
  errors?: Array<{ message: string }>;
}


// Función de utilidad para validar la pertenencia de secciones
export const validateSectionOwnership = (sectionId: string, pageId: string): boolean => {
  return sectionId.startsWith(`page-${pageId}-`);
};


// Get a page by its slug
async function getPageBySlug(slug: string): Promise<PageData | null> {
  try {
    console.log(`[getPageBySlug] Attempting to fetch page with slug: "${slug}"`);
    
    // Check cache first
    const cacheKey = `page_slug_${slug}`;
    const cachedPage = getCachedResponse<PageData>(cacheKey);
    
    if (cachedPage) {
      console.log(`[getPageBySlug] Found cached page: ${cachedPage.title}`);
      return cachedPage;
    }
    
    const query = `
      query GetPageBySlug($slug: String!) {
        getPageBySlug(slug: $slug) {
          id
          title
          slug
          description
          template
          isPublished
          publishDate
          featuredImage
          metaTitle
          metaDescription
          parentId
          order
          pageType
          locale
          scrollType
          isDefault
          createdAt
          updatedAt
          sections {
            id
            sectionId
            name
          }
          seo {
            title
            description
            keywords
            ogTitle
            ogDescription
            ogImage
            twitterTitle
            twitterDescription
            twitterImage
            canonicalUrl
            structuredData
          }
        }
      }
    `;

    const variables = { slug };
    
    console.log(`[getPageBySlug] Executing GraphQL query with variables:`, variables);
    const result = await gqlRequest<{ 
      getPageBySlug?: PageData; 
      data?: { getPageBySlug: PageData };
      errors?: Array<{ message: string }>
    }>(query, variables);
    
    console.log(`[getPageBySlug] GraphQL result:`, result);
    
    // Check for errors in the response
    if (result.errors && result.errors.length > 0) {
      console.error(`[getPageBySlug] GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
      return null;
    }
    
    // Try to extract page data from different possible response structures
    let page: PageData | null = null;
    
    // Direct property
    if (result.getPageBySlug) {
      page = result.getPageBySlug;
    } 
    // Nested under data
    else if (result.data?.getPageBySlug) {
      page = result.data.getPageBySlug;
    }
    // Check if data is the top-level property with getPageBySlug inside
    else if (typeof result === 'object' && result !== null && 'data' in result) {
      const data = (result as GraphQLResponse<PageData>).data;
      if (data && typeof data === 'object' && 'getPageBySlug' in data) {
        page = data.getPageBySlug;
      }
    }
    
    // Found a page
    if (page && page.id) {
      console.log(`[getPageBySlug] Found page: ID=${page.id}, Title="${page.title}"`);
      
      // Filtrar las secciones con sectionId null para evitar errores GraphQL
      if (page.sections && Array.isArray(page.sections)) {
        page.sections = page.sections.filter(section => 
          section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
        );
      }
      
      // Ensure there's always at least an empty SEO object
      if (!page.seo) {
        page.seo = {};
      }
      
      // Cache the page data
      setCachedResponse(cacheKey, page);
      
      return page;
    }
    
    // Try to find by ID as a fallback (less verbose)
    try {
      const listQuery = `
        query GetAllPages {
          getAllCMSPages {
            id
            slug
            title
          }
        }
      `;
      const listResult = await gqlRequest<{ 
        getAllCMSPages: Array<{ id: string; slug: string; title: string }> 
      }>(listQuery);
      
      // Check different possible structures for the getAllCMSPages result
      let pages: Array<{ id: string; slug: string; title: string }> = [];
      
      if (listResult.getAllCMSPages) {
        pages = listResult.getAllCMSPages;
      } else if (typeof listResult === 'object' && listResult !== null && 'data' in listResult) {
        const data = (listResult as GraphQLResponse<Array<{ id: string; slug: string; title: string }>>).data;
        if (data && typeof data === 'object' && 'getAllCMSPages' in data) {
          pages = data.getAllCMSPages;
        }
      }
      
      // Check if a matching page exists but wasn't returned correctly
      if (pages.length > 0) {
        const matchingPage = pages.find(p => 
          p.slug === slug || 
          p.slug.toLowerCase() === slug.toLowerCase() ||
          p.slug.replace(/-/g, '') === slug.replace(/-/g, '') ||
          p.slug.replace(/-/g, ' ') === slug.replace(/-/g, ' ')
        );
        
        if (matchingPage) {
          // Try to fetch by ID as a fallback
          const foundPage = await getPageById(matchingPage.id);
          if (foundPage) {
            // Cache the page data
            setCachedResponse(cacheKey, foundPage);
            return foundPage;
          }
        }
      }
    } catch (listError) {
      console.error(`Error listing pages:`, listError);
    }
    
    console.log(`[getPageBySlug] No page found with slug: "${slug}"`);
    return null;
  } catch (error) {
    console.error(`[getPageBySlug] Error retrieving page with slug "${slug}":`, error);
    throw error;
  }
}

// Update a page
async function updatePage(id: string, input: {
  title?: string;
  slug?: string;
  description?: string | null;
  template?: string;
  isPublished?: boolean;
  publishDate?: string | null;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  parentId?: string | null;
  order?: number;
  pageType?: string;
  locale?: string;
  isDefault?: boolean;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
  sectionIds?: string[]; // This is used by client code but converted to sections
  sections?: string[]; // This matches the GraphQL schema
}): Promise<{
  success: boolean;
  message: string;
  page: PageData | null;
}> {
  try {
    // Preprocess SEO data for consistency
    const seoData = input.seo || {};
    const titleValue = input.metaTitle || seoData.title;
    const descriptionValue = input.metaDescription || seoData.description;
    
    if (titleValue) {
      if (!seoData.title) seoData.title = titleValue;
      if (!input.metaTitle) input.metaTitle = titleValue;
    }
    
    if (descriptionValue) {
      if (!seoData.description) seoData.description = descriptionValue;
      if (!input.metaDescription) input.metaDescription = descriptionValue;
    }

    // Convert sectionIds to sections format if present
    const inputData = { ...input };
    
    // If sectionIds is provided but sections isn't, move the values
    if (inputData.sectionIds && !inputData.sections) {
      inputData.sections = inputData.sectionIds;
      delete inputData.sectionIds;
    }

    const mutation = `
      mutation UpdatePage($id: ID!, $input: UpdatePageInput!) {
        updatePage(id: $id, input: $input) {
          success
          message
          page {
            id
            title
            slug
            description
            template
            isPublished
            pageType
            locale
            metaTitle
            metaDescription
            featuredImage
            publishDate
            isDefault
            updatedAt
            sections {
              id
              sectionId
              name
              order
            }
            seo {
              title
              description
              keywords
              ogTitle
              ogDescription
              ogImage
              twitterTitle
              twitterDescription
              twitterImage
              canonicalUrl
              structuredData
            }
          }
        }
      }
    `;

    console.log('Updating page with data:', { id, input: inputData });
    const variables = { id, input: inputData };
    const result = await gqlRequest<{ 
      updatePage?: { success: boolean; message: string; page: PageData | null };
      data?: { updatePage: { success: boolean; message: string; page: PageData | null } }
    }>(mutation, variables);
    console.log('Update page result:', result);
    
    // Handle different response structures
    let opResult = null;
    if (result.updatePage) {
      opResult = result.updatePage;
    } else if (result.data?.updatePage) {
      opResult = result.data.updatePage;
    }

    if (opResult && opResult.success && opResult.page) {
      const updatedPageData = opResult.page;
      if (updatedPageData.slug) {
        optimizedQueries.invalidateCache(`page:${updatedPageData.slug}`);
        clearCache(`page_slug_${updatedPageData.slug}`); // local cache
      }
      optimizedQueries.invalidateCache(`page_id:${id}`);
      clearCache(`page_id_${id}`); // local cache

      if (updatedPageData.isDefault && updatedPageData.locale) {
        optimizedQueries.invalidateCache(`default_page_${updatedPageData.locale}`);
        clearCache(`default_page_${updatedPageData.locale}`); // local cache
      }
      // Invalidate related sections if their structure might change or be affected
      if (updatedPageData.sections) {
        updatedPageData.sections.forEach(section => {
          if (section.sectionId) {
            optimizedQueries.invalidateCache(`section:${section.sectionId}`);
            clearCache(`section_components_${section.sectionId}`); // local cache
          }
        });
      }
      optimizedQueries.invalidateCache('allPages'); 
      clearCache('allPages'); // local cache for general page lists
    } else if (opResult && opResult.success) {
      // Page data might not be returned but operation was successful
      // Attempt to invalidate based on input if available
      if (input.slug) {
        optimizedQueries.invalidateCache(`page:${input.slug}`);
        clearCache(`page_slug_${input.slug}`);
      }
      optimizedQueries.invalidateCache(`page_id:${id}`);
      clearCache(`page_id_${id}`);
      if (input.isDefault && input.locale) {
        optimizedQueries.invalidateCache(`default_page_${input.locale}`);
        clearCache(`default_page_${input.locale}`);
      }
      optimizedQueries.invalidateCache('allPages');
      clearCache('allPages');
    }
    
    if (opResult) return opResult;

    return {
      success: false,
      message: 'Failed to update page: Unexpected response format',
      page: null
    };
  } catch (error) {
    console.error('Error updating page:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating page',
      page: null
    };
  }
}

// Get a page by ID
async function getPageById(id: string): Promise<PageData | null> {
  // Check cache first
  const cacheKey = `page_id_${id}`;
  const cachedPage = getCachedResponse<PageData>(cacheKey);
  
  if (cachedPage) {
    console.log(`[getPageById] Found cached page: ID=${id}`);
    return cachedPage;
  }
  
  const GET_PAGE_BY_ID_QUERY = `
    query GetPageById($id: ID!) {
      page(id: $id) {
        id
        title
        slug
        description
        template
        isPublished
        publishDate
        featuredImage
        metaTitle
        metaDescription
        parentId
        order
        pageType
        locale
        scrollType
        isDefault
        createdAt
        updatedAt
        sections {
          id
          sectionId
          name
          order
        }
        seo {
          title
          description
          keywords
          ogTitle
          ogDescription
          ogImage
          twitterTitle
          twitterDescription
          twitterImage
          canonicalUrl
          structuredData
        }
      }
    }
  `;

  try {
    console.log(`[getPageById] Attempting to fetch page with ID: "${id}"`);
    const variables = { id };
    
    const result = await gqlRequest<{ 
      page?: PageData;
      data?: { page: PageData }; // Alternative structure
      errors?: Array<{ message: string }>
    }>(GET_PAGE_BY_ID_QUERY, variables);

    console.log(`[getPageById] GraphQL result for ID "${id}":`, result);

    if (result.errors && result.errors.length > 0) {
      console.error(`[getPageById] GraphQL errors for ID "${id}": ${result.errors.map(e => e.message).join(', ')}`);
      return null;
    }

    let page: PageData | null = null;

    if (result.page) {
      page = result.page;
    } else if (result.data?.page) {
      page = result.data.page;
    }

    if (page && page.id) {
      console.log(`[getPageById] Found page: ID=${page.id}, Title="${page.title}"`);
      
      // Filter sections with null sectionId
      if (page.sections && Array.isArray(page.sections)) {
        page.sections = page.sections.filter(section => 
          section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
        );
      }
      
      // Ensure there's always at least an empty SEO object
      if (!page.seo) {
        page.seo = {};
      }
      
      // Cache the page data
      setCachedResponse(cacheKey, page);
      return page;
    }
    
    console.log(`[getPageById] No page found with ID: "${id}"`);
    return null;
  } catch (error) {
    console.error(`[getPageById] Error retrieving page with ID "${id}":`, error);
    // Do not throw error, just return null as per original behavior of function
    return null;
  }
}

// Get page with detailed section components for preview
export async function getPagePreview(pageData: PageData): Promise<{
  page: PageData;
  sections: Array<{
    id: string;
    title?: string;
    order: number;
    components: CMSComponent[];
  }>;
}> {
  console.log(`Generating preview for page: "${pageData.title}"`);
  
  const sections: Array<{
    id: string;
    title?: string;
    order: number;
    components: CMSComponent[];
  }> = [];
  
  if (!pageData.sections || !Array.isArray(pageData.sections) || pageData.sections.length === 0) {
    console.log(`Page has no sections to preview`);
    return { page: pageData, sections: [] };
  }
  
  // Log all sections we're going to fetch
  console.log(`Fetching components for ${pageData.sections.length} sections`);
  
  // Process each section to get its components
  for (const section of pageData.sections) {
    try {
      // Only fetch if we have a section ID
      if (!section.id) {
        console.log(`Section missing ID, skipping component fetch`);
        continue;
      }
      
      // Get the CMSSection data first
      const cmsSection = await cmsOperations.getCMSSection(section.id);
      if (!cmsSection) {
        console.log(`CMSSection not found for ID: ${section.id}`);
        continue;
      }
      
      console.log(`Fetching components for section ID: ${cmsSection.sectionId}`);
      
      // Get section title if available
      const sectionTitle = cmsSection.name || `Section ${section.order || 0}`;
      
      // Fetch the components for this section using the CMSSection's sectionId
      const result = await cmsOperations.getSectionComponents(cmsSection.sectionId);
      const { components } = result;
      
      console.log(`Fetched ${components.length} components for section "${sectionTitle}"`);
      
      // Add to our sections array with components
      sections.push({
        id: section.id,
        title: sectionTitle,
        order: section.order || 0,
        components
      });
      
      // Log component types for debugging
      if (components.length > 0) {
        console.log(`Component types in section "${sectionTitle}":`, 
          components.map((c: CMSComponent) => c.type).join(', '));
      }
    } catch (error) {
      console.error(`Error fetching components for section ${section.id}:`, error);
      
      // Add the section with empty components to maintain structure
      sections.push({
        id: section.id,
        title: 'title' in section ? (section.title as string) : `Section ${section.order || 0}`,
        order: section.order || 0,
        components: []
      });
    }
  }
  
  // Sort sections by order
  sections.sort((a, b) => a.order - b.order);
  
  console.log(`Page preview generated with ${sections.length} populated sections`);
  
  return {
    page: pageData,
    sections
  };
}


// Update a section name
async function updateSectionName(sectionId: string, name: string): Promise<{
  success: boolean;
  message: string;
  lastUpdated?: string | null;
}> {
  try {
    // Use the updateCMSSection function from cms-update.ts
    const result = await updateCMSSection(sectionId, { name });

    if (result.success) {
      optimizedQueries.invalidateCache(`section:${sectionId}`);
      clearCache(`section_components_${sectionId}`); // Local cache for section components
      clearCache(`section_${sectionId}`); // Local cache for section data if separate
    }
    
    return {
      success: result.success,
      message: result.message,
      lastUpdated: result.lastUpdated
    };
  } catch (error) {
    console.error('Error updating section name:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating section name'
    };
  }
}

// Get section components for editing
export async function loadSectionComponentsForEdit(sectionId: string): Promise<{
  sectionId: string;
  components: CMSComponent[];
  lastUpdated: string | null;
}> {
  try {
    console.log(`Loading components for section ${sectionId} in editor`);
    
    // Fetch the components for this section
    const result = await cmsOperations.getSectionComponents(sectionId);
    const { components, lastUpdated } = result;
    
    console.log(`Editor: Loaded ${components.length} components for section ${sectionId}`);
    
    if (components.length > 0) {
      // Log types and data structure to help with editing
      console.log(`Component types for editing:`, components.map((c: CMSComponent) => c.type));
      console.log(`First component data structure:`, 
        Object.keys(components[0].data || {}).join(', '));
    }
    
    return { 
      sectionId,
      components, 
      lastUpdated 
    };
  } catch (error) {
    console.error(`Error loading section components for edit:`, error);
    return { 
      sectionId,
      components: [], 
      lastUpdated: null 
    };
  }
}

// Update the component edit function to handle background properties
export async function applyComponentEdit(
  sectionId: string,
  componentId: string,
  editedData: Record<string, unknown>
): Promise<{
  success: boolean;
  message: string;
  lastUpdated: string | null;
}> {
  try {
    console.log(`Applying edits to component ${componentId} in section ${sectionId}`);
    console.log('Edit data:', editedData);
    
    // First fetch the current components
    const result = await cmsOperations.getSectionComponents(sectionId);
    const { components } = result;
    
    if (!components || components.length === 0) {
      return {
        success: false,
        message: `No components found in section ${sectionId}`,
        lastUpdated: null
      };
    }
    
    // Find the component to update
    const componentIndex = components.findIndex((c: CMSComponent) => c.id === componentId);
    
    if (componentIndex === -1) {
      console.error(`Component ${componentId} not found in section ${sectionId}`);
      return {
        success: false,
        message: `Component ${componentId} not found in section`,
        lastUpdated: null
      };
    }
    
    console.log(`Found component at index ${componentIndex}, updating data`);
    
    // Create a new array with the updated component
    const updatedComponents = [...components];
    const currentComponent = updatedComponents[componentIndex];
    
    // Merge the new data with existing data, preserving all properties
    const mergedData = {
      ...currentComponent.data,
      ...editedData
    };
    
    // Special handling for background properties to ensure they persist
    if (editedData.backgroundImage !== undefined) {
      mergedData.backgroundImage = editedData.backgroundImage;
    }
    if (editedData.backgroundType !== undefined) {
      mergedData.backgroundType = editedData.backgroundType;
    }
    
    updatedComponents[componentIndex] = {
      ...currentComponent,
      data: mergedData
    };
    
    console.log(`Saving updated component with merged data:`, {
      id: updatedComponents[componentIndex].id,
      type: updatedComponents[componentIndex].type,
      dataKeys: Object.keys(updatedComponents[componentIndex].data || {}),
      backgroundImage: mergedData.backgroundImage,
      backgroundType: mergedData.backgroundType
    });
    
    // Save all components back to the section
    const result2 = await cmsOperations.saveSectionComponents(sectionId, updatedComponents);
    
    return result2;
  } catch (error) {
    console.error('Error applying component edit:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating component',
      lastUpdated: null
    };
  }
}

// Update a component title in a section
async function updateComponentTitle(sectionId: string, componentId: string, title: string): Promise<{
  success: boolean;
  message: string;
  lastUpdated?: string | null;
}> {
  try {
    // First get current section components
    const sectionData = await cmsOperations.getSectionComponents(sectionId);
    
    if (!sectionData.components || !Array.isArray(sectionData.components)) {
      return {
        success: false,
        message: 'Failed to get section components'
      };
    }
    
    // Find the component by ID and update its title
    const updatedComponents = sectionData.components.map((component: CMSComponent) => {
      if (component.id === componentId) {
        // Preserve the original data and add title
        return {
          ...component,
          data: {
            ...component.data,
            componentTitle: title
          }
        };
      }
      return component;
    });
    
    // Save the updated components
    const saveResult = await cmsOperations.saveSectionComponents(sectionId, updatedComponents);
    
    return {
      success: saveResult.success,
      message: saveResult.message || `Component title ${saveResult.success ? 'updated' : 'update failed'}`,
      lastUpdated: saveResult.lastUpdated
    };
  } catch (error) {
    console.error('Error updating component title:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating component title'
    };
  }
}


// Create a simple in-memory cache for API responses
const apiCache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache TTL by default

// Get a cached response or undefined if expired or not found
function getCachedResponse<T>(cacheKey: string): T | undefined {
  const cachedItem = apiCache[cacheKey];
  
  if (!cachedItem) return undefined;
  
  const now = Date.now();
  if (now - cachedItem.timestamp > CACHE_TTL) {
    // Cache expired, remove it
    delete apiCache[cacheKey];
    return undefined;
  }
  
  return cachedItem.data as T;
}

// Cache an API response
function setCachedResponse<T>(cacheKey: string, data: T): void {
  apiCache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
}

// Clear cache for a specific key or pattern
function clearCache(keyPattern?: string): void {
  if (!keyPattern) {
    // Clear all cache
    Object.keys(apiCache).forEach(key => delete apiCache[key]);
    return;
  }
  
  // Clear matching cache entries
  Object.keys(apiCache).forEach(key => {
    if (key.includes(keyPattern)) {
      delete apiCache[key];
    }
  });
}

// Define a type for the section components result
interface SectionComponentsResult {
  components: CMSComponent[];
  lastUpdated: string | null;
}

// Add this new type for HeaderStyle input
export interface HeaderStyleInput {
  transparency?: number;
  headerSize?: 'sm' | 'md' | 'lg';
  menuAlignment?: 'left' | 'center' | 'right';
  menuButtonStyle?: 'default' | 'filled' | 'outline';
  mobileMenuStyle?: 'fullscreen' | 'dropdown' | 'sidebar';
  mobileMenuPosition?: 'left' | 'right';
  transparentHeader?: boolean;
  borderBottom?: boolean;
  fixedHeader?: boolean;
  advancedOptions?: Record<string, unknown>;
}

export interface FooterStyleInput {
  transparency?: number;
  columnLayout?: 'stacked' | 'grid' | 'flex';
  socialAlignment?: 'left' | 'center' | 'right';
  borderTop?: boolean;
  alignment?: 'left' | 'center' | 'right';
  padding?: 'small' | 'medium' | 'large';
  width?: 'full' | 'container' | 'narrow';
  advancedOptions?: Record<string, unknown>;
}

// Operaciones CMS
export const cmsOperations = {
  // Obtener todas las secciones CMS
  getAllCMSSections: async () => {
    try {
      const query = `
        query GetAllCMSSections {
          getAllCMSSections {
            id
            sectionId
            name
            description
            lastUpdated
            createdAt
            updatedAt
            createdBy
            components {
              id
              componentId
              order
            }
          }
        }
      `;

      try {
        const result = await gqlRequest<{ getAllCMSSections: Array<{
          id: string;
          sectionId: string;
          name: string;
          description: string;
          lastUpdated: string;
          createdAt: string;
          updatedAt: string;
          createdBy: string | null;
          components: unknown;
        }> }>(query);

        if (!result || !result.getAllCMSSections) {
          return [];
        }
        
        return result.getAllCMSSections;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSSections:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllCMSSections:`, error);
      return [];
    }
  },

  // Obtener componentes de una sección
  getSectionComponents: async (sectionId: string): Promise<SectionComponentsResult> => {
    try {
      // Exit early if sectionId is invalid
      if (!sectionId) {
        return { components: [], lastUpdated: null };
      }
      
      // Clean the sectionId by removing any query parameters or hashes
      let cleanedSectionId = sectionId;
      if (cleanedSectionId.includes('?')) {
        cleanedSectionId = cleanedSectionId.split('?')[0];
      }
      if (cleanedSectionId.includes('#')) {
        cleanedSectionId = cleanedSectionId.split('#')[0];
      }
      
      // Check cache first
      const cacheKey = `section_components_${cleanedSectionId}`;
      const cachedData = getCachedResponse<SectionComponentsResult>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Define the GraphQL query
      const query = `
        query GetSectionComponents($sectionId: ID!) {
          getSectionComponents(sectionId: $sectionId) {
            components {
              id
              type
              data
            }
            lastUpdated
          }
        }
      `;

      try {
        // Execute the GraphQL query
        const result = await gqlRequest<SectionComponentsResponse>(query, { sectionId: cleanedSectionId });
        
        if (!result || !result.getSectionComponents) {
          return { components: [], lastUpdated: null };
        }
        
        const { components = [], lastUpdated } = result.getSectionComponents;
        
        const response = { components, lastUpdated };
        
        // Store in cache
        setCachedResponse(cacheKey, response);
        
        return response;
      } catch (error) {
        console.error('Error fetching section components:', error);
        return { components: [], lastUpdated: null };
      }
    } catch (error) {
      console.error('Error in getSectionComponents:', error);
      return { components: [], lastUpdated: null };
    }
  },

  // Guardar componentes de una sección
  saveSectionComponents: async (
    sectionId: string, 
    components: CMSComponent[]
  ): Promise<{ 
    success: boolean; 
    message: string; 
    lastUpdated: string | null 
  }> => {
    try {
      // Ensure all components have an ID and remove any 'title' properties
      // since the GraphQL schema doesn't accept 'title' in ComponentInput
      const validComponents = components.map(comp => {
        // Ensure component has an ID
        const componentWithId = !comp.id 
          ? { ...comp, id: crypto.randomUUID() } 
          : comp;
        
        // Remove 'title' property if it exists
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, ...componentWithoutTitle } = componentWithId as { title?: string } & CMSComponent;
        
        return componentWithoutTitle;
      });
      
      const mutation = `
        mutation SaveSectionComponents($input: SaveSectionInput!) {
          saveSectionComponents(input: $input) {
            success
            message
            lastUpdated
          }
        }
      `;
      
      const input = {
        sectionId,
        components: validComponents
      };
      
      console.log(`Starting saveSectionComponents mutation for section ${sectionId} with ${components.length} components`);
      
      // Use a longer timeout for saving components - reduced from 30s to 15s after optimization
      const result = await gqlRequest<{ 
        saveSectionComponents: { 
          success: boolean; 
          message: string; 
          lastUpdated: string | null;
        }
      }>(mutation, { input }, 15000);
      
      if (!result) {
        console.error('No result from GraphQL request in saveSectionComponents');
        throw new Error('No result received from server');
      }
      
      if (!result.saveSectionComponents) {
        console.error('Missing saveSectionComponents in result:', result);
        throw new Error('Invalid response format: missing saveSectionComponents field');
      }
      
      // Clear cache for this section
      clearCache(`section_components_${sectionId}`);
      optimizedQueries.invalidateCache(`section:${sectionId}`);
      
      return result.saveSectionComponents;
    } catch (error) {
      console.error('Error saving section components:', error);
      return {
        success: false,
        message: `Error al guardar componentes: "${error instanceof Error ? error.message : 'Error desconocido'}"`,
        lastUpdated: null
      };
    }
  },

  // Obtener todas las páginas CMS
  getAllPages: async () => {
    try {
      const query = `
        query GetAllCMSPages {
          getAllCMSPages {
            id
            title
            slug
            description
            isPublished
            pageType
            locale
            createdAt
            updatedAt
            isDefault
            sections {
              id
              sectionId
              name
            }
          }
        }
      `;

      console.log('GraphQL query para getAllCMSPages');

      try {
        const result = await gqlRequest<{ getAllCMSPages: CMSPageDB[] }>(query);
        
        console.log("Resultado GraphQL getAllCMSPages:", JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getAllCMSPages) {
          console.log("No se encontraron páginas o la estructura no es la esperada");
          return [];
        }
        
        // Filtrar las secciones con sectionId null para evitar errores GraphQL
        const pagesWithValidSections = result.getAllCMSPages.map(page => {
          if (page.sections && Array.isArray(page.sections)) {
            // Asegurar que todas las secciones tengan sectionId válido
            page.sections = page.sections.filter(section => 
              section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
            );
          }
          return page;
        });
        
        return pagesWithValidSections;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSPages:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllPages:`, error);
      return [];
    }
  },

  // Obtener todos los identificadores de página CMS
  getAllPageIdentifiers: async () => {
    const GET_ALL_PAGE_IDENTIFIERS_QUERY = `
      query GetAllCMSPageIdentifiers {
        getAllCMSPages {
          id
          slug
          locale
        }
      }
    `;
    try {
      const result = await gqlRequest<{ getAllCMSPages: Array<{ id: string; slug: string; locale?: string | null }> }>(GET_ALL_PAGE_IDENTIFIERS_QUERY);
      if (!result || !result.getAllCMSPages) {
        return [];
      }
      return result.getAllCMSPages.map(page => ({
        id: page.id,
        slug: page.slug,
        locale: page.locale || 'en', // Default locale to 'en' if missing
      }));
    } catch (error) {
      console.error(`Error general en getAllPageIdentifiers:`, error);
      return [];
    }
  },

  // Obtener componentes por tipo
  getComponentsByType: async (type: string) => {
    try {
      const query = `
        query GetCMSComponentsByType($type: String!) {
          getCMSComponentsByType(type: $type) {
            id
            name
            slug
            description
            category
            icon
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log(`GraphQL query para getCMSComponentsByType, tipo: ${type}`);

      try {
        const result = await gqlRequest<{ getCMSComponentsByType: CMSComponentDB[] }>(query, { type });
        
        console.log(`Resultado GraphQL getCMSComponentsByType (${type}):`, JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getCMSComponentsByType) {
          console.log(`No se encontraron componentes de tipo ${type}`);
          return [];
        }
        
        return result.getCMSComponentsByType;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getCMSComponentsByType (${type}):`, error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getComponentsByType:`, error);
      return [];
    }
  },

  // Obtener un componente por ID
  getComponentById: async (id: string) => {
    try {
      const query = `
        query GetCMSComponent($id: ID!) {
          getCMSComponent(id: $id) {
            id
            name
            slug
            description
            category
            icon
            schema
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log(`GraphQL query para getCMSComponent, id: ${id}`);

      try {
        const result = await gqlRequest<{ getCMSComponent: CMSComponentDB | null }>(query, { id });
        
        if (!result || !result.getCMSComponent) {
          console.log(`No se encontró el componente con id ${id}`);
          return null;
        }
        
        return result.getCMSComponent;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getCMSComponent (${id}):`, error);
        return null;
      }
    } catch (error) {
      console.error(`Error general en getComponentById:`, error);
      return null;
    }
  },

  // Crear un nuevo componente
  createComponent: async (input: CMSComponentInput) => {
    try {
      const mutation = `
        mutation CreateCMSComponent($input: CreateCMSComponentInput!) {
          createCMSComponent(input: $input) {
            success
            message
            component {
              id
              name
              slug
              description
              category
              icon
              isActive
              createdAt
              updatedAt
            }
          }
        }
      `;

      console.log('Mutation para crear componente:', input.name);
      
      const result = await gqlRequest<{ createCMSComponent: CMSComponentResult }>(mutation, { input });
      
      console.log('Resultado de crear componente:', result);
      
      return result.createCMSComponent;
    } catch (error) {
      console.error('Error al crear componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al crear componente',
        component: null
      };
    }
  },

  // Actualizar un componente existente
  updateComponent: async (id: string, input: Partial<CMSComponentInput>) => {
    try {
      const mutation = `
        mutation UpdateCMSComponent($id: ID!, $input: UpdateCMSComponentInput!) {
          updateCMSComponent(id: $id, input: $input) {
            success
            message
            component {
              id
              name
              slug
              description
              category
              icon
              isActive
              createdAt
              updatedAt
            }
          }
        }
      `;

      console.log(`Mutation para actualizar componente: ${id}`);
      
      const result = await gqlRequest<{ updateCMSComponent: CMSComponentResult }>(mutation, { id, input });
      
      console.log('Resultado de actualizar componente:', result);
      
      return result.updateCMSComponent;
    } catch (error) {
      console.error('Error al actualizar componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al actualizar componente',
        component: null
      };
    }
  },

  // Eliminar un componente
  deleteComponent: async (id: string) => {
    try {
      const mutation = `
        mutation DeleteCMSComponent($id: ID!) {
          deleteCMSComponent(id: $id) {
            success
            message
          }
        }
      `;

      console.log(`Mutation para eliminar componente: ${id}`);
      
      const result = await gqlRequest<{ deleteCMSComponent: { success: boolean; message: string } }>(mutation, { id });
      
      console.log('Resultado de eliminar componente:', result);
      
      return result.deleteCMSComponent;
    } catch (error) {
      console.error('Error al eliminar componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al eliminar componente'
      };
    }
  },

  // Create a new CMS page with an automatic section
  createPage: async (pageInput: {
    title: string;
    slug: string;
    description?: string;
    template?: string;
    isPublished?: boolean;
    pageType?: string;
    locale?: string;
    metaTitle?: string;
    metaDescription?: string;
    featuredImage?: string;
    isDefault?: boolean;
    sections?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    page: {
      id: string;
      title: string;
      slug: string;
    } | null;
  }> => {
    // Generate a unique request ID for logging
    const requestId = `createPage-${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`🔍 [${requestId}] GraphQL CLIENT - createPage - Starting request with auto-section`);
    
    try {
      // Step 1: Create the page first
      const pageQuery = `
        mutation CreatePage($input: CreatePageInput!) {
          createPage(input: $input) {
            success
            message
            page {
              id
              title
              slug
            }
          }
        }
      `;
      
      const pageVariables = {
        input: pageInput
      };
      
      const pageResult = await gqlRequest<{
        createPage: {
          success: boolean;
          message: string;
          page: {
            id: string;
            title: string;
            slug: string;
          } | null;
        }
      }>(pageQuery, pageVariables);
      
      console.log(`✅ [${requestId}] GraphQL CLIENT - createPage - Page created:`, pageResult);
      
      if (!pageResult || !pageResult.createPage || !pageResult.createPage.success || !pageResult.createPage.page) {
        console.error(`❌ [${requestId}] GraphQL CLIENT - createPage - Error: Failed to create page`);
        return { 
          success: false, 
          message: pageResult?.createPage?.message || 'Failed to create page', 
          page: null 
        };
      }
      
      const createdPage = pageResult.createPage.page;
      
      // Step 2: Create a default section for the page
      console.log(`🔧 [${requestId}] Creating default section for page ${createdPage.id}`);
      
      // Generate section ID based on page
      const generatePageSectionId = (pageId: string, sectionName: string): string => {
        const cleanName = sectionName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        return `${pageId.substring(0, 8)}-${cleanName}-${Date.now().toString(36)}`;
      };
      
      const defaultSectionName = 'Contenido Principal';
      const sectionIdentifier = generatePageSectionId(createdPage.id, defaultSectionName);
      
      // Create the CMS section
      const sectionResult = await cmsOperations.createCMSSection({
        sectionId: sectionIdentifier,
        name: defaultSectionName,
        description: `Sección principal para la página "${createdPage.title}"`
      });
      
      console.log(`🔧 [${requestId}] Section creation result:`, sectionResult);
      
      if (sectionResult.success && sectionResult.section) {
        // Step 3: Associate the section with the page
        console.log(`🔗 [${requestId}] Associating section ${sectionResult.section.id} to page ${createdPage.id}`);
        
        const associateResult = await cmsOperations.associateSectionToPage(
          createdPage.id,
          sectionResult.section.id,
          0 // First section, order 0
        );
        
        console.log(`🔗 [${requestId}] Association result:`, associateResult);
        
        if (associateResult.success) {
          console.log(`✅ [${requestId}] Page and section created successfully`);
          optimizedQueries.invalidateCache('allPages');
          clearCache('allPages'); // Local cache
          return {
            success: true,
            message: `Página "${createdPage.title}" creada con sección inicial`,
            page: createdPage
          };
        } else {
          console.warn(`⚠️ [${requestId}] Page created but section association failed: ${associateResult.message}`);
          // Still invalidate allPages as the page itself was created
          optimizedQueries.invalidateCache('allPages');
          clearCache('allPages');
          return {
            success: true,
            message: `Página creada. ${associateResult.message || 'La sección se creará automáticamente al editar.'}`,
            page: createdPage
          };
        }
      } else {
        console.warn(`⚠️ [${requestId}] Page created but section creation failed: ${sectionResult.message}`);
        // Still invalidate allPages as the page itself was created
        optimizedQueries.invalidateCache('allPages');
        clearCache('allPages');
        return {
          success: true,
          message: `Página creada. ${sectionResult.message || 'La sección se creará automáticamente al editar.'}`,
          page: createdPage
        };
      }
      
    } catch (error) {
      console.error(`❌ [${requestId}] GraphQL CLIENT - createPage - Error:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error creating page',
        page: null
      };
    }
  },

  applyComponentEdit,
  
  loadSectionComponentsForEdit,
  
  getPagePreview,
  
  getPageBySlug,
  updatePage,
  getPageById,

  // Eliminar una página CMS
  deletePage: async (id: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    console.log(`Attempting to delete page with ID: ${id} and its associated sections.`);
    
    // Step 1: Fetch page details first to get slug and other info for cache invalidation.
    // Use the already refactored getPageById which uses a direct query.
    let pageToDelete: PageData | null = null;
    try {
      // We use the internal getPageById directly, not via cmsOperations to avoid circular dependency issues
      // if cmsOperations.getPageById was not yet defined or fully initialized during module load.
      // However, getPageById is defined earlier in this file.
      pageToDelete = await getPageById(id); 
    } catch (fetchError) {
      console.error(`Error fetching page details for ID ${id} before deletion:`, fetchError);
      // Proceed with deletion if fetching fails, but cache invalidation might be incomplete.
    }

    // Step 2: Call the actual deletion logic (deletePageWithSections)
    // deletePageWithSections is imported and should handle the GraphQL mutation for deletion.
    // Assuming deletePageWithSections is defined elsewhere and handles the actual deletion.
    // For this refactoring, we are focusing on the cache invalidation within this deletePage operation.
    
    const deleteResult = await deletePageWithSections(id); // This function is imported.

    // Step 3: Invalidate caches if deletion was successful
    if (deleteResult.success) {
      console.log(`Page with ID: ${id} deleted successfully. Invalidating caches.`);
      if (pageToDelete && pageToDelete.slug) {
        optimizedQueries.invalidateCache(`page:${pageToDelete.slug}`);
        clearCache(`page_slug_${pageToDelete.slug}`);
      }
      optimizedQueries.invalidateCache(`page_id:${id}`);
      clearCache(`page_id_${id}`); // local cache

      if (pageToDelete && pageToDelete.isDefault && pageToDelete.locale) {
        optimizedQueries.invalidateCache(`default_page_${pageToDelete.locale}`);
        clearCache(`default_page_${pageToDelete.locale}`); // local cache
      }
      
      optimizedQueries.invalidateCache('allPages');
      clearCache('allPages'); // local cache for general page lists
      
      // If pages also affect menu structures (e.g. if a deleted page was in a menu)
      optimizedQueries.invalidateCache('menus'); 
      clearCache('all_menus'); // Assuming 'all_menus' for local cache based on getMenus

    } else {
      console.log(`Failed to delete page with ID: ${id}. Message: ${deleteResult.message}`);
    }
    
    return deleteResult;
  },

  // Obtener páginas que usan una sección específica
  getPagesUsingSectionId: async (sectionId: string) => {
    try {
      const query = `
        query GetPagesUsingSectionId($sectionId: ID!) {
          getPagesUsingSectionId(sectionId: $sectionId) {
            id
            title
            slug
            description
            isPublished
            pageType
            locale
            updatedAt
            sections {
              id
              sectionId
              name
            }
          }
        }
      `;

      console.log(`GraphQL query para getPagesUsingSectionId, sectionId: ${sectionId}`);

      try {
        const result = await gqlRequest<{ getPagesUsingSectionId: PageData[] }>(query, { sectionId });
        
        console.log(`Resultado GraphQL getPagesUsingSectionId (${sectionId}):`, JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getPagesUsingSectionId) {
          console.log(`No se encontraron páginas que usen la sección ${sectionId}`);
          return [];
        }
        
        // Filtrar las secciones con sectionId null para evitar errores GraphQL
        const pagesWithValidSections = result.getPagesUsingSectionId.map(page => {
          if (page.sections && Array.isArray(page.sections)) {
            // Asegurar que todas las secciones tengan sectionId válido
            page.sections = page.sections.filter(section => 
              section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
            );
          }
          return page;
        });
        
        return pagesWithValidSections;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getPagesUsingSectionId (${sectionId}):`, error);
        return [];
      }
    } catch (error) {
      console.error(`Error in getPagesUsingSectionId:`, error);
      return [];
    }
  },

  async getCMSSection(id: string): Promise<{
    id: string;
    sectionId: string;
    name: string;
    description: string;
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    components: unknown;
  } | null> {
    // Check cache first
    const cacheKey = `section_${id}`;
    const cachedSection = getCachedResponse<{
      id: string;
      sectionId: string;
      name: string;
      description: string;
      lastUpdated: string;
      createdAt: string;
      updatedAt: string;
      createdBy: string | null;
      components: unknown;
    }>(cacheKey);
    
    if (cachedSection) {
      return cachedSection;
    }
    
    const query = `
      query GetCMSSection($id: String!) {
        getCMSSection(id: $id) {
          id
          sectionId
          name
          description
          lastUpdated
          createdAt
          updatedAt
          createdBy
          components {
            id
            componentId
            order
          }
        }
      }
    `;
    
    const response = await gqlRequest<{
      getCMSSection: {
        id: string;
        sectionId: string;
        name: string;
        description: string;
        lastUpdated: string;
        createdAt: string;
        updatedAt: string;
        createdBy: string | null;
        components: unknown;
      } | null;
    }>(query, { id });
    
    const result = response?.getCMSSection || null;
    
    // Cache the result
    if (result) {
      setCachedResponse(cacheKey, result);
    }
    
    return result;
  },

  // Create CMS Section
  createCMSSection: async (input: { 
    sectionId: string; 
    name: string; 
    description?: string; 
  }): Promise<{ 
    success: boolean; 
    message: string; 
    section: { id: string; sectionId: string; name: string; order?: number } | null;
  }> => {
    try {
      if (!input.sectionId || !input.name) {
        console.error('Missing required fields for createCMSSection', input);
        return {
          success: false,
          message: 'sectionId and name are required',
          section: null
        };
      }

      console.log('Starting createCMSSection mutation with:', JSON.stringify(input));
      
      const mutation = `
        mutation CreateCMSSection($input: CreateCMSSectionInput!) {
          createCMSSection(input: $input) {
            success
            message
            section {
              id
              sectionId
              name
              order
            }
          }
        }
      `;
      
      // Use a longer timeout for section creation - increase from 15s to 30s
      const result = await gqlRequest<{ 
        createCMSSection?: { 
          success: boolean; 
          message: string; 
          section: { id: string; sectionId: string; name: string; order?: number } | null;
        }
      }>(mutation, { input }, 30000);
      
      console.log('createCMSSection raw result:', JSON.stringify(result));
      
      if (!result) {
        console.error('No result from GraphQL request in createCMSSection');
        return {
          success: false,
          message: 'No result received from server',
          section: null
        };
      }
      
      if (!result.createCMSSection) {
        console.error('Missing createCMSSection in result:', JSON.stringify(result));
        return {
          success: false,
          message: 'Invalid response format: missing createCMSSection field',
          section: null
        };
      }
      
      // Clear cache for related data
      clearCache(`section_${input.sectionId}`); // Local cache for the specific section by its internal ID
      optimizedQueries.invalidateCache(`section:${input.sectionId}`); // GraphQLOptimizer cache for the specific section by its sectionId
      // If there was a general key for all sections list in GraphQLOptimizer, invalidate it here.
      // e.g., optimizedQueries.invalidateCache('allCMSSections');
      
      return result.createCMSSection;
    } catch (error) {
      console.error('Error creating CMS section:', error);
      return {
        success: false,
        message: `Error al crear CMSSection: "${error instanceof Error ? error.message : 'Error desconocido'}"`,
        section: null
      };
    }
  },



  updateComponentTitle,
  updateSectionName,
  
  // Update section background
  updateSectionBackground: async (sectionId: string, backgroundImage: string, backgroundType: 'image' | 'gradient') => {
    try {
      // Use the updateCMSSection function from cms-update.ts
      const result = await updateCMSSection(sectionId, { backgroundImage, backgroundType });

      if (result.success) {
        optimizedQueries.invalidateCache(`section:${sectionId}`);
        clearCache(`section_components_${sectionId}`);
        clearCache(`section_${sectionId}`);
      }
      
      return {
        success: result.success,
        message: result.message,
        lastUpdated: result.lastUpdated
      };
    } catch (error) {
      console.error('Error updating section background:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating section background'
      };
    }
  },
  
  // Get all menus with their items
  getMenus: async () => {
    // Check cache first
    const cacheKey = 'all_menus';
    const cachedMenus = getCachedResponse<Array<{
      id: string;
      name: string;
      location: string | null;
      items: Array<{
        id: string;
        title: string;
        url: string | null;
        pageId: string | null;
        target: string | null;
        icon: string | null;
        order: number;
        children?: Array<{
          id: string;
          title: string;
          url: string | null;
          pageId: string | null;
          target: string | null;
          icon: string | null;
          order: number;
        }>;
        page?: {
          id: string;
          title: string;
          slug: string;
        };
      }>;
      headerStyle?: {
        id: string;
        transparency: number;
        headerSize: string;
        menuAlignment: string;
        menuButtonStyle: string;
        mobileMenuStyle: string;
        mobileMenuPosition: string;
        transparentHeader: boolean;
        borderBottom: boolean;
        fixedHeader?: boolean;
        advancedOptions?: Record<string, unknown>;
      };
      footerStyle?: {
        id: string;
        transparency: number;
        columnLayout: string;
        socialAlignment: string;
        borderTop: boolean;
        alignment: string;
        padding: string;
        width: string;
        advancedOptions?: Record<string, unknown>;
      };
    }>>(cacheKey);
    
    if (cachedMenus) {
      return cachedMenus;
    }
    
    try {
      const query = `
        query GetMenus {
          menus {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
              children {
                id
                title
                url
                pageId
                target
                icon
                order
              }
              page {
                id
                title
                slug
              }
            }
            headerStyle {
              id
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              fixedHeader
              advancedOptions
            }
            footerStyle {
              id
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
            }
          }
        }
      `;

      const result = await gqlRequest<{ menus: Array<{
        id: string;
        name: string;
        location: string | null;
        items: Array<{
          id: string;
          title: string;
          url: string | null;
          pageId: string | null;
          target: string | null;
          icon: string | null;
          order: number;
          children?: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
          }>;
          page?: {
            id: string;
            title: string;
            slug: string;
          };
        }>;
        headerStyle?: {
          id: string;
          transparency: number;
          headerSize: string;
          menuAlignment: string;
          menuButtonStyle: string;
          mobileMenuStyle: string;
          mobileMenuPosition: string;
          transparentHeader: boolean;
          borderBottom: boolean;
          advancedOptions?: Record<string, unknown>;
        };
        footerStyle?: {
          id: string;
          transparency: number;
          columnLayout: string;
          socialAlignment: string;
          borderTop: boolean;
          alignment: string;
          padding: string;
          width: string;
          advancedOptions?: Record<string, unknown>;
        };
      }> }>(query);
      
      if (!result || !result.menus) {
        return [];
      }
      
      // Cache the menus
      setCachedResponse(cacheKey, result.menus);
      
      return result.menus;
    } catch (error) {
      console.error('Error in getMenus GraphQL query:', error);
      return [];
    }
  },

  // Update header style for a menu
  updateHeaderStyle: async (menuId: string, styleInput: HeaderStyleInput): Promise<{
    success: boolean;
    message: string;
    headerStyle?: {
      id: string;
      menuId: string;
      transparency: number;
      headerSize: string;
      menuAlignment: string;
      menuButtonStyle: string;
      mobileMenuStyle: string;
      mobileMenuPosition: string;
      transparentHeader: boolean;
      borderBottom: boolean;
      fixedHeader: boolean;
      advancedOptions?: Record<string, unknown>;
    };
  }> => {
    try {
      const mutation = `
        mutation UpdateHeaderStyle($menuId: ID!, $input: HeaderStyleInput!) {
          updateHeaderStyle(menuId: $menuId, input: $input) {
            success
            message
            headerStyle {
              id
              menuId
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              fixedHeader
              advancedOptions
              createdAt
              updatedAt
            }
          }
        }
      `;

      const variables = {
        menuId,
        input: styleInput
      };

      const result = await gqlRequest<{
        updateHeaderStyle: {
          success: boolean;
          message: string;
          headerStyle: {
            id: string;
            menuId: string;
            transparency: number;
            headerSize: string;
            menuAlignment: string;
            menuButtonStyle: string;
            mobileMenuStyle: string;
            mobileMenuPosition: string;
            transparentHeader: boolean;
            borderBottom: boolean;
            fixedHeader: boolean;
            advancedOptions?: Record<string, unknown>;
            createdAt: string;
            updatedAt: string;
          } | null;
        }
      }>(mutation, variables);

      if (!result || !result.updateHeaderStyle) {
        return {
          success: false,
          message: 'Failed to update header style'
        };
      }
      
      if (result.updateHeaderStyle.success) {
        optimizedQueries.invalidateCache('menus');
        clearCache('all_menus'); // local cache
      }

      return {
        success: result.updateHeaderStyle.success,
        message: result.updateHeaderStyle.message,
        headerStyle: result.updateHeaderStyle.headerStyle || undefined
      };
    } catch (error) {
      console.error('Error updating header style:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating header style'
      };
    }
  },
  
  // Get menu with its header style
  getMenuWithHeaderStyle: async (menuId: string) => {
    try {
      const query = `
        query GetMenu($id: ID!) {
          menu(id: $id) {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
            }
            headerStyle {
              id
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              advancedOptions
              fixedHeader
            }
          }
        }
      `;

      const variables = { id: menuId };
      const result = await gqlRequest<{
        menu: {
          id: string;
          name: string;
          location: string | null;
          items: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
          }>;
          headerStyle: {
            id: string;
            transparency: number;
            headerSize: string;
            menuAlignment: string;
            menuButtonStyle: string;
            mobileMenuStyle: string;
            mobileMenuPosition: string;
            transparentHeader: boolean;
            borderBottom: boolean;
            fixedHeader?: boolean;
            advancedOptions?: Record<string, unknown>;
          } | null;
        } | null;
      }>(query, variables);

      return result?.menu || null;
    } catch (error) {
      console.error('Error getting menu with header style:', error);
      return null;
    }
  },

  // Añadir referencia a la función getForms
  getForms,

  // Asociar una sección a una página
  associateSectionToPage: async (pageId: string, sectionId: string, order: number): Promise<{
    success: boolean;
    message: string;
    page: PageData | null;
  }> => {
    try {
      if (!pageId || !sectionId) {
        console.error('Missing required parameters in associateSectionToPage', { pageId, sectionId });
        return {
          success: false,
          message: 'Los IDs de la página y la sección son requeridos',
          page: null
        };
      }

      console.log(`Asociando sección ${sectionId} a página ${pageId} con orden ${order}`);
      
      const mutation = `
        mutation AssociateSectionToPage($pageId: ID!, $sectionId: ID!, $order: Int!) {
          associateSectionToPage(pageId: $pageId, sectionId: $sectionId, order: $order) {
            success
            message
            page {
              id
              title
              sections {
                id
                sectionId
                name
                order
              }
            }
          }
        }
      `;

      const variables = { pageId, sectionId, order };
      
      // Usar un timeout más largo para esta operación
      const result = await gqlRequest<{ 
        associateSectionToPage?: {
          success: boolean;
          message: string;
          page: PageData | null;
        } 
      }>(mutation, variables, 30000); // Increased timeout to 30 seconds

      console.log('Respuesta de associateSectionToPage:', JSON.stringify(result, null, 2));
      
      if (!result) {
        console.error('No se recibió respuesta del servidor');
        return {
          success: false,
          message: 'No se recibió respuesta del servidor al asociar la sección a la página',
          page: null
        };
      }
      
      if (!result.associateSectionToPage) {
        console.error('Respuesta sin el campo associateSectionToPage:', result);
        return {
          success: false,
          message: 'Respuesta no válida del servidor: campo associateSectionToPage no encontrado',
          page: null
        };
      }
      
      if (result.associateSectionToPage && result.associateSectionToPage.success && result.associateSectionToPage.page) {
        const updatedPage = result.associateSectionToPage.page;
        if (updatedPage.slug) {
          optimizedQueries.invalidateCache(`page:${updatedPage.slug}`);
          clearCache(`page_slug_${updatedPage.slug}`);
        }
        optimizedQueries.invalidateCache(`page_id:${pageId}`);
        clearCache(`page_id_${pageId}`);
        optimizedQueries.invalidateCache(`section:${sectionId}`); // Section's context within a page changed
        clearCache(`section_components_${sectionId}`);
        clearCache(`section_${sectionId}`);
        optimizedQueries.invalidateCache('allPages');
        clearCache('allPages');
      }

      return result.associateSectionToPage;
    } catch (error) {
      console.error('Error associating section to page:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Error al asociar sección a página: ${error.message}` 
          : 'Error desconocido al asociar sección a página',
        page: null
      };
    }
  },

  // Desasociar una sección de una página
  dissociateSectionFromPage: async (pageId: string, sectionId: string): Promise<{
    success: boolean;
    message: string;
    page: PageData | null;
  }> => {
    try {
      const mutation = `
        mutation DissociateSectionFromPage($pageId: ID!, $sectionId: ID!) {
          dissociateSectionFromPage(pageId: $pageId, sectionId: $sectionId) {
            success
            message
            page {
              id
              title
              sections {
                id
                sectionId
                name
                order
              }
            }
          }
        }
      `;

      const variables = { pageId, sectionId };
      const result = await gqlRequest<{ 
        dissociateSectionFromPage: {
          success: boolean;
          message: string;
          page: PageData | null;
        } 
      }>(mutation, variables);
      
      if (result.dissociateSectionFromPage && result.dissociateSectionFromPage.success && result.dissociateSectionFromPage.page) {
        const updatedPage = result.dissociateSectionFromPage.page;
        if (updatedPage.slug) {
          optimizedQueries.invalidateCache(`page:${updatedPage.slug}`);
          clearCache(`page_slug_${updatedPage.slug}`);
        }
        optimizedQueries.invalidateCache(`page_id:${pageId}`);
        clearCache(`page_id_${pageId}`);
        optimizedQueries.invalidateCache(`section:${sectionId}`); // Section's context within a page changed
        clearCache(`section_components_${sectionId}`);
        clearCache(`section_${sectionId}`);
        optimizedQueries.invalidateCache('allPages');
        clearCache('allPages');
      }

      return result.dissociateSectionFromPage;
    } catch (error) {
      console.error('Error dissociating section from page:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        page: null
      };
    }
  },

  // Obtener todos los componentes CMS
  getAllComponents: async () => {
    try {
      const query = `
        query GetAllCMSComponents {
          getAllCMSComponents {
            id
            name
            slug
            description
            category
            icon
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log('GraphQL query para getAllCMSComponents');

      try {
        const result = await gqlRequest<{ getAllCMSComponents: CMSComponentDB[] }>(query);
        
        console.log("Resultado GraphQL getAllCMSComponents:", JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getAllCMSComponents) {
          console.log("No se encontraron componentes o la estructura no es la esperada");
          return [];
        }
        
        return result.getAllCMSComponents;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSComponents:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllComponents:`, error);
      return [];
    }
  },

  // Header and footer style update methods are defined earlier in the cmsOperations object

  // Update Footer Style
  async updateFooterStyle(menuId: string, styleData: FooterStyleInput): Promise<{
    success: boolean;
    message: string;
    footerStyle?: Record<string, unknown>;
  }> {
    try {
      const query = `
        mutation UpdateFooterStyle($menuId: ID!, $input: FooterStyleInput!) {
          updateFooterStyle(menuId: $menuId, input: $input) {
            success
            message
            footerStyle {
              id
              menuId
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
              createdAt
              updatedAt
            }
          }
        }
      `;

      const variables = {
        menuId,
        input: styleData
      };

      const response = await gqlRequest<{
        updateFooterStyle: {
          success: boolean;
          message: string;
          footerStyle: Record<string, unknown> | null;
        };
      }>(query, variables);

      
      if (response.updateFooterStyle.success) {
        optimizedQueries.invalidateCache('menus');
        clearCache('all_menus'); // local cache
      }

      return {
        success: response.updateFooterStyle.success,
        message: response.updateFooterStyle.message,
        footerStyle: response.updateFooterStyle.footerStyle || undefined
      };
    } catch (error) {
      console.error('Error updating footer style:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Get menu with Footer style
  async getMenuWithFooterStyle(menuId: string): Promise<{
    id: string;
    name: string;
    location: string | null;
    items: Array<{
      id: string;
      title: string;
      url: string | null;
      pageId: string | null;
      target: string | null;
      icon: string | null;
      order: number;
      parentId: string | null;
      children?: Array<{
        id: string;
        title: string;
        url: string | null;
        pageId: string | null;
        target: string | null;
        icon: string | null;
        order: number;
      }>;
      page?: { slug: string } | null;
    }>;
    footerStyle?: {
      transparency?: number;
      columnLayout?: string;
      socialAlignment?: string;
      borderTop?: boolean;
      alignment?: string;
      padding?: string;
      width?: string;
      advancedOptions?: Record<string, unknown>;
    } | null;
  } | null> {
    try {
      const query = `
        query GetMenuWithFooterStyle($id: ID!) {
          menu(id: $id) {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
              parentId
              children {
                id
                title
                url
                pageId
                target
                icon
                order
              }
              page {
                slug
              }
            }
            footerStyle {
              id
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
            }
          }
        }
      `;

      const variables = { id: menuId };
      // Use a longer timeout for this query
      const result = await gqlRequest<{
        menu: {
          id: string;
          name: string;
          location: string | null;
          items: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
            parentId: string | null;
            children?: Array<{
              id: string;
              title: string;
              url: string | null;
              pageId: string | null;
              target: string | null;
              icon: string | null;
              order: number;
            }>;
            page?: { slug: string } | null;
          }>;
          footerStyle: {
            id: string;
            transparency?: number;
            columnLayout?: string;
            socialAlignment?: string;
            borderTop?: boolean;
            alignment?: string;
            padding?: string;
            width?: string;
            advancedOptions?: Record<string, unknown>;
          } | null;
        } | null;
      }>(query, variables, 20000); // Increase timeout to 20 seconds

      return result?.menu || null;
    } catch (error) {
      console.error('Error fetching menu with footer style:', error);
      return null;
    }
  },

  // Expose the clearCache function
  clearCache,

  // Get the default page for a locale
  getDefaultPage,

  // Settings operations
  async getSiteSettings(): Promise<{
    id: string;
    siteName: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale: string;
    footerText?: string;
    maintenanceMode: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales: string[];
    twitterCardType?: string;
    twitterHandle?: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetSiteSettings {
        getSiteSettings {
          id
          siteName
          siteDescription
          logoUrl
          faviconUrl
          primaryColor
          secondaryColor
          googleAnalyticsId
          facebookPixelId
          customCss
          customJs
          contactEmail
          contactPhone
          address
          accentColor
          defaultLocale
          footerText
          maintenanceMode
          metaDescription
          metaTitle
          ogImage
          socialLinks
          supportedLocales
          twitterCardType
          twitterHandle
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ getSiteSettings: {
        id: string;
        siteName: string;
        siteDescription?: string;
        logoUrl?: string;
        faviconUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
        customCss?: string;
        customJs?: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        accentColor?: string;
        defaultLocale: string;
        footerText?: string;
        maintenanceMode: boolean;
        metaDescription?: string;
        metaTitle?: string;
        ogImage?: string;
        socialLinks?: string;
        supportedLocales: string[];
        twitterCardType?: string;
        twitterHandle?: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(query);
      return response.getSiteSettings;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return null;
    }
  },

  async updateSiteSettings(input: {
    siteName?: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale?: string;
    footerText?: string;
    maintenanceMode?: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales?: string[];
    twitterCardType?: string;
    twitterHandle?: string;
  }): Promise<{
    id: string;
    siteName: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale: string;
    footerText?: string;
    maintenanceMode: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales: string[];
    twitterCardType?: string;
    twitterHandle?: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const mutation = `
      mutation UpdateSiteSettings($input: UpdateSiteSettingsInput!) {
        updateSiteSettings(input: $input) {
          id
          siteName
          siteDescription
          logoUrl
          faviconUrl
          primaryColor
          secondaryColor
          googleAnalyticsId
          facebookPixelId
          customCss
          customJs
          contactEmail
          contactPhone
          address
          accentColor
          defaultLocale
          footerText
          maintenanceMode
          metaDescription
          metaTitle
          ogImage
          socialLinks
          supportedLocales
          twitterCardType
          twitterHandle
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ updateSiteSettings: {
        id: string;
        siteName: string;
        siteDescription?: string;
        logoUrl?: string;
        faviconUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
        customCss?: string;
        customJs?: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        accentColor?: string;
        defaultLocale: string;
        footerText?: string;
        maintenanceMode: boolean;
        metaDescription?: string;
        metaTitle?: string;
        ogImage?: string;
        socialLinks?: string;
        supportedLocales: string[];
        twitterCardType?: string;
        twitterHandle?: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(mutation, { input });
      return response.updateSiteSettings;
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    }
  },

  // User Settings operations
  async getUserSettings(): Promise<{
    id: string;
    userId: string;
    emailNotifications: boolean;
    theme: string;
    language: string;
    timeFormat: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetUserSettings {
        userSettings {
          id
          userId
          emailNotifications
          theme
          language
          timeFormat
          dateFormat
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ userSettings: {
        id: string;
        userId: string;
        emailNotifications: boolean;
        theme: string;
        language: string;
        timeFormat: string;
        dateFormat: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(query);
      return response.userSettings;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }
  },

  async updateUserSettings(input: {
    emailNotifications?: boolean;
    theme?: string;
    language?: string;
    timeFormat?: string;
    dateFormat?: string;
  }): Promise<{
    id: string;
    userId: string;
    emailNotifications: boolean;
    theme: string;
    language: string;
    timeFormat: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const mutation = `
      mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
        updateUserSettings(input: $input) {
          id
          userId
          emailNotifications
          theme
          language
          timeFormat
          dateFormat
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ updateUserSettings: {
        id: string;
        userId: string;
        emailNotifications: boolean;
        theme: string;
        language: string;
        timeFormat: string;
        dateFormat: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(mutation, { input });
      return response.updateUserSettings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  // Staff Management Operations
  async staffProfiles(): Promise<CalendarStaffProfile[]> {
    try {
      const query = `
        query GetStaffProfiles {
          staffProfiles {
            id
            userId
            bio
            specializations
            createdAt
            updatedAt
            user {
              id
              email
              firstName
              lastName
              phoneNumber
              isActive
              profileImageUrl
              role {
                id
                name
              }
            }
            assignedServices {
              id
              name
              description
              durationMinutes
              price
              isActive
            }
            locationAssignments {
              id
              name
              address
              phone
            }
            schedules {
              id
              locationId
              date
              dayOfWeek
              startTime
              endTime
              scheduleType
              isAvailable
              notes
              createdAt
              updatedAt
            }
          }
        }
      `;

      const response = await gqlRequest<{ staffProfiles: CalendarStaffProfile[] }>(query);
      return response.staffProfiles || [];
    } catch (error) {
      console.error('Error fetching staff profiles:', error);
      return [];
    }
  },

  async users(): Promise<CalendarUser[]> {
    try {
      const query = `
        query GetUsers {
          users {
            id
            email
            firstName
            lastName
            phoneNumber
            isActive
            profileImageUrl
            role {
              id
              name
            }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await gqlRequest<{ users: CalendarUser[] }>(query);
      
      // Handle case where users might be null or undefined
      if (!response || !response.users) {
        console.warn('Users query returned null or undefined, returning empty array');
        return [];
      }
      
      return response.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.users')) {
        console.warn('Users field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },


  async locations(): Promise<CalendarLocation[]> {
    try {
      const query = `
        query GetLocations {
          locations {
            id
            name
            address
            phone
            operatingHours
            createdAt
            updatedAt
          }
        }
      `;

      const response = await gqlRequest<{ locations: CalendarLocation[] }>(query);
      
      // Handle case where locations might be null or undefined
      if (!response || !response.locations) {
        console.warn('Locations query returned null or undefined, returning empty array');
        return [];
      }
      
      return response.locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.locations')) {
        console.warn('Locations field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },

  async createStaffProfile(input: { input: {
    userId: string;
    bio?: string;
    specializations?: string[];
  }}): Promise<CalendarStaffProfile> {
    try {
      const mutation = `
        mutation CreateStaffProfile($input: CreateStaffProfileInput!) {
          createStaffProfile(input: $input) {
            success
            message
            staffProfile {
              id
              userId
              bio
              specializations
              createdAt
              updatedAt
              user {
                id
                email
                firstName
                lastName
                phoneNumber
                bio
                department
                isActive
                position
                profileImageUrl
                roleId
              }
            }
          }
        }
      `;

      const response = await gqlRequest<{
        createStaffProfile: {
          success: boolean;
          message: string;
          staffProfile: CalendarStaffProfile | null;
        };
      }>(mutation, input);

      if (!response.createStaffProfile.success || !response.createStaffProfile.staffProfile) {
        throw new Error(response.createStaffProfile.message || 'Failed to create staff profile');
      }

      return response.createStaffProfile.staffProfile;
    } catch (error) {
      console.error('Error creating staff profile:', error);
      throw error;
    }
  },

  async updateStaffProfile(input: { id: string; input: Partial<StaffProfileInput> }): Promise<CalendarStaffProfile> {
    try {
      const mutation = `
        mutation UpdateStaffProfile($id: ID!, $input: UpdateStaffProfileInput!) {
          updateStaffProfile(id: $id, input: $input) {
            success
            message
            staffProfile {
              id
              userId
              bio
              specializations
              createdAt
              updatedAt
              user {
                id
                email
                firstName
                lastName
                phoneNumber
                bio
                department
                isActive
                position
                profileImageUrl
                roleId
              }
            }
          }
        }
      `;

      const response = await gqlRequest<{
        updateStaffProfile: {
          success: boolean;
          message: string;
          staffProfile: CalendarStaffProfile | null;
        };
      }>(mutation, input);

      if (!response.updateStaffProfile.success || !response.updateStaffProfile.staffProfile) {
        throw new Error(response.updateStaffProfile.message || 'Failed to update staff profile');
      }

      return response.updateStaffProfile.staffProfile;
    } catch (error) {
      console.error('Error updating staff profile:', error);
      throw error;
    }
  },

  async deleteStaffProfile(input: { id: string }): Promise<{ success: boolean; message: string }> {
    try {
      const mutation = `
        mutation DeleteStaffProfile($id: ID!) {
          deleteStaffProfile(id: $id) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ deleteStaffProfile: { success: boolean; message: string } }>(mutation, input);
      return response.deleteStaffProfile;
    } catch (error) {
      console.error('Error deleting staff profile:', error);
      throw error;
    }
  },

  async updateStaffSchedule(input: { staffProfileId: string; schedule: CalendarStaffScheduleInput[] }): Promise<{ success: boolean; message: string }> {
    try {
      const mutation = `
        mutation UpdateStaffSchedule($staffProfileId: ID!, $schedule: [StaffScheduleInput!]!) {
          updateStaffSchedule(staffProfileId: $staffProfileId, schedule: $schedule) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ updateStaffSchedule: { success: boolean; message: string } }>(mutation, input);
      return response.updateStaffSchedule;
    } catch (error) {
      console.error('Error updating staff schedule:', error);
      throw error;
    }
  },

  async deleteFormSubmission(id: string): Promise<FormSubmissionResult> {
    const mutation = `
      mutation DeleteFormSubmission($id: ID!) {
        deleteFormSubmission(id: $id) {
          success
          message
        }
      }
    `;

    const result = await gqlRequest<{ deleteFormSubmission: FormSubmissionResult }>(mutation, { id });
    return result.deleteFormSubmission;
  },

  // Calendar booking rules
  async globalBookingRule(): Promise<{
    id: string;
    advanceBookingHoursMin: number;
    advanceBookingDaysMax: number;
    sameDayCutoffTime?: string;
    bufferBetweenAppointmentsMinutes: number;
    maxAppointmentsPerDayPerStaff?: number;
    bookingSlotIntervalMinutes: number;
  } | null> {
    const query = `
      query GlobalBookingRule {
        globalBookingRule {
          id
          advanceBookingHoursMin
          advanceBookingDaysMax
          sameDayCutoffTime
          bufferBetweenAppointmentsMinutes
          maxAppointmentsPerDayPerStaff
          bookingSlotIntervalMinutes
        }
      }
    `;

    const result = await gqlRequest<{ globalBookingRule: {
      id: string;
      advanceBookingHoursMin: number;
      advanceBookingDaysMax: number;
      sameDayCutoffTime?: string;
      bufferBetweenAppointmentsMinutes: number;
      maxAppointmentsPerDayPerStaff?: number;
      bookingSlotIntervalMinutes: number;
    } | null }>(query);
    return result.globalBookingRule;
  },

  // Calendar booking rules - upsert
  async upsertGlobalBookingRules({ input }: {
    input: {
      advanceBookingHoursMin: number;
      advanceBookingDaysMax: number;
      sameDayCutoffTime?: string | null;
      bufferBetweenAppointmentsMinutes: number;
      maxAppointmentsPerDayPerStaff?: number | null;
      bookingSlotIntervalMinutes: number;
    }
  }): Promise<{
    id: string;
    advanceBookingHoursMin: number;
    advanceBookingDaysMax: number;
    sameDayCutoffTime?: string;
    bufferBetweenAppointmentsMinutes: number;
    maxAppointmentsPerDayPerStaff?: number;
    bookingSlotIntervalMinutes: number;
  }> {
    const mutation = `
      mutation UpsertGlobalBookingRules($input: BookingRuleInput!) {
        upsertGlobalBookingRules(input: $input) {
          id
          advanceBookingHoursMin
          advanceBookingDaysMax
          sameDayCutoffTime
          bufferBetweenAppointmentsMinutes
          maxAppointmentsPerDayPerStaff
          bookingSlotIntervalMinutes
        }
      }
    `;

    const result = await gqlRequest<{ upsertGlobalBookingRules: {
      id: string;
      advanceBookingHoursMin: number;
      advanceBookingDaysMax: number;
      sameDayCutoffTime?: string;
      bufferBetweenAppointmentsMinutes: number;
      maxAppointmentsPerDayPerStaff?: number;
      bookingSlotIntervalMinutes: number;
    } }>(mutation, { input });
    
    return result.upsertGlobalBookingRules;
  },

  // Calendar service categories
  async serviceCategories(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query ServiceCategories {
        serviceCategories {
          id
          name
          description
          displayOrder
          parentId
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const result = await gqlRequest<{ serviceCategories: Array<{
        id: string;
        name: string;
        description?: string;
        displayOrder: number;
        parentId?: string;
        createdAt: string;
        updatedAt: string;
      }> }>(query);
      
      // Handle case where serviceCategories might be null or undefined
      if (!result || !result.serviceCategories) {
        console.warn('ServiceCategories query returned null or undefined, returning empty array');
        return [];
      }
      
      return result.serviceCategories;
    } catch (error) {
      console.error('Error fetching service categories:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.serviceCategories')) {
        console.warn('ServiceCategories field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },

  // Delete service category
  async deleteServiceCategory({ id }: { id: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteServiceCategory($id: ID!) {
        deleteServiceCategory(id: $id) {
          success
          message
          serviceCategory {
            id
            name
          }
        }
      }
    `;

    try {
      const result = await gqlRequest<{ deleteServiceCategory: {
        success: boolean;
        message: string;
        serviceCategory: {
          id: string;
          name: string;
        } | null;
      } }>(mutation, { id });
      
      return {
        success: result.deleteServiceCategory.success,
        message: result.deleteServiceCategory.message
      };
    } catch (error) {
      console.error('Error deleting service category:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete service category'
      };
    }
  },

  // Create service category
  async createServiceCategory({ input }: { 
    input: {
      name?: string;
      description?: string | null;
      displayOrder?: number;
      parentId?: string | null;
    }
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    parentId?: string;
  }> {
    const mutation = `
      mutation CreateServiceCategory($input: CreateServiceCategoryInput!) {
        createServiceCategory(input: $input) {
          success
          message
          serviceCategory {
            id
            name
            description
            displayOrder
            parentId
          }
        }
      }
    `;

    const result = await gqlRequest<{ createServiceCategory: {
      success: boolean;
      message: string;
      serviceCategory: {
        id: string;
        name: string;
        description?: string;
        displayOrder: number;
        parentId?: string;
      } | null;
    } }>(mutation, { input });
    
    if (!result.createServiceCategory.success || !result.createServiceCategory.serviceCategory) {
      throw new Error(result.createServiceCategory.message || 'Failed to create service category');
    }
    
    return result.createServiceCategory.serviceCategory;
  },

  // Update service category
  async updateServiceCategory({ id, input }: { 
    id: string;
    input: {
      name?: string;
      description?: string | null;
      displayOrder?: number;
      parentId?: string | null;
    }
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    parentId?: string;
  }> {
    const mutation = `
      mutation UpdateServiceCategory($id: ID!, $input: UpdateServiceCategoryInput!) {
        updateServiceCategory(id: $id, input: $input) {
          success
          message
          serviceCategory {
            id
            name
            description
            displayOrder
            parentId
          }
        }
      }
    `;

    const result = await gqlRequest<{ updateServiceCategory: {
      success: boolean;
      message: string;
      serviceCategory: {
        id: string;
        name: string;
        description?: string;
        displayOrder: number;
        parentId?: string;
      } | null;
    } }>(mutation, { id, input });
    
    if (!result.updateServiceCategory.success || !result.updateServiceCategory.serviceCategory) {
      throw new Error(result.updateServiceCategory.message || 'Failed to update service category');
    }
    
    return result.updateServiceCategory.serviceCategory;
  },

  // Services
  async services(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    prices: Array<{
      id: string;
      amount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
    }>;
    bufferTimeBeforeMinutes: number;
    bufferTimeAfterMinutes: number;
    preparationTimeMinutes: number;
    cleanupTimeMinutes: number;
    maxDailyBookingsPerService?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    serviceCategoryId: string;
    serviceCategory?: { id: string; name: string };
    locations?: Array<{ id: string; name: string }>;
  }>> {
    const query = `
      query Services {
        services {
          id
          name
          description
          durationMinutes
          prices {
            id
            amount
            currency {
              id
              code
              symbol
            }
          }
          bufferTimeBeforeMinutes
          bufferTimeAfterMinutes
          preparationTimeMinutes
          cleanupTimeMinutes
          maxDailyBookingsPerService
          isActive
          createdAt
          updatedAt
          serviceCategoryId
          serviceCategory {
            id
            name
          }
          locations {
            id
            name
          }
        }
      }
    `;

    try {
      const result = await gqlRequest<{ services: Array<{
        id: string;
        name: string;
        description?: string;
        durationMinutes: number;
        prices: Array<{
          id: string;
          amount: number;
          currency: {
            id: string;
            code: string;
            symbol: string;
          };
        }>;
        bufferTimeBeforeMinutes: number;
        bufferTimeAfterMinutes: number;
        preparationTimeMinutes: number;
        cleanupTimeMinutes: number;
        maxDailyBookingsPerService?: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        serviceCategoryId: string;
        serviceCategory?: { id: string; name: string };
        locations?: Array<{ id: string; name: string }>;
      }> }>(query);
      
      // Handle case where services might be null or undefined
      if (!result || !result.services) {
        console.warn('Services query returned null or undefined, returning empty array');
        return [];
      }
      
      // Transform string dates to Date objects to match CalendarService type
      const transformedServices = result.services.map(service => ({
        ...service,
        createdAt: new Date(service.createdAt),
        updatedAt: new Date(service.updatedAt)
      }));
      
      return transformedServices;
    } catch (error) {
      console.error('Error fetching services:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.services')) {
        console.warn('Services field is null in database, returning empty array');
        return [];
      }
      return []; // Return empty array instead of null on any error
    }
  },

  async createService({ input }: { input: {
    name: string;
    description?: string | null;
    durationMinutes: number;
    price: number;
    bufferTimeBeforeMinutes?: number;
    bufferTimeAfterMinutes?: number;
    preparationTimeMinutes?: number;
    cleanupTimeMinutes?: number;
    maxDailyBookingsPerService?: number;
    isActive?: boolean;
    serviceCategoryId: string;
    locationIds?: string[];
  }}): Promise<{
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    isActive: boolean;
  }> {
    const mutation = `
      mutation CreateService($input: CreateServiceInput!) {
        createService(input: $input) {
          success
          message
          service {
            id
            name
            description
            durationMinutes
            price
            isActive
          }
        }
      }
    `;

    const response = await gqlRequest<{
      createService: {
        success: boolean;
        message: string;
        service: {
          id: string;
          name: string;
          description?: string;
          durationMinutes: number;
          price: number;
          isActive: boolean;
        } | null;
      };
    }>(mutation, { input });

    if (!response.createService.success || !response.createService.service) {
      throw new Error(response.createService.message || 'Failed to create service');
    }

    return response.createService.service;
  },

  async updateService({ id, input }: { 
    id: string;
    input: {
      name?: string;
      description?: string | null;
      durationMinutes?: number;
      price?: number;
      bufferTimeBeforeMinutes?: number;
      bufferTimeAfterMinutes?: number;
      preparationTimeMinutes?: number;
      cleanupTimeMinutes?: number;
      maxDailyBookingsPerService?: number;
      isActive?: boolean;
      serviceCategoryId?: string;
      locationIds?: string[];
    }
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    isActive: boolean;
  }> {
    const mutation = `
      mutation UpdateService($id: ID!, $input: UpdateServiceInput!) {
        updateService(id: $id, input: $input) {
          success
          message
          service {
            id
            name
            description
            durationMinutes
            price
            isActive
          }
        }
      }
    `;

    const response = await gqlRequest<{
      updateService: {
        success: boolean;
        message: string;
        service: {
          id: string;
          name: string;
          description?: string;
          durationMinutes: number;
          price: number;
          isActive: boolean;
        } | null;
      };
    }>(mutation, { id, input });

    if (!response.updateService.success || !response.updateService.service) {
      throw new Error(response.updateService.message || 'Failed to update service');
    }

    return response.updateService.service;
  },

  async deleteService({ id }: { id: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteService($id: ID!) {
        deleteService(id: $id) {
          id
          name
        }
      }
    `;

    try {
      await gqlRequest(mutation, { id });
      return {
        success: true,
        message: 'Service deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting service:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete service'
      };
    }
  },

  async createLocation({ input }: { input: {
    name: string;
    address?: string | null;
    phone?: string | null;
    operatingHours?: Record<string, unknown> | null;
  }}): Promise<{
    id: string;
    name: string;
    address?: string;
    phone?: string;
  }> {
    const mutation = `
      mutation CreateLocation($input: CreateLocationInput!) {
        createLocation(input: $input) {
          success
          message
          location {
            id
            name
            address
            phone
          }
        }
      }
    `;

    const response = await gqlRequest<{
      createLocation: {
        success: boolean;
        message: string;
        location: {
          id: string;
          name: string;
          address?: string;
          phone?: string;
        } | null;
      };
    }>(mutation, { input });

    if (!response.createLocation.success || !response.createLocation.location) {
      throw new Error(response.createLocation.message || 'Failed to create location');
    }

    return response.createLocation.location;
  },

  async updateLocation({ id, input }: { 
    id: string;
    input: {
      name?: string;
      address?: string | null;
      phone?: string | null;
      operatingHours?: Record<string, unknown> | null;
    }
  }): Promise<{
    id: string;
    name: string;
    address?: string;
    phone?: string;
  }> {
    const mutation = `
      mutation UpdateLocation($id: ID!, $input: UpdateLocationInput!) {
        updateLocation(id: $id, input: $input) {
          success
          message
          location {
            id
            name
            address
            phone
          }
        }
      }
    `;

    const response = await gqlRequest<{
      updateLocation: {
        success: boolean;
        message: string;
        location: {
          id: string;
          name: string;
          address?: string;
          phone?: string;
        } | null;
      };
    }>(mutation, { id, input });

    if (!response.updateLocation.success || !response.updateLocation.location) {
      throw new Error(response.updateLocation.message || 'Failed to update location');
    }

    return response.updateLocation.location;
  },

  async deleteLocation({ id }: { id: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteLocation($id: ID!) {
        deleteLocation(id: $id) {
          success
          message
          location {
            id
            name
          }
        }
      }
    `;

    const response = await gqlRequest<{
      deleteLocation: {
        success: boolean;
        message: string;
        location: {
          id: string;
          name: string;
        } | null;
      };
    }>(mutation, { id });

    return {
      success: response.deleteLocation.success,
      message: response.deleteLocation.message
    };
  },

  // Calendar Bookings Operations
  async bookings({ filter, pagination }: {
    filter?: {
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      locationId?: string;
      serviceId?: string;
      staffProfileId?: string;
      customerId?: string;
      searchQuery?: string;
    };
    pagination?: {
      page?: number;
      pageSize?: number;
    };
  }): Promise<{
    items: Array<{
      id: string;
      customerName?: string | null;
      customerEmail?: string | null;
      customerPhone?: string | null;
      service: { id: string; name: string };
      location: { id: string; name: string };
      staffProfile?: { id: string; user: { firstName: string; lastName: string } } | null;
      bookingDate: string;
      startTime: string;
      endTime: string;
      status: string;
      notes?: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    totalCount: number;
    page: number;
    pageSize: number;
  } | null> {
    const query = `
      query GetBookings($filter: BookingFilterInput, $pagination: PaginationInput) {
        bookings(filter: $filter, pagination: $pagination) {
          edges {
            node {
              id
              customerName
              customerEmail
              customerPhone
              service {
                id
                name
              }
              location {
                id
                name
              }
              staffProfile {
                id
                user {
                  firstName
                  lastName
                }
              }
              bookingDate
              startTime
              endTime
              status
              notes
              createdAt
              updatedAt
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        bookings: {
          edges: Array<{
            node: {
              id: string;
              customerName?: string | null;
              customerEmail?: string | null;
              customerPhone?: string | null;
              service: { id: string; name: string };
              location: { id: string; name: string };
              staffProfile?: { id: string; user: { firstName: string; lastName: string } } | null;
              bookingDate: string;
              startTime: string;
              endTime: string;
              status: string;
              notes?: string | null;
              createdAt: string;
              updatedAt: string;
            };
          }>;
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor?: string;
            endCursor?: string;
          };
          totalCount: number;
        };
      }>(query, { filter, pagination });
      
      // Transform the response to match the expected format
      const bookingsData = response.bookings;
      if (!bookingsData) {
        console.warn('Bookings query returned null or undefined, returning empty result');
        return {
          items: [],
          totalCount: 0,
          page: pagination?.page || 1,
          pageSize: pagination?.pageSize || 10
        };
      }
      
      return {
        items: bookingsData.edges.map(edge => edge.node),
        totalCount: bookingsData.totalCount,
        page: pagination?.page || 1,
        pageSize: pagination?.pageSize || 10
      };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.bookings')) {
        console.warn('Bookings field is null in database, returning empty result');
        return {
          items: [],
          totalCount: 0,
          page: pagination?.page || 1,
          pageSize: pagination?.pageSize || 10
        };
      }
      // Always return empty result structure instead of null
      return {
        items: [],
        totalCount: 0,
        page: pagination?.page || 1,
        pageSize: pagination?.pageSize || 10
      };
    }
  },

  // Create a new booking
  async createBooking({ input }: {
    input: {
      serviceId: string;
      locationId: string;
      staffProfileId?: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      notes?: string;
      userId?: string;
    };
  }): Promise<{
    id: string;
    customerName: string;
    customerEmail: string;
    service: { name: string };
    location: { name: string };
    staffProfile?: { user: { firstName: string; lastName: string } } | null;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: string;
    notes?: string;
  } | null> {
    const mutation = `
      mutation CreateBooking($input: BookingInput!) {
        createBooking(input: $input) {
          id
          customerName
          customerEmail
          service {
            name
          }
          location {
            name
          }
          staffProfile {
            user {
              firstName
              lastName
            }
          }
          bookingDate
          startTime
          endTime
          status
          notes
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        createBooking: {
          id: string;
          customerName: string;
          customerEmail: string;
          service: { name: string };
          location: { name: string };
          staffProfile?: { user: { firstName: string; lastName: string } } | null;
          bookingDate: string;
          startTime: string;
          endTime: string;
          status: string;
          notes?: string;
        };
      }>(mutation, { input });
      
      return response.createBooking || null;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Get staff available for a service at a location
  async staffForService({ serviceId, locationId }: {
    serviceId: string;
    locationId: string;
  }): Promise<Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
    bio?: string;
    specializations: string[];
  }>> {
    const query = `
      query StaffForService($serviceId: ID!, $locationId: ID!) {
        staffForService(serviceId: $serviceId, locationId: $locationId) {
          id
          user {
            id
            firstName
            lastName
            profileImageUrl
          }
          bio
          specializations
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        staffForService: Array<{
          id: string;
          user: {
            id: string;
            firstName: string;
            lastName: string;
            profileImageUrl?: string;
          };
          bio?: string;
          specializations: string[];
        }>;
      }>(query, { serviceId, locationId });
      
      return response.staffForService || [];
    } catch (error) {
      console.error('Error fetching staff for service:', error);
      return [];
    }
  },

  // Get available time slots
  async availableSlots({ 
    serviceId, 
    locationId, 
    staffProfileId, 
    date 
  }: {
    serviceId: string;
    locationId: string;
    staffProfileId?: string;
    date: string;
  }): Promise<Array<{
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>> {
    const query = `
      query AvailableSlots($serviceId: ID!, $locationId: ID!, $staffProfileId: ID, $date: String!) {
        availableSlots(
          serviceId: $serviceId, 
          locationId: $locationId, 
          staffProfileId: $staffProfileId, 
          date: $date
        ) {
          startTime
          endTime
          isAvailable
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        availableSlots: Array<{
          startTime: string;
          endTime: string;
          isAvailable: boolean;
        }>;
      }>(query, { serviceId, locationId, staffProfileId, date });
      
      return response.availableSlots || [];
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  },

  async getOrders(filter?: {
    search?: string;
    shopId?: string;
    customerId?: string;
    status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    totalAmount: number;
    currency: {
      id: string;
      code: string;
      symbol: string;
    };
    shop: {
      id: string;
      name: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      product: {
        id: string;
        name: string;
        sku?: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetOrders($filter: OrderFilterInput, $pagination: PaginationInput) {
        orders(filter: $filter, pagination: $pagination) {
          id
          customerName
          customerEmail
          status
          totalAmount
          currency {
            id
            code
            symbol
          }
          shop {
            id
            name
          }
          items {
            id
            quantity
            unitPrice
            totalPrice
            product {
              id
              name
              sku
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        shopId?: string;
        customerId?: string;
        status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
        dateFrom?: string;
        dateTo?: string;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ orders: Array<{
      id: string;
      customerName: string;
      customerEmail: string;
      status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
      totalAmount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
      shop: {
        id: string;
        name: string;
      };
      items: Array<{
        id: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        product: {
          id: string;
          name: string;
          sku?: string;
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.orders || [];
  },

  // Product Category functions
  async getProductCategories(filter?: {
    search?: string;
    shopId?: string;
    parentId?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    slug: string;
    parentId?: string;
    isActive: boolean;
    shopId?: string;
    productCount: number;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetProductCategories($filter: ProductCategoryFilterInput, $pagination: PaginationInput) {
        productCategories(filter: $filter, pagination: $pagination) {
          id
          name
          description
          slug
          parentId
          isActive
          shopId
          productCount
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ productCategories: Array<{
      id: string;
      name: string;
      description?: string;
      slug: string;
      parentId?: string;
      isActive: boolean;
      shopId?: string;
      productCount: number;
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.productCategories || [];
  },

  async getProductCategory(id: string): Promise<{
    id: string;
    name: string;
    description?: string;
    slug: string;
    parentId?: string;
    isActive: boolean;
    shopId?: string;
    productCount: number;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetProductCategory($id: ID!) {
        productCategory(id: $id) {
          id
          name
          description
          slug
          parentId
          isActive
          shopId
          productCount
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ productCategory: {
      id: string;
      name: string;
      description?: string;
      slug: string;
      parentId?: string;
      isActive: boolean;
      shopId?: string;
      productCount: number;
      createdAt: string;
      updatedAt: string;
    } | null }>(query, { id });

    return result.productCategory;
  },

  async createProductCategory(input: {
    name: string;
    description?: string;
    slug: string;
    parentId?: string;
    isActive?: boolean;
    shopId?: string;
  }): Promise<{
    success: boolean;
    message: string;
    category?: {
      id: string;
      name: string;
      description?: string;
      slug: string;
      parentId?: string;
      isActive: boolean;
      shopId?: string;
      productCount: number;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    const mutation = `
      mutation CreateProductCategory($input: CreateProductCategoryInput!) {
        createProductCategory(input: $input) {
          success
          message
          category {
            id
            name
            description
            slug
            parentId
            isActive
            shopId
            productCount
            createdAt
            updatedAt
          }
        }
      }
    `;

    const result = await gqlRequest<{ createProductCategory: {
      success: boolean;
      message: string;
      category?: {
        id: string;
        name: string;
        description?: string;
        slug: string;
        parentId?: string;
        isActive: boolean;
        shopId?: string;
        productCount: number;
        createdAt: string;
        updatedAt: string;
      };
    } }>(mutation, { input });

    return result.createProductCategory;
  },

  // Payment Provider functions
  async getPaymentProviders(filter?: {
    search?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPaymentProviders($filter: PaymentProviderFilterInput, $pagination: PaginationInput) {
        paymentProviders(filter: $filter, pagination: $pagination) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          paymentMethods {
            id
            name
            type
          }
          payments {
            id
            amount
            status
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ paymentProviders: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      paymentMethods: Array<{
        id: string;
        name: string;
        type: string;
      }>;
      payments: Array<{
        id: string;
        amount: number;
        status: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.paymentProviders || [];
  },

  async getPaymentProvider(id: string): Promise<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
    }>;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetPaymentProvider($id: ID!) {
        paymentProvider(id: $id) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          paymentMethods {
            id
            name
            type
          }
          payments {
            id
            amount
            status
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ paymentProvider: {
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      paymentMethods: Array<{
        id: string;
        name: string;
        type: string;
      }>;
      payments: Array<{
        id: string;
        amount: number;
        status: string;
      }>;
      createdAt: string;
      updatedAt: string;
    } | null }>(query, { id });

    return result.paymentProvider;
  },

  // Payment Method functions
  async getPaymentMethods(filter?: {
    search?: string;
    providerId?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    providerId: string;
    isActive: boolean;
    processingFeeRate?: number;
    fixedFee?: number;
    provider: {
      id: string;
      name: string;
      type: string;
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPaymentMethods($filter: PaymentMethodFilterInput, $pagination: PaginationInput) {
        paymentMethods(filter: $filter, pagination: $pagination) {
          id
          name
          type
          providerId
          isActive
          processingFeeRate
          fixedFee
          provider {
            id
            name
            type
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
      providerId: string;
      isActive: boolean;
      processingFeeRate?: number;
      fixedFee?: number;
      provider: {
        id: string;
        name: string;
        type: string;
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.paymentMethods || [];
  },

  // Payment functions
  async getPayments(filter?: {
    search?: string;
    orderId?: string;
    status?: string;
    providerId?: string;
    paymentMethodId?: string;
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    orderId?: string;
    amount: number;
    status: string;
    transactionId?: string;
    failureReason?: string;
    refundAmount?: number;
    currency: {
      id: string;
      code: string;
      name: string;
      symbol: string;
    };
    paymentMethod: {
      id: string;
      name: string;
      type: string;
      provider: {
        id: string;
        name: string;
        type: string;
      };
    };
    provider: {
      id: string;
      name: string;
      type: string;
    };
    order?: {
      id: string;
      customerName: string;
      customerEmail: string;
      totalAmount: number;
      shop: {
        id: string;
        name: string;
      };
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPayments($filter: PaymentFilterInput, $pagination: PaginationInput) {
        payments(filter: $filter, pagination: $pagination) {
          id
          orderId
          amount
          status
          transactionId
          failureReason
          refundAmount
          currency {
            id
            code
            name
            symbol
          }
          paymentMethod {
            id
            name
            type
            provider {
              id
              name
              type
            }
          }
          provider {
            id
            name
            type
          }
          order {
            id
            customerName
            customerEmail
            totalAmount
            shop {
              id
              name
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ payments: Array<{
      id: string;
      orderId?: string;
      amount: number;
      status: string;
      transactionId?: string;
      failureReason?: string;
      refundAmount?: number;
      currency: {
        id: string;
        code: string;
        name: string;
        symbol: string;
      };
      paymentMethod: {
        id: string;
        name: string;
        type: string;
        provider: {
          id: string;
          name: string;
          type: string;
        };
      };
      provider: {
        id: string;
        name: string;
        type: string;
      };
      order?: {
        id: string;
        customerName: string;
        customerEmail: string;
        totalAmount: number;
        shop: {
          id: string;
          name: string;
        };
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.payments || [];
  },

  async createPaymentProvider(input: {
    name: string;
    type: string;
    isActive?: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
  }): Promise<{
    success: boolean;
    message: string;
    provider?: {
      id: string;
      name: string;
      type: string;
      isActive: boolean;
    };
  }> {
    const mutation = `
      mutation CreatePaymentProvider($input: CreatePaymentProviderInput!) {
        createPaymentProvider(input: $input) {
          success
          message
          provider {
            id
            name
            type
            isActive
          }
        }
      }
    `;

    const result = await gqlRequest<{ createPaymentProvider: {
      success: boolean;
      message: string;
      provider?: {
        id: string;
        name: string;
        type: string;
        isActive: boolean;
      };
    } }>(mutation, { input });

    return result.createPaymentProvider;
  },

  // Shipping functions
  async getShippingProviders(filter?: {
    search?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    trackingUrl?: string;
    shippingMethods: Array<{
      id: string;
      name: string;
      description?: string;
      isActive: boolean;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      trackingEnabled: boolean;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingProviders($filter: ShippingProviderFilterInput, $pagination: PaginationInput) {
        shippingProviders(filter: $filter, pagination: $pagination) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          trackingUrl
          shippingMethods {
            id
            name
            description
            isActive
            estimatedDaysMin
            estimatedDaysMax
            trackingEnabled
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        type?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shippingProviders: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      trackingUrl?: string;
      shippingMethods: Array<{
        id: string;
        name: string;
        description?: string;
        isActive: boolean;
        estimatedDaysMin?: number;
        estimatedDaysMax?: number;
        trackingEnabled: boolean;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shippingProviders || [];
  },

  async getShippingMethods(filter?: {
    search?: string;
    providerId?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    providerId: string;
    isActive: boolean;
    estimatedDaysMin?: number;
    estimatedDaysMax?: number;
    trackingEnabled: boolean;
    provider: {
      id: string;
      name: string;
      type: string;
    };
    shippingRates: Array<{
      id: string;
      baseRate: number;
      minWeight?: number;
      maxWeight?: number;
      shippingZone: {
        id: string;
        name: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingMethods($filter: ShippingMethodFilterInput, $pagination: PaginationInput) {
        shippingMethods(filter: $filter, pagination: $pagination) {
          id
          name
          description
          providerId
          isActive
          estimatedDaysMin
          estimatedDaysMax
          trackingEnabled
          provider {
            id
            name
            type
          }
          shippingRates {
            id
            baseRate
            minWeight
            maxWeight
            shippingZone {
              id
              name
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        providerId?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shippingMethods: Array<{
      id: string;
      name: string;
      description?: string;
      providerId: string;
      isActive: boolean;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      trackingEnabled: boolean;
      provider: {
        id: string;
        name: string;
        type: string;
      };
      shippingRates: Array<{
        id: string;
        baseRate: number;
        minWeight?: number;
        maxWeight?: number;
        shippingZone: {
          id: string;
          name: string;
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shippingMethods || [];
  },

  async createShippingProvider(input: {
    name: string;
    type: string;
    isActive?: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    trackingUrl?: string;
  }): Promise<{
    success: boolean;
    message: string;
    provider?: {
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      trackingUrl?: string;
    };
  }> {
    const mutation = `
      mutation CreateShippingProvider($input: CreateShippingProviderInput!) {
        createShippingProvider(input: $input) {
          success
          message
          provider {
            id
            name
            type
            isActive
            apiKey
            secretKey
            webhookUrl
            trackingUrl
          }
        }
      }
    `;

    const result = await gqlRequest<{ createShippingProvider: {
      success: boolean;
      message: string;
      provider?: {
        id: string;
        name: string;
        type: string;
        isActive: boolean;
        apiKey?: string;
        secretKey?: string;
        webhookUrl?: string;
        trackingUrl?: string;
      };
    } }>(mutation, { input });

    return result.createShippingProvider;
  },

  async createShippingMethod(input: {
    name: string;
    description?: string;
    providerId: string;
    isActive?: boolean;
    estimatedDaysMin?: number;
    estimatedDaysMax?: number;
    trackingEnabled?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    method?: {
      id: string;
      name: string;
      description?: string;
      providerId: string;
      isActive: boolean;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      trackingEnabled: boolean;
    };
  }> {
    const mutation = `
      mutation CreateShippingMethod($input: CreateShippingMethodInput!) {
        createShippingMethod(input: $input) {
          success
          message
          method {
            id
            name
            description
            providerId
            isActive
            estimatedDaysMin
            estimatedDaysMax
            trackingEnabled
          }
        }
      }
    `;

    const result = await gqlRequest<{ createShippingMethod: {
      success: boolean;
      message: string;
      method?: {
        id: string;
        name: string;
        description?: string;
        providerId: string;
        isActive: boolean;
        estimatedDaysMin?: number;
        estimatedDaysMax?: number;
        trackingEnabled: boolean;
      };
    } }>(mutation, { input });

    return result.createShippingMethod;
  },

  async createShippingRate(input: {
    shippingMethodId: string;
    baseRate: number;
    minWeight?: number;
    maxWeight?: number;
    shippingZoneId: string;
  }): Promise<{
    success: boolean;
    message: string;
    rate?: {
      id: string;
      baseRate: number;
      minWeight?: number;
      maxWeight?: number;
      shippingZone: {
        id: string;
        name: string;
      };
    };
  }> {
    const mutation = `
      mutation CreateShippingRate($input: CreateShippingRateInput!) {
        createShippingRate(input: $input) {
          success
          message
          rate {
            id
            baseRate
            minWeight
            maxWeight
            shippingZone {
              id
              name
            }
          }
        }
      }
    `;

    const result = await gqlRequest<{ createShippingRate: {
      success: boolean;
      message: string;
      rate?: {
        id: string;
        baseRate: number;
        minWeight?: number;
        maxWeight?: number;
        shippingZone: {
          id: string;
          name: string;
        };
      };
    } }>(mutation, { input });

    return result.createShippingRate;
  },

  async updateShippingProvider(input: {
    id: string;
    name?: string;
    type?: string;
    isActive?: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    trackingUrl?: string;
  }): Promise<{
    success: boolean;
    message: string;
    provider?: {
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      trackingUrl?: string;
    };
  }> {
    const mutation = `
      mutation UpdateShippingProvider($input: UpdateShippingProviderInput!) {
        updateShippingProvider(input: $input) {
          success
          message
          provider {
            id
            name
            type
            isActive
            apiKey
            secretKey
            webhookUrl
            trackingUrl
          }
        }
      }
    `;

    const result = await gqlRequest<{ updateShippingProvider: {
      success: boolean;
      message: string;
      provider?: {
        id: string;
        name: string;
        type: string;
        isActive: boolean;
        apiKey?: string;
        secretKey?: string;
        webhookUrl?: string;
        trackingUrl?: string;
      };
    } }>(mutation, { input });

    return result.updateShippingProvider;
  },

  async updateShippingMethod(input: {
    id: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    estimatedDaysMin?: number;
    estimatedDaysMax?: number;
    trackingEnabled?: boolean;
  }): Promise<{
    success: boolean;
    message: string;
    method?: {
      id: string;
      name: string;
      description?: string;
      providerId: string;
      isActive: boolean;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      trackingEnabled: boolean;
    };
  }> {
    const mutation = `
      mutation UpdateShippingMethod($input: UpdateShippingMethodInput!) {
        updateShippingMethod(input: $input) {
          success
          message
          method {
            id
            name
            description
            providerId
            isActive
            estimatedDaysMin
            estimatedDaysMax
            trackingEnabled
          }
        }
      }
    `;

    const result = await gqlRequest<{ updateShippingMethod: {
      success: boolean;
      message: string;
      method?: {
        id: string;
        name: string;
        description?: string;
        providerId: string;
        isActive: boolean;
        estimatedDaysMin?: number;
        estimatedDaysMax?: number;
        trackingEnabled: boolean;
      };
    } }>(mutation, { input });

    return result.updateShippingMethod;
  },

  async updateShippingRate(input: {
    id: string;
    baseRate?: number;
    minWeight?: number;
    maxWeight?: number;
  }): Promise<{
    success: boolean;
    message: string;
    rate?: {
      id: string;
      baseRate: number;
      minWeight?: number;
      maxWeight?: number;
      shippingZone: {
        id: string;
        name: string;
      };
    };
  }> {
    const mutation = `
      mutation UpdateShippingRate($input: UpdateShippingRateInput!) {
        updateShippingRate(input: $input) {
          success
          message
          rate {
            id
            baseRate
            minWeight
            maxWeight
            shippingZone {
              id
              name
            }
          }
        }
      }
    `;

    const result = await gqlRequest<{ updateShippingRate: {
      success: boolean;
      message: string;
      rate?: {
        id: string;
        baseRate: number;
        minWeight?: number;
        maxWeight?: number;
        shippingZone: {
          id: string;
          name: string;
        };
      };
    } }>(mutation, { input });

    return result.updateShippingRate;
  },

  async deleteShippingProvider(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteShippingProvider($id: ID!) {
        deleteShippingProvider(id: $id) {
          success
          message
        }
      }
    `;

    const result = await gqlRequest<{ deleteShippingProvider: {
      success: boolean;
      message: string;
    } }>(mutation, { id });

    return result.deleteShippingProvider;
  },

  async deleteShippingMethod(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteShippingMethod($id: ID!) {
        deleteShippingMethod(id: $id) {
          success
          message
        }
      }
    `;

    const result = await gqlRequest<{ deleteShippingMethod: {
      success: boolean;
      message: string;
    } }>(mutation, { id });

    return result.deleteShippingMethod;
  },

  async deleteShippingRate(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteShippingRate($id: ID!) {
        deleteShippingRate(id: $id) {
          success
          message
        }
      }
    `;

    const result = await gqlRequest<{ deleteShippingRate: {
      success: boolean;
      message: string;
    } }>(mutation, { id });

    return result.deleteShippingRate;
  },

  async getShippingZones(filter?: {
    search?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    countries: Array<{
      id: string;
      name: string;
      code: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingZones($filter: ShippingZoneFilterInput, $pagination: PaginationInput) {
        shippingZones(filter: $filter, pagination: $pagination) {
          id
          name
          description
          isActive
          countries {
            id
            name
            code
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ shippingZones: Array<{
      id: string;
      name: string;
      description?: string;
      isActive: boolean;
      countries: Array<{
        id: string;
        name: string;
        code: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.shippingZones || [];
  },

  async createShippingZone(input: {
    name: string;
    description?: string;
    isActive?: boolean;
    countryIds: string[];
  }): Promise<{
    success: boolean;
    message: string;
    zone?: {
      id: string;
      name: string;
      description?: string;
      isActive: boolean;
      countries: Array<{
        id: string;
        name: string;
        code: string;
      }>;
    };
  }> {
    const mutation = `
      mutation CreateShippingZone($input: CreateShippingZoneInput!) {
        createShippingZone(input: $input) {
          success
          message
          zone {
            id
            name
            description
            isActive
            countries {
              id
              name
              code
            }
          }
        }
      }
    `;

    const result = await gqlRequest<{ createShippingZone: {
      success: boolean;
      message: string;
      zone?: {
        id: string;
        name: string;
        description?: string;
        isActive: boolean;
        countries: Array<{
          id: string;
          name: string;
          code: string;
        }>;
      };
    } }>(mutation, { input });

    return result.createShippingZone;
  },

  async updateShippingZone(input: {
    id: string;
    name?: string;
    description?: string;
    isActive?: boolean;
    countryIds?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    zone?: {
      id: string;
      name: string;
      description?: string;
      isActive: boolean;
      countries: Array<{
        id: string;
        name: string;
        code: string;
      }>;
    };
  }> {
    const mutation = `
      mutation UpdateShippingZone($input: UpdateShippingZoneInput!) {
        updateShippingZone(input: $input) {
          success
          message
          zone {
            id
            name
            description
            isActive
            countries {
              id
              name
              code
            }
          }
        }
      }
    `;

    const result = await gqlRequest<{ updateShippingZone: {
      success: boolean;
      message: string;
      zone?: {
        id: string;
        name: string;
        description?: string;
        isActive: boolean;
        countries: Array<{
          id: string;
          name: string;
          code: string;
        }>;
      };
    } }>(mutation, { input });

    return result.updateShippingZone;
  },

  async deleteShippingZone(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteShippingZone($id: ID!) {
        deleteShippingZone(id: $id) {
          success
          message
        }
      }
    `;

    const result = await gqlRequest<{ deleteShippingZone: {
      success: boolean;
      message: string;
    } }>(mutation, { id });

    return result.deleteShippingZone;
  },

  async getCountries(): Promise<Array<{
    id: string;
    name: string;
    code: string;
  }>> {
    const query = `
      query GetCountries {
        countries {
          id
          name
          code
        }
      }
    `;

    const result = await gqlRequest<{ countries: Array<{
      id: string;
      name: string;
      code: string;
    }> }>(query);

    return result.countries || [];
  },

  async getCurrencies(): Promise<Array<{
    id: string;
    code: string;
    name: string;
    symbol: string;
  }>> {
    const query = `
      query GetCurrencies {
        currencies {
          id
          code
          name
          symbol
        }
      }
    `;

    const result = await gqlRequest<{ currencies: Array<{
      id: string;
      code: string;
      name: string;
      symbol: string;
    }> }>(query);

    return result.currencies || [];
  },

  async getLanguages(): Promise<Array<{
    id: string;
    code: string;
    name: string;
    isActive: boolean;
  }>> {
    const query = `
      query GetLanguages {
        languages {
          id
          code
          name
          isActive
        }
      }
    `;

    const result = await gqlRequest<{ languages: Array<{
      id: string;
      code: string;
      name: string;
      isActive: boolean;
    }> }>(query);

    return result.languages || [];
  },

  async getTimezones(): Promise<Array<{
    id: string;
    name: string;
    offset: string;
  }>> {
    const query = `
      query GetTimezones {
        timezones {
          id
          name
          offset
        }
      }
    `;

    const result = await gqlRequest<{ timezones: Array<{
      id: string;
      name: string;
      offset: string;
    }> }>(query);

    return result.timezones || [];
  },

  async getPaymentProviders(filter?: {
    search?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPaymentProviders($filter: PaymentProviderFilterInput, $pagination: PaginationInput) {
        paymentProviders(filter: $filter, pagination: $pagination) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        type?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ paymentProviders: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.paymentProviders || [];
  },

  async createPaymentMethod(input: {
    name: string;
    type: string;
    providerId: string;
    isActive?: boolean;
    processingFeeRate?: number;
    fixedFee?: number;
  }): Promise<{
    success: boolean;
    message: string;
    method?: {
      id: string;
      name: string;
      type: string;
      providerId: string;
      isActive: boolean;
      processingFeeRate?: number;
      fixedFee?: number;
    };
  }> {
    const mutation = `
      mutation CreatePaymentMethod($input: CreatePaymentMethodInput!) {
        createPaymentMethod(input: $input) {
          success
          message
          method {
            id
            name
            type
            providerId
            isActive
            processingFeeRate
            fixedFee
          }
        }
      }
    `;

    const result = await gqlRequest<{ createPaymentMethod: {
      success: boolean;
      message: string;
      method?: {
        id: string;
        name: string;
        type: string;
        providerId: string;
        isActive: boolean;
        processingFeeRate?: number;
        fixedFee?: number;
      };
    } }>(mutation, { input });

    return result.createPaymentMethod;
  },

  async updatePaymentMethod(input: {
    id: string;
    name?: string;
    type?: string;
    isActive?: boolean;
    processingFeeRate?: number;
    fixedFee?: number;
  }): Promise<{
    success: boolean;
    message: string;
    method?: {
      id: string;
      name: string;
      type: string;
      providerId: string;
      isActive: boolean;
      processingFeeRate?: number;
      fixedFee?: number;
    };
  }> {
    const mutation = `
      mutation UpdatePaymentMethod($input: UpdatePaymentMethodInput!) {
        updatePaymentMethod(input: $input) {
          success
          message
          method {
            id
            name
            type
            providerId
            isActive
            processingFeeRate
            fixedFee
          }
        }
      }
    `;

    const result = await gqlRequest<{ updatePaymentMethod: {
      success: boolean;
      message: string;
      method?: {
        id: string;
        name: string;
        type: string;
        providerId: string;
        isActive: boolean;
        processingFeeRate?: number;
        fixedFee?: number;
      };
    } }>(mutation, { input });

    return result.updatePaymentMethod;
  },

  async deletePaymentMethod(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeletePaymentMethod($id: ID!) {
        deletePaymentMethod(id: $id) {
          success
          message
        }
      }
    `;

    const result = await gqlRequest<{ deletePaymentMethod: {
      success: boolean;
      message: string;
    } }>(mutation, { id });

    return result.deletePaymentMethod;
  },

  async getPaymentProviderTypes(): Promise<Array<string>> {
    const query = `
      query GetPaymentProviderTypes {
        paymentProviderTypes
      }
    `;

    const result = await gqlRequest<{ paymentProviderTypes: Array<string> }>(query);

    return result.paymentProviderTypes || [];
  },

  async getPaymentMethodTypes(): Promise<Array<string>> {
    const query = `
      query GetPaymentMethodTypes {
        paymentMethodTypes
      }
    `;

    const result = await gqlRequest<{ paymentMethodTypes: Array<string> }>(query);

    return result.paymentMethodTypes || [];
  },

  async getShippingProviderTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingProviderTypes {
        shippingProviderTypes
      }
    `;

    const result = await gqlRequest<{ shippingProviderTypes: Array<string> }>(query);

    return result.shippingProviderTypes || [];
  },

  async getShippingMethodTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingMethodTypes {
        shippingMethodTypes
      }
    `;

    const result = await gqlRequest<{ shippingMethodTypes: Array<string> }>(query);

    return result.shippingMethodTypes || [];
  },

  async getShippingZoneTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingZoneTypes {
        shippingZoneTypes
      }
    `;

    const result = await gqlRequest<{ shippingZoneTypes: Array<string> }>(query);

    return result.shippingZoneTypes || [];
  },

  async getShippingRateTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingRateTypes {
        shippingRateTypes
      }
    `;

    const result = await gqlRequest<{ shippingRateTypes: Array<string> }>(query);

    return result.shippingRateTypes || [];
  },

  async getShippingCarrierTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingCarrierTypes {
        shippingCarrierTypes
      }
    `;

    const result = await gqlRequest<{ shippingCarrierTypes: Array<string> }>(query);

    return result.shippingCarrierTypes || [];
  },

  async getShippingServiceTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingServiceTypes {
        shippingServiceTypes
      }
    `;

    const result = await gqlRequest<{ shippingServiceTypes: Array<string> }>(query);

    return result.shippingServiceTypes || [];
  },

  async getShippingPackageTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingPackageTypes {
        shippingPackageTypes
      }
    `;

    const result = await gqlRequest<{ shippingPackageTypes: Array<string> }>(query);

    return result.shippingPackageTypes || [];
  },

  async getShippingLabelTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingLabelTypes {
        shippingLabelTypes
      }
    `;

    const result = await gqlRequest<{ shippingLabelTypes: Array<string> }>(query);

    return result.shippingLabelTypes || [];
  },

  async getShippingTrackingTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingTrackingTypes {
        shippingTrackingTypes
      }
    `;

    const result = await gqlRequest<{ shippingTrackingTypes: Array<string> }>(query);

    return result.shippingTrackingTypes || [];
  },

  async getShippingReturnTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingReturnTypes {
        shippingReturnTypes
      }
    `;

    const result = await gqlRequest<{ shippingReturnTypes: Array<string> }>(query);

    return result.shippingReturnTypes || [];
  },

  async getShippingExchangeTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingExchangeTypes {
        shippingExchangeTypes
      }
    `;

    const result = await gqlRequest<{ shippingExchangeTypes: Array<string> }>(query);

    return result.shippingExchangeTypes || [];
  },

  async getShippingRefundTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingRefundTypes {
        shippingRefundTypes
      }
    `;

    const result = await gqlRequest<{ shippingRefundTypes: Array<string> }>(query);

    return result.shippingRefundTypes || [];
  },

  async getShippingCancellationTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingCancellationTypes {
        shippingCancellationTypes
      }
    `;

    const result = await gqlRequest<{ shippingCancellationTypes: Array<string> }>(query);

    return result.shippingCancellationTypes || [];
  },

  async getShippingDiscountTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingDiscountTypes {
        shippingDiscountTypes
      }
    `;

    const result = await gqlRequest<{ shippingDiscountTypes: Array<string> }>(query);

    return result.shippingDiscountTypes || [];
  },

  async getShippingTaxTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingTaxTypes {
        shippingTaxTypes
      }
    `;

    const result = await gqlRequest<{ shippingTaxTypes: Array<string> }>(query);

    return result.shippingTaxTypes || [];
  },

  async getShippingFeeTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingFeeTypes {
        shippingFeeTypes
      }
    `;

    const result = await gqlRequest<{ shippingFeeTypes: Array<string> }>(query);

    return result.shippingFeeTypes || [];
  },

  async getShippingInsuranceTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingInsuranceTypes {
        shippingInsuranceTypes
      }
    `;

    const result = await gqlRequest<{ shippingInsuranceTypes: Array<string> }>(query);

    return result.shippingInsuranceTypes || [];
  },

  async getShippingCustomsTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingCustomsTypes {
        shippingCustomsTypes
      }
    `;

    const result = await gqlRequest<{ shippingCustomsTypes: Array<string> }>(query);

    return result.shippingCustomsTypes || [];
  },

  async getShippingDutyTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingDutyTypes {
        shippingDutyTypes
      }
    `;

    const result = await gqlRequest<{ shippingDutyTypes: Array<string> }>(query);

    return result.shippingDutyTypes || [];
  },

  async getShippingRestrictionTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingRestrictionTypes {
        shippingRestrictionTypes
      }
    `;

    const result = await gqlRequest<{ shippingRestrictionTypes: Array<string> }>(query);

    return result.shippingRestrictionTypes || [];
  },

  async getShippingComplianceTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingComplianceTypes {
        shippingComplianceTypes
      }
    `;

    const result = await gqlRequest<{ shippingComplianceTypes: Array<string> }>(query);

    return result.shippingComplianceTypes || [];
  },

  async getShippingDocumentTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingDocumentTypes {
        shippingDocumentTypes
      }
    `;

    const result = await gqlRequest<{ shippingDocumentTypes: Array<string> }>(query);

    return result.shippingDocumentTypes || [];
  },

  async getShippingNotificationTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingNotificationTypes {
        shippingNotificationTypes
      }
    `;

    const result = await gqlRequest<{ shippingNotificationTypes: Array<string> }>(query);

    return result.shippingNotificationTypes || [];
  },

  async getShippingDeliveryTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingDeliveryTypes {
        shippingDeliveryTypes
      }
    `;

    const result = await gqlRequest<{ shippingDeliveryTypes: Array<string> }>(query);

    return result.shippingDeliveryTypes || [];
  },

  async getShippingPickupTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingPickupTypes {
        shippingPickupTypes
      }
    `;

    const result = await gqlRequest<{ shippingPickupTypes: Array<string> }>(query);

    return result.shippingPickupTypes || [];
  },

  async getShippingLocationTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingLocationTypes {
        shippingLocationTypes
      }
    `;

    const result = await gqlRequest<{ shippingLocationTypes: Array<string> }>(query);

    return result.shippingLocationTypes || [];
  },

  async getShippingInventoryTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingInventoryTypes {
        shippingInventoryTypes
      }
    `;

    const result = await gqlRequest<{ shippingInventoryTypes: Array<string> }>(query);

    return result.shippingInventoryTypes || [];
  },

  async getShippingWarehouseTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingWarehouseTypes {
        shippingWarehouseTypes
      }
    `;

    const result = await gqlRequest<{ shippingWarehouseTypes: Array<string> }>(query);

    return result.shippingWarehouseTypes || [];
  },

  async getShippingFulfillmentTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingFulfillmentTypes {
        shippingFulfillmentTypes
      }
    `;

    const result = await gqlRequest<{ shippingFulfillmentTypes: Array<string> }>(query);

    return result.shippingFulfillmentTypes || [];
  },

  async getShippingOrderTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingOrderTypes {
        shippingOrderTypes
      }
    `;

    const result = await gqlRequest<{ shippingOrderTypes: Array<string> }>(query);

    return result.shippingOrderTypes || [];
  },

  async getShippingCustomerTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingCustomerTypes {
        shippingCustomerTypes
      }
    `;

    const result = await gqlRequest<{ shippingCustomerTypes: Array<string> }>(query);

    return result.shippingCustomerTypes || [];
  },

  async getShippingAddressTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingAddressTypes {
        shippingAddressTypes
      }
    `;

    const result = await gqlRequest<{ shippingAddressTypes: Array<string> }>(query);

    return result.shippingAddressTypes || [];
  },

  async getShippingContactTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingContactTypes {
        shippingContactTypes
      }
    `;

    const result = await gqlRequest<{ shippingContactTypes: Array<string> }>(query);

    return result.shippingContactTypes || [];
  },

  async getShippingProductTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingProductTypes {
        shippingProductTypes
      }
    `;

    const result = await gqlRequest<{ shippingProductTypes: Array<string> }>(query);

    return result.shippingProductTypes || [];
  },

  async getShippingSKUTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingSKUTypes {
        shippingSKUTypes
      }
    `;

    const result = await gqlRequest<{ shippingSKUTypes: Array<string> }>(query);

    return result.shippingSKUTypes || [];
  },

  async getShippingVariantTypes(): Promise<Array<string>> {
    const query = `
      query GetShippingVariantTypes {
        shippingVariantTypes
      }
    `;

    const result = await gqlRequest<{ shippingVariantTypes: Array<string> }>(query);

    return result.shippingVariantTypes || [];
  },

import { updateCMSSection } from './cms-update';
import { deletePageWithSections } from './cms-page-delete';
import { optimizedQueries } from './graphql-optimizations';

// Import form types
import {
  FormBase,
  FormStepBase,
  FormFieldBase,
  FormSubmissionBase,
  FormResult,
  FormStepResult,
  FormFieldResult,
  FormSubmissionResult,
  FormInput,
  FormStepInput,
  FormFieldInput,
  FormSubmissionInput,
  FormSubmissionStats
} from '@/types/forms';

import { Blog, Post } from '@/types/blog';

// Import calendar types
import {
  StaffProfileInput,
  CalendarStaffProfile,
  CalendarUser,
  CalendarLocation,
  CalendarStaffScheduleInput
} from '@/types/calendar';

// Función simple para realizar solicitudes GraphQL
export async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  timeout: number = 10000 // Default 10 second timeout
): Promise<T> {
  // Generar un ID único para esta solicitud para facilitar el seguimiento en logs
  const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 gqlRequest [${requestId}] - Query: ${query.substring(0, 50).replace(/\s+/g, ' ')}...`);
      console.log(`🔍 gqlRequest [${requestId}] - Variables: ${JSON.stringify(variables).substring(0, 100)}...`);
      console.log(`🔍 gqlRequest [${requestId}] - Timeout: ${timeout}ms`);
    }
    
    // Create an AbortController to handle request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ Request timeout: ${timeout}ms exceeded for [${requestId}]`);
      controller.abort();
    }, timeout);

    // Check if this is a public operation that doesn't require authentication
    const isPublicOperation = (
      query.includes('getPageBySlug') || 
      query.includes('getSectionComponents') || 
      query.includes('submitForm') || 
      query.includes('getMenus') ||
      query.includes('formBySlug') ||
      query.includes('getFormById') ||
      query.includes('form(id:') ||
      query.includes('forms') ||
      query.includes('formFields') ||
      query.includes('formSteps') ||
      query.includes('formStep') ||
      query.includes('GetForm') ||
      query.includes('FormStep') ||
      query.includes('FormField') ||
      query.includes('menus') ||
      query.includes('getAllCMSPages') ||
      query.includes('GetBlogs') ||
      query.includes('GetBlog') ||
      query.includes('GetPosts') ||
      query.includes('GetPostBySlug') ||
      query.includes('posts') ||
      query.includes('blog') ||
      query.includes('postBySlug')
    );

    // Get session token from cookies if available and not a public operation
    const getToken = () => {
      if (!isPublicOperation && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('session-token='));
        if (tokenCookie) {
          return tokenCookie.split('=')[1].trim();
        }
      }
      return null;
    };
    
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Determine the GraphQL endpoint URL
    const getGraphQLUrl = () => {
      // If we're on the server (no window object), use absolute URL
      if (typeof window === 'undefined') {
        // In production, use the deployment URL or localhost for development
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NODE_ENV === 'production'
          ? 'https://your-domain.com' // Replace with your actual domain
          : 'http://localhost:3000';
        return `${baseUrl}/api/graphql`;
      }
      // On the client, use relative URL
      return '/api/graphql';
    };
    
    const graphqlUrl = getGraphQLUrl();
    
    try {
      console.log(`🔄 Starting GraphQL request [${requestId}] to ${graphqlUrl}`);
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: controller.signal,
        // Add cache control to improve performance for repeated queries
        cache: 'default',
      });
      
      // Clear the timeout as the request completed
      clearTimeout(timeoutId);
      
      // Handle non-ok responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GraphQL HTTP error ${response.status} for [${requestId}]:`, errorText);
        
        // For public operations, return empty result instead of throwing
        if (isPublicOperation) {
          console.warn(`HTTP error in public operation [${requestId}], returning empty result`);
          return {} as T;
        }
        
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      console.log(`✅ GraphQL request completed [${requestId}]`);
      const responseData = await response.json();
      
      // Check for GraphQL errors
      if (responseData.errors && responseData.errors.length > 0) {
        const errorMessages = responseData.errors.map((e: { message: string }) => e.message).join(', ');
        console.error(`GraphQL errors for [${requestId}]:`, errorMessages);
        
        // For public operations, handle auth errors gracefully
        if (isPublicOperation && (errorMessages.includes('Not authenticated') || errorMessages.includes('Unauthorized'))) {
          console.warn(`Authentication error in public operation [${requestId}], continuing with partial data`);
          // Return partial data if available, or empty object
          return (responseData.data || {}) as T;
        }
        
        // For form operations, don't throw to prevent UI breakage
        if ((query.includes('form') || query.includes('Form')) && 
            (errorMessages.includes('Not authenticated') || errorMessages.includes('Unauthorized'))) {
          console.warn(`Form auth error [${requestId}], returning empty result`);
          return {} as T;
        }
        
        throw new Error(`GraphQL errors: ${errorMessages}`);
      }
      
      // Return the data property or the entire response if data is not present
      return responseData.data || responseData as T;
    } catch (error) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // Special handling for abort errors (timeouts)
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(`⚠️ Request timed out after ${timeout}ms [${requestId}]`);
        throw new Error(`La solicitud GraphQL excedió el tiempo límite de ${timeout}ms`);
      }
      
      // For public operations, swallow errors and return empty result
      if (isPublicOperation) {
        console.warn(`Error in public operation [${requestId}], returning empty result:`, error);
        return {} as T;
      }
      
      throw error;
    }
  } catch (error) {
    // Format the error for better debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`GraphQL error [${requestId}]:`, errorMessage);
    
    // Check if this is a query about forms and return empty data instead of throwing
    if (query.toLowerCase().includes('form')) {
      console.warn(`Form query error, returning empty result:`, errorMessage);
      return {} as T;
    }
    
    // Rethrow with more context
    throw new Error(`Error en solicitud GraphQL: ${errorMessage}`);
  }
}

// Interfaz para los componentes del CMS
export interface CMSComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

// Estructura de un componente de la base de datos
export interface CMSComponentDB {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  icon?: string;
  schema?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Estructura de una página CMS
export interface CMSPageDB {
  id: string;
  title: string;
  slug: string;
  description?: string;
  template?: string;
  isPublished: boolean;
  publishDate?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  pageType: string;
  locale?: string; // Add locale property
  createdAt: string;
  updatedAt: string;
  sections?: Array<{id: string; order?: number}>;
}

// Input para crear/actualizar componentes
export interface CMSComponentInput {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  schema?: Record<string, unknown>;
  icon?: string;
}

// Resultado de operaciones con componentes
export interface CMSComponentResult {
  success: boolean;
  message: string;
  component: CMSComponentDB | null;
}

// Actualizar según la nueva estructura de relaciones
export interface CMSSectionComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface CMSSectionResult {
  components: CMSSectionComponent[];
  lastUpdated: string | null;
}

// Definir la estructura de respuesta esperada para las importaciones dinámicas
interface SectionComponentsResponse {
  getSectionComponents?: {
    components: CMSComponent[];
    lastUpdated: string | null;
  };
}

// Interfaces for page data
export interface PageData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  template?: string;
  isPublished: boolean;
  publishDate?: string | null;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  parentId?: string | null;
  order?: number;
  pageType: string;
  locale?: string;
  scrollType?: 'normal' | 'smooth';
  createdAt?: string;
  updatedAt?: string;
  isDefault?: boolean;
  sections?: Array<{
    id: string;
    sectionId: string;
    name?: string;
    order: number;
    // Otra metadata relevante
  }>; // Adaptado a la estructura de CMSSection
  seo?: {
    title?: string; // Add title (same as metaTitle)
    description?: string; // Add description (same as metaDescription)
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
}

export interface SectionData {
  id: string;
  title?: string;
  order: number;
  components: CMSComponent[];
  backgroundImage?: string;
  backgroundType?: string;
}

// Generic GraphQL response type
interface GraphQLResponse<T> {
  data?: {
    [key: string]: T;
  };
  errors?: Array<{ message: string }>;
}


// Función de utilidad para validar la pertenencia de secciones
export const validateSectionOwnership = (sectionId: string, pageId: string): boolean => {
  return sectionId.startsWith(`page-${pageId}-`);
};


// Get a page by its slug
async function getPageBySlug(slug: string): Promise<PageData | null> {
  try {
    console.log(`[getPageBySlug] Attempting to fetch page with slug: "${slug}"`);
    
    // Check cache first
    const cacheKey = `page_slug_${slug}`;
    const cachedPage = getCachedResponse<PageData>(cacheKey);
    
    if (cachedPage) {
      console.log(`[getPageBySlug] Found cached page: ${cachedPage.title}`);
      return cachedPage;
    }
    
    const query = `
      query GetPageBySlug($slug: String!) {
        getPageBySlug(slug: $slug) {
          id
          title
          slug
          description
          template
          isPublished
          publishDate
          featuredImage
          metaTitle
          metaDescription
          parentId
          order
          pageType
          locale
          scrollType
          isDefault
          createdAt
          updatedAt
          sections {
            id
            sectionId
            name
          }
          seo {
            title
            description
            keywords
            ogTitle
            ogDescription
            ogImage
            twitterTitle
            twitterDescription
            twitterImage
            canonicalUrl
            structuredData
          }
        }
      }
    `;

    const variables = { slug };
    
    console.log(`[getPageBySlug] Executing GraphQL query with variables:`, variables);
    const result = await gqlRequest<{ 
      getPageBySlug?: PageData; 
      data?: { getPageBySlug: PageData };
      errors?: Array<{ message: string }>
    }>(query, variables);
    
    console.log(`[getPageBySlug] GraphQL result:`, result);
    
    // Check for errors in the response
    if (result.errors && result.errors.length > 0) {
      console.error(`[getPageBySlug] GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
      return null;
    }
    
    // Try to extract page data from different possible response structures
    let page: PageData | null = null;
    
    // Direct property
    if (result.getPageBySlug) {
      page = result.getPageBySlug;
    } 
    // Nested under data
    else if (result.data?.getPageBySlug) {
      page = result.data.getPageBySlug;
    }
    // Check if data is the top-level property with getPageBySlug inside
    else if (typeof result === 'object' && result !== null && 'data' in result) {
      const data = (result as GraphQLResponse<PageData>).data;
      if (data && typeof data === 'object' && 'getPageBySlug' in data) {
        page = data.getPageBySlug;
      }
    }
    
    // Found a page
    if (page && page.id) {
      console.log(`[getPageBySlug] Found page: ID=${page.id}, Title="${page.title}"`);
      
      // Filtrar las secciones con sectionId null para evitar errores GraphQL
      if (page.sections && Array.isArray(page.sections)) {
        page.sections = page.sections.filter(section => 
          section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
        );
      }
      
      // Ensure there's always at least an empty SEO object
      if (!page.seo) {
        page.seo = {};
      }
      
      // Cache the page data
      setCachedResponse(cacheKey, page);
      
      return page;
    }
    
    // Try to find by ID as a fallback (less verbose)
    try {
      const listQuery = `
        query GetAllPages {
          getAllCMSPages {
            id
            slug
            title
          }
        }
      `;
      const listResult = await gqlRequest<{ 
        getAllCMSPages: Array<{ id: string; slug: string; title: string }> 
      }>(listQuery);
      
      // Check different possible structures for the getAllCMSPages result
      let pages: Array<{ id: string; slug: string; title: string }> = [];
      
      if (listResult.getAllCMSPages) {
        pages = listResult.getAllCMSPages;
      } else if (typeof listResult === 'object' && listResult !== null && 'data' in listResult) {
        const data = (listResult as GraphQLResponse<Array<{ id: string; slug: string; title: string }>>).data;
        if (data && typeof data === 'object' && 'getAllCMSPages' in data) {
          pages = data.getAllCMSPages;
        }
      }
      
      // Check if a matching page exists but wasn't returned correctly
      if (pages.length > 0) {
        const matchingPage = pages.find(p => 
          p.slug === slug || 
          p.slug.toLowerCase() === slug.toLowerCase() ||
          p.slug.replace(/-/g, '') === slug.replace(/-/g, '') ||
          p.slug.replace(/-/g, ' ') === slug.replace(/-/g, ' ')
        );
        
        if (matchingPage) {
          // Try to fetch by ID as a fallback
          const foundPage = await getPageById(matchingPage.id);
          if (foundPage) {
            // Cache the page data
            setCachedResponse(cacheKey, foundPage);
            return foundPage;
          }
        }
      }
    } catch (listError) {
      console.error(`Error listing pages:`, listError);
    }
    
    console.log(`[getPageBySlug] No page found with slug: "${slug}"`);
    return null;
  } catch (error) {
    console.error(`[getPageBySlug] Error retrieving page with slug "${slug}":`, error);
    throw error;
  }
}

// Update a page
async function updatePage(id: string, input: {
  title?: string;
  slug?: string;
  description?: string | null;
  template?: string;
  isPublished?: boolean;
  publishDate?: string | null;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  parentId?: string | null;
  order?: number;
  pageType?: string;
  locale?: string;
  isDefault?: boolean;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
  sectionIds?: string[]; // This is used by client code but converted to sections
  sections?: string[]; // This matches the GraphQL schema
}): Promise<{
  success: boolean;
  message: string;
  page: PageData | null;
}> {
  try {
    // Preprocess SEO data for consistency
    const seoData = input.seo || {};
    const titleValue = input.metaTitle || seoData.title;
    const descriptionValue = input.metaDescription || seoData.description;
    
    if (titleValue) {
      if (!seoData.title) seoData.title = titleValue;
      if (!input.metaTitle) input.metaTitle = titleValue;
    }
    
    if (descriptionValue) {
      if (!seoData.description) seoData.description = descriptionValue;
      if (!input.metaDescription) input.metaDescription = descriptionValue;
    }

    // Convert sectionIds to sections format if present
    const inputData = { ...input };
    
    // If sectionIds is provided but sections isn't, move the values
    if (inputData.sectionIds && !inputData.sections) {
      inputData.sections = inputData.sectionIds;
      delete inputData.sectionIds;
    }

    const mutation = `
      mutation UpdatePage($id: ID!, $input: UpdatePageInput!) {
        updatePage(id: $id, input: $input) {
          success
          message
          page {
            id
            title
            slug
            description
            template
            isPublished
            pageType
            locale
            metaTitle
            metaDescription
            featuredImage
            publishDate
            isDefault
            updatedAt
            sections {
              id
              sectionId
              name
              order
            }
            seo {
              title
              description
              keywords
              ogTitle
              ogDescription
              ogImage
              twitterTitle
              twitterDescription
              twitterImage
              canonicalUrl
              structuredData
            }
          }
        }
      }
    `;

    console.log('Updating page with data:', { id, input: inputData });
    const variables = { id, input: inputData };
    const result = await gqlRequest<{ 
      updatePage?: { success: boolean; message: string; page: PageData | null };
      data?: { updatePage: { success: boolean; message: string; page: PageData | null } }
    }>(mutation, variables);
    console.log('Update page result:', result);
    
    // Handle different response structures
    let opResult = null;
    if (result.updatePage) {
      opResult = result.updatePage;
    } else if (result.data?.updatePage) {
      opResult = result.data.updatePage;
    }

    if (opResult && opResult.success && opResult.page) {
      const updatedPageData = opResult.page;
      if (updatedPageData.slug) {
        optimizedQueries.invalidateCache(`page:${updatedPageData.slug}`);
        clearCache(`page_slug_${updatedPageData.slug}`); // local cache
      }
      optimizedQueries.invalidateCache(`page_id:${id}`);
      clearCache(`page_id_${id}`); // local cache

      if (updatedPageData.isDefault && updatedPageData.locale) {
        optimizedQueries.invalidateCache(`default_page_${updatedPageData.locale}`);
        clearCache(`default_page_${updatedPageData.locale}`); // local cache
      }
      // Invalidate related sections if their structure might change or be affected
      if (updatedPageData.sections) {
        updatedPageData.sections.forEach(section => {
          if (section.sectionId) {
            optimizedQueries.invalidateCache(`section:${section.sectionId}`);
            clearCache(`section_components_${section.sectionId}`); // local cache
          }
        });
      }
      optimizedQueries.invalidateCache('allPages'); 
      clearCache('allPages'); // local cache for general page lists
    } else if (opResult && opResult.success) {
      // Page data might not be returned but operation was successful
      // Attempt to invalidate based on input if available
      if (input.slug) {
        optimizedQueries.invalidateCache(`page:${input.slug}`);
        clearCache(`page_slug_${input.slug}`);
      }
      optimizedQueries.invalidateCache(`page_id:${id}`);
      clearCache(`page_id_${id}`);
      if (input.isDefault && input.locale) {
        optimizedQueries.invalidateCache(`default_page_${input.locale}`);
        clearCache(`default_page_${input.locale}`);
      }
      optimizedQueries.invalidateCache('allPages');
      clearCache('allPages');
    }
    
    if (opResult) return opResult;

    return {
      success: false,
      message: 'Failed to update page: Unexpected response format',
      page: null
    };
  } catch (error) {
    console.error('Error updating page:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating page',
      page: null
    };
  }
}

// Get a page by ID
async function getPageById(id: string): Promise<PageData | null> {
  // Check cache first
  const cacheKey = `page_id_${id}`;
  const cachedPage = getCachedResponse<PageData>(cacheKey);
  
  if (cachedPage) {
    console.log(`[getPageById] Found cached page: ID=${id}`);
    return cachedPage;
  }
  
  const GET_PAGE_BY_ID_QUERY = `
    query GetPageById($id: ID!) {
      page(id: $id) {
        id
        title
        slug
        description
        template
        isPublished
        publishDate
        featuredImage
        metaTitle
        metaDescription
        parentId
        order
        pageType
        locale
        scrollType
        isDefault
        createdAt
        updatedAt
        sections {
          id
          sectionId
          name
          order
        }
        seo {
          title
          description
          keywords
          ogTitle
          ogDescription
          ogImage
          twitterTitle
          twitterDescription
          twitterImage
          canonicalUrl
          structuredData
        }
      }
    }
  `;

  try {
    console.log(`[getPageById] Attempting to fetch page with ID: "${id}"`);
    const variables = { id };
    
    const result = await gqlRequest<{ 
      page?: PageData;
      data?: { page: PageData }; // Alternative structure
      errors?: Array<{ message: string }>
    }>(GET_PAGE_BY_ID_QUERY, variables);

    console.log(`[getPageById] GraphQL result for ID "${id}":`, result);

    if (result.errors && result.errors.length > 0) {
      console.error(`[getPageById] GraphQL errors for ID "${id}": ${result.errors.map(e => e.message).join(', ')}`);
      return null;
    }

    let page: PageData | null = null;

    if (result.page) {
      page = result.page;
    } else if (result.data?.page) {
      page = result.data.page;
    }

    if (page && page.id) {
      console.log(`[getPageById] Found page: ID=${page.id}, Title="${page.title}"`);
      
      // Filter sections with null sectionId
      if (page.sections && Array.isArray(page.sections)) {
        page.sections = page.sections.filter(section => 
          section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
        );
      }
      
      // Ensure there's always at least an empty SEO object
      if (!page.seo) {
        page.seo = {};
      }
      
      // Cache the page data
      setCachedResponse(cacheKey, page);
      return page;
    }
    
    console.log(`[getPageById] No page found with ID: "${id}"`);
    return null;
  } catch (error) {
    console.error(`[getPageById] Error retrieving page with ID "${id}":`, error);
    // Do not throw error, just return null as per original behavior of function
    return null;
  }
}

// Get page with detailed section components for preview
export async function getPagePreview(pageData: PageData): Promise<{
  page: PageData;
  sections: Array<{
    id: string;
    title?: string;
    order: number;
    components: CMSComponent[];
  }>;
}> {
  console.log(`Generating preview for page: "${pageData.title}"`);
  
  const sections: Array<{
    id: string;
    title?: string;
    order: number;
    components: CMSComponent[];
  }> = [];
  
  if (!pageData.sections || !Array.isArray(pageData.sections) || pageData.sections.length === 0) {
    console.log(`Page has no sections to preview`);
    return { page: pageData, sections: [] };
  }
  
  // Log all sections we're going to fetch
  console.log(`Fetching components for ${pageData.sections.length} sections`);
  
  // Process each section to get its components
  for (const section of pageData.sections) {
    try {
      // Only fetch if we have a section ID
      if (!section.id) {
        console.log(`Section missing ID, skipping component fetch`);
        continue;
      }
      
      // Get the CMSSection data first
      const cmsSection = await cmsOperations.getCMSSection(section.id);
      if (!cmsSection) {
        console.log(`CMSSection not found for ID: ${section.id}`);
        continue;
      }
      
      console.log(`Fetching components for section ID: ${cmsSection.sectionId}`);
      
      // Get section title if available
      const sectionTitle = cmsSection.name || `Section ${section.order || 0}`;
      
      // Fetch the components for this section using the CMSSection's sectionId
      const result = await cmsOperations.getSectionComponents(cmsSection.sectionId);
      const { components } = result;
      
      console.log(`Fetched ${components.length} components for section "${sectionTitle}"`);
      
      // Add to our sections array with components
      sections.push({
        id: section.id,
        title: sectionTitle,
        order: section.order || 0,
        components
      });
      
      // Log component types for debugging
      if (components.length > 0) {
        console.log(`Component types in section "${sectionTitle}":`, 
          components.map((c: CMSComponent) => c.type).join(', '));
      }
    } catch (error) {
      console.error(`Error fetching components for section ${section.id}:`, error);
      
      // Add the section with empty components to maintain structure
      sections.push({
        id: section.id,
        title: 'title' in section ? (section.title as string) : `Section ${section.order || 0}`,
        order: section.order || 0,
        components: []
      });
    }
  }
  
  // Sort sections by order
  sections.sort((a, b) => a.order - b.order);
  
  console.log(`Page preview generated with ${sections.length} populated sections`);
  
  return {
    page: pageData,
    sections
  };
}


// Update a section name
async function updateSectionName(sectionId: string, name: string): Promise<{
  success: boolean;
  message: string;
  lastUpdated?: string | null;
}> {
  try {
    // Use the updateCMSSection function from cms-update.ts
    const result = await updateCMSSection(sectionId, { name });

    if (result.success) {
      optimizedQueries.invalidateCache(`section:${sectionId}`);
      clearCache(`section_components_${sectionId}`); // Local cache for section components
      clearCache(`section_${sectionId}`); // Local cache for section data if separate
    }
    
    return {
      success: result.success,
      message: result.message,
      lastUpdated: result.lastUpdated
    };
  } catch (error) {
    console.error('Error updating section name:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating section name'
    };
  }
}

// Get section components for editing
export async function loadSectionComponentsForEdit(sectionId: string): Promise<{
  sectionId: string;
  components: CMSComponent[];
  lastUpdated: string | null;
}> {
  try {
    console.log(`Loading components for section ${sectionId} in editor`);
    
    // Fetch the components for this section
    const result = await cmsOperations.getSectionComponents(sectionId);
    const { components, lastUpdated } = result;
    
    console.log(`Editor: Loaded ${components.length} components for section ${sectionId}`);
    
    if (components.length > 0) {
      // Log types and data structure to help with editing
      console.log(`Component types for editing:`, components.map((c: CMSComponent) => c.type));
      console.log(`First component data structure:`, 
        Object.keys(components[0].data || {}).join(', '));
    }
    
    return { 
      sectionId,
      components, 
      lastUpdated 
    };
  } catch (error) {
    console.error(`Error loading section components for edit:`, error);
    return { 
      sectionId,
      components: [], 
      lastUpdated: null 
    };
  }
}

// Update the component edit function to handle background properties
export async function applyComponentEdit(
  sectionId: string,
  componentId: string,
  editedData: Record<string, unknown>
): Promise<{
  success: boolean;
  message: string;
  lastUpdated: string | null;
}> {
  try {
    console.log(`Applying edits to component ${componentId} in section ${sectionId}`);
    console.log('Edit data:', editedData);
    
    // First fetch the current components
    const result = await cmsOperations.getSectionComponents(sectionId);
    const { components } = result;
    
    if (!components || components.length === 0) {
      return {
        success: false,
        message: `No components found in section ${sectionId}`,
        lastUpdated: null
      };
    }
    
    // Find the component to update
    const componentIndex = components.findIndex((c: CMSComponent) => c.id === componentId);
    
    if (componentIndex === -1) {
      console.error(`Component ${componentId} not found in section ${sectionId}`);
      return {
        success: false,
        message: `Component ${componentId} not found in section`,
        lastUpdated: null
      };
    }
    
    console.log(`Found component at index ${componentIndex}, updating data`);
    
    // Create a new array with the updated component
    const updatedComponents = [...components];
    const currentComponent = updatedComponents[componentIndex];
    
    // Merge the new data with existing data, preserving all properties
    const mergedData = {
      ...currentComponent.data,
      ...editedData
    };
    
    // Special handling for background properties to ensure they persist
    if (editedData.backgroundImage !== undefined) {
      mergedData.backgroundImage = editedData.backgroundImage;
    }
    if (editedData.backgroundType !== undefined) {
      mergedData.backgroundType = editedData.backgroundType;
    }
    
    updatedComponents[componentIndex] = {
      ...currentComponent,
      data: mergedData
    };
    
    console.log(`Saving updated component with merged data:`, {
      id: updatedComponents[componentIndex].id,
      type: updatedComponents[componentIndex].type,
      dataKeys: Object.keys(updatedComponents[componentIndex].data || {}),
      backgroundImage: mergedData.backgroundImage,
      backgroundType: mergedData.backgroundType
    });
    
    // Save all components back to the section
    const result2 = await cmsOperations.saveSectionComponents(sectionId, updatedComponents);
    
    return result2;
  } catch (error) {
    console.error('Error applying component edit:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating component',
      lastUpdated: null
    };
  }
}

// Update a component title in a section
async function updateComponentTitle(sectionId: string, componentId: string, title: string): Promise<{
  success: boolean;
  message: string;
  lastUpdated?: string | null;
}> {
  try {
    // First get current section components
    const sectionData = await cmsOperations.getSectionComponents(sectionId);
    
    if (!sectionData.components || !Array.isArray(sectionData.components)) {
      return {
        success: false,
        message: 'Failed to get section components'
      };
    }
    
    // Find the component by ID and update its title
    const updatedComponents = sectionData.components.map((component: CMSComponent) => {
      if (component.id === componentId) {
        // Preserve the original data and add title
        return {
          ...component,
          data: {
            ...component.data,
            componentTitle: title
          }
        };
      }
      return component;
    });
    
    // Save the updated components
    const saveResult = await cmsOperations.saveSectionComponents(sectionId, updatedComponents);
    
    return {
      success: saveResult.success,
      message: saveResult.message || `Component title ${saveResult.success ? 'updated' : 'update failed'}`,
      lastUpdated: saveResult.lastUpdated
    };
  } catch (error) {
    console.error('Error updating component title:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating component title'
    };
  }
}


// Create a simple in-memory cache for API responses
const apiCache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache TTL by default

// Get a cached response or undefined if expired or not found
function getCachedResponse<T>(cacheKey: string): T | undefined {
  const cachedItem = apiCache[cacheKey];
  
  if (!cachedItem) return undefined;
  
  const now = Date.now();
  if (now - cachedItem.timestamp > CACHE_TTL) {
    // Cache expired, remove it
    delete apiCache[cacheKey];
    return undefined;
  }
  
  return cachedItem.data as T;
}

// Cache an API response
function setCachedResponse<T>(cacheKey: string, data: T): void {
  apiCache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
}

// Clear cache for a specific key or pattern
function clearCache(keyPattern?: string): void {
  if (!keyPattern) {
    // Clear all cache
    Object.keys(apiCache).forEach(key => delete apiCache[key]);
    return;
  }
  
  // Clear matching cache entries
  Object.keys(apiCache).forEach(key => {
    if (key.includes(keyPattern)) {
      delete apiCache[key];
    }
  });
}

// Define a type for the section components result
interface SectionComponentsResult {
  components: CMSComponent[];
  lastUpdated: string | null;
}

// Add this new type for HeaderStyle input
export interface HeaderStyleInput {
  transparency?: number;
  headerSize?: 'sm' | 'md' | 'lg';
  menuAlignment?: 'left' | 'center' | 'right';
  menuButtonStyle?: 'default' | 'filled' | 'outline';
  mobileMenuStyle?: 'fullscreen' | 'dropdown' | 'sidebar';
  mobileMenuPosition?: 'left' | 'right';
  transparentHeader?: boolean;
  borderBottom?: boolean;
  fixedHeader?: boolean;
  advancedOptions?: Record<string, unknown>;
}

export interface FooterStyleInput {
  transparency?: number;
  columnLayout?: 'stacked' | 'grid' | 'flex';
  socialAlignment?: 'left' | 'center' | 'right';
  borderTop?: boolean;
  alignment?: 'left' | 'center' | 'right';
  padding?: 'small' | 'medium' | 'large';
  width?: 'full' | 'container' | 'narrow';
  advancedOptions?: Record<string, unknown>;
}

// Operaciones CMS
export const cmsOperations = {
  // Obtener todas las secciones CMS
  getAllCMSSections: async () => {
    try {
      const query = `
        query GetAllCMSSections {
          getAllCMSSections {
            id
            sectionId
            name
            description
            lastUpdated
            createdAt
            updatedAt
            createdBy
            components {
              id
              componentId
              order
            }
          }
        }
      `;

      try {
        const result = await gqlRequest<{ getAllCMSSections: Array<{
          id: string;
          sectionId: string;
          name: string;
          description: string;
          lastUpdated: string;
          createdAt: string;
          updatedAt: string;
          createdBy: string | null;
          components: unknown;
        }> }>(query);

        if (!result || !result.getAllCMSSections) {
          return [];
        }
        
        return result.getAllCMSSections;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSSections:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllCMSSections:`, error);
      return [];
    }
  },

  // Obtener componentes de una sección
  getSectionComponents: async (sectionId: string): Promise<SectionComponentsResult> => {
    try {
      // Exit early if sectionId is invalid
      if (!sectionId) {
        return { components: [], lastUpdated: null };
      }
      
      // Clean the sectionId by removing any query parameters or hashes
      let cleanedSectionId = sectionId;
      if (cleanedSectionId.includes('?')) {
        cleanedSectionId = cleanedSectionId.split('?')[0];
      }
      if (cleanedSectionId.includes('#')) {
        cleanedSectionId = cleanedSectionId.split('#')[0];
      }
      
      // Check cache first
      const cacheKey = `section_components_${cleanedSectionId}`;
      const cachedData = getCachedResponse<SectionComponentsResult>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Define the GraphQL query
      const query = `
        query GetSectionComponents($sectionId: ID!) {
          getSectionComponents(sectionId: $sectionId) {
            components {
              id
              type
              data
            }
            lastUpdated
          }
        }
      `;

      try {
        // Execute the GraphQL query
        const result = await gqlRequest<SectionComponentsResponse>(query, { sectionId: cleanedSectionId });
        
        if (!result || !result.getSectionComponents) {
          return { components: [], lastUpdated: null };
        }
        
        const { components = [], lastUpdated } = result.getSectionComponents;
        
        const response = { components, lastUpdated };
        
        // Store in cache
        setCachedResponse(cacheKey, response);
        
        return response;
      } catch (error) {
        console.error('Error fetching section components:', error);
        return { components: [], lastUpdated: null };
      }
    } catch (error) {
      console.error('Error in getSectionComponents:', error);
      return { components: [], lastUpdated: null };
    }
  },

  // Guardar componentes de una sección
  saveSectionComponents: async (
    sectionId: string, 
    components: CMSComponent[]
  ): Promise<{ 
    success: boolean; 
    message: string; 
    lastUpdated: string | null 
  }> => {
    try {
      // Ensure all components have an ID and remove any 'title' properties
      // since the GraphQL schema doesn't accept 'title' in ComponentInput
      const validComponents = components.map(comp => {
        // Ensure component has an ID
        const componentWithId = !comp.id 
          ? { ...comp, id: crypto.randomUUID() } 
          : comp;
        
        // Remove 'title' property if it exists
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, ...componentWithoutTitle } = componentWithId as { title?: string } & CMSComponent;
        
        return componentWithoutTitle;
      });
      
      const mutation = `
        mutation SaveSectionComponents($input: SaveSectionInput!) {
          saveSectionComponents(input: $input) {
            success
            message
            lastUpdated
          }
        }
      `;
      
      const input = {
        sectionId,
        components: validComponents
      };
      
      console.log(`Starting saveSectionComponents mutation for section ${sectionId} with ${components.length} components`);
      
      // Use a longer timeout for saving components - reduced from 30s to 15s after optimization
      const result = await gqlRequest<{ 
        saveSectionComponents: { 
          success: boolean; 
          message: string; 
          lastUpdated: string | null;
        }
      }>(mutation, { input }, 15000);
      
      if (!result) {
        console.error('No result from GraphQL request in saveSectionComponents');
        throw new Error('No result received from server');
      }
      
      if (!result.saveSectionComponents) {
        console.error('Missing saveSectionComponents in result:', result);
        throw new Error('Invalid response format: missing saveSectionComponents field');
      }
      
      // Clear cache for this section
      clearCache(`section_components_${sectionId}`);
      optimizedQueries.invalidateCache(`section:${sectionId}`);
      
      return result.saveSectionComponents;
    } catch (error) {
      console.error('Error saving section components:', error);
      return {
        success: false,
        message: `Error al guardar componentes: "${error instanceof Error ? error.message : 'Error desconocido'}"`,
        lastUpdated: null
      };
    }
  },

  // Obtener todas las páginas CMS
  getAllPages: async () => {
    try {
      const query = `
        query GetAllCMSPages {
          getAllCMSPages {
            id
            title
            slug
            description
            isPublished
            pageType
            locale
            createdAt
            updatedAt
            isDefault
            sections {
              id
              sectionId
              name
            }
          }
        }
      `;

      console.log('GraphQL query para getAllCMSPages');

      try {
        const result = await gqlRequest<{ getAllCMSPages: CMSPageDB[] }>(query);
        
        console.log("Resultado GraphQL getAllCMSPages:", JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getAllCMSPages) {
          console.log("No se encontraron páginas o la estructura no es la esperada");
          return [];
        }
        
        // Filtrar las secciones con sectionId null para evitar errores GraphQL
        const pagesWithValidSections = result.getAllCMSPages.map(page => {
          if (page.sections && Array.isArray(page.sections)) {
            // Asegurar que todas las secciones tengan sectionId válido
            page.sections = page.sections.filter(section => 
              section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
            );
          }
          return page;
        });
        
        return pagesWithValidSections;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSPages:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllPages:`, error);
      return [];
    }
  },

  // Obtener todos los identificadores de página CMS
  getAllPageIdentifiers: async () => {
    const GET_ALL_PAGE_IDENTIFIERS_QUERY = `
      query GetAllCMSPageIdentifiers {
        getAllCMSPages {
          id
          slug
          locale
        }
      }
    `;
    try {
      const result = await gqlRequest<{ getAllCMSPages: Array<{ id: string; slug: string; locale?: string | null }> }>(GET_ALL_PAGE_IDENTIFIERS_QUERY);
      if (!result || !result.getAllCMSPages) {
        return [];
      }
      return result.getAllCMSPages.map(page => ({
        id: page.id,
        slug: page.slug,
        locale: page.locale || 'en', // Default locale to 'en' if missing
      }));
    } catch (error) {
      console.error(`Error general en getAllPageIdentifiers:`, error);
      return [];
    }
  },

  // Obtener componentes por tipo
  getComponentsByType: async (type: string) => {
    try {
      const query = `
        query GetCMSComponentsByType($type: String!) {
          getCMSComponentsByType(type: $type) {
            id
            name
            slug
            description
            category
            icon
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log(`GraphQL query para getCMSComponentsByType, tipo: ${type}`);

      try {
        const result = await gqlRequest<{ getCMSComponentsByType: CMSComponentDB[] }>(query, { type });
        
        console.log(`Resultado GraphQL getCMSComponentsByType (${type}):`, JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getCMSComponentsByType) {
          console.log(`No se encontraron componentes de tipo ${type}`);
          return [];
        }
        
        return result.getCMSComponentsByType;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getCMSComponentsByType (${type}):`, error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getComponentsByType:`, error);
      return [];
    }
  },

  // Obtener un componente por ID
  getComponentById: async (id: string) => {
    try {
      const query = `
        query GetCMSComponent($id: ID!) {
          getCMSComponent(id: $id) {
            id
            name
            slug
            description
            category
            icon
            schema
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log(`GraphQL query para getCMSComponent, id: ${id}`);

      try {
        const result = await gqlRequest<{ getCMSComponent: CMSComponentDB | null }>(query, { id });
        
        if (!result || !result.getCMSComponent) {
          console.log(`No se encontró el componente con id ${id}`);
          return null;
        }
        
        return result.getCMSComponent;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getCMSComponent (${id}):`, error);
        return null;
      }
    } catch (error) {
      console.error(`Error general en getComponentById:`, error);
      return null;
    }
  },

  // Crear un nuevo componente
  createComponent: async (input: CMSComponentInput) => {
    try {
      const mutation = `
        mutation CreateCMSComponent($input: CreateCMSComponentInput!) {
          createCMSComponent(input: $input) {
            success
            message
            component {
              id
              name
              slug
              description
              category
              icon
              isActive
              createdAt
              updatedAt
            }
          }
        }
      `;

      console.log('Mutation para crear componente:', input.name);
      
      const result = await gqlRequest<{ createCMSComponent: CMSComponentResult }>(mutation, { input });
      
      console.log('Resultado de crear componente:', result);
      
      return result.createCMSComponent;
    } catch (error) {
      console.error('Error al crear componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al crear componente',
        component: null
      };
    }
  },

  // Actualizar un componente existente
  updateComponent: async (id: string, input: Partial<CMSComponentInput>) => {
    try {
      const mutation = `
        mutation UpdateCMSComponent($id: ID!, $input: UpdateCMSComponentInput!) {
          updateCMSComponent(id: $id, input: $input) {
            success
            message
            component {
              id
              name
              slug
              description
              category
              icon
              isActive
              createdAt
              updatedAt
            }
          }
        }
      `;

      console.log(`Mutation para actualizar componente: ${id}`);
      
      const result = await gqlRequest<{ updateCMSComponent: CMSComponentResult }>(mutation, { id, input });
      
      console.log('Resultado de actualizar componente:', result);
      
      return result.updateCMSComponent;
    } catch (error) {
      console.error('Error al actualizar componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al actualizar componente',
        component: null
      };
    }
  },

  // Eliminar un componente
  deleteComponent: async (id: string) => {
    try {
      const mutation = `
        mutation DeleteCMSComponent($id: ID!) {
          deleteCMSComponent(id: $id) {
            success
            message
          }
        }
      `;

      console.log(`Mutation para eliminar componente: ${id}`);
      
      const result = await gqlRequest<{ deleteCMSComponent: { success: boolean; message: string } }>(mutation, { id });
      
      console.log('Resultado de eliminar componente:', result);
      
      return result.deleteCMSComponent;
    } catch (error) {
      console.error('Error al eliminar componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al eliminar componente'
      };
    }
  },

  // Create a new CMS page with an automatic section
  createPage: async (pageInput: {
    title: string;
    slug: string;
    description?: string;
    template?: string;
    isPublished?: boolean;
    pageType?: string;
    locale?: string;
    metaTitle?: string;
    metaDescription?: string;
    featuredImage?: string;
    isDefault?: boolean;
    sections?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    page: {
      id: string;
      title: string;
      slug: string;
    } | null;
  }> => {
    // Generate a unique request ID for logging
    const requestId = `createPage-${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`🔍 [${requestId}] GraphQL CLIENT - createPage - Starting request with auto-section`);
    
    try {
      // Step 1: Create the page first
      const pageQuery = `
        mutation CreatePage($input: CreatePageInput!) {
          createPage(input: $input) {
            success
            message
            page {
              id
              title
              slug
            }
          }
        }
      `;
      
      const pageVariables = {
        input: pageInput
      };
      
      const pageResult = await gqlRequest<{
        createPage: {
          success: boolean;
          message: string;
          page: {
            id: string;
            title: string;
            slug: string;
          } | null;
        }
      }>(pageQuery, pageVariables);
      
      console.log(`✅ [${requestId}] GraphQL CLIENT - createPage - Page created:`, pageResult);
      
      if (!pageResult || !pageResult.createPage || !pageResult.createPage.success || !pageResult.createPage.page) {
        console.error(`❌ [${requestId}] GraphQL CLIENT - createPage - Error: Failed to create page`);
        return { 
          success: false, 
          message: pageResult?.createPage?.message || 'Failed to create page', 
          page: null 
        };
      }
      
      const createdPage = pageResult.createPage.page;
      
      // Step 2: Create a default section for the page
      console.log(`🔧 [${requestId}] Creating default section for page ${createdPage.id}`);
      
      // Generate section ID based on page
      const generatePageSectionId = (pageId: string, sectionName: string): string => {
        const cleanName = sectionName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        return `${pageId.substring(0, 8)}-${cleanName}-${Date.now().toString(36)}`;
      };
      
      const defaultSectionName = 'Contenido Principal';
      const sectionIdentifier = generatePageSectionId(createdPage.id, defaultSectionName);
      
      // Create the CMS section
      const sectionResult = await cmsOperations.createCMSSection({
        sectionId: sectionIdentifier,
        name: defaultSectionName,
        description: `Sección principal para la página "${createdPage.title}"`
      });
      
      console.log(`🔧 [${requestId}] Section creation result:`, sectionResult);
      
      if (sectionResult.success && sectionResult.section) {
        // Step 3: Associate the section with the page
        console.log(`🔗 [${requestId}] Associating section ${sectionResult.section.id} to page ${createdPage.id}`);
        
        const associateResult = await cmsOperations.associateSectionToPage(
          createdPage.id,
          sectionResult.section.id,
          0 // First section, order 0
        );
        
        console.log(`🔗 [${requestId}] Association result:`, associateResult);
        
        if (associateResult.success) {
          console.log(`✅ [${requestId}] Page and section created successfully`);
          optimizedQueries.invalidateCache('allPages');
          clearCache('allPages'); // Local cache
          return {
            success: true,
            message: `Página "${createdPage.title}" creada con sección inicial`,
            page: createdPage
          };
        } else {
          console.warn(`⚠️ [${requestId}] Page created but section association failed: ${associateResult.message}`);
          // Still invalidate allPages as the page itself was created
          optimizedQueries.invalidateCache('allPages');
          clearCache('allPages');
          return {
            success: true,
            message: `Página creada. ${associateResult.message || 'La sección se creará automáticamente al editar.'}`,
            page: createdPage
          };
        }
      } else {
        console.warn(`⚠️ [${requestId}] Page created but section creation failed: ${sectionResult.message}`);
        // Still invalidate allPages as the page itself was created
        optimizedQueries.invalidateCache('allPages');
        clearCache('allPages');
        return {
          success: true,
          message: `Página creada. ${sectionResult.message || 'La sección se creará automáticamente al editar.'}`,
          page: createdPage
        };
      }
      
    } catch (error) {
      console.error(`❌ [${requestId}] GraphQL CLIENT - createPage - Error:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error creating page',
        page: null
      };
    }
  },

  applyComponentEdit,
  
  loadSectionComponentsForEdit,
  
  getPagePreview,
  
  getPageBySlug,
  updatePage,
  getPageById,

  // Eliminar una página CMS
  deletePage: async (id: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    console.log(`Attempting to delete page with ID: ${id} and its associated sections.`);
    
    // Step 1: Fetch page details first to get slug and other info for cache invalidation.
    // Use the already refactored getPageById which uses a direct query.
    let pageToDelete: PageData | null = null;
    try {
      // We use the internal getPageById directly, not via cmsOperations to avoid circular dependency issues
      // if cmsOperations.getPageById was not yet defined or fully initialized during module load.
      // However, getPageById is defined earlier in this file.
      pageToDelete = await getPageById(id); 
    } catch (fetchError) {
      console.error(`Error fetching page details for ID ${id} before deletion:`, fetchError);
      // Proceed with deletion if fetching fails, but cache invalidation might be incomplete.
    }

    // Step 2: Call the actual deletion logic (deletePageWithSections)
    // deletePageWithSections is imported and should handle the GraphQL mutation for deletion.
    // Assuming deletePageWithSections is defined elsewhere and handles the actual deletion.
    // For this refactoring, we are focusing on the cache invalidation within this deletePage operation.
    
    const deleteResult = await deletePageWithSections(id); // This function is imported.

    // Step 3: Invalidate caches if deletion was successful
    if (deleteResult.success) {
      console.log(`Page with ID: ${id} deleted successfully. Invalidating caches.`);
      if (pageToDelete && pageToDelete.slug) {
        optimizedQueries.invalidateCache(`page:${pageToDelete.slug}`);
        clearCache(`page_slug_${pageToDelete.slug}`);
      }
      optimizedQueries.invalidateCache(`page_id:${id}`);
      clearCache(`page_id_${id}`); // local cache

      if (pageToDelete && pageToDelete.isDefault && pageToDelete.locale) {
        optimizedQueries.invalidateCache(`default_page_${pageToDelete.locale}`);
        clearCache(`default_page_${pageToDelete.locale}`); // local cache
      }
      
      optimizedQueries.invalidateCache('allPages');
      clearCache('allPages'); // local cache for general page lists
      
      // If pages also affect menu structures (e.g. if a deleted page was in a menu)
      optimizedQueries.invalidateCache('menus'); 
      clearCache('all_menus'); // Assuming 'all_menus' for local cache based on getMenus

    } else {
      console.log(`Failed to delete page with ID: ${id}. Message: ${deleteResult.message}`);
    }
    
    return deleteResult;
  },

  // Obtener páginas que usan una sección específica
  getPagesUsingSectionId: async (sectionId: string) => {
    try {
      const query = `
        query GetPagesUsingSectionId($sectionId: ID!) {
          getPagesUsingSectionId(sectionId: $sectionId) {
            id
            title
            slug
            description
            isPublished
            pageType
            locale
            updatedAt
            sections {
              id
              sectionId
              name
            }
          }
        }
      `;

      console.log(`GraphQL query para getPagesUsingSectionId, sectionId: ${sectionId}`);

      try {
        const result = await gqlRequest<{ getPagesUsingSectionId: PageData[] }>(query, { sectionId });
        
        console.log(`Resultado GraphQL getPagesUsingSectionId (${sectionId}):`, JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getPagesUsingSectionId) {
          console.log(`No se encontraron páginas que usen la sección ${sectionId}`);
          return [];
        }
        
        // Filtrar las secciones con sectionId null para evitar errores GraphQL
        const pagesWithValidSections = result.getPagesUsingSectionId.map(page => {
          if (page.sections && Array.isArray(page.sections)) {
            // Asegurar que todas las secciones tengan sectionId válido
            page.sections = page.sections.filter(section => 
              section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
            );
          }
          return page;
        });
        
        return pagesWithValidSections;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getPagesUsingSectionId (${sectionId}):`, error);
        return [];
      }
    } catch (error) {
      console.error(`Error in getPagesUsingSectionId:`, error);
      return [];
    }
  },

  async getCMSSection(id: string): Promise<{
    id: string;
    sectionId: string;
    name: string;
    description: string;
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    components: unknown;
  } | null> {
    // Check cache first
    const cacheKey = `section_${id}`;
    const cachedSection = getCachedResponse<{
      id: string;
      sectionId: string;
      name: string;
      description: string;
      lastUpdated: string;
      createdAt: string;
      updatedAt: string;
      createdBy: string | null;
      components: unknown;
    }>(cacheKey);
    
    if (cachedSection) {
      return cachedSection;
    }
    
    const query = `
      query GetCMSSection($id: String!) {
        getCMSSection(id: $id) {
          id
          sectionId
          name
          description
          lastUpdated
          createdAt
          updatedAt
          createdBy
          components {
            id
            componentId
            order
          }
        }
      }
    `;
    
    const response = await gqlRequest<{
      getCMSSection: {
        id: string;
        sectionId: string;
        name: string;
        description: string;
        lastUpdated: string;
        createdAt: string;
        updatedAt: string;
        createdBy: string | null;
        components: unknown;
      } | null;
    }>(query, { id });
    
    const result = response?.getCMSSection || null;
    
    // Cache the result
    if (result) {
      setCachedResponse(cacheKey, result);
    }
    
    return result;
  },

  // Create CMS Section
  createCMSSection: async (input: { 
    sectionId: string; 
    name: string; 
    description?: string; 
  }): Promise<{ 
    success: boolean; 
    message: string; 
    section: { id: string; sectionId: string; name: string; order?: number } | null;
  }> => {
    try {
      if (!input.sectionId || !input.name) {
        console.error('Missing required fields for createCMSSection', input);
        return {
          success: false,
          message: 'sectionId and name are required',
          section: null
        };
      }

      console.log('Starting createCMSSection mutation with:', JSON.stringify(input));
      
      const mutation = `
        mutation CreateCMSSection($input: CreateCMSSectionInput!) {
          createCMSSection(input: $input) {
            success
            message
            section {
              id
              sectionId
              name
              order
            }
          }
        }
      `;
      
      // Use a longer timeout for section creation - increase from 15s to 30s
      const result = await gqlRequest<{ 
        createCMSSection?: { 
          success: boolean; 
          message: string; 
          section: { id: string; sectionId: string; name: string; order?: number } | null;
        }
      }>(mutation, { input }, 30000);
      
      console.log('createCMSSection raw result:', JSON.stringify(result));
      
      if (!result) {
        console.error('No result from GraphQL request in createCMSSection');
        return {
          success: false,
          message: 'No result received from server',
          section: null
        };
      }
      
      if (!result.createCMSSection) {
        console.error('Missing createCMSSection in result:', JSON.stringify(result));
        return {
          success: false,
          message: 'Invalid response format: missing createCMSSection field',
          section: null
        };
      }
      
      // Clear cache for related data
      clearCache(`section_${input.sectionId}`); // Local cache for the specific section by its internal ID
      optimizedQueries.invalidateCache(`section:${input.sectionId}`); // GraphQLOptimizer cache for the specific section by its sectionId
      // If there was a general key for all sections list in GraphQLOptimizer, invalidate it here.
      // e.g., optimizedQueries.invalidateCache('allCMSSections');
      
      return result.createCMSSection;
    } catch (error) {
      console.error('Error creating CMS section:', error);
      return {
        success: false,
        message: `Error al crear CMSSection: "${error instanceof Error ? error.message : 'Error desconocido'}"`,
        section: null
      };
    }
  },



  updateComponentTitle,
  updateSectionName,
  
  // Update section background
  updateSectionBackground: async (sectionId: string, backgroundImage: string, backgroundType: 'image' | 'gradient') => {
    try {
      // Use the updateCMSSection function from cms-update.ts
      const result = await updateCMSSection(sectionId, { backgroundImage, backgroundType });

      if (result.success) {
        optimizedQueries.invalidateCache(`section:${sectionId}`);
        clearCache(`section_components_${sectionId}`);
        clearCache(`section_${sectionId}`);
      }
      
      return {
        success: result.success,
        message: result.message,
        lastUpdated: result.lastUpdated
      };
    } catch (error) {
      console.error('Error updating section background:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating section background'
      };
    }
  },
  
  // Get all menus with their items
  getMenus: async () => {
    // Check cache first
    const cacheKey = 'all_menus';
    const cachedMenus = getCachedResponse<Array<{
      id: string;
      name: string;
      location: string | null;
      items: Array<{
        id: string;
        title: string;
        url: string | null;
        pageId: string | null;
        target: string | null;
        icon: string | null;
        order: number;
        children?: Array<{
          id: string;
          title: string;
          url: string | null;
          pageId: string | null;
          target: string | null;
          icon: string | null;
          order: number;
        }>;
        page?: {
          id: string;
          title: string;
          slug: string;
        };
      }>;
      headerStyle?: {
        id: string;
        transparency: number;
        headerSize: string;
        menuAlignment: string;
        menuButtonStyle: string;
        mobileMenuStyle: string;
        mobileMenuPosition: string;
        transparentHeader: boolean;
        borderBottom: boolean;
        fixedHeader?: boolean;
        advancedOptions?: Record<string, unknown>;
      };
      footerStyle?: {
        id: string;
        transparency: number;
        columnLayout: string;
        socialAlignment: string;
        borderTop: boolean;
        alignment: string;
        padding: string;
        width: string;
        advancedOptions?: Record<string, unknown>;
      };
    }>>(cacheKey);
    
    if (cachedMenus) {
      return cachedMenus;
    }
    
    try {
      const query = `
        query GetMenus {
          menus {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
              children {
                id
                title
                url
                pageId
                target
                icon
                order
              }
              page {
                id
                title
                slug
              }
            }
            headerStyle {
              id
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              fixedHeader
              advancedOptions
            }
            footerStyle {
              id
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
            }
          }
        }
      `;

      const result = await gqlRequest<{ menus: Array<{
        id: string;
        name: string;
        location: string | null;
        items: Array<{
          id: string;
          title: string;
          url: string | null;
          pageId: string | null;
          target: string | null;
          icon: string | null;
          order: number;
          children?: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
          }>;
          page?: {
            id: string;
            title: string;
            slug: string;
          };
        }>;
        headerStyle?: {
          id: string;
          transparency: number;
          headerSize: string;
          menuAlignment: string;
          menuButtonStyle: string;
          mobileMenuStyle: string;
          mobileMenuPosition: string;
          transparentHeader: boolean;
          borderBottom: boolean;
          advancedOptions?: Record<string, unknown>;
        };
        footerStyle?: {
          id: string;
          transparency: number;
          columnLayout: string;
          socialAlignment: string;
          borderTop: boolean;
          alignment: string;
          padding: string;
          width: string;
          advancedOptions?: Record<string, unknown>;
        };
      }> }>(query);
      
      if (!result || !result.menus) {
        return [];
      }
      
      // Cache the menus
      setCachedResponse(cacheKey, result.menus);
      
      return result.menus;
    } catch (error) {
      console.error('Error in getMenus GraphQL query:', error);
      return [];
    }
  },

  // Update header style for a menu
  updateHeaderStyle: async (menuId: string, styleInput: HeaderStyleInput): Promise<{
    success: boolean;
    message: string;
    headerStyle?: {
      id: string;
      menuId: string;
      transparency: number;
      headerSize: string;
      menuAlignment: string;
      menuButtonStyle: string;
      mobileMenuStyle: string;
      mobileMenuPosition: string;
      transparentHeader: boolean;
      borderBottom: boolean;
      fixedHeader: boolean;
      advancedOptions?: Record<string, unknown>;
    };
  }> => {
    try {
      const mutation = `
        mutation UpdateHeaderStyle($menuId: ID!, $input: HeaderStyleInput!) {
          updateHeaderStyle(menuId: $menuId, input: $input) {
            success
            message
            headerStyle {
              id
              menuId
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              fixedHeader
              advancedOptions
              createdAt
              updatedAt
            }
          }
        }
      `;

      const variables = {
        menuId,
        input: styleInput
      };

      const result = await gqlRequest<{
        updateHeaderStyle: {
          success: boolean;
          message: string;
          headerStyle: {
            id: string;
            menuId: string;
            transparency: number;
            headerSize: string;
            menuAlignment: string;
            menuButtonStyle: string;
            mobileMenuStyle: string;
            mobileMenuPosition: string;
            transparentHeader: boolean;
            borderBottom: boolean;
            fixedHeader: boolean;
            advancedOptions?: Record<string, unknown>;
            createdAt: string;
            updatedAt: string;
          } | null;
        }
      }>(mutation, variables);

      if (!result || !result.updateHeaderStyle) {
        return {
          success: false,
          message: 'Failed to update header style'
        };
      }
      
      if (result.updateHeaderStyle.success) {
        optimizedQueries.invalidateCache('menus');
        clearCache('all_menus'); // local cache
      }

      return {
        success: result.updateHeaderStyle.success,
        message: result.updateHeaderStyle.message,
        headerStyle: result.updateHeaderStyle.headerStyle || undefined
      };
    } catch (error) {
      console.error('Error updating header style:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating header style'
      };
    }
  },
  
  // Get menu with its header style
  getMenuWithHeaderStyle: async (menuId: string) => {
    try {
      const query = `
        query GetMenu($id: ID!) {
          menu(id: $id) {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
            }
            headerStyle {
              id
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              advancedOptions
              fixedHeader
            }
          }
        }
      `;

      const variables = { id: menuId };
      const result = await gqlRequest<{
        menu: {
          id: string;
          name: string;
          location: string | null;
          items: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
          }>;
          headerStyle: {
            id: string;
            transparency: number;
            headerSize: string;
            menuAlignment: string;
            menuButtonStyle: string;
            mobileMenuStyle: string;
            mobileMenuPosition: string;
            transparentHeader: boolean;
            borderBottom: boolean;
            fixedHeader?: boolean;
            advancedOptions?: Record<string, unknown>;
          } | null;
        } | null;
      }>(query, variables);

      return result?.menu || null;
    } catch (error) {
      console.error('Error getting menu with header style:', error);
      return null;
    }
  },

  // Añadir referencia a la función getForms
  getForms,

  // Asociar una sección a una página
  associateSectionToPage: async (pageId: string, sectionId: string, order: number): Promise<{
    success: boolean;
    message: string;
    page: PageData | null;
  }> => {
    try {
      if (!pageId || !sectionId) {
        console.error('Missing required parameters in associateSectionToPage', { pageId, sectionId });
        return {
          success: false,
          message: 'Los IDs de la página y la sección son requeridos',
          page: null
        };
      }

      console.log(`Asociando sección ${sectionId} a página ${pageId} con orden ${order}`);
      
      const mutation = `
        mutation AssociateSectionToPage($pageId: ID!, $sectionId: ID!, $order: Int!) {
          associateSectionToPage(pageId: $pageId, sectionId: $sectionId, order: $order) {
            success
            message
            page {
              id
              title
              sections {
                id
                sectionId
                name
                order
              }
            }
          }
        }
      `;

      const variables = { pageId, sectionId, order };
      
      // Usar un timeout más largo para esta operación
      const result = await gqlRequest<{ 
        associateSectionToPage?: {
          success: boolean;
          message: string;
          page: PageData | null;
        } 
      }>(mutation, variables, 30000); // Increased timeout to 30 seconds

      console.log('Respuesta de associateSectionToPage:', JSON.stringify(result, null, 2));
      
      if (!result) {
        console.error('No se recibió respuesta del servidor');
        return {
          success: false,
          message: 'No se recibió respuesta del servidor al asociar la sección a la página',
          page: null
        };
      }
      
      if (!result.associateSectionToPage) {
        console.error('Respuesta sin el campo associateSectionToPage:', result);
        return {
          success: false,
          message: 'Respuesta no válida del servidor: campo associateSectionToPage no encontrado',
          page: null
        };
      }
      
      if (result.associateSectionToPage && result.associateSectionToPage.success && result.associateSectionToPage.page) {
        const updatedPage = result.associateSectionToPage.page;
        if (updatedPage.slug) {
          optimizedQueries.invalidateCache(`page:${updatedPage.slug}`);
          clearCache(`page_slug_${updatedPage.slug}`);
        }
        optimizedQueries.invalidateCache(`page_id:${pageId}`);
        clearCache(`page_id_${pageId}`);
        optimizedQueries.invalidateCache(`section:${sectionId}`); // Section's context within a page changed
        clearCache(`section_components_${sectionId}`);
        clearCache(`section_${sectionId}`);
        optimizedQueries.invalidateCache('allPages');
        clearCache('allPages');
      }

      return result.associateSectionToPage;
    } catch (error) {
      console.error('Error associating section to page:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Error al asociar sección a página: ${error.message}` 
          : 'Error desconocido al asociar sección a página',
        page: null
      };
    }
  },

  // Desasociar una sección de una página
  dissociateSectionFromPage: async (pageId: string, sectionId: string): Promise<{
    success: boolean;
    message: string;
    page: PageData | null;
  }> => {
    try {
      const mutation = `
        mutation DissociateSectionFromPage($pageId: ID!, $sectionId: ID!) {
          dissociateSectionFromPage(pageId: $pageId, sectionId: $sectionId) {
            success
            message
            page {
              id
              title
              sections {
                id
                sectionId
                name
                order
              }
            }
          }
        }
      `;

      const variables = { pageId, sectionId };
      const result = await gqlRequest<{ 
        dissociateSectionFromPage: {
          success: boolean;
          message: string;
          page: PageData | null;
        } 
      }>(mutation, variables);
      
      if (result.dissociateSectionFromPage && result.dissociateSectionFromPage.success && result.dissociateSectionFromPage.page) {
        const updatedPage = result.dissociateSectionFromPage.page;
        if (updatedPage.slug) {
          optimizedQueries.invalidateCache(`page:${updatedPage.slug}`);
          clearCache(`page_slug_${updatedPage.slug}`);
        }
        optimizedQueries.invalidateCache(`page_id:${pageId}`);
        clearCache(`page_id_${pageId}`);
        optimizedQueries.invalidateCache(`section:${sectionId}`); // Section's context within a page changed
        clearCache(`section_components_${sectionId}`);
        clearCache(`section_${sectionId}`);
        optimizedQueries.invalidateCache('allPages');
        clearCache('allPages');
      }

      return result.dissociateSectionFromPage;
    } catch (error) {
      console.error('Error dissociating section from page:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        page: null
      };
    }
  },

  // Obtener todos los componentes CMS
  getAllComponents: async () => {
    try {
      const query = `
        query GetAllCMSComponents {
          getAllCMSComponents {
            id
            name
            slug
            description
            category
            icon
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log('GraphQL query para getAllCMSComponents');

      try {
        const result = await gqlRequest<{ getAllCMSComponents: CMSComponentDB[] }>(query);
        
        console.log("Resultado GraphQL getAllCMSComponents:", JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getAllCMSComponents) {
          console.log("No se encontraron componentes o la estructura no es la esperada");
          return [];
        }
        
        return result.getAllCMSComponents;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSComponents:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllComponents:`, error);
      return [];
    }
  },

  // Header and footer style update methods are defined earlier in the cmsOperations object

  // Update Footer Style
  async updateFooterStyle(menuId: string, styleData: FooterStyleInput): Promise<{
    success: boolean;
    message: string;
    footerStyle?: Record<string, unknown>;
  }> {
    try {
      const query = `
        mutation UpdateFooterStyle($menuId: ID!, $input: FooterStyleInput!) {
          updateFooterStyle(menuId: $menuId, input: $input) {
            success
            message
            footerStyle {
              id
              menuId
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
              createdAt
              updatedAt
            }
          }
        }
      `;

      const variables = {
        menuId,
        input: styleData
      };

      const response = await gqlRequest<{
        updateFooterStyle: {
          success: boolean;
          message: string;
          footerStyle: Record<string, unknown> | null;
        };
      }>(query, variables);

      
      if (response.updateFooterStyle.success) {
        optimizedQueries.invalidateCache('menus');
        clearCache('all_menus'); // local cache
      }

      return {
        success: response.updateFooterStyle.success,
        message: response.updateFooterStyle.message,
        footerStyle: response.updateFooterStyle.footerStyle || undefined
      };
    } catch (error) {
      console.error('Error updating footer style:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Get menu with Footer style
  async getMenuWithFooterStyle(menuId: string): Promise<{
    id: string;
    name: string;
    location: string | null;
    items: Array<{
      id: string;
      title: string;
      url: string | null;
      pageId: string | null;
      target: string | null;
      icon: string | null;
      order: number;
      parentId: string | null;
      children?: Array<{
        id: string;
        title: string;
        url: string | null;
        pageId: string | null;
        target: string | null;
        icon: string | null;
        order: number;
      }>;
      page?: { slug: string } | null;
    }>;
    footerStyle?: {
      transparency?: number;
      columnLayout?: string;
      socialAlignment?: string;
      borderTop?: boolean;
      alignment?: string;
      padding?: string;
      width?: string;
      advancedOptions?: Record<string, unknown>;
    } | null;
  } | null> {
    try {
      const query = `
        query GetMenuWithFooterStyle($id: ID!) {
          menu(id: $id) {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
              parentId
              children {
                id
                title
                url
                pageId
                target
                icon
                order
              }
              page {
                slug
              }
            }
            footerStyle {
              id
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
            }
          }
        }
      `;

      const variables = { id: menuId };
      // Use a longer timeout for this query
      const result = await gqlRequest<{
        menu: {
          id: string;
          name: string;
          location: string | null;
          items: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
            parentId: string | null;
            children?: Array<{
              id: string;
              title: string;
              url: string | null;
              pageId: string | null;
              target: string | null;
              icon: string | null;
              order: number;
            }>;
            page?: { slug: string } | null;
          }>;
          footerStyle: {
            id: string;
            transparency?: number;
            columnLayout?: string;
            socialAlignment?: string;
            borderTop?: boolean;
            alignment?: string;
            padding?: string;
            width?: string;
            advancedOptions?: Record<string, unknown>;
          } | null;
        } | null;
      }>(query, variables, 20000); // Increase timeout to 20 seconds

      return result?.menu || null;
    } catch (error) {
      console.error('Error fetching menu with footer style:', error);
      return null;
    }
  },

  // Expose the clearCache function
  clearCache,

  // Get the default page for a locale
  getDefaultPage,

  // Settings operations
  async getSiteSettings(): Promise<{
    id: string;
    siteName: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale: string;
    footerText?: string;
    maintenanceMode: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales: string[];
    twitterCardType?: string;
    twitterHandle?: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetSiteSettings {
        getSiteSettings {
          id
          siteName
          siteDescription
          logoUrl
          faviconUrl
          primaryColor
          secondaryColor
          googleAnalyticsId
          facebookPixelId
          customCss
          customJs
          contactEmail
          contactPhone
          address
          accentColor
          defaultLocale
          footerText
          maintenanceMode
          metaDescription
          metaTitle
          ogImage
          socialLinks
          supportedLocales
          twitterCardType
          twitterHandle
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ getSiteSettings: {
        id: string;
        siteName: string;
        siteDescription?: string;
        logoUrl?: string;
        faviconUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
        customCss?: string;
        customJs?: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        accentColor?: string;
        defaultLocale: string;
        footerText?: string;
        maintenanceMode: boolean;
        metaDescription?: string;
        metaTitle?: string;
        ogImage?: string;
        socialLinks?: string;
        supportedLocales: string[];
        twitterCardType?: string;
        twitterHandle?: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(query);
      return response.getSiteSettings;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return null;
    }
  },

  async updateSiteSettings(input: {
    siteName?: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale?: string;
    footerText?: string;
    maintenanceMode?: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales?: string[];
    twitterCardType?: string;
    twitterHandle?: string;
  }): Promise<{
    id: string;
    siteName: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale: string;
    footerText?: string;
    maintenanceMode: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales: string[];
    twitterCardType?: string;
    twitterHandle?: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const mutation = `
      mutation UpdateSiteSettings($input: UpdateSiteSettingsInput!) {
        updateSiteSettings(input: $input) {
          id
          siteName
          siteDescription
          logoUrl
          faviconUrl
          primaryColor
          secondaryColor
          googleAnalyticsId
          facebookPixelId
          customCss
          customJs
          contactEmail
          contactPhone
          address
          accentColor
          defaultLocale
          footerText
          maintenanceMode
          metaDescription
          metaTitle
          ogImage
          socialLinks
          supportedLocales
          twitterCardType
          twitterHandle
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ updateSiteSettings: {
        id: string;
        siteName: string;
        siteDescription?: string;
        logoUrl?: string;
        faviconUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
        customCss?: string;
        customJs?: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        accentColor?: string;
        defaultLocale: string;
        footerText?: string;
        maintenanceMode: boolean;
        metaDescription?: string;
        metaTitle?: string;
        ogImage?: string;
        socialLinks?: string;
        supportedLocales: string[];
        twitterCardType?: string;
        twitterHandle?: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(mutation, { input });
      return response.updateSiteSettings;
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    }
  },

  // User Settings operations
  async getUserSettings(): Promise<{
    id: string;
    userId: string;
    emailNotifications: boolean;
    theme: string;
    language: string;
    timeFormat: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetUserSettings {
        userSettings {
          id
          userId
          emailNotifications
          theme
          language
          timeFormat
          dateFormat
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ userSettings: {
        id: string;
        userId: string;
        emailNotifications: boolean;
        theme: string;
        language: string;
        timeFormat: string;
        dateFormat: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(query);
      return response.userSettings;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }
  },

  async updateUserSettings(input: {
    emailNotifications?: boolean;
    theme?: string;
    language?: string;
    timeFormat?: string;
    dateFormat?: string;
  }): Promise<{
    id: string;
    userId: string;
    emailNotifications: boolean;
    theme: string;
    language: string;
    timeFormat: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const mutation = `
      mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
        updateUserSettings(input: $input) {
          id
          userId
          emailNotifications
          theme
          language
          timeFormat
          dateFormat
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ updateUserSettings: {
        id: string;
        userId: string;
        emailNotifications: boolean;
        theme: string;
        language: string;
        timeFormat: string;
        dateFormat: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(mutation, { input });
      return response.updateUserSettings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  // Staff Management Operations
  async staffProfiles(): Promise<CalendarStaffProfile[]> {
    try {
      const query = `
        query GetStaffProfiles {
          staffProfiles {
            id
            userId
            bio
            specializations
            createdAt
            updatedAt
            user {
              id
              email
              firstName
              lastName
              phoneNumber
              isActive
              profileImageUrl
              role {
                id
                name
              }
            }
            assignedServices {
              id
              name
              description
              durationMinutes
              price
              isActive
            }
            locationAssignments {
              id
              name
              address
              phone
            }
            schedules {
              id
              locationId
              date
              dayOfWeek
              startTime
              endTime
              scheduleType
              isAvailable
              notes
              createdAt
              updatedAt
            }
          }
        }
      `;

      const response = await gqlRequest<{ staffProfiles: CalendarStaffProfile[] }>(query);
      return response.staffProfiles || [];
    } catch (error) {
      console.error('Error fetching staff profiles:', error);
      return [];
    }
  },

  async users(): Promise<CalendarUser[]> {
    try {
      const query = `
        query GetUsers {
          users {
            id
            email
            firstName
            lastName
            phoneNumber
            isActive
            profileImageUrl
            role {
              id
              name
            }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await gqlRequest<{ users: CalendarUser[] }>(query);
      
      // Handle case where users might be null or undefined
      if (!response || !response.users) {
        console.warn('Users query returned null or undefined, returning empty array');
        return [];
      }
      
      return response.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.users')) {
        console.warn('Users field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },


  async locations(): Promise<CalendarLocation[]> {
    try {
      const query = `
        query GetLocations {
          locations {
            id
            name
            address
            phone
            operatingHours
            createdAt
            updatedAt
          }
        }
      `;

      const response = await gqlRequest<{ locations: CalendarLocation[] }>(query);
      
      // Handle case where locations might be null or undefined
      if (!response || !response.locations) {
        console.warn('Locations query returned null or undefined, returning empty array');
        return [];
      }
      
      return response.locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.locations')) {
        console.warn('Locations field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },

  async createStaffProfile(input: { input: {
    userId: string;
    bio?: string;
    specializations?: string[];
  }}): Promise<CalendarStaffProfile> {
    try {
      const mutation = `
        mutation CreateStaffProfile($input: CreateStaffProfileInput!) {
          createStaffProfile(input: $input) {
            success
            message
            staffProfile {
              id
              userId
              bio
              specializations
              createdAt
              updatedAt
              user {
                id
                email
                firstName
                lastName
                phoneNumber
                bio
                department
                isActive
                position
                profileImageUrl
                roleId
              }
            }
          }
        }
      `;

      const response = await gqlRequest<{
        createStaffProfile: {
          success: boolean;
          message: string;
          staffProfile: CalendarStaffProfile | null;
        };
      }>(mutation, input);

      if (!response.createStaffProfile.success || !response.createStaffProfile.staffProfile) {
        throw new Error(response.createStaffProfile.message || 'Failed to create staff profile');
      }

      return response.createStaffProfile.staffProfile;
    } catch (error) {
      console.error('Error creating staff profile:', error);
      throw error;
    }
  },

  async updateStaffProfile(input: { id: string; input: Partial<StaffProfileInput> }): Promise<CalendarStaffProfile> {
    try {
      const mutation = `
        mutation UpdateStaffProfile($id: ID!, $input: UpdateStaffProfileInput!) {
          updateStaffProfile(id: $id, input: $input) {
            success
            message
            staffProfile {
              id
              userId
              bio
              specializations
              createdAt
              updatedAt
              user {
                id
                email
                firstName
                lastName
                phoneNumber
                bio
                department
                isActive
                position
                profileImageUrl
                roleId
              }
            }
          }
        }
      `;

      const response = await gqlRequest<{
        updateStaffProfile: {
          success: boolean;
          message: string;
          staffProfile: CalendarStaffProfile | null;
        };
      }>(mutation, input);

      if (!response.updateStaffProfile.success || !response.updateStaffProfile.staffProfile) {
        throw new Error(response.updateStaffProfile.message || 'Failed to update staff profile');
      }

      return response.updateStaffProfile.staffProfile;
    } catch (error) {
      console.error('Error updating staff profile:', error);
      throw error;
    }
  },

  async deleteStaffProfile(input: { id: string }): Promise<{ success: boolean; message: string }> {
    try {
      const mutation = `
        mutation DeleteStaffProfile($id: ID!) {
          deleteStaffProfile(id: $id) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ deleteStaffProfile: { success: boolean; message: string } }>(mutation, input);
      return response.deleteStaffProfile;
    } catch (error) {
      console.error('Error deleting staff profile:', error);
      throw error;
    }
  },

  async updateStaffSchedule(input: { staffProfileId: string; schedule: CalendarStaffScheduleInput[] }): Promise<{ success: boolean; message: string }> {
    try {
      const mutation = `
        mutation UpdateStaffSchedule($staffProfileId: ID!, $schedule: [StaffScheduleInput!]!) {
          updateStaffSchedule(staffProfileId: $staffProfileId, schedule: $schedule) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ updateStaffSchedule: { success: boolean; message: string } }>(mutation, input);
      return response.updateStaffSchedule;
    } catch (error) {
      console.error('Error updating staff schedule:', error);
      throw error;
    }
  },

  async deleteFormSubmission(id: string): Promise<FormSubmissionResult> {
    const mutation = `
      mutation DeleteFormSubmission($id: ID!) {
        deleteFormSubmission(id: $id) {
          success
          message
        }
      }
    `;

    const result = await gqlRequest<{ deleteFormSubmission: FormSubmissionResult }>(mutation, { id });
    return result.deleteFormSubmission;
  },

  // Calendar booking rules
  async globalBookingRule(): Promise<{
    id: string;
    advanceBookingHoursMin: number;
    advanceBookingDaysMax: number;
    sameDayCutoffTime?: string;
    bufferBetweenAppointmentsMinutes: number;
    maxAppointmentsPerDayPerStaff?: number;
    bookingSlotIntervalMinutes: number;
  } | null> {
    const query = `
      query GlobalBookingRule {
        globalBookingRule {
          id
          advanceBookingHoursMin
          advanceBookingDaysMax
          sameDayCutoffTime
          bufferBetweenAppointmentsMinutes
          maxAppointmentsPerDayPerStaff
          bookingSlotIntervalMinutes
        }
      }
    `;

    const result = await gqlRequest<{ globalBookingRule: {
      id: string;
      advanceBookingHoursMin: number;
      advanceBookingDaysMax: number;
      sameDayCutoffTime?: string;
      bufferBetweenAppointmentsMinutes: number;
      maxAppointmentsPerDayPerStaff?: number;
      bookingSlotIntervalMinutes: number;
    } | null }>(query);
    return result.globalBookingRule;
  },

  // Calendar booking rules - upsert
  async upsertGlobalBookingRules({ input }: {
    input: {
      advanceBookingHoursMin: number;
      advanceBookingDaysMax: number;
      sameDayCutoffTime?: string | null;
      bufferBetweenAppointmentsMinutes: number;
      maxAppointmentsPerDayPerStaff?: number | null;
      bookingSlotIntervalMinutes: number;
    }
  }): Promise<{
    id: string;
    advanceBookingHoursMin: number;
    advanceBookingDaysMax: number;
    sameDayCutoffTime?: string;
    bufferBetweenAppointmentsMinutes: number;
    maxAppointmentsPerDayPerStaff?: number;
    bookingSlotIntervalMinutes: number;
  }> {
    const mutation = `
      mutation UpsertGlobalBookingRules($input: BookingRuleInput!) {
        upsertGlobalBookingRules(input: $input) {
          id
          advanceBookingHoursMin
          advanceBookingDaysMax
          sameDayCutoffTime
          bufferBetweenAppointmentsMinutes
          maxAppointmentsPerDayPerStaff
          bookingSlotIntervalMinutes
        }
      }
    `;

    const result = await gqlRequest<{ upsertGlobalBookingRules: {
      id: string;
      advanceBookingHoursMin: number;
      advanceBookingDaysMax: number;
      sameDayCutoffTime?: string;
      bufferBetweenAppointmentsMinutes: number;
      maxAppointmentsPerDayPerStaff?: number;
      bookingSlotIntervalMinutes: number;
    } }>(mutation, { input });
    
    return result.upsertGlobalBookingRules;
  },

  // Calendar service categories
  async serviceCategories(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query ServiceCategories {
        serviceCategories {
          id
          name
          description
          displayOrder
          parentId
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const result = await gqlRequest<{ serviceCategories: Array<{
        id: string;
        name: string;
        description?: string;
        displayOrder: number;
        parentId?: string;
        createdAt: string;
        updatedAt: string;
      }> }>(query);
      
      // Handle case where serviceCategories might be null or undefined
      if (!result || !result.serviceCategories) {
        console.warn('ServiceCategories query returned null or undefined, returning empty array');
        return [];
      }
      
      return result.serviceCategories;
    } catch (error) {
      console.error('Error fetching service categories:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.serviceCategories')) {
        console.warn('ServiceCategories field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },

  // Delete service category
  async deleteServiceCategory({ id }: { id: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteServiceCategory($id: ID!) {
        deleteServiceCategory(id: $id) {
          success
          message
          serviceCategory {
            id
            name
          }
        }
      }
    `;

    try {
      const result = await gqlRequest<{ deleteServiceCategory: {
        success: boolean;
        message: string;
        serviceCategory: {
          id: string;
          name: string;
        } | null;
      } }>(mutation, { id });
      
      return {
        success: result.deleteServiceCategory.success,
        message: result.deleteServiceCategory.message
      };
    } catch (error) {
      console.error('Error deleting service category:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete service category'
      };
    }
  },

  // Create service category
  async createServiceCategory({ input }: { 
    input: {
      name?: string;
      description?: string | null;
      displayOrder?: number;
      parentId?: string | null;
    }
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    parentId?: string;
  }> {
    const mutation = `
      mutation CreateServiceCategory($input: CreateServiceCategoryInput!) {
        createServiceCategory(input: $input) {
          success
          message
          serviceCategory {
            id
            name
            description
            displayOrder
            parentId
          }
        }
      }
    `;

    const result = await gqlRequest<{ createServiceCategory: {
      success: boolean;
      message: string;
      serviceCategory: {
        id: string;
        name: string;
        description?: string;
        displayOrder: number;
        parentId?: string;
      } | null;
    } }>(mutation, { input });
    
    if (!result.createServiceCategory.success || !result.createServiceCategory.serviceCategory) {
      throw new Error(result.createServiceCategory.message || 'Failed to create service category');
    }
    
    return result.createServiceCategory.serviceCategory;
  },

  // Update service category
  async updateServiceCategory({ id, input }: { 
    id: string;
    input: {
      name?: string;
      description?: string | null;
      displayOrder?: number;
      parentId?: string | null;
    }
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    parentId?: string;
  }> {
    const mutation = `
      mutation UpdateServiceCategory($id: ID!, $input: UpdateServiceCategoryInput!) {
        updateServiceCategory(id: $id, input: $input) {
          success
          message
          serviceCategory {
            id
            name
            description
            displayOrder
            parentId
          }
        }
      }
    `;

    const result = await gqlRequest<{ updateServiceCategory: {
      success: boolean;
      message: string;
      serviceCategory: {
        id: string;
        name: string;
        description?: string;
        displayOrder: number;
        parentId?: string;
      } | null;
    } }>(mutation, { id, input });
    
    if (!result.updateServiceCategory.success || !result.updateServiceCategory.serviceCategory) {
      throw new Error(result.updateServiceCategory.message || 'Failed to update service category');
    }
    
    return result.updateServiceCategory.serviceCategory;
  },

  // Services
  async services(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    prices: Array<{
      id: string;
      amount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
    }>;
    bufferTimeBeforeMinutes: number;
    bufferTimeAfterMinutes: number;
    preparationTimeMinutes: number;
    cleanupTimeMinutes: number;
    maxDailyBookingsPerService?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    serviceCategoryId: string;
    serviceCategory?: { id: string; name: string };
    locations?: Array<{ id: string; name: string }>;
  }>> {
    const query = `
      query Services {
        services {
          id
          name
          description
          durationMinutes
          prices {
            id
            amount
            currency {
              id
              code
              symbol
            }
          }
          bufferTimeBeforeMinutes
          bufferTimeAfterMinutes
          preparationTimeMinutes
          cleanupTimeMinutes
          maxDailyBookingsPerService
          isActive
          createdAt
          updatedAt
          serviceCategoryId
          serviceCategory {
            id
            name
          }
          locations {
            id
            name
          }
        }
      }
    `;

    try {
      const result = await gqlRequest<{ services: Array<{
        id: string;
        name: string;
        description?: string;
        durationMinutes: number;
        prices: Array<{
          id: string;
          amount: number;
          currency: {
            id: string;
            code: string;
            symbol: string;
          };
        }>;
        bufferTimeBeforeMinutes: number;
        bufferTimeAfterMinutes: number;
        preparationTimeMinutes: number;
        cleanupTimeMinutes: number;
        maxDailyBookingsPerService?: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        serviceCategoryId: string;
        serviceCategory?: { id: string; name: string };
        locations?: Array<{ id: string; name: string }>;
      }> }>(query);
      
      // Handle case where services might be null or undefined
      if (!result || !result.services) {
        console.warn('Services query returned null or undefined, returning empty array');
        return [];
      }
      
      // Transform string dates to Date objects to match CalendarService type
      const transformedServices = result.services.map(service => ({
        ...service,
        createdAt: new Date(service.createdAt),
        updatedAt: new Date(service.updatedAt)
      }));
      
      return transformedServices;
    } catch (error) {
      console.error('Error fetching services:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.services')) {
        console.warn('Services field is null in database, returning empty array');
        return [];
      }
      return []; // Return empty array instead of null on any error
    }
  },

  async createService({ input }: { input: {
    name: string;
    description?: string | null;
    durationMinutes: number;
    price: number;
    bufferTimeBeforeMinutes?: number;
    bufferTimeAfterMinutes?: number;
    preparationTimeMinutes?: number;
    cleanupTimeMinutes?: number;
    maxDailyBookingsPerService?: number;
    isActive?: boolean;
    serviceCategoryId: string;
    locationIds?: string[];
  }}): Promise<{
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    isActive: boolean;
  }> {
    const mutation = `
      mutation CreateService($input: CreateServiceInput!) {
        createService(input: $input) {
          success
          message
          service {
            id
            name
            description
            durationMinutes
            price
            isActive
          }
        }
      }
    `;

    const response = await gqlRequest<{
      createService: {
        success: boolean;
        message: string;
        service: {
          id: string;
          name: string;
          description?: string;
          durationMinutes: number;
          price: number;
          isActive: boolean;
        } | null;
      };
    }>(mutation, { input });

    if (!response.createService.success || !response.createService.service) {
      throw new Error(response.createService.message || 'Failed to create service');
    }

    return response.createService.service;
  },

  async updateService({ id, input }: { 
    id: string;
    input: {
      name?: string;
      description?: string | null;
      durationMinutes?: number;
      price?: number;
      bufferTimeBeforeMinutes?: number;
      bufferTimeAfterMinutes?: number;
      preparationTimeMinutes?: number;
      cleanupTimeMinutes?: number;
      maxDailyBookingsPerService?: number;
      isActive?: boolean;
      serviceCategoryId?: string;
      locationIds?: string[];
    }
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    isActive: boolean;
  }> {
    const mutation = `
      mutation UpdateService($id: ID!, $input: UpdateServiceInput!) {
        updateService(id: $id, input: $input) {
          success
          message
          service {
            id
            name
            description
            durationMinutes
            price
            isActive
          }
        }
      }
    `;

    const response = await gqlRequest<{
      updateService: {
        success: boolean;
        message: string;
        service: {
          id: string;
          name: string;
          description?: string;
          durationMinutes: number;
          price: number;
          isActive: boolean;
        } | null;
      };
    }>(mutation, { id, input });

    if (!response.updateService.success || !response.updateService.service) {
      throw new Error(response.updateService.message || 'Failed to update service');
    }

    return response.updateService.service;
  },

  async deleteService({ id }: { id: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteService($id: ID!) {
        deleteService(id: $id) {
          id
          name
        }
      }
    `;

    try {
      await gqlRequest(mutation, { id });
      return {
        success: true,
        message: 'Service deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting service:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete service'
      };
    }
  },

  async createLocation({ input }: { input: {
    name: string;
    address?: string | null;
    phone?: string | null;
    operatingHours?: Record<string, unknown> | null;
  }}): Promise<{
    id: string;
    name: string;
    address?: string;
    phone?: string;
  }> {
    const mutation = `
      mutation CreateLocation($input: CreateLocationInput!) {
        createLocation(input: $input) {
          success
          message
          location {
            id
            name
            address
            phone
          }
        }
      }
    `;

    const response = await gqlRequest<{
      createLocation: {
        success: boolean;
        message: string;
        location: {
          id: string;
          name: string;
          address?: string;
          phone?: string;
        } | null;
      };
    }>(mutation, { input });

    if (!response.createLocation.success || !response.createLocation.location) {
      throw new Error(response.createLocation.message || 'Failed to create location');
    }

    return response.createLocation.location;
  },

  async updateLocation({ id, input }: { 
    id: string;
    input: {
      name?: string;
      address?: string | null;
      phone?: string | null;
      operatingHours?: Record<string, unknown> | null;
    }
  }): Promise<{
    id: string;
    name: string;
    address?: string;
    phone?: string;
  }> {
    const mutation = `
      mutation UpdateLocation($id: ID!, $input: UpdateLocationInput!) {
        updateLocation(id: $id, input: $input) {
          success
          message
          location {
            id
            name
            address
            phone
          }
        }
      }
    `;

    const response = await gqlRequest<{
      updateLocation: {
        success: boolean;
        message: string;
        location: {
          id: string;
          name: string;
          address?: string;
          phone?: string;
        } | null;
      };
    }>(mutation, { id, input });

    if (!response.updateLocation.success || !response.updateLocation.location) {
      throw new Error(response.updateLocation.message || 'Failed to update location');
    }

    return response.updateLocation.location;
  },

  async deleteLocation({ id }: { id: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteLocation($id: ID!) {
        deleteLocation(id: $id) {
          success
          message
          location {
            id
            name
          }
        }
      }
    `;

    const response = await gqlRequest<{
      deleteLocation: {
        success: boolean;
        message: string;
        location: {
          id: string;
          name: string;
        } | null;
      };
    }>(mutation, { id });

    return {
      success: response.deleteLocation.success,
      message: response.deleteLocation.message
    };
  },

  // Calendar Bookings Operations
  async bookings({ filter, pagination }: {
    filter?: {
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      locationId?: string;
      serviceId?: string;
      staffProfileId?: string;
      customerId?: string;
      searchQuery?: string;
    };
    pagination?: {
      page?: number;
      pageSize?: number;
    };
  }): Promise<{
    items: Array<{
      id: string;
      customerName?: string | null;
      customerEmail?: string | null;
      customerPhone?: string | null;
      service: { id: string; name: string };
      location: { id: string; name: string };
      staffProfile?: { id: string; user: { firstName: string; lastName: string } } | null;
      bookingDate: string;
      startTime: string;
      endTime: string;
      status: string;
      notes?: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    totalCount: number;
    page: number;
    pageSize: number;
  } | null> {
    const query = `
      query GetBookings($filter: BookingFilterInput, $pagination: PaginationInput) {
        bookings(filter: $filter, pagination: $pagination) {
          edges {
            node {
              id
              customerName
              customerEmail
              customerPhone
              service {
                id
                name
              }
              location {
                id
                name
              }
              staffProfile {
                id
                user {
                  firstName
                  lastName
                }
              }
              bookingDate
              startTime
              endTime
              status
              notes
              createdAt
              updatedAt
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        bookings: {
          edges: Array<{
            node: {
              id: string;
              customerName?: string | null;
              customerEmail?: string | null;
              customerPhone?: string | null;
              service: { id: string; name: string };
              location: { id: string; name: string };
              staffProfile?: { id: string; user: { firstName: string; lastName: string } } | null;
              bookingDate: string;
              startTime: string;
              endTime: string;
              status: string;
              notes?: string | null;
              createdAt: string;
              updatedAt: string;
            };
          }>;
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor?: string;
            endCursor?: string;
          };
          totalCount: number;
        };
      }>(query, { filter, pagination });
      
      // Transform the response to match the expected format
      const bookingsData = response.bookings;
      if (!bookingsData) {
        console.warn('Bookings query returned null or undefined, returning empty result');
        return {
          items: [],
          totalCount: 0,
          page: pagination?.page || 1,
          pageSize: pagination?.pageSize || 10
        };
      }
      
      return {
        items: bookingsData.edges.map(edge => edge.node),
        totalCount: bookingsData.totalCount,
        page: pagination?.page || 1,
        pageSize: pagination?.pageSize || 10
      };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.bookings')) {
        console.warn('Bookings field is null in database, returning empty result');
        return {
          items: [],
          totalCount: 0,
          page: pagination?.page || 1,
          pageSize: pagination?.pageSize || 10
        };
      }
      // Always return empty result structure instead of null
      return {
        items: [],
        totalCount: 0,
        page: pagination?.page || 1,
        pageSize: pagination?.pageSize || 10
      };
    }
  },

  // Create a new booking
  async createBooking({ input }: {
    input: {
      serviceId: string;
      locationId: string;
      staffProfileId?: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      notes?: string;
      userId?: string;
    };
  }): Promise<{
    id: string;
    customerName: string;
    customerEmail: string;
    service: { name: string };
    location: { name: string };
    staffProfile?: { user: { firstName: string; lastName: string } } | null;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: string;
    notes?: string;
  } | null> {
    const mutation = `
      mutation CreateBooking($input: BookingInput!) {
        createBooking(input: $input) {
          id
          customerName
          customerEmail
          service {
            name
          }
          location {
            name
          }
          staffProfile {
            user {
              firstName
              lastName
            }
          }
          bookingDate
          startTime
          endTime
          status
          notes
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        createBooking: {
          id: string;
          customerName: string;
          customerEmail: string;
          service: { name: string };
          location: { name: string };
          staffProfile?: { user: { firstName: string; lastName: string } } | null;
          bookingDate: string;
          startTime: string;
          endTime: string;
          status: string;
          notes?: string;
        };
      }>(mutation, { input });
      
      return response.createBooking || null;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Get staff available for a service at a location
  async staffForService({ serviceId, locationId }: {
    serviceId: string;
    locationId: string;
  }): Promise<Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
    bio?: string;
    specializations: string[];
  }>> {
    const query = `
      query StaffForService($serviceId: ID!, $locationId: ID!) {
        staffForService(serviceId: $serviceId, locationId: $locationId) {
          id
          user {
            id
            firstName
            lastName
            profileImageUrl
          }
          bio
          specializations
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        staffForService: Array<{
          id: string;
          user: {
            id: string;
            firstName: string;
            lastName: string;
            profileImageUrl?: string;
          };
          bio?: string;
          specializations: string[];
        }>;
      }>(query, { serviceId, locationId });
      
      return response.staffForService || [];
    } catch (error) {
      console.error('Error fetching staff for service:', error);
      return [];
    }
  },

  // Get available time slots
  async availableSlots({ 
    serviceId, 
    locationId, 
    staffProfileId, 
    date 
  }: {
    serviceId: string;
    locationId: string;
    staffProfileId?: string;
    date: string;
  }): Promise<Array<{
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>> {
    const query = `
      query AvailableSlots($serviceId: ID!, $locationId: ID!, $staffProfileId: ID, $date: String!) {
        availableSlots(
          serviceId: $serviceId, 
          locationId: $locationId, 
          staffProfileId: $staffProfileId, 
          date: $date
        ) {
          startTime
          endTime
          isAvailable
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        availableSlots: Array<{
          startTime: string;
          endTime: string;
          isAvailable: boolean;
        }>;
      }>(query, { serviceId, locationId, staffProfileId, date });
      
      return response.availableSlots || [];
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  },

  async getOrders(filter?: {
    search?: string;
    shopId?: string;
    customerId?: string;
    status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    totalAmount: number;
    currency: {
      id: string;
      code: string;
      symbol: string;
    };
    shop: {
      id: string;
      name: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      product: {
        id: string;
        name: string;
        sku?: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetOrders($filter: OrderFilterInput, $pagination: PaginationInput) {
        orders(filter: $filter, pagination: $pagination) {
          id
          customerName
          customerEmail
          status
          totalAmount
          currency {
            id
            code
            symbol
          }
          shop {
            id
            name
          }
          items {
            id
            quantity
            unitPrice
            totalPrice
            product {
              id
              name
              sku
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        shopId?: string;
        customerId?: string;
        status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
        dateFrom?: string;
        dateTo?: string;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ orders: Array<{
      id: string;
      customerName: string;
      customerEmail: string;
      status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
      totalAmount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
      shop: {
        id: string;
        name: string;
      };
      items: Array<{
        id: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        product: {
          id: string;
          name: string;
          sku?: string;
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.orders || [];
  },

  // Product Category functions
  async getProductCategories(filter?: {
    search?: string;
    shopId?: string;
    parentId?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    slug: string;
    parentId?: string;
    isActive: boolean;
    shopId?: string;
    productCount: number;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetProductCategories($filter: ProductCategoryFilterInput, $pagination: PaginationInput) {
        productCategories(filter: $filter, pagination: $pagination) {
          id
          name
          description
          slug
          parentId
          isActive
          shopId
          productCount
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ productCategories: Array<{
      id: string;
      name: string;
      description?: string;
      slug: string;
      parentId?: string;
      isActive: boolean;
      shopId?: string;
      productCount: number;
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.productCategories || [];
  },

  async getProductCategory(id: string): Promise<{
    id: string;
    name: string;
    description?: string;
    slug: string;
    parentId?: string;
    isActive: boolean;
    shopId?: string;
    productCount: number;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetProductCategory($id: ID!) {
        productCategory(id: $id) {
          id
          name
          description
          slug
          parentId
          isActive
          shopId
          productCount
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ productCategory: {
      id: string;
      name: string;
      description?: string;
      slug: string;
      parentId?: string;
      isActive: boolean;
      shopId?: string;
      productCount: number;
      createdAt: string;
      updatedAt: string;
    } | null }>(query, { id });

    return result.productCategory;
  },

  async createProductCategory(input: {
    name: string;
    description?: string;
    slug: string;
    parentId?: string;
    isActive?: boolean;
    shopId?: string;
  }): Promise<{
    success: boolean;
    message: string;
    category?: {
      id: string;
      name: string;
      description?: string;
      slug: string;
      parentId?: string;
      isActive: boolean;
      shopId?: string;
      productCount: number;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    const mutation = `
      mutation CreateProductCategory($input: CreateProductCategoryInput!) {
        createProductCategory(input: $input) {
          success
          message
          category {
            id
            name
            description
            slug
            parentId
            isActive
            shopId
            productCount
            createdAt
            updatedAt
          }
        }
      }
    `;

    const result = await gqlRequest<{ createProductCategory: {
      success: boolean;
      message: string;
      category?: {
        id: string;
        name: string;
        description?: string;
        slug: string;
        parentId?: string;
        isActive: boolean;
        shopId?: string;
        productCount: number;
        createdAt: string;
        updatedAt: string;
      };
    } }>(mutation, { input });

    return result.createProductCategory;
  },

  // Payment Provider functions
  async getPaymentProviders(filter?: {
    search?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPaymentProviders($filter: PaymentProviderFilterInput, $pagination: PaginationInput) {
        paymentProviders(filter: $filter, pagination: $pagination) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          paymentMethods {
            id
            name
            type
          }
          payments {
            id
            amount
            status
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ paymentProviders: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      paymentMethods: Array<{
        id: string;
        name: string;
        type: string;
      }>;
      payments: Array<{
        id: string;
        amount: number;
        status: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.paymentProviders || [];
  },

  async getPaymentProvider(id: string): Promise<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
    }>;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetPaymentProvider($id: ID!) {
        paymentProvider(id: $id) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          paymentMethods {
            id
            name
            type
          }
          payments {
            id
            amount
            status
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ paymentProvider: {
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      paymentMethods: Array<{
        id: string;
        name: string;
        type: string;
      }>;
      payments: Array<{
        id: string;
        amount: number;
        status: string;
      }>;
      createdAt: string;
      updatedAt: string;
    } | null }>(query, { id });

    return result.paymentProvider;
  },

  // Payment Method functions
  async getPaymentMethods(filter?: {
    search?: string;
    providerId?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    providerId: string;
    isActive: boolean;
    processingFeeRate?: number;
    fixedFee?: number;
    provider: {
      id: string;
      name: string;
      type: string;
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPaymentMethods($filter: PaymentMethodFilterInput, $pagination: PaginationInput) {
        paymentMethods(filter: $filter, pagination: $pagination) {
          id
          name
          type
          providerId
          isActive
          processingFeeRate
          fixedFee
          provider {
            id
            name
            type
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
      providerId: string;
      isActive: boolean;
      processingFeeRate?: number;
      fixedFee?: number;
      provider: {
        id: string;
        name: string;
        type: string;
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.paymentMethods || [];
  },

  // Payment functions
  async getPayments(filter?: {
    search?: string;
    orderId?: string;
    status?: string;
    providerId?: string;
    paymentMethodId?: string;
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    orderId?: string;
    amount: number;
    status: string;
    transactionId?: string;
    failureReason?: string;
    refundAmount?: number;
    currency: {
      id: string;
      code: string;
      name: string;
      symbol: string;
    };
    paymentMethod: {
      id: string;
      name: string;
      type: string;
      provider: {
        id: string;
        name: string;
        type: string;
      };
    };
    provider: {
      id: string;
      name: string;
      type: string;
    };
    order?: {
      id: string;
      customerName: string;
      customerEmail: string;
      totalAmount: number;
      shop: {
        id: string;
        name: string;
      };
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPayments($filter: PaymentFilterInput, $pagination: PaginationInput) {
        payments(filter: $filter, pagination: $pagination) {
          id
          orderId
          amount
          status
          transactionId
          failureReason
          refundAmount
          currency {
            id
            code
            name
            symbol
          }
          paymentMethod {
            id
            name
            type
            provider {
              id
              name
              type
            }
          }
          provider {
            id
            name
            type
          }
          order {
            id
            customerName
            customerEmail
            totalAmount
            shop {
              id
              name
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ payments: Array<{
      id: string;
      orderId?: string;
      amount: number;
      status: string;
      transactionId?: string;
      failureReason?: string;
      refundAmount?: number;
      currency: {
        id: string;
        code: string;
        name: string;
        symbol: string;
      };
      paymentMethod: {
        id: string;
        name: string;
        type: string;
        provider: {
          id: string;
          name: string;
          type: string;
        };
      };
      provider: {
        id: string;
        name: string;
        type: string;
      };
      order?: {
        id: string;
        customerName: string;
        customerEmail: string;
        totalAmount: number;
        shop: {
          id: string;
          name: string;
        };
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.payments || [];
  },

  async createPaymentProvider(input: {
    name: string;
    type: string;
    isActive?: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
  }): Promise<{
    success: boolean;
    message: string;
    provider?: {
      id: string;
      name: string;
      type: string;
      isActive: boolean;
    };
  }> {
    const mutation = `
      mutation CreatePaymentProvider($input: CreatePaymentProviderInput!) {
        createPaymentProvider(input: $input) {
          success
          message
          provider {
            id
            name
            type
            isActive
          }
        }
      }
    `;

    const result = await gqlRequest<{ createPaymentProvider: {
      success: boolean;
      message: string;
      provider?: {
        id: string;
        name: string;
        type: string;
        isActive: boolean;
      };
    } }>(mutation, { input });

    return result.createPaymentProvider;
  },

  // Shipping functions
  async getShippingProviders(filter?: {
    search?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    trackingUrl?: string;
    shippingMethods: Array<{
      id: string;
      name: string;
      description?: string;
      isActive: boolean;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      trackingEnabled: boolean;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingProviders($filter: ShippingProviderFilterInput, $pagination: PaginationInput) {
        shippingProviders(filter: $filter, pagination: $pagination) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          trackingUrl
          shippingMethods {
            id
            name
            description
            isActive
            estimatedDaysMin
            estimatedDaysMax
            trackingEnabled
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        type?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shippingProviders: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      trackingUrl?: string;
      shippingMethods: Array<{
        id: string;
        name: string;
        description?: string;
        isActive: boolean;
        estimatedDaysMin?: number;
        estimatedDaysMax?: number;
        trackingEnabled: boolean;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shippingProviders || [];
  },

  async getShippingMethods(filter?: {
    search?: string;
    providerId?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    providerId: string;
    isActive: boolean;
    estimatedDaysMin?: number;
    estimatedDaysMax?: number;
    trackingEnabled: boolean;
    provider: {
      id: string;
      name: string;
      type: string;
    };
    shippingRates: Array<{
      id: string;
      baseRate: number;
      minWeight?: number;
      maxWeight?: number;
      shippingZone: {
        id: string;
        name: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingMethods($filter: ShippingMethodFilterInput, $pagination: PaginationInput) {
        shippingMethods(filter: $filter, pagination: $pagination) {
          id
          name
          description
          providerId
          isActive
          estimatedDaysMin
          estimatedDaysMax
          trackingEnabled
          provider {
            id
            name
            type
          }
          shippingRates {
            id
            baseRate
            minWeight
            maxWeight
            shippingZone {
              id
              name
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        providerId?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shippingMethods: Array<{
      id: string;
      name: string;
      description?: string;
      providerId: string;
      isActive: boolean;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      trackingEnabled: boolean;
      provider: {
        id: string;
        name: string;
        type: string;
      };
      shippingRates: Array<{
        id: string;
        baseRate: number;
        minWeight?: number;
import { updateCMSSection } from './cms-update';
import { deletePageWithSections } from './cms-page-delete';
import { optimizedQueries } from './graphql-optimizations';

// Import form types
import {
  FormBase,
  FormStepBase,
  FormFieldBase,
  FormSubmissionBase,
  FormResult,
  FormStepResult,
  FormFieldResult,
  FormSubmissionResult,
  FormInput,
  FormStepInput,
  FormFieldInput,
  FormSubmissionInput,
  FormSubmissionStats
} from '@/types/forms';

import { Blog, Post } from '@/types/blog';

// Import calendar types
import {
  StaffProfileInput,
  CalendarStaffProfile,
  CalendarUser,
  CalendarLocation,
  CalendarStaffScheduleInput
} from '@/types/calendar';

// Función simple para realizar solicitudes GraphQL
export async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  timeout: number = 10000 // Default 10 second timeout
): Promise<T> {
  // Generar un ID único para esta solicitud para facilitar el seguimiento en logs
  const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    // Only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 gqlRequest [${requestId}] - Query: ${query.substring(0, 50).replace(/\s+/g, ' ')}...`);
      console.log(`🔍 gqlRequest [${requestId}] - Variables: ${JSON.stringify(variables).substring(0, 100)}...`);
      console.log(`🔍 gqlRequest [${requestId}] - Timeout: ${timeout}ms`);
    }
    
    // Create an AbortController to handle request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`⏱️ Request timeout: ${timeout}ms exceeded for [${requestId}]`);
      controller.abort();
    }, timeout);

    // Check if this is a public operation that doesn't require authentication
    const isPublicOperation = (
      query.includes('getPageBySlug') || 
      query.includes('getSectionComponents') || 
      query.includes('submitForm') || 
      query.includes('getMenus') ||
      query.includes('formBySlug') ||
      query.includes('getFormById') ||
      query.includes('form(id:') ||
      query.includes('forms') ||
      query.includes('formFields') ||
      query.includes('formSteps') ||
      query.includes('formStep') ||
      query.includes('GetForm') ||
      query.includes('FormStep') ||
      query.includes('FormField') ||
      query.includes('menus') ||
      query.includes('getAllCMSPages') ||
      query.includes('GetBlogs') ||
      query.includes('GetBlog') ||
      query.includes('GetPosts') ||
      query.includes('GetPostBySlug') ||
      query.includes('posts') ||
      query.includes('blog') ||
      query.includes('postBySlug')
    );

    // Get session token from cookies if available and not a public operation
    const getToken = () => {
      if (!isPublicOperation && typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('session-token='));
        if (tokenCookie) {
          return tokenCookie.split('=')[1].trim();
        }
      }
      return null;
    };
    
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Determine the GraphQL endpoint URL
    const getGraphQLUrl = () => {
      // If we're on the server (no window object), use absolute URL
      if (typeof window === 'undefined') {
        // In production, use the deployment URL or localhost for development
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NODE_ENV === 'production'
          ? 'https://your-domain.com' // Replace with your actual domain
          : 'http://localhost:3000';
        return `${baseUrl}/api/graphql`;
      }
      // On the client, use relative URL
      return '/api/graphql';
    };
    
    const graphqlUrl = getGraphQLUrl();
    
    try {
      console.log(`🔄 Starting GraphQL request [${requestId}] to ${graphqlUrl}`);
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          variables,
        }),
        signal: controller.signal,
        // Add cache control to improve performance for repeated queries
        cache: 'default',
      });
      
      // Clear the timeout as the request completed
      clearTimeout(timeoutId);
      
      // Handle non-ok responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`GraphQL HTTP error ${response.status} for [${requestId}]:`, errorText);
        
        // For public operations, return empty result instead of throwing
        if (isPublicOperation) {
          console.warn(`HTTP error in public operation [${requestId}], returning empty result`);
          return {} as T;
        }
        
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      
      console.log(`✅ GraphQL request completed [${requestId}]`);
      const responseData = await response.json();
      
      // Check for GraphQL errors
      if (responseData.errors && responseData.errors.length > 0) {
        const errorMessages = responseData.errors.map((e: { message: string }) => e.message).join(', ');
        console.error(`GraphQL errors for [${requestId}]:`, errorMessages);
        
        // For public operations, handle auth errors gracefully
        if (isPublicOperation && (errorMessages.includes('Not authenticated') || errorMessages.includes('Unauthorized'))) {
          console.warn(`Authentication error in public operation [${requestId}], continuing with partial data`);
          // Return partial data if available, or empty object
          return (responseData.data || {}) as T;
        }
        
        // For form operations, don't throw to prevent UI breakage
        if ((query.includes('form') || query.includes('Form')) && 
            (errorMessages.includes('Not authenticated') || errorMessages.includes('Unauthorized'))) {
          console.warn(`Form auth error [${requestId}], returning empty result`);
          return {} as T;
        }
        
        throw new Error(`GraphQL errors: ${errorMessages}`);
      }
      
      // Return the data property or the entire response if data is not present
      return responseData.data || responseData as T;
    } catch (error) {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
      
      // Special handling for abort errors (timeouts)
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error(`⚠️ Request timed out after ${timeout}ms [${requestId}]`);
        throw new Error(`La solicitud GraphQL excedió el tiempo límite de ${timeout}ms`);
      }
      
      // For public operations, swallow errors and return empty result
      if (isPublicOperation) {
        console.warn(`Error in public operation [${requestId}], returning empty result:`, error);
        return {} as T;
      }
      
      throw error;
    }
  } catch (error) {
    // Format the error for better debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`GraphQL error [${requestId}]:`, errorMessage);
    
    // Check if this is a query about forms and return empty data instead of throwing
    if (query.toLowerCase().includes('form')) {
      console.warn(`Form query error, returning empty result:`, errorMessage);
      return {} as T;
    }
    
    // Rethrow with more context
    throw new Error(`Error en solicitud GraphQL: ${errorMessage}`);
  }
}

// Interfaz para los componentes del CMS
export interface CMSComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

// Estructura de un componente de la base de datos
export interface CMSComponentDB {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  icon?: string;
  schema?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Estructura de una página CMS
export interface CMSPageDB {
  id: string;
  title: string;
  slug: string;
  description?: string;
  template?: string;
  isPublished: boolean;
  publishDate?: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  pageType: string;
  locale?: string; // Add locale property
  createdAt: string;
  updatedAt: string;
  sections?: Array<{id: string; order?: number}>;
}

// Input para crear/actualizar componentes
export interface CMSComponentInput {
  name: string;
  slug: string;
  description?: string;
  category?: string;
  schema?: Record<string, unknown>;
  icon?: string;
}

// Resultado de operaciones con componentes
export interface CMSComponentResult {
  success: boolean;
  message: string;
  component: CMSComponentDB | null;
}

// Actualizar según la nueva estructura de relaciones
export interface CMSSectionComponent {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

export interface CMSSectionResult {
  components: CMSSectionComponent[];
  lastUpdated: string | null;
}

// Definir la estructura de respuesta esperada para las importaciones dinámicas
interface SectionComponentsResponse {
  getSectionComponents?: {
    components: CMSComponent[];
    lastUpdated: string | null;
  };
}

// Interfaces for page data
export interface PageData {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  template?: string;
  isPublished: boolean;
  publishDate?: string | null;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  parentId?: string | null;
  order?: number;
  pageType: string;
  locale?: string;
  scrollType?: 'normal' | 'smooth';
  createdAt?: string;
  updatedAt?: string;
  isDefault?: boolean;
  sections?: Array<{
    id: string;
    sectionId: string;
    name?: string;
    order: number;
    // Otra metadata relevante
  }>; // Adaptado a la estructura de CMSSection
  seo?: {
    title?: string; // Add title (same as metaTitle)
    description?: string; // Add description (same as metaDescription)
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
}

export interface SectionData {
  id: string;
  title?: string;
  order: number;
  components: CMSComponent[];
  backgroundImage?: string;
  backgroundType?: string;
}

// Generic GraphQL response type
interface GraphQLResponse<T> {
  data?: {
    [key: string]: T;
  };
  errors?: Array<{ message: string }>;
}


// Función de utilidad para validar la pertenencia de secciones
export const validateSectionOwnership = (sectionId: string, pageId: string): boolean => {
  return sectionId.startsWith(`page-${pageId}-`);
};


// Get a page by its slug
async function getPageBySlug(slug: string): Promise<PageData | null> {
  try {
    console.log(`[getPageBySlug] Attempting to fetch page with slug: "${slug}"`);
    
    // Check cache first
    const cacheKey = `page_slug_${slug}`;
    const cachedPage = getCachedResponse<PageData>(cacheKey);
    
    if (cachedPage) {
      console.log(`[getPageBySlug] Found cached page: ${cachedPage.title}`);
      return cachedPage;
    }
    
    const query = `
      query GetPageBySlug($slug: String!) {
        getPageBySlug(slug: $slug) {
          id
          title
          slug
          description
          template
          isPublished
          publishDate
          featuredImage
          metaTitle
          metaDescription
          parentId
          order
          pageType
          locale
          scrollType
          isDefault
          createdAt
          updatedAt
          sections {
            id
            sectionId
            name
          }
          seo {
            title
            description
            keywords
            ogTitle
            ogDescription
            ogImage
            twitterTitle
            twitterDescription
            twitterImage
            canonicalUrl
            structuredData
          }
        }
      }
    `;

    const variables = { slug };
    
    console.log(`[getPageBySlug] Executing GraphQL query with variables:`, variables);
    const result = await gqlRequest<{ 
      getPageBySlug?: PageData; 
      data?: { getPageBySlug: PageData };
      errors?: Array<{ message: string }>
    }>(query, variables);
    
    console.log(`[getPageBySlug] GraphQL result:`, result);
    
    // Check for errors in the response
    if (result.errors && result.errors.length > 0) {
      console.error(`[getPageBySlug] GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
      return null;
    }
    
    // Try to extract page data from different possible response structures
    let page: PageData | null = null;
    
    // Direct property
    if (result.getPageBySlug) {
      page = result.getPageBySlug;
    } 
    // Nested under data
    else if (result.data?.getPageBySlug) {
      page = result.data.getPageBySlug;
    }
    // Check if data is the top-level property with getPageBySlug inside
    else if (typeof result === 'object' && result !== null && 'data' in result) {
      const data = (result as GraphQLResponse<PageData>).data;
      if (data && typeof data === 'object' && 'getPageBySlug' in data) {
        page = data.getPageBySlug;
      }
    }
    
    // Found a page
    if (page && page.id) {
      console.log(`[getPageBySlug] Found page: ID=${page.id}, Title="${page.title}"`);
      
      // Filtrar las secciones con sectionId null para evitar errores GraphQL
      if (page.sections && Array.isArray(page.sections)) {
        page.sections = page.sections.filter(section => 
          section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
        );
      }
      
      // Ensure there's always at least an empty SEO object
      if (!page.seo) {
        page.seo = {};
      }
      
      // Cache the page data
      setCachedResponse(cacheKey, page);
      
      return page;
    }
    
    // Try to find by ID as a fallback (less verbose)
    try {
      const listQuery = `
        query GetAllPages {
          getAllCMSPages {
            id
            slug
            title
          }
        }
      `;
      const listResult = await gqlRequest<{ 
        getAllCMSPages: Array<{ id: string; slug: string; title: string }> 
      }>(listQuery);
      
      // Check different possible structures for the getAllCMSPages result
      let pages: Array<{ id: string; slug: string; title: string }> = [];
      
      if (listResult.getAllCMSPages) {
        pages = listResult.getAllCMSPages;
      } else if (typeof listResult === 'object' && listResult !== null && 'data' in listResult) {
        const data = (listResult as GraphQLResponse<Array<{ id: string; slug: string; title: string }>>).data;
        if (data && typeof data === 'object' && 'getAllCMSPages' in data) {
          pages = data.getAllCMSPages;
        }
      }
      
      // Check if a matching page exists but wasn't returned correctly
      if (pages.length > 0) {
        const matchingPage = pages.find(p => 
          p.slug === slug || 
          p.slug.toLowerCase() === slug.toLowerCase() ||
          p.slug.replace(/-/g, '') === slug.replace(/-/g, '') ||
          p.slug.replace(/-/g, ' ') === slug.replace(/-/g, ' ')
        );
        
        if (matchingPage) {
          // Try to fetch by ID as a fallback
          const foundPage = await getPageById(matchingPage.id);
          if (foundPage) {
            // Cache the page data
            setCachedResponse(cacheKey, foundPage);
            return foundPage;
          }
        }
      }
    } catch (listError) {
      console.error(`Error listing pages:`, listError);
    }
    
    console.log(`[getPageBySlug] No page found with slug: "${slug}"`);
    return null;
  } catch (error) {
    console.error(`[getPageBySlug] Error retrieving page with slug "${slug}":`, error);
    throw error;
  }
}

// Update a page
async function updatePage(id: string, input: {
  title?: string;
  slug?: string;
  description?: string | null;
  template?: string;
  isPublished?: boolean;
  publishDate?: string | null;
  featuredImage?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  parentId?: string | null;
  order?: number;
  pageType?: string;
  locale?: string;
  isDefault?: boolean;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonicalUrl?: string;
    structuredData?: Record<string, unknown>;
  };
  sectionIds?: string[]; // This is used by client code but converted to sections
  sections?: string[]; // This matches the GraphQL schema
}): Promise<{
  success: boolean;
  message: string;
  page: PageData | null;
}> {
  try {
    // Preprocess SEO data for consistency
    const seoData = input.seo || {};
    const titleValue = input.metaTitle || seoData.title;
    const descriptionValue = input.metaDescription || seoData.description;
    
    if (titleValue) {
      if (!seoData.title) seoData.title = titleValue;
      if (!input.metaTitle) input.metaTitle = titleValue;
    }
    
    if (descriptionValue) {
      if (!seoData.description) seoData.description = descriptionValue;
      if (!input.metaDescription) input.metaDescription = descriptionValue;
    }

    // Convert sectionIds to sections format if present
    const inputData = { ...input };
    
    // If sectionIds is provided but sections isn't, move the values
    if (inputData.sectionIds && !inputData.sections) {
      inputData.sections = inputData.sectionIds;
      delete inputData.sectionIds;
    }

    const mutation = `
      mutation UpdatePage($id: ID!, $input: UpdatePageInput!) {
        updatePage(id: $id, input: $input) {
          success
          message
          page {
            id
            title
            slug
            description
            template
            isPublished
            pageType
            locale
            metaTitle
            metaDescription
            featuredImage
            publishDate
            isDefault
            updatedAt
            sections {
              id
              sectionId
              name
              order
            }
            seo {
              title
              description
              keywords
              ogTitle
              ogDescription
              ogImage
              twitterTitle
              twitterDescription
              twitterImage
              canonicalUrl
              structuredData
            }
          }
        }
      }
    `;

    console.log('Updating page with data:', { id, input: inputData });
    const variables = { id, input: inputData };
    const result = await gqlRequest<{ 
      updatePage?: { success: boolean; message: string; page: PageData | null };
      data?: { updatePage: { success: boolean; message: string; page: PageData | null } }
    }>(mutation, variables);
    console.log('Update page result:', result);
    
    // Handle different response structures
    let opResult = null;
    if (result.updatePage) {
      opResult = result.updatePage;
    } else if (result.data?.updatePage) {
      opResult = result.data.updatePage;
    }

    if (opResult && opResult.success && opResult.page) {
      const updatedPageData = opResult.page;
      if (updatedPageData.slug) {
        optimizedQueries.invalidateCache(`page:${updatedPageData.slug}`);
        clearCache(`page_slug_${updatedPageData.slug}`); // local cache
      }
      optimizedQueries.invalidateCache(`page_id:${id}`);
      clearCache(`page_id_${id}`); // local cache

      if (updatedPageData.isDefault && updatedPageData.locale) {
        optimizedQueries.invalidateCache(`default_page_${updatedPageData.locale}`);
        clearCache(`default_page_${updatedPageData.locale}`); // local cache
      }
      // Invalidate related sections if their structure might change or be affected
      if (updatedPageData.sections) {
        updatedPageData.sections.forEach(section => {
          if (section.sectionId) {
            optimizedQueries.invalidateCache(`section:${section.sectionId}`);
            clearCache(`section_components_${section.sectionId}`); // local cache
          }
        });
      }
      optimizedQueries.invalidateCache('allPages'); 
      clearCache('allPages'); // local cache for general page lists
    } else if (opResult && opResult.success) {
      // Page data might not be returned but operation was successful
      // Attempt to invalidate based on input if available
      if (input.slug) {
        optimizedQueries.invalidateCache(`page:${input.slug}`);
        clearCache(`page_slug_${input.slug}`);
      }
      optimizedQueries.invalidateCache(`page_id:${id}`);
      clearCache(`page_id_${id}`);
      if (input.isDefault && input.locale) {
        optimizedQueries.invalidateCache(`default_page_${input.locale}`);
        clearCache(`default_page_${input.locale}`);
      }
      optimizedQueries.invalidateCache('allPages');
      clearCache('allPages');
    }
    
    if (opResult) return opResult;

    return {
      success: false,
      message: 'Failed to update page: Unexpected response format',
      page: null
    };
  } catch (error) {
    console.error('Error updating page:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating page',
      page: null
    };
  }
}

// Get a page by ID
async function getPageById(id: string): Promise<PageData | null> {
  // Check cache first
  const cacheKey = `page_id_${id}`;
  const cachedPage = getCachedResponse<PageData>(cacheKey);
  
  if (cachedPage) {
    console.log(`[getPageById] Found cached page: ID=${id}`);
    return cachedPage;
  }
  
  const GET_PAGE_BY_ID_QUERY = `
    query GetPageById($id: ID!) {
      page(id: $id) {
        id
        title
        slug
        description
        template
        isPublished
        publishDate
        featuredImage
        metaTitle
        metaDescription
        parentId
        order
        pageType
        locale
        scrollType
        isDefault
        createdAt
        updatedAt
        sections {
          id
          sectionId
          name
          order
        }
        seo {
          title
          description
          keywords
          ogTitle
          ogDescription
          ogImage
          twitterTitle
          twitterDescription
          twitterImage
          canonicalUrl
          structuredData
        }
      }
    }
  `;

  try {
    console.log(`[getPageById] Attempting to fetch page with ID: "${id}"`);
    const variables = { id };
    
    const result = await gqlRequest<{ 
      page?: PageData;
      data?: { page: PageData }; // Alternative structure
      errors?: Array<{ message: string }>
    }>(GET_PAGE_BY_ID_QUERY, variables);

    console.log(`[getPageById] GraphQL result for ID "${id}":`, result);

    if (result.errors && result.errors.length > 0) {
      console.error(`[getPageById] GraphQL errors for ID "${id}": ${result.errors.map(e => e.message).join(', ')}`);
      return null;
    }

    let page: PageData | null = null;

    if (result.page) {
      page = result.page;
    } else if (result.data?.page) {
      page = result.data.page;
    }

    if (page && page.id) {
      console.log(`[getPageById] Found page: ID=${page.id}, Title="${page.title}"`);
      
      // Filter sections with null sectionId
      if (page.sections && Array.isArray(page.sections)) {
        page.sections = page.sections.filter(section => 
          section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
        );
      }
      
      // Ensure there's always at least an empty SEO object
      if (!page.seo) {
        page.seo = {};
      }
      
      // Cache the page data
      setCachedResponse(cacheKey, page);
      return page;
    }
    
    console.log(`[getPageById] No page found with ID: "${id}"`);
    return null;
  } catch (error) {
    console.error(`[getPageById] Error retrieving page with ID "${id}":`, error);
    // Do not throw error, just return null as per original behavior of function
    return null;
  }
}

// Get page with detailed section components for preview
export async function getPagePreview(pageData: PageData): Promise<{
  page: PageData;
  sections: Array<{
    id: string;
    title?: string;
    order: number;
    components: CMSComponent[];
  }>;
}> {
  console.log(`Generating preview for page: "${pageData.title}"`);
  
  const sections: Array<{
    id: string;
    title?: string;
    order: number;
    components: CMSComponent[];
  }> = [];
  
  if (!pageData.sections || !Array.isArray(pageData.sections) || pageData.sections.length === 0) {
    console.log(`Page has no sections to preview`);
    return { page: pageData, sections: [] };
  }
  
  // Log all sections we're going to fetch
  console.log(`Fetching components for ${pageData.sections.length} sections`);
  
  // Process each section to get its components
  for (const section of pageData.sections) {
    try {
      // Only fetch if we have a section ID
      if (!section.id) {
        console.log(`Section missing ID, skipping component fetch`);
        continue;
      }
      
      // Get the CMSSection data first
      const cmsSection = await cmsOperations.getCMSSection(section.id);
      if (!cmsSection) {
        console.log(`CMSSection not found for ID: ${section.id}`);
        continue;
      }
      
      console.log(`Fetching components for section ID: ${cmsSection.sectionId}`);
      
      // Get section title if available
      const sectionTitle = cmsSection.name || `Section ${section.order || 0}`;
      
      // Fetch the components for this section using the CMSSection's sectionId
      const result = await cmsOperations.getSectionComponents(cmsSection.sectionId);
      const { components } = result;
      
      console.log(`Fetched ${components.length} components for section "${sectionTitle}"`);
      
      // Add to our sections array with components
      sections.push({
        id: section.id,
        title: sectionTitle,
        order: section.order || 0,
        components
      });
      
      // Log component types for debugging
      if (components.length > 0) {
        console.log(`Component types in section "${sectionTitle}":`, 
          components.map((c: CMSComponent) => c.type).join(', '));
      }
    } catch (error) {
      console.error(`Error fetching components for section ${section.id}:`, error);
      
      // Add the section with empty components to maintain structure
      sections.push({
        id: section.id,
        title: 'title' in section ? (section.title as string) : `Section ${section.order || 0}`,
        order: section.order || 0,
        components: []
      });
    }
  }
  
  // Sort sections by order
  sections.sort((a, b) => a.order - b.order);
  
  console.log(`Page preview generated with ${sections.length} populated sections`);
  
  return {
    page: pageData,
    sections
  };
}


// Update a section name
async function updateSectionName(sectionId: string, name: string): Promise<{
  success: boolean;
  message: string;
  lastUpdated?: string | null;
}> {
  try {
    // Use the updateCMSSection function from cms-update.ts
    const result = await updateCMSSection(sectionId, { name });

    if (result.success) {
      optimizedQueries.invalidateCache(`section:${sectionId}`);
      clearCache(`section_components_${sectionId}`); // Local cache for section components
      clearCache(`section_${sectionId}`); // Local cache for section data if separate
    }
    
    return {
      success: result.success,
      message: result.message,
      lastUpdated: result.lastUpdated
    };
  } catch (error) {
    console.error('Error updating section name:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating section name'
    };
  }
}

// Get section components for editing
export async function loadSectionComponentsForEdit(sectionId: string): Promise<{
  sectionId: string;
  components: CMSComponent[];
  lastUpdated: string | null;
}> {
  try {
    console.log(`Loading components for section ${sectionId} in editor`);
    
    // Fetch the components for this section
    const result = await cmsOperations.getSectionComponents(sectionId);
    const { components, lastUpdated } = result;
    
    console.log(`Editor: Loaded ${components.length} components for section ${sectionId}`);
    
    if (components.length > 0) {
      // Log types and data structure to help with editing
      console.log(`Component types for editing:`, components.map((c: CMSComponent) => c.type));
      console.log(`First component data structure:`, 
        Object.keys(components[0].data || {}).join(', '));
    }
    
    return { 
      sectionId,
      components, 
      lastUpdated 
    };
  } catch (error) {
    console.error(`Error loading section components for edit:`, error);
    return { 
      sectionId,
      components: [], 
      lastUpdated: null 
    };
  }
}

// Update the component edit function to handle background properties
export async function applyComponentEdit(
  sectionId: string,
  componentId: string,
  editedData: Record<string, unknown>
): Promise<{
  success: boolean;
  message: string;
  lastUpdated: string | null;
}> {
  try {
    console.log(`Applying edits to component ${componentId} in section ${sectionId}`);
    console.log('Edit data:', editedData);
    
    // First fetch the current components
    const result = await cmsOperations.getSectionComponents(sectionId);
    const { components } = result;
    
    if (!components || components.length === 0) {
      return {
        success: false,
        message: `No components found in section ${sectionId}`,
        lastUpdated: null
      };
    }
    
    // Find the component to update
    const componentIndex = components.findIndex((c: CMSComponent) => c.id === componentId);
    
    if (componentIndex === -1) {
      console.error(`Component ${componentId} not found in section ${sectionId}`);
      return {
        success: false,
        message: `Component ${componentId} not found in section`,
        lastUpdated: null
      };
    }
    
    console.log(`Found component at index ${componentIndex}, updating data`);
    
    // Create a new array with the updated component
    const updatedComponents = [...components];
    const currentComponent = updatedComponents[componentIndex];
    
    // Merge the new data with existing data, preserving all properties
    const mergedData = {
      ...currentComponent.data,
      ...editedData
    };
    
    // Special handling for background properties to ensure they persist
    if (editedData.backgroundImage !== undefined) {
      mergedData.backgroundImage = editedData.backgroundImage;
    }
    if (editedData.backgroundType !== undefined) {
      mergedData.backgroundType = editedData.backgroundType;
    }
    
    updatedComponents[componentIndex] = {
      ...currentComponent,
      data: mergedData
    };
    
    console.log(`Saving updated component with merged data:`, {
      id: updatedComponents[componentIndex].id,
      type: updatedComponents[componentIndex].type,
      dataKeys: Object.keys(updatedComponents[componentIndex].data || {}),
      backgroundImage: mergedData.backgroundImage,
      backgroundType: mergedData.backgroundType
    });
    
    // Save all components back to the section
    const result2 = await cmsOperations.saveSectionComponents(sectionId, updatedComponents);
    
    return result2;
  } catch (error) {
    console.error('Error applying component edit:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating component',
      lastUpdated: null
    };
  }
}

// Update a component title in a section
async function updateComponentTitle(sectionId: string, componentId: string, title: string): Promise<{
  success: boolean;
  message: string;
  lastUpdated?: string | null;
}> {
  try {
    // First get current section components
    const sectionData = await cmsOperations.getSectionComponents(sectionId);
    
    if (!sectionData.components || !Array.isArray(sectionData.components)) {
      return {
        success: false,
        message: 'Failed to get section components'
      };
    }
    
    // Find the component by ID and update its title
    const updatedComponents = sectionData.components.map((component: CMSComponent) => {
      if (component.id === componentId) {
        // Preserve the original data and add title
        return {
          ...component,
          data: {
            ...component.data,
            componentTitle: title
          }
        };
      }
      return component;
    });
    
    // Save the updated components
    const saveResult = await cmsOperations.saveSectionComponents(sectionId, updatedComponents);
    
    return {
      success: saveResult.success,
      message: saveResult.message || `Component title ${saveResult.success ? 'updated' : 'update failed'}`,
      lastUpdated: saveResult.lastUpdated
    };
  } catch (error) {
    console.error('Error updating component title:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error updating component title'
    };
  }
}


// Create a simple in-memory cache for API responses
const apiCache: Record<string, { data: unknown; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute cache TTL by default

// Get a cached response or undefined if expired or not found
function getCachedResponse<T>(cacheKey: string): T | undefined {
  const cachedItem = apiCache[cacheKey];
  
  if (!cachedItem) return undefined;
  
  const now = Date.now();
  if (now - cachedItem.timestamp > CACHE_TTL) {
    // Cache expired, remove it
    delete apiCache[cacheKey];
    return undefined;
  }
  
  return cachedItem.data as T;
}

// Cache an API response
function setCachedResponse<T>(cacheKey: string, data: T): void {
  apiCache[cacheKey] = {
    data,
    timestamp: Date.now()
  };
}

// Clear cache for a specific key or pattern
function clearCache(keyPattern?: string): void {
  if (!keyPattern) {
    // Clear all cache
    Object.keys(apiCache).forEach(key => delete apiCache[key]);
    return;
  }
  
  // Clear matching cache entries
  Object.keys(apiCache).forEach(key => {
    if (key.includes(keyPattern)) {
      delete apiCache[key];
    }
  });
}

// Define a type for the section components result
interface SectionComponentsResult {
  components: CMSComponent[];
  lastUpdated: string | null;
}

// Add this new type for HeaderStyle input
export interface HeaderStyleInput {
  transparency?: number;
  headerSize?: 'sm' | 'md' | 'lg';
  menuAlignment?: 'left' | 'center' | 'right';
  menuButtonStyle?: 'default' | 'filled' | 'outline';
  mobileMenuStyle?: 'fullscreen' | 'dropdown' | 'sidebar';
  mobileMenuPosition?: 'left' | 'right';
  transparentHeader?: boolean;
  borderBottom?: boolean;
  fixedHeader?: boolean;
  advancedOptions?: Record<string, unknown>;
}

export interface FooterStyleInput {
  transparency?: number;
  columnLayout?: 'stacked' | 'grid' | 'flex';
  socialAlignment?: 'left' | 'center' | 'right';
  borderTop?: boolean;
  alignment?: 'left' | 'center' | 'right';
  padding?: 'small' | 'medium' | 'large';
  width?: 'full' | 'container' | 'narrow';
  advancedOptions?: Record<string, unknown>;
}

// Operaciones CMS
export const cmsOperations = {
  // Obtener todas las secciones CMS
  getAllCMSSections: async () => {
    try {
      const query = `
        query GetAllCMSSections {
          getAllCMSSections {
            id
            sectionId
            name
            description
            lastUpdated
            createdAt
            updatedAt
            createdBy
            components {
              id
              componentId
              order
            }
          }
        }
      `;

      try {
        const result = await gqlRequest<{ getAllCMSSections: Array<{
          id: string;
          sectionId: string;
          name: string;
          description: string;
          lastUpdated: string;
          createdAt: string;
          updatedAt: string;
          createdBy: string | null;
          components: unknown;
        }> }>(query);

        if (!result || !result.getAllCMSSections) {
          return [];
        }
        
        return result.getAllCMSSections;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSSections:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllCMSSections:`, error);
      return [];
    }
  },

  // Obtener componentes de una sección
  getSectionComponents: async (sectionId: string): Promise<SectionComponentsResult> => {
    try {
      // Exit early if sectionId is invalid
      if (!sectionId) {
        return { components: [], lastUpdated: null };
      }
      
      // Clean the sectionId by removing any query parameters or hashes
      let cleanedSectionId = sectionId;
      if (cleanedSectionId.includes('?')) {
        cleanedSectionId = cleanedSectionId.split('?')[0];
      }
      if (cleanedSectionId.includes('#')) {
        cleanedSectionId = cleanedSectionId.split('#')[0];
      }
      
      // Check cache first
      const cacheKey = `section_components_${cleanedSectionId}`;
      const cachedData = getCachedResponse<SectionComponentsResult>(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      // Define the GraphQL query
      const query = `
        query GetSectionComponents($sectionId: ID!) {
          getSectionComponents(sectionId: $sectionId) {
            components {
              id
              type
              data
            }
            lastUpdated
          }
        }
      `;

      try {
        // Execute the GraphQL query
        const result = await gqlRequest<SectionComponentsResponse>(query, { sectionId: cleanedSectionId });
        
        if (!result || !result.getSectionComponents) {
          return { components: [], lastUpdated: null };
        }
        
        const { components = [], lastUpdated } = result.getSectionComponents;
        
        const response = { components, lastUpdated };
        
        // Store in cache
        setCachedResponse(cacheKey, response);
        
        return response;
      } catch (error) {
        console.error('Error fetching section components:', error);
        return { components: [], lastUpdated: null };
      }
    } catch (error) {
      console.error('Error in getSectionComponents:', error);
      return { components: [], lastUpdated: null };
    }
  },

  // Guardar componentes de una sección
  saveSectionComponents: async (
    sectionId: string, 
    components: CMSComponent[]
  ): Promise<{ 
    success: boolean; 
    message: string; 
    lastUpdated: string | null 
  }> => {
    try {
      // Ensure all components have an ID and remove any 'title' properties
      // since the GraphQL schema doesn't accept 'title' in ComponentInput
      const validComponents = components.map(comp => {
        // Ensure component has an ID
        const componentWithId = !comp.id 
          ? { ...comp, id: crypto.randomUUID() } 
          : comp;
        
        // Remove 'title' property if it exists
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, ...componentWithoutTitle } = componentWithId as { title?: string } & CMSComponent;
        
        return componentWithoutTitle;
      });
      
      const mutation = `
        mutation SaveSectionComponents($input: SaveSectionInput!) {
          saveSectionComponents(input: $input) {
            success
            message
            lastUpdated
          }
        }
      `;
      
      const input = {
        sectionId,
        components: validComponents
      };
      
      console.log(`Starting saveSectionComponents mutation for section ${sectionId} with ${components.length} components`);
      
      // Use a longer timeout for saving components - reduced from 30s to 15s after optimization
      const result = await gqlRequest<{ 
        saveSectionComponents: { 
          success: boolean; 
          message: string; 
          lastUpdated: string | null;
        }
      }>(mutation, { input }, 15000);
      
      if (!result) {
        console.error('No result from GraphQL request in saveSectionComponents');
        throw new Error('No result received from server');
      }
      
      if (!result.saveSectionComponents) {
        console.error('Missing saveSectionComponents in result:', result);
        throw new Error('Invalid response format: missing saveSectionComponents field');
      }
      
      // Clear cache for this section
      clearCache(`section_components_${sectionId}`);
      optimizedQueries.invalidateCache(`section:${sectionId}`);
      
      return result.saveSectionComponents;
    } catch (error) {
      console.error('Error saving section components:', error);
      return {
        success: false,
        message: `Error al guardar componentes: "${error instanceof Error ? error.message : 'Error desconocido'}"`,
        lastUpdated: null
      };
    }
  },

  // Obtener todas las páginas CMS
  getAllPages: async () => {
    try {
      const query = `
        query GetAllCMSPages {
          getAllCMSPages {
            id
            title
            slug
            description
            isPublished
            pageType
            locale
            createdAt
            updatedAt
            isDefault
            sections {
              id
              sectionId
              name
            }
          }
        }
      `;

      console.log('GraphQL query para getAllCMSPages');

      try {
        const result = await gqlRequest<{ getAllCMSPages: CMSPageDB[] }>(query);
        
        console.log("Resultado GraphQL getAllCMSPages:", JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getAllCMSPages) {
          console.log("No se encontraron páginas o la estructura no es la esperada");
          return [];
        }
        
        // Filtrar las secciones con sectionId null para evitar errores GraphQL
        const pagesWithValidSections = result.getAllCMSPages.map(page => {
          if (page.sections && Array.isArray(page.sections)) {
            // Asegurar que todas las secciones tengan sectionId válido
            page.sections = page.sections.filter(section => 
              section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
            );
          }
          return page;
        });
        
        return pagesWithValidSections;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSPages:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllPages:`, error);
      return [];
    }
  },

  // Obtener todos los identificadores de página CMS
  getAllPageIdentifiers: async () => {
    const GET_ALL_PAGE_IDENTIFIERS_QUERY = `
      query GetAllCMSPageIdentifiers {
        getAllCMSPages {
          id
          slug
          locale
        }
      }
    `;
    try {
      const result = await gqlRequest<{ getAllCMSPages: Array<{ id: string; slug: string; locale?: string | null }> }>(GET_ALL_PAGE_IDENTIFIERS_QUERY);
      if (!result || !result.getAllCMSPages) {
        return [];
      }
      return result.getAllCMSPages.map(page => ({
        id: page.id,
        slug: page.slug,
        locale: page.locale || 'en', // Default locale to 'en' if missing
      }));
    } catch (error) {
      console.error(`Error general en getAllPageIdentifiers:`, error);
      return [];
    }
  },

  // Obtener componentes por tipo
  getComponentsByType: async (type: string) => {
    try {
      const query = `
        query GetCMSComponentsByType($type: String!) {
          getCMSComponentsByType(type: $type) {
            id
            name
            slug
            description
            category
            icon
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log(`GraphQL query para getCMSComponentsByType, tipo: ${type}`);

      try {
        const result = await gqlRequest<{ getCMSComponentsByType: CMSComponentDB[] }>(query, { type });
        
        console.log(`Resultado GraphQL getCMSComponentsByType (${type}):`, JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getCMSComponentsByType) {
          console.log(`No se encontraron componentes de tipo ${type}`);
          return [];
        }
        
        return result.getCMSComponentsByType;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getCMSComponentsByType (${type}):`, error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getComponentsByType:`, error);
      return [];
    }
  },

  // Obtener un componente por ID
  getComponentById: async (id: string) => {
    try {
      const query = `
        query GetCMSComponent($id: ID!) {
          getCMSComponent(id: $id) {
            id
            name
            slug
            description
            category
            icon
            schema
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log(`GraphQL query para getCMSComponent, id: ${id}`);

      try {
        const result = await gqlRequest<{ getCMSComponent: CMSComponentDB | null }>(query, { id });
        
        if (!result || !result.getCMSComponent) {
          console.log(`No se encontró el componente con id ${id}`);
          return null;
        }
        
        return result.getCMSComponent;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getCMSComponent (${id}):`, error);
        return null;
      }
    } catch (error) {
      console.error(`Error general en getComponentById:`, error);
      return null;
    }
  },

  // Crear un nuevo componente
  createComponent: async (input: CMSComponentInput) => {
    try {
      const mutation = `
        mutation CreateCMSComponent($input: CreateCMSComponentInput!) {
          createCMSComponent(input: $input) {
            success
            message
            component {
              id
              name
              slug
              description
              category
              icon
              isActive
              createdAt
              updatedAt
            }
          }
        }
      `;

      console.log('Mutation para crear componente:', input.name);
      
      const result = await gqlRequest<{ createCMSComponent: CMSComponentResult }>(mutation, { input });
      
      console.log('Resultado de crear componente:', result);
      
      return result.createCMSComponent;
    } catch (error) {
      console.error('Error al crear componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al crear componente',
        component: null
      };
    }
  },

  // Actualizar un componente existente
  updateComponent: async (id: string, input: Partial<CMSComponentInput>) => {
    try {
      const mutation = `
        mutation UpdateCMSComponent($id: ID!, $input: UpdateCMSComponentInput!) {
          updateCMSComponent(id: $id, input: $input) {
            success
            message
            component {
              id
              name
              slug
              description
              category
              icon
              isActive
              createdAt
              updatedAt
            }
          }
        }
      `;

      console.log(`Mutation para actualizar componente: ${id}`);
      
      const result = await gqlRequest<{ updateCMSComponent: CMSComponentResult }>(mutation, { id, input });
      
      console.log('Resultado de actualizar componente:', result);
      
      return result.updateCMSComponent;
    } catch (error) {
      console.error('Error al actualizar componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al actualizar componente',
        component: null
      };
    }
  },

  // Eliminar un componente
  deleteComponent: async (id: string) => {
    try {
      const mutation = `
        mutation DeleteCMSComponent($id: ID!) {
          deleteCMSComponent(id: $id) {
            success
            message
          }
        }
      `;

      console.log(`Mutation para eliminar componente: ${id}`);
      
      const result = await gqlRequest<{ deleteCMSComponent: { success: boolean; message: string } }>(mutation, { id });
      
      console.log('Resultado de eliminar componente:', result);
      
      return result.deleteCMSComponent;
    } catch (error) {
      console.error('Error al eliminar componente:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido al eliminar componente'
      };
    }
  },

  // Create a new CMS page with an automatic section
  createPage: async (pageInput: {
    title: string;
    slug: string;
    description?: string;
    template?: string;
    isPublished?: boolean;
    pageType?: string;
    locale?: string;
    metaTitle?: string;
    metaDescription?: string;
    featuredImage?: string;
    isDefault?: boolean;
    sections?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    page: {
      id: string;
      title: string;
      slug: string;
    } | null;
  }> => {
    // Generate a unique request ID for logging
    const requestId = `createPage-${Math.random().toString(36).substring(2, 9)}`;
    
    console.log(`🔍 [${requestId}] GraphQL CLIENT - createPage - Starting request with auto-section`);
    
    try {
      // Step 1: Create the page first
      const pageQuery = `
        mutation CreatePage($input: CreatePageInput!) {
          createPage(input: $input) {
            success
            message
            page {
              id
              title
              slug
            }
          }
        }
      `;
      
      const pageVariables = {
        input: pageInput
      };
      
      const pageResult = await gqlRequest<{
        createPage: {
          success: boolean;
          message: string;
          page: {
            id: string;
            title: string;
            slug: string;
          } | null;
        }
      }>(pageQuery, pageVariables);
      
      console.log(`✅ [${requestId}] GraphQL CLIENT - createPage - Page created:`, pageResult);
      
      if (!pageResult || !pageResult.createPage || !pageResult.createPage.success || !pageResult.createPage.page) {
        console.error(`❌ [${requestId}] GraphQL CLIENT - createPage - Error: Failed to create page`);
        return { 
          success: false, 
          message: pageResult?.createPage?.message || 'Failed to create page', 
          page: null 
        };
      }
      
      const createdPage = pageResult.createPage.page;
      
      // Step 2: Create a default section for the page
      console.log(`🔧 [${requestId}] Creating default section for page ${createdPage.id}`);
      
      // Generate section ID based on page
      const generatePageSectionId = (pageId: string, sectionName: string): string => {
        const cleanName = sectionName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        return `${pageId.substring(0, 8)}-${cleanName}-${Date.now().toString(36)}`;
      };
      
      const defaultSectionName = 'Contenido Principal';
      const sectionIdentifier = generatePageSectionId(createdPage.id, defaultSectionName);
      
      // Create the CMS section
      const sectionResult = await cmsOperations.createCMSSection({
        sectionId: sectionIdentifier,
        name: defaultSectionName,
        description: `Sección principal para la página "${createdPage.title}"`
      });
      
      console.log(`🔧 [${requestId}] Section creation result:`, sectionResult);
      
      if (sectionResult.success && sectionResult.section) {
        // Step 3: Associate the section with the page
        console.log(`🔗 [${requestId}] Associating section ${sectionResult.section.id} to page ${createdPage.id}`);
        
        const associateResult = await cmsOperations.associateSectionToPage(
          createdPage.id,
          sectionResult.section.id,
          0 // First section, order 0
        );
        
        console.log(`🔗 [${requestId}] Association result:`, associateResult);
        
        if (associateResult.success) {
          console.log(`✅ [${requestId}] Page and section created successfully`);
          optimizedQueries.invalidateCache('allPages');
          clearCache('allPages'); // Local cache
          return {
            success: true,
            message: `Página "${createdPage.title}" creada con sección inicial`,
            page: createdPage
          };
        } else {
          console.warn(`⚠️ [${requestId}] Page created but section association failed: ${associateResult.message}`);
          // Still invalidate allPages as the page itself was created
          optimizedQueries.invalidateCache('allPages');
          clearCache('allPages');
          return {
            success: true,
            message: `Página creada. ${associateResult.message || 'La sección se creará automáticamente al editar.'}`,
            page: createdPage
          };
        }
      } else {
        console.warn(`⚠️ [${requestId}] Page created but section creation failed: ${sectionResult.message}`);
        // Still invalidate allPages as the page itself was created
        optimizedQueries.invalidateCache('allPages');
        clearCache('allPages');
        return {
          success: true,
          message: `Página creada. ${sectionResult.message || 'La sección se creará automáticamente al editar.'}`,
          page: createdPage
        };
      }
      
    } catch (error) {
      console.error(`❌ [${requestId}] GraphQL CLIENT - createPage - Error:`, error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error creating page',
        page: null
      };
    }
  },

  applyComponentEdit,
  
  loadSectionComponentsForEdit,
  
  getPagePreview,
  
  getPageBySlug,
  updatePage,
  getPageById,

  // Eliminar una página CMS
  deletePage: async (id: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    console.log(`Attempting to delete page with ID: ${id} and its associated sections.`);
    
    // Step 1: Fetch page details first to get slug and other info for cache invalidation.
    // Use the already refactored getPageById which uses a direct query.
    let pageToDelete: PageData | null = null;
    try {
      // We use the internal getPageById directly, not via cmsOperations to avoid circular dependency issues
      // if cmsOperations.getPageById was not yet defined or fully initialized during module load.
      // However, getPageById is defined earlier in this file.
      pageToDelete = await getPageById(id); 
    } catch (fetchError) {
      console.error(`Error fetching page details for ID ${id} before deletion:`, fetchError);
      // Proceed with deletion if fetching fails, but cache invalidation might be incomplete.
    }

    // Step 2: Call the actual deletion logic (deletePageWithSections)
    // deletePageWithSections is imported and should handle the GraphQL mutation for deletion.
    // Assuming deletePageWithSections is defined elsewhere and handles the actual deletion.
    // For this refactoring, we are focusing on the cache invalidation within this deletePage operation.
    
    const deleteResult = await deletePageWithSections(id); // This function is imported.

    // Step 3: Invalidate caches if deletion was successful
    if (deleteResult.success) {
      console.log(`Page with ID: ${id} deleted successfully. Invalidating caches.`);
      if (pageToDelete && pageToDelete.slug) {
        optimizedQueries.invalidateCache(`page:${pageToDelete.slug}`);
        clearCache(`page_slug_${pageToDelete.slug}`);
      }
      optimizedQueries.invalidateCache(`page_id:${id}`);
      clearCache(`page_id_${id}`); // local cache

      if (pageToDelete && pageToDelete.isDefault && pageToDelete.locale) {
        optimizedQueries.invalidateCache(`default_page_${pageToDelete.locale}`);
        clearCache(`default_page_${pageToDelete.locale}`); // local cache
      }
      
      optimizedQueries.invalidateCache('allPages');
      clearCache('allPages'); // local cache for general page lists
      
      // If pages also affect menu structures (e.g. if a deleted page was in a menu)
      optimizedQueries.invalidateCache('menus'); 
      clearCache('all_menus'); // Assuming 'all_menus' for local cache based on getMenus

    } else {
      console.log(`Failed to delete page with ID: ${id}. Message: ${deleteResult.message}`);
    }
    
    return deleteResult;
  },

  // Obtener páginas que usan una sección específica
  getPagesUsingSectionId: async (sectionId: string) => {
    try {
      const query = `
        query GetPagesUsingSectionId($sectionId: ID!) {
          getPagesUsingSectionId(sectionId: $sectionId) {
            id
            title
            slug
            description
            isPublished
            pageType
            locale
            updatedAt
            sections {
              id
              sectionId
              name
            }
          }
        }
      `;

      console.log(`GraphQL query para getPagesUsingSectionId, sectionId: ${sectionId}`);

      try {
        const result = await gqlRequest<{ getPagesUsingSectionId: PageData[] }>(query, { sectionId });
        
        console.log(`Resultado GraphQL getPagesUsingSectionId (${sectionId}):`, JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getPagesUsingSectionId) {
          console.log(`No se encontraron páginas que usen la sección ${sectionId}`);
          return [];
        }
        
        // Filtrar las secciones con sectionId null para evitar errores GraphQL
        const pagesWithValidSections = result.getPagesUsingSectionId.map(page => {
          if (page.sections && Array.isArray(page.sections)) {
            // Asegurar que todas las secciones tengan sectionId válido
            page.sections = page.sections.filter(section => 
              section && typeof section === 'object' && 'sectionId' in section && section.sectionId !== null
            );
          }
          return page;
        });
        
        return pagesWithValidSections;
      } catch (error) {
        console.error(`Error en la consulta GraphQL getPagesUsingSectionId (${sectionId}):`, error);
        return [];
      }
    } catch (error) {
      console.error(`Error in getPagesUsingSectionId:`, error);
      return [];
    }
  },

  async getCMSSection(id: string): Promise<{
    id: string;
    sectionId: string;
    name: string;
    description: string;
    lastUpdated: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string | null;
    components: unknown;
  } | null> {
    // Check cache first
    const cacheKey = `section_${id}`;
    const cachedSection = getCachedResponse<{
      id: string;
      sectionId: string;
      name: string;
      description: string;
      lastUpdated: string;
      createdAt: string;
      updatedAt: string;
      createdBy: string | null;
      components: unknown;
    }>(cacheKey);
    
    if (cachedSection) {
      return cachedSection;
    }
    
    const query = `
      query GetCMSSection($id: String!) {
        getCMSSection(id: $id) {
          id
          sectionId
          name
          description
          lastUpdated
          createdAt
          updatedAt
          createdBy
          components {
            id
            componentId
            order
          }
        }
      }
    `;
    
    const response = await gqlRequest<{
      getCMSSection: {
        id: string;
        sectionId: string;
        name: string;
        description: string;
        lastUpdated: string;
        createdAt: string;
        updatedAt: string;
        createdBy: string | null;
        components: unknown;
      } | null;
    }>(query, { id });
    
    const result = response?.getCMSSection || null;
    
    // Cache the result
    if (result) {
      setCachedResponse(cacheKey, result);
    }
    
    return result;
  },

  // Create CMS Section
  createCMSSection: async (input: { 
    sectionId: string; 
    name: string; 
    description?: string; 
  }): Promise<{ 
    success: boolean; 
    message: string; 
    section: { id: string; sectionId: string; name: string; order?: number } | null;
  }> => {
    try {
      if (!input.sectionId || !input.name) {
        console.error('Missing required fields for createCMSSection', input);
        return {
          success: false,
          message: 'sectionId and name are required',
          section: null
        };
      }

      console.log('Starting createCMSSection mutation with:', JSON.stringify(input));
      
      const mutation = `
        mutation CreateCMSSection($input: CreateCMSSectionInput!) {
          createCMSSection(input: $input) {
            success
            message
            section {
              id
              sectionId
              name
              order
            }
          }
        }
      `;
      
      // Use a longer timeout for section creation - increase from 15s to 30s
      const result = await gqlRequest<{ 
        createCMSSection?: { 
          success: boolean; 
          message: string; 
          section: { id: string; sectionId: string; name: string; order?: number } | null;
        }
      }>(mutation, { input }, 30000);
      
      console.log('createCMSSection raw result:', JSON.stringify(result));
      
      if (!result) {
        console.error('No result from GraphQL request in createCMSSection');
        return {
          success: false,
          message: 'No result received from server',
          section: null
        };
      }
      
      if (!result.createCMSSection) {
        console.error('Missing createCMSSection in result:', JSON.stringify(result));
        return {
          success: false,
          message: 'Invalid response format: missing createCMSSection field',
          section: null
        };
      }
      
      // Clear cache for related data
      clearCache(`section_${input.sectionId}`); // Local cache for the specific section by its internal ID
      optimizedQueries.invalidateCache(`section:${input.sectionId}`); // GraphQLOptimizer cache for the specific section by its sectionId
      // If there was a general key for all sections list in GraphQLOptimizer, invalidate it here.
      // e.g., optimizedQueries.invalidateCache('allCMSSections');
      
      return result.createCMSSection;
    } catch (error) {
      console.error('Error creating CMS section:', error);
      return {
        success: false,
        message: `Error al crear CMSSection: "${error instanceof Error ? error.message : 'Error desconocido'}"`,
        section: null
      };
    }
  },



  updateComponentTitle,
  updateSectionName,
  
  // Update section background
  updateSectionBackground: async (sectionId: string, backgroundImage: string, backgroundType: 'image' | 'gradient') => {
    try {
      // Use the updateCMSSection function from cms-update.ts
      const result = await updateCMSSection(sectionId, { backgroundImage, backgroundType });

      if (result.success) {
        optimizedQueries.invalidateCache(`section:${sectionId}`);
        clearCache(`section_components_${sectionId}`);
        clearCache(`section_${sectionId}`);
      }
      
      return {
        success: result.success,
        message: result.message,
        lastUpdated: result.lastUpdated
      };
    } catch (error) {
      console.error('Error updating section background:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating section background'
      };
    }
  },
  
  // Get all menus with their items
  getMenus: async () => {
    // Check cache first
    const cacheKey = 'all_menus';
    const cachedMenus = getCachedResponse<Array<{
      id: string;
      name: string;
      location: string | null;
      items: Array<{
        id: string;
        title: string;
        url: string | null;
        pageId: string | null;
        target: string | null;
        icon: string | null;
        order: number;
        children?: Array<{
          id: string;
          title: string;
          url: string | null;
          pageId: string | null;
          target: string | null;
          icon: string | null;
          order: number;
        }>;
        page?: {
          id: string;
          title: string;
          slug: string;
        };
      }>;
      headerStyle?: {
        id: string;
        transparency: number;
        headerSize: string;
        menuAlignment: string;
        menuButtonStyle: string;
        mobileMenuStyle: string;
        mobileMenuPosition: string;
        transparentHeader: boolean;
        borderBottom: boolean;
        fixedHeader?: boolean;
        advancedOptions?: Record<string, unknown>;
      };
      footerStyle?: {
        id: string;
        transparency: number;
        columnLayout: string;
        socialAlignment: string;
        borderTop: boolean;
        alignment: string;
        padding: string;
        width: string;
        advancedOptions?: Record<string, unknown>;
      };
    }>>(cacheKey);
    
    if (cachedMenus) {
      return cachedMenus;
    }
    
    try {
      const query = `
        query GetMenus {
          menus {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
              children {
                id
                title
                url
                pageId
                target
                icon
                order
              }
              page {
                id
                title
                slug
              }
            }
            headerStyle {
              id
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              fixedHeader
              advancedOptions
            }
            footerStyle {
              id
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
            }
          }
        }
      `;

      const result = await gqlRequest<{ menus: Array<{
        id: string;
        name: string;
        location: string | null;
        items: Array<{
          id: string;
          title: string;
          url: string | null;
          pageId: string | null;
          target: string | null;
          icon: string | null;
          order: number;
          children?: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
          }>;
          page?: {
            id: string;
            title: string;
            slug: string;
          };
        }>;
        headerStyle?: {
          id: string;
          transparency: number;
          headerSize: string;
          menuAlignment: string;
          menuButtonStyle: string;
          mobileMenuStyle: string;
          mobileMenuPosition: string;
          transparentHeader: boolean;
          borderBottom: boolean;
          advancedOptions?: Record<string, unknown>;
        };
        footerStyle?: {
          id: string;
          transparency: number;
          columnLayout: string;
          socialAlignment: string;
          borderTop: boolean;
          alignment: string;
          padding: string;
          width: string;
          advancedOptions?: Record<string, unknown>;
        };
      }> }>(query);
      
      if (!result || !result.menus) {
        return [];
      }
      
      // Cache the menus
      setCachedResponse(cacheKey, result.menus);
      
      return result.menus;
    } catch (error) {
      console.error('Error in getMenus GraphQL query:', error);
      return [];
    }
  },

  // Update header style for a menu
  updateHeaderStyle: async (menuId: string, styleInput: HeaderStyleInput): Promise<{
    success: boolean;
    message: string;
    headerStyle?: {
      id: string;
      menuId: string;
      transparency: number;
      headerSize: string;
      menuAlignment: string;
      menuButtonStyle: string;
      mobileMenuStyle: string;
      mobileMenuPosition: string;
      transparentHeader: boolean;
      borderBottom: boolean;
      fixedHeader: boolean;
      advancedOptions?: Record<string, unknown>;
    };
  }> => {
    try {
      const mutation = `
        mutation UpdateHeaderStyle($menuId: ID!, $input: HeaderStyleInput!) {
          updateHeaderStyle(menuId: $menuId, input: $input) {
            success
            message
            headerStyle {
              id
              menuId
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              fixedHeader
              advancedOptions
              createdAt
              updatedAt
            }
          }
        }
      `;

      const variables = {
        menuId,
        input: styleInput
      };

      const result = await gqlRequest<{
        updateHeaderStyle: {
          success: boolean;
          message: string;
          headerStyle: {
            id: string;
            menuId: string;
            transparency: number;
            headerSize: string;
            menuAlignment: string;
            menuButtonStyle: string;
            mobileMenuStyle: string;
            mobileMenuPosition: string;
            transparentHeader: boolean;
            borderBottom: boolean;
            fixedHeader: boolean;
            advancedOptions?: Record<string, unknown>;
            createdAt: string;
            updatedAt: string;
          } | null;
        }
      }>(mutation, variables);

      if (!result || !result.updateHeaderStyle) {
        return {
          success: false,
          message: 'Failed to update header style'
        };
      }
      
      if (result.updateHeaderStyle.success) {
        optimizedQueries.invalidateCache('menus');
        clearCache('all_menus'); // local cache
      }

      return {
        success: result.updateHeaderStyle.success,
        message: result.updateHeaderStyle.message,
        headerStyle: result.updateHeaderStyle.headerStyle || undefined
      };
    } catch (error) {
      console.error('Error updating header style:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error updating header style'
      };
    }
  },
  
  // Get menu with its header style
  getMenuWithHeaderStyle: async (menuId: string) => {
    try {
      const query = `
        query GetMenu($id: ID!) {
          menu(id: $id) {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
            }
            headerStyle {
              id
              transparency
              headerSize
              menuAlignment
              menuButtonStyle
              mobileMenuStyle
              mobileMenuPosition
              transparentHeader
              borderBottom
              advancedOptions
              fixedHeader
            }
          }
        }
      `;

      const variables = { id: menuId };
      const result = await gqlRequest<{
        menu: {
          id: string;
          name: string;
          location: string | null;
          items: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
          }>;
          headerStyle: {
            id: string;
            transparency: number;
            headerSize: string;
            menuAlignment: string;
            menuButtonStyle: string;
            mobileMenuStyle: string;
            mobileMenuPosition: string;
            transparentHeader: boolean;
            borderBottom: boolean;
            fixedHeader?: boolean;
            advancedOptions?: Record<string, unknown>;
          } | null;
        } | null;
      }>(query, variables);

      return result?.menu || null;
    } catch (error) {
      console.error('Error getting menu with header style:', error);
      return null;
    }
  },

  // Añadir referencia a la función getForms
  getForms,

  // Asociar una sección a una página
  associateSectionToPage: async (pageId: string, sectionId: string, order: number): Promise<{
    success: boolean;
    message: string;
    page: PageData | null;
  }> => {
    try {
      if (!pageId || !sectionId) {
        console.error('Missing required parameters in associateSectionToPage', { pageId, sectionId });
        return {
          success: false,
          message: 'Los IDs de la página y la sección son requeridos',
          page: null
        };
      }

      console.log(`Asociando sección ${sectionId} a página ${pageId} con orden ${order}`);
      
      const mutation = `
        mutation AssociateSectionToPage($pageId: ID!, $sectionId: ID!, $order: Int!) {
          associateSectionToPage(pageId: $pageId, sectionId: $sectionId, order: $order) {
            success
            message
            page {
              id
              title
              sections {
                id
                sectionId
                name
                order
              }
            }
          }
        }
      `;

      const variables = { pageId, sectionId, order };
      
      // Usar un timeout más largo para esta operación
      const result = await gqlRequest<{ 
        associateSectionToPage?: {
          success: boolean;
          message: string;
          page: PageData | null;
        } 
      }>(mutation, variables, 30000); // Increased timeout to 30 seconds

      console.log('Respuesta de associateSectionToPage:', JSON.stringify(result, null, 2));
      
      if (!result) {
        console.error('No se recibió respuesta del servidor');
        return {
          success: false,
          message: 'No se recibió respuesta del servidor al asociar la sección a la página',
          page: null
        };
      }
      
      if (!result.associateSectionToPage) {
        console.error('Respuesta sin el campo associateSectionToPage:', result);
        return {
          success: false,
          message: 'Respuesta no válida del servidor: campo associateSectionToPage no encontrado',
          page: null
        };
      }
      
      if (result.associateSectionToPage && result.associateSectionToPage.success && result.associateSectionToPage.page) {
        const updatedPage = result.associateSectionToPage.page;
        if (updatedPage.slug) {
          optimizedQueries.invalidateCache(`page:${updatedPage.slug}`);
          clearCache(`page_slug_${updatedPage.slug}`);
        }
        optimizedQueries.invalidateCache(`page_id:${pageId}`);
        clearCache(`page_id_${pageId}`);
        optimizedQueries.invalidateCache(`section:${sectionId}`); // Section's context within a page changed
        clearCache(`section_components_${sectionId}`);
        clearCache(`section_${sectionId}`);
        optimizedQueries.invalidateCache('allPages');
        clearCache('allPages');
      }

      return result.associateSectionToPage;
    } catch (error) {
      console.error('Error associating section to page:', error);
      return {
        success: false,
        message: error instanceof Error 
          ? `Error al asociar sección a página: ${error.message}` 
          : 'Error desconocido al asociar sección a página',
        page: null
      };
    }
  },

  // Desasociar una sección de una página
  dissociateSectionFromPage: async (pageId: string, sectionId: string): Promise<{
    success: boolean;
    message: string;
    page: PageData | null;
  }> => {
    try {
      const mutation = `
        mutation DissociateSectionFromPage($pageId: ID!, $sectionId: ID!) {
          dissociateSectionFromPage(pageId: $pageId, sectionId: $sectionId) {
            success
            message
            page {
              id
              title
              sections {
                id
                sectionId
                name
                order
              }
            }
          }
        }
      `;

      const variables = { pageId, sectionId };
      const result = await gqlRequest<{ 
        dissociateSectionFromPage: {
          success: boolean;
          message: string;
          page: PageData | null;
        } 
      }>(mutation, variables);
      
      if (result.dissociateSectionFromPage && result.dissociateSectionFromPage.success && result.dissociateSectionFromPage.page) {
        const updatedPage = result.dissociateSectionFromPage.page;
        if (updatedPage.slug) {
          optimizedQueries.invalidateCache(`page:${updatedPage.slug}`);
          clearCache(`page_slug_${updatedPage.slug}`);
        }
        optimizedQueries.invalidateCache(`page_id:${pageId}`);
        clearCache(`page_id_${pageId}`);
        optimizedQueries.invalidateCache(`section:${sectionId}`); // Section's context within a page changed
        clearCache(`section_components_${sectionId}`);
        clearCache(`section_${sectionId}`);
        optimizedQueries.invalidateCache('allPages');
        clearCache('allPages');
      }

      return result.dissociateSectionFromPage;
    } catch (error) {
      console.error('Error dissociating section from page:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        page: null
      };
    }
  },

  // Obtener todos los componentes CMS
  getAllComponents: async () => {
    try {
      const query = `
        query GetAllCMSComponents {
          getAllCMSComponents {
            id
            name
            slug
            description
            category
            icon
            isActive
            createdAt
            updatedAt
          }
        }
      `;

      console.log('GraphQL query para getAllCMSComponents');

      try {
        const result = await gqlRequest<{ getAllCMSComponents: CMSComponentDB[] }>(query);
        
        console.log("Resultado GraphQL getAllCMSComponents:", JSON.stringify(result).substring(0, 200));
        
        if (!result || !result.getAllCMSComponents) {
          console.log("No se encontraron componentes o la estructura no es la esperada");
          return [];
        }
        
        return result.getAllCMSComponents;
      } catch (error) {
        console.error('Error en la consulta GraphQL getAllCMSComponents:', error);
        return [];
      }
    } catch (error) {
      console.error(`Error general en getAllComponents:`, error);
      return [];
    }
  },

  // Header and footer style update methods are defined earlier in the cmsOperations object

  // Update Footer Style
  async updateFooterStyle(menuId: string, styleData: FooterStyleInput): Promise<{
    success: boolean;
    message: string;
    footerStyle?: Record<string, unknown>;
  }> {
    try {
      const query = `
        mutation UpdateFooterStyle($menuId: ID!, $input: FooterStyleInput!) {
          updateFooterStyle(menuId: $menuId, input: $input) {
            success
            message
            footerStyle {
              id
              menuId
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
              createdAt
              updatedAt
            }
          }
        }
      `;

      const variables = {
        menuId,
        input: styleData
      };

      const response = await gqlRequest<{
        updateFooterStyle: {
          success: boolean;
          message: string;
          footerStyle: Record<string, unknown> | null;
        };
      }>(query, variables);

      
      if (response.updateFooterStyle.success) {
        optimizedQueries.invalidateCache('menus');
        clearCache('all_menus'); // local cache
      }

      return {
        success: response.updateFooterStyle.success,
        message: response.updateFooterStyle.message,
        footerStyle: response.updateFooterStyle.footerStyle || undefined
      };
    } catch (error) {
      console.error('Error updating footer style:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Get menu with Footer style
  async getMenuWithFooterStyle(menuId: string): Promise<{
    id: string;
    name: string;
    location: string | null;
    items: Array<{
      id: string;
      title: string;
      url: string | null;
      pageId: string | null;
      target: string | null;
      icon: string | null;
      order: number;
      parentId: string | null;
      children?: Array<{
        id: string;
        title: string;
        url: string | null;
        pageId: string | null;
        target: string | null;
        icon: string | null;
        order: number;
      }>;
      page?: { slug: string } | null;
    }>;
    footerStyle?: {
      transparency?: number;
      columnLayout?: string;
      socialAlignment?: string;
      borderTop?: boolean;
      alignment?: string;
      padding?: string;
      width?: string;
      advancedOptions?: Record<string, unknown>;
    } | null;
  } | null> {
    try {
      const query = `
        query GetMenuWithFooterStyle($id: ID!) {
          menu(id: $id) {
            id
            name
            location
            items {
              id
              title
              url
              pageId
              target
              icon
              order
              parentId
              children {
                id
                title
                url
                pageId
                target
                icon
                order
              }
              page {
                slug
              }
            }
            footerStyle {
              id
              transparency
              columnLayout
              socialAlignment
              borderTop
              alignment
              padding
              width
              advancedOptions
            }
          }
        }
      `;

      const variables = { id: menuId };
      // Use a longer timeout for this query
      const result = await gqlRequest<{
        menu: {
          id: string;
          name: string;
          location: string | null;
          items: Array<{
            id: string;
            title: string;
            url: string | null;
            pageId: string | null;
            target: string | null;
            icon: string | null;
            order: number;
            parentId: string | null;
            children?: Array<{
              id: string;
              title: string;
              url: string | null;
              pageId: string | null;
              target: string | null;
              icon: string | null;
              order: number;
            }>;
            page?: { slug: string } | null;
          }>;
          footerStyle: {
            id: string;
            transparency?: number;
            columnLayout?: string;
            socialAlignment?: string;
            borderTop?: boolean;
            alignment?: string;
            padding?: string;
            width?: string;
            advancedOptions?: Record<string, unknown>;
          } | null;
        } | null;
      }>(query, variables, 20000); // Increase timeout to 20 seconds

      return result?.menu || null;
    } catch (error) {
      console.error('Error fetching menu with footer style:', error);
      return null;
    }
  },

  // Expose the clearCache function
  clearCache,

  // Get the default page for a locale
  getDefaultPage,

  // Settings operations
  async getSiteSettings(): Promise<{
    id: string;
    siteName: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale: string;
    footerText?: string;
    maintenanceMode: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales: string[];
    twitterCardType?: string;
    twitterHandle?: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetSiteSettings {
        getSiteSettings {
          id
          siteName
          siteDescription
          logoUrl
          faviconUrl
          primaryColor
          secondaryColor
          googleAnalyticsId
          facebookPixelId
          customCss
          customJs
          contactEmail
          contactPhone
          address
          accentColor
          defaultLocale
          footerText
          maintenanceMode
          metaDescription
          metaTitle
          ogImage
          socialLinks
          supportedLocales
          twitterCardType
          twitterHandle
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ getSiteSettings: {
        id: string;
        siteName: string;
        siteDescription?: string;
        logoUrl?: string;
        faviconUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
        customCss?: string;
        customJs?: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        accentColor?: string;
        defaultLocale: string;
        footerText?: string;
        maintenanceMode: boolean;
        metaDescription?: string;
        metaTitle?: string;
        ogImage?: string;
        socialLinks?: string;
        supportedLocales: string[];
        twitterCardType?: string;
        twitterHandle?: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(query);
      return response.getSiteSettings;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return null;
    }
  },

  async updateSiteSettings(input: {
    siteName?: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale?: string;
    footerText?: string;
    maintenanceMode?: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales?: string[];
    twitterCardType?: string;
    twitterHandle?: string;
  }): Promise<{
    id: string;
    siteName: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale: string;
    footerText?: string;
    maintenanceMode: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales: string[];
    twitterCardType?: string;
    twitterHandle?: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const mutation = `
      mutation UpdateSiteSettings($input: UpdateSiteSettingsInput!) {
        updateSiteSettings(input: $input) {
          id
          siteName
          siteDescription
          logoUrl
          faviconUrl
          primaryColor
          secondaryColor
          googleAnalyticsId
          facebookPixelId
          customCss
          customJs
          contactEmail
          contactPhone
          address
          accentColor
          defaultLocale
          footerText
          maintenanceMode
          metaDescription
          metaTitle
          ogImage
          socialLinks
          supportedLocales
          twitterCardType
          twitterHandle
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ updateSiteSettings: {
        id: string;
        siteName: string;
        siteDescription?: string;
        logoUrl?: string;
        faviconUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
        customCss?: string;
        customJs?: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        accentColor?: string;
        defaultLocale: string;
        footerText?: string;
        maintenanceMode: boolean;
        metaDescription?: string;
        metaTitle?: string;
        ogImage?: string;
        socialLinks?: string;
        supportedLocales: string[];
        twitterCardType?: string;
        twitterHandle?: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(mutation, { input });
      return response.updateSiteSettings;
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    }
  },

  // User Settings operations
  async getUserSettings(): Promise<{
    id: string;
    userId: string;
    emailNotifications: boolean;
    theme: string;
    language: string;
    timeFormat: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetUserSettings {
        userSettings {
          id
          userId
          emailNotifications
          theme
          language
          timeFormat
          dateFormat
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ userSettings: {
        id: string;
        userId: string;
        emailNotifications: boolean;
        theme: string;
        language: string;
        timeFormat: string;
        dateFormat: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(query);
      return response.userSettings;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }
  },

  async updateUserSettings(input: {
    emailNotifications?: boolean;
    theme?: string;
    language?: string;
    timeFormat?: string;
    dateFormat?: string;
  }): Promise<{
    id: string;
    userId: string;
    emailNotifications: boolean;
    theme: string;
    language: string;
    timeFormat: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const mutation = `
      mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
        updateUserSettings(input: $input) {
          id
          userId
          emailNotifications
          theme
          language
          timeFormat
          dateFormat
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ updateUserSettings: {
        id: string;
        userId: string;
        emailNotifications: boolean;
        theme: string;
        language: string;
        timeFormat: string;
        dateFormat: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(mutation, { input });
      return response.updateUserSettings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  // Staff Management Operations
  async staffProfiles(): Promise<CalendarStaffProfile[]> {
    try {
      const query = `
        query GetStaffProfiles {
          staffProfiles {
            id
            userId
            bio
            specializations
            createdAt
            updatedAt
            user {
              id
              email
              firstName
              lastName
              phoneNumber
              isActive
              profileImageUrl
              role {
                id
                name
              }
            }
            assignedServices {
              id
              name
              description
              durationMinutes
              price
              isActive
            }
            locationAssignments {
              id
              name
              address
              phone
            }
            schedules {
              id
              locationId
              date
              dayOfWeek
              startTime
              endTime
              scheduleType
              isAvailable
              notes
              createdAt
              updatedAt
            }
          }
        }
      `;

      const response = await gqlRequest<{ staffProfiles: CalendarStaffProfile[] }>(query);
      return response.staffProfiles || [];
    } catch (error) {
      console.error('Error fetching staff profiles:', error);
      return [];
    }
  },

  async users(): Promise<CalendarUser[]> {
    try {
      const query = `
        query GetUsers {
          users {
            id
            email
            firstName
            lastName
            phoneNumber
            isActive
            profileImageUrl
            role {
              id
              name
            }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await gqlRequest<{ users: CalendarUser[] }>(query);
      
      // Handle case where users might be null or undefined
      if (!response || !response.users) {
        console.warn('Users query returned null or undefined, returning empty array');
        return [];
      }
      
      return response.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.users')) {
        console.warn('Users field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },


  async locations(): Promise<CalendarLocation[]> {
    try {
      const query = `
        query GetLocations {
          locations {
            id
            name
            address
            phone
            operatingHours
            createdAt
            updatedAt
          }
        }
      `;

      const response = await gqlRequest<{ locations: CalendarLocation[] }>(query);
      
      // Handle case where locations might be null or undefined
      if (!response || !response.locations) {
        console.warn('Locations query returned null or undefined, returning empty array');
        return [];
      }
      
      return response.locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.locations')) {
        console.warn('Locations field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },

  async createStaffProfile(input: { input: {
    userId: string;
    bio?: string;
    specializations?: string[];
  }}): Promise<CalendarStaffProfile> {
    try {
      const mutation = `
        mutation CreateStaffProfile($input: CreateStaffProfileInput!) {
          createStaffProfile(input: $input) {
            success
            message
            staffProfile {
              id
              userId
              bio
              specializations
              createdAt
              updatedAt
              user {
                id
                email
                firstName
                lastName
                phoneNumber
                bio
                department
                isActive
                position
                profileImageUrl
                roleId
              }
            }
          }
        }
      `;

      const response = await gqlRequest<{
        createStaffProfile: {
          success: boolean;
          message: string;
          staffProfile: CalendarStaffProfile | null;
        };
      }>(mutation, input);

      if (!response.createStaffProfile.success || !response.createStaffProfile.staffProfile) {
        throw new Error(response.createStaffProfile.message || 'Failed to create staff profile');
      }

      return response.createStaffProfile.staffProfile;
    } catch (error) {
      console.error('Error creating staff profile:', error);
      throw error;
    }
  },

  async updateStaffProfile(input: { id: string; input: Partial<StaffProfileInput> }): Promise<CalendarStaffProfile> {
    try {
      const mutation = `
        mutation UpdateStaffProfile($id: ID!, $input: UpdateStaffProfileInput!) {
          updateStaffProfile(id: $id, input: $input) {
            success
            message
            staffProfile {
              id
              userId
              bio
              specializations
              createdAt
              updatedAt
              user {
                id
                email
                firstName
                lastName
                phoneNumber
                bio
                department
                isActive
                position
                profileImageUrl
                roleId
              }
            }
          }
        }
      `;

      const response = await gqlRequest<{
        updateStaffProfile: {
          success: boolean;
          message: string;
          staffProfile: CalendarStaffProfile | null;
        };
      }>(mutation, input);

      if (!response.updateStaffProfile.success || !response.updateStaffProfile.staffProfile) {
        throw new Error(response.updateStaffProfile.message || 'Failed to update staff profile');
      }

      return response.updateStaffProfile.staffProfile;
    } catch (error) {
      console.error('Error updating staff profile:', error);
      throw error;
    }
  },

  async deleteStaffProfile(input: { id: string }): Promise<{ success: boolean; message: string }> {
    try {
      const mutation = `
        mutation DeleteStaffProfile($id: ID!) {
          deleteStaffProfile(id: $id) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ deleteStaffProfile: { success: boolean; message: string } }>(mutation, input);
      return response.deleteStaffProfile;
    } catch (error) {
      console.error('Error deleting staff profile:', error);
      throw error;
    }
  },

  async updateStaffSchedule(input: { staffProfileId: string; schedule: CalendarStaffScheduleInput[] }): Promise<{ success: boolean; message: string }> {
    try {
      const mutation = `
        mutation UpdateStaffSchedule($staffProfileId: ID!, $schedule: [StaffScheduleInput!]!) {
          updateStaffSchedule(staffProfileId: $staffProfileId, schedule: $schedule) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ updateStaffSchedule: { success: boolean; message: string } }>(mutation, input);
      return response.updateStaffSchedule;
    } catch (error) {
      console.error('Error updating staff schedule:', error);
      throw error;
    }
  },

  async deleteFormSubmission(id: string): Promise<FormSubmissionResult> {
    const mutation = `
      mutation DeleteFormSubmission($id: ID!) {
        deleteFormSubmission(id: $id) {
          success
          message
        }
      }
    `;

    const result = await gqlRequest<{ deleteFormSubmission: FormSubmissionResult }>(mutation, { id });
    return result.deleteFormSubmission;
  },

  // Calendar booking rules
  async globalBookingRule(): Promise<{
    id: string;
    advanceBookingHoursMin: number;
    advanceBookingDaysMax: number;
    sameDayCutoffTime?: string;
    bufferBetweenAppointmentsMinutes: number;
    maxAppointmentsPerDayPerStaff?: number;
    bookingSlotIntervalMinutes: number;
  } | null> {
    const query = `
      query GlobalBookingRule {
        globalBookingRule {
          id
          advanceBookingHoursMin
          advanceBookingDaysMax
          sameDayCutoffTime
          bufferBetweenAppointmentsMinutes
          maxAppointmentsPerDayPerStaff
          bookingSlotIntervalMinutes
        }
      }
    `;

    const result = await gqlRequest<{ globalBookingRule: {
      id: string;
      advanceBookingHoursMin: number;
      advanceBookingDaysMax: number;
      sameDayCutoffTime?: string;
      bufferBetweenAppointmentsMinutes: number;
      maxAppointmentsPerDayPerStaff?: number;
      bookingSlotIntervalMinutes: number;
    } | null }>(query);
    return result.globalBookingRule;
  },

  // Calendar booking rules - upsert
  async upsertGlobalBookingRules({ input }: {
    input: {
      advanceBookingHoursMin: number;
      advanceBookingDaysMax: number;
      sameDayCutoffTime?: string | null;
      bufferBetweenAppointmentsMinutes: number;
      maxAppointmentsPerDayPerStaff?: number | null;
      bookingSlotIntervalMinutes: number;
    }
  }): Promise<{
    id: string;
    advanceBookingHoursMin: number;
    advanceBookingDaysMax: number;
    sameDayCutoffTime?: string;
    bufferBetweenAppointmentsMinutes: number;
    maxAppointmentsPerDayPerStaff?: number;
    bookingSlotIntervalMinutes: number;
  }> {
    const mutation = `
      mutation UpsertGlobalBookingRules($input: BookingRuleInput!) {
        upsertGlobalBookingRules(input: $input) {
          id
          advanceBookingHoursMin
          advanceBookingDaysMax
          sameDayCutoffTime
          bufferBetweenAppointmentsMinutes
          maxAppointmentsPerDayPerStaff
          bookingSlotIntervalMinutes
        }
      }
    `;

    const result = await gqlRequest<{ upsertGlobalBookingRules: {
      id: string;
      advanceBookingHoursMin: number;
      advanceBookingDaysMax: number;
      sameDayCutoffTime?: string;
      bufferBetweenAppointmentsMinutes: number;
      maxAppointmentsPerDayPerStaff?: number;
      bookingSlotIntervalMinutes: number;
    } }>(mutation, { input });
    
    return result.upsertGlobalBookingRules;
  },

  // Calendar service categories
  async serviceCategories(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    parentId?: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query ServiceCategories {
        serviceCategories {
          id
          name
          description
          displayOrder
          parentId
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const result = await gqlRequest<{ serviceCategories: Array<{
        id: string;
        name: string;
        description?: string;
        displayOrder: number;
        parentId?: string;
        createdAt: string;
        updatedAt: string;
      }> }>(query);
      
      // Handle case where serviceCategories might be null or undefined
      if (!result || !result.serviceCategories) {
        console.warn('ServiceCategories query returned null or undefined, returning empty array');
        return [];
      }
      
      return result.serviceCategories;
    } catch (error) {
      console.error('Error fetching service categories:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.serviceCategories')) {
        console.warn('ServiceCategories field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },

  // Delete service category
  async deleteServiceCategory({ id }: { id: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteServiceCategory($id: ID!) {
        deleteServiceCategory(id: $id) {
          success
          message
          serviceCategory {
            id
            name
          }
        }
      }
    `;

    try {
      const result = await gqlRequest<{ deleteServiceCategory: {
        success: boolean;
        message: string;
        serviceCategory: {
          id: string;
          name: string;
        } | null;
      } }>(mutation, { id });
      
      return {
        success: result.deleteServiceCategory.success,
        message: result.deleteServiceCategory.message
      };
    } catch (error) {
      console.error('Error deleting service category:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete service category'
      };
    }
  },

  // Create service category
  async createServiceCategory({ input }: { 
    input: {
      name?: string;
      description?: string | null;
      displayOrder?: number;
      parentId?: string | null;
    }
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    parentId?: string;
  }> {
    const mutation = `
      mutation CreateServiceCategory($input: CreateServiceCategoryInput!) {
        createServiceCategory(input: $input) {
          success
          message
          serviceCategory {
            id
            name
            description
            displayOrder
            parentId
          }
        }
      }
    `;

    const result = await gqlRequest<{ createServiceCategory: {
      success: boolean;
      message: string;
      serviceCategory: {
        id: string;
        name: string;
        description?: string;
        displayOrder: number;
        parentId?: string;
      } | null;
    } }>(mutation, { input });
    
    if (!result.createServiceCategory.success || !result.createServiceCategory.serviceCategory) {
      throw new Error(result.createServiceCategory.message || 'Failed to create service category');
    }
    
    return result.createServiceCategory.serviceCategory;
  },

  // Update service category
  async updateServiceCategory({ id, input }: { 
    id: string;
    input: {
      name?: string;
      description?: string | null;
      displayOrder?: number;
      parentId?: string | null;
    }
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    parentId?: string;
  }> {
    const mutation = `
      mutation UpdateServiceCategory($id: ID!, $input: UpdateServiceCategoryInput!) {
        updateServiceCategory(id: $id, input: $input) {
          success
          message
          serviceCategory {
            id
            name
            description
            displayOrder
            parentId
          }
        }
      }
    `;

    const result = await gqlRequest<{ updateServiceCategory: {
      success: boolean;
      message: string;
      serviceCategory: {
        id: string;
        name: string;
        description?: string;
        displayOrder: number;
        parentId?: string;
      } | null;
    } }>(mutation, { id, input });
    
    if (!result.updateServiceCategory.success || !result.updateServiceCategory.serviceCategory) {
      throw new Error(result.updateServiceCategory.message || 'Failed to update service category');
    }
    
    return result.updateServiceCategory.serviceCategory;
  },

  // Services
  async services(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    bufferTimeBeforeMinutes: number;
    bufferTimeAfterMinutes: number;
    preparationTimeMinutes: number;
    cleanupTimeMinutes: number;
    maxDailyBookingsPerService?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    serviceCategoryId: string;
    serviceCategory?: { id: string; name: string };
    locations?: Array<{ id: string; name: string }>;
  }>> {
    const query = `
      query Services {
        services {
          id
          name
          description
          durationMinutes
          price
          bufferTimeBeforeMinutes
          bufferTimeAfterMinutes
          preparationTimeMinutes
          cleanupTimeMinutes
          maxDailyBookingsPerService
          isActive
          createdAt
          updatedAt
          serviceCategoryId
          serviceCategory {
            id
            name
          }
          locations {
            id
            name
          }
        }
      }
    `;

    try {
      const result = await gqlRequest<{ services: Array<{
        id: string;
        name: string;
        description?: string;
        durationMinutes: number;
        price: number;
        bufferTimeBeforeMinutes: number;
        bufferTimeAfterMinutes: number;
        preparationTimeMinutes: number;
        cleanupTimeMinutes: number;
        maxDailyBookingsPerService?: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        serviceCategoryId: string;
        serviceCategory?: { id: string; name: string };
        locations?: Array<{ id: string; name: string }>;
      }> }>(query);
      
      // Handle case where services might be null or undefined
      if (!result || !result.services) {
        console.warn('Services query returned null or undefined, returning empty array');
        return [];
      }
      
      // Transform string dates to Date objects to match CalendarService type
      const transformedServices = result.services.map(service => ({
        ...service,
        createdAt: new Date(service.createdAt),
        updatedAt: new Date(service.updatedAt)
      }));
      
      return transformedServices;
    } catch (error) {
      console.error('Error fetching services:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.services')) {
        console.warn('Services field is null in database, returning empty array');
        return [];
      }
      return []; // Return empty array instead of null on any error
    }
  },

  async createService({ input }: { input: {
    name: string;
    description?: string | null;
    durationMinutes: number;
    price: number;
    bufferTimeBeforeMinutes?: number;
    bufferTimeAfterMinutes?: number;
    preparationTimeMinutes?: number;
    cleanupTimeMinutes?: number;
    maxDailyBookingsPerService?: number;
    isActive?: boolean;
    serviceCategoryId: string;
    locationIds?: string[];
  }}): Promise<{
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    isActive: boolean;
  }> {
    const mutation = `
      mutation CreateService($input: CreateServiceInput!) {
        createService(input: $input) {
          success
          message
          service {
            id
            name
            description
            durationMinutes
            price
            isActive
          }
        }
      }
    `;

    const response = await gqlRequest<{
      createService: {
        success: boolean;
        message: string;
        service: {
          id: string;
          name: string;
          description?: string;
          durationMinutes: number;
          price: number;
          isActive: boolean;
        } | null;
      };
    }>(mutation, { input });

    if (!response.createService.success || !response.createService.service) {
      throw new Error(response.createService.message || 'Failed to create service');
    }

    return response.createService.service;
  },

  async updateService({ id, input }: { 
    id: string;
    input: {
      name?: string;
      description?: string | null;
      durationMinutes?: number;
      price?: number;
      bufferTimeBeforeMinutes?: number;
      bufferTimeAfterMinutes?: number;
      preparationTimeMinutes?: number;
      cleanupTimeMinutes?: number;
      maxDailyBookingsPerService?: number;
      isActive?: boolean;
      serviceCategoryId?: string;
      locationIds?: string[];
    }
  }): Promise<{
    id: string;
    name: string;
    description?: string;
    durationMinutes: number;
    price: number;
    isActive: boolean;
  }> {
    const mutation = `
      mutation UpdateService($id: ID!, $input: UpdateServiceInput!) {
        updateService(id: $id, input: $input) {
          success
          message
          service {
            id
            name
            description
            durationMinutes
            price
            isActive
          }
        }
      }
    `;

    const response = await gqlRequest<{
      updateService: {
        success: boolean;
        message: string;
        service: {
          id: string;
          name: string;
          description?: string;
          durationMinutes: number;
          price: number;
          isActive: boolean;
        } | null;
      };
    }>(mutation, { id, input });

    if (!response.updateService.success || !response.updateService.service) {
      throw new Error(response.updateService.message || 'Failed to update service');
    }

    return response.updateService.service;
  },

  async deleteService({ id }: { id: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteService($id: ID!) {
        deleteService(id: $id) {
          id
          name
        }
      }
    `;

    try {
      await gqlRequest(mutation, { id });
      return {
        success: true,
        message: 'Service deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting service:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete service'
      };
    }
  },

  async createLocation({ input }: { input: {
    name: string;
    address?: string | null;
    phone?: string | null;
    operatingHours?: Record<string, unknown> | null;
  }}): Promise<{
    id: string;
    name: string;
    address?: string;
    phone?: string;
  }> {
    const mutation = `
      mutation CreateLocation($input: CreateLocationInput!) {
        createLocation(input: $input) {
          success
          message
          location {
            id
            name
            address
            phone
          }
        }
      }
    `;

    const response = await gqlRequest<{
      createLocation: {
        success: boolean;
        message: string;
        location: {
          id: string;
          name: string;
          address?: string;
          phone?: string;
        } | null;
      };
    }>(mutation, { input });

    if (!response.createLocation.success || !response.createLocation.location) {
      throw new Error(response.createLocation.message || 'Failed to create location');
    }

    return response.createLocation.location;
  },

  async updateLocation({ id, input }: { 
    id: string;
    input: {
      name?: string;
      address?: string | null;
      phone?: string | null;
      operatingHours?: Record<string, unknown> | null;
    }
  }): Promise<{
    id: string;
    name: string;
    address?: string;
    phone?: string;
  }> {
    const mutation = `
      mutation UpdateLocation($id: ID!, $input: UpdateLocationInput!) {
        updateLocation(id: $id, input: $input) {
          success
          message
          location {
            id
            name
            address
            phone
          }
        }
      }
    `;

    const response = await gqlRequest<{
      updateLocation: {
        success: boolean;
        message: string;
        location: {
          id: string;
          name: string;
          address?: string;
          phone?: string;
        } | null;
      };
    }>(mutation, { id, input });

    if (!response.updateLocation.success || !response.updateLocation.location) {
      throw new Error(response.updateLocation.message || 'Failed to update location');
    }

    return response.updateLocation.location;
  },

  async deleteLocation({ id }: { id: string }): Promise<{
    success: boolean;
    message: string;
  }> {
    const mutation = `
      mutation DeleteLocation($id: ID!) {
        deleteLocation(id: $id) {
          success
          message
          location {
            id
            name
          }
        }
      }
    `;

    const response = await gqlRequest<{
      deleteLocation: {
        success: boolean;
        message: string;
        location: {
          id: string;
          name: string;
        } | null;
      };
    }>(mutation, { id });

    return {
      success: response.deleteLocation.success,
      message: response.deleteLocation.message
    };
  },

  // Calendar Bookings Operations
  async bookings({ filter, pagination }: {
    filter?: {
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      locationId?: string;
      serviceId?: string;
      staffProfileId?: string;
      customerId?: string;
      searchQuery?: string;
    };
    pagination?: {
      page?: number;
      pageSize?: number;
    };
  }): Promise<{
    items: Array<{
      id: string;
      customerName?: string | null;
      customerEmail?: string | null;
      customerPhone?: string | null;
      service: { id: string; name: string };
      location: { id: string; name: string };
      staffProfile?: { id: string; user: { firstName: string; lastName: string } } | null;
      bookingDate: string;
      startTime: string;
      endTime: string;
      status: string;
      notes?: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    totalCount: number;
    page: number;
    pageSize: number;
  } | null> {
    const query = `
      query GetBookings($filter: BookingFilterInput, $pagination: PaginationInput) {
        bookings(filter: $filter, pagination: $pagination) {
          edges {
            node {
              id
              customerName
              customerEmail
              customerPhone
              service {
                id
                name
              }
              location {
                id
                name
              }
              staffProfile {
                id
                user {
                  firstName
                  lastName
                }
              }
              bookingDate
              startTime
              endTime
              status
              notes
              createdAt
              updatedAt
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        bookings: {
          edges: Array<{
            node: {
              id: string;
              customerName?: string | null;
              customerEmail?: string | null;
              customerPhone?: string | null;
              service: { id: string; name: string };
              location: { id: string; name: string };
              staffProfile?: { id: string; user: { firstName: string; lastName: string } } | null;
              bookingDate: string;
              startTime: string;
              endTime: string;
              status: string;
              notes?: string | null;
              createdAt: string;
              updatedAt: string;
            };
          }>;
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor?: string;
            endCursor?: string;
          };
          totalCount: number;
        };
      }>(query, { filter, pagination });
      
      // Transform the response to match the expected format
      const bookingsData = response.bookings;
      if (!bookingsData) {
        console.warn('Bookings query returned null or undefined, returning empty result');
        return {
          items: [],
          totalCount: 0,
          page: pagination?.page || 1,
          pageSize: pagination?.pageSize || 10
        };
      }
      
      return {
        items: bookingsData.edges.map(edge => edge.node),
        totalCount: bookingsData.totalCount,
        page: pagination?.page || 1,
        pageSize: pagination?.pageSize || 10
      };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.bookings')) {
        console.warn('Bookings field is null in database, returning empty result');
        return {
          items: [],
          totalCount: 0,
          page: pagination?.page || 1,
          pageSize: pagination?.pageSize || 10
        };
      }
      // Always return empty result structure instead of null
      return {
        items: [],
        totalCount: 0,
        page: pagination?.page || 1,
        pageSize: pagination?.pageSize || 10
      };
    }
  },

  // Create a new booking
  async createBooking({ input }: {
    input: {
      serviceId: string;
      locationId: string;
      staffProfileId?: string;
      bookingDate: string;
      startTime: string;
      endTime: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      notes?: string;
      userId?: string;
    };
  }): Promise<{
    id: string;
    customerName: string;
    customerEmail: string;
    service: { name: string };
    location: { name: string };
    staffProfile?: { user: { firstName: string; lastName: string } } | null;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: string;
    notes?: string;
  } | null> {
    const mutation = `
      mutation CreateBooking($input: BookingInput!) {
        createBooking(input: $input) {
          id
          customerName
          customerEmail
          service {
            name
          }
          location {
            name
          }
          staffProfile {
            user {
              firstName
              lastName
            }
          }
          bookingDate
          startTime
          endTime
          status
          notes
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        createBooking: {
          id: string;
          customerName: string;
          customerEmail: string;
          service: { name: string };
          location: { name: string };
          staffProfile?: { user: { firstName: string; lastName: string } } | null;
          bookingDate: string;
          startTime: string;
          endTime: string;
          status: string;
          notes?: string;
        };
      }>(mutation, { input });
      
      return response.createBooking || null;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Get staff available for a service at a location
  async staffForService({ serviceId, locationId }: {
    serviceId: string;
    locationId: string;
  }): Promise<Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
    bio?: string;
    specializations: string[];
  }>> {
    const query = `
      query StaffForService($serviceId: ID!, $locationId: ID!) {
        staffForService(serviceId: $serviceId, locationId: $locationId) {
          id
          user {
            id
            firstName
            lastName
            profileImageUrl
          }
          bio
          specializations
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        staffForService: Array<{
          id: string;
          user: {
            id: string;
            firstName: string;
            lastName: string;
            profileImageUrl?: string;
          };
          bio?: string;
          specializations: string[];
        }>;
      }>(query, { serviceId, locationId });
      
      return response.staffForService || [];
    } catch (error) {
      console.error('Error fetching staff for service:', error);
      return [];
    }
  },

  // Get available time slots
  async availableSlots({ 
    serviceId, 
    locationId, 
    staffProfileId, 
    date 
  }: {
    serviceId: string;
    locationId: string;
    staffProfileId?: string;
    date: string;
  }): Promise<Array<{
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>> {
    const query = `
      query AvailableSlots($serviceId: ID!, $locationId: ID!, $staffProfileId: ID, $date: String!) {
        availableSlots(
          serviceId: $serviceId, 
          locationId: $locationId, 
          staffProfileId: $staffProfileId, 
          date: $date
        ) {
          startTime
          endTime
          isAvailable
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        availableSlots: Array<{
          startTime: string;
          endTime: string;
          isAvailable: boolean;
        }>;
      }>(query, { serviceId, locationId, staffProfileId, date });
      
      return response.availableSlots || [];
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  },

  async getOrders(filter?: {
    search?: string;
    shopId?: string;
    customerId?: string;
    status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    totalAmount: number;
    currency: {
      id: string;
      code: string;
      symbol: string;
    };
    shop: {
      id: string;
      name: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      product: {
        id: string;
        name: string;
        sku?: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetOrders($filter: OrderFilterInput, $pagination: PaginationInput) {
        orders(filter: $filter, pagination: $pagination) {
          id
          customerName
          customerEmail
          status
          totalAmount
          currency {
            id
            code
            symbol
          }
          shop {
            id
            name
          }
          items {
            id
            quantity
            unitPrice
            totalPrice
            product {
              id
              name
              sku
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        shopId?: string;
        customerId?: string;
        status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
        dateFrom?: string;
        dateTo?: string;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ orders: Array<{
      id: string;
      customerName: string;
      customerEmail: string;
      status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
      totalAmount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
      shop: {
        id: string;
        name: string;
      };
      items: Array<{
        id: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        product: {
          id: string;
          name: string;
          sku?: string;
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.orders || [];
  },

  // Product Category functions
  async getProductCategories(filter?: {
    search?: string;
    shopId?: string;
    parentId?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    slug: string;
    parentId?: string;
    isActive: boolean;
    shopId?: string;
    productCount: number;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetProductCategories($filter: ProductCategoryFilterInput, $pagination: PaginationInput) {
        productCategories(filter: $filter, pagination: $pagination) {
          id
          name
          description
          slug
          parentId
          isActive
          shopId
          productCount
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ productCategories: Array<{
      id: string;
      name: string;
      description?: string;
      slug: string;
      parentId?: string;
      isActive: boolean;
      shopId?: string;
      productCount: number;
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.productCategories || [];
  },

  async getProductCategory(id: string): Promise<{
    id: string;
    name: string;
    description?: string;
    slug: string;
    parentId?: string;
    isActive: boolean;
    shopId?: string;
    productCount: number;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetProductCategory($id: ID!) {
        productCategory(id: $id) {
          id
          name
          description
          slug
          parentId
          isActive
          shopId
          productCount
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ productCategory: {
      id: string;
      name: string;
      description?: string;
      slug: string;
      parentId?: string;
      isActive: boolean;
      shopId?: string;
      productCount: number;
      createdAt: string;
      updatedAt: string;
    } | null }>(query, { id });

    return result.productCategory;
  },

  async createProductCategory(input: {
    name: string;
    description?: string;
    slug: string;
    parentId?: string;
    isActive?: boolean;
    shopId?: string;
  }): Promise<{
    success: boolean;
    message: string;
    category?: {
      id: string;
      name: string;
      description?: string;
      slug: string;
      parentId?: string;
      isActive: boolean;
      shopId?: string;
      productCount: number;
      createdAt: string;
      updatedAt: string;
    };
  }> {
    const mutation = `
      mutation CreateProductCategory($input: CreateProductCategoryInput!) {
        createProductCategory(input: $input) {
          success
          message
          category {
            id
            name
            description
            slug
            parentId
            isActive
            shopId
            productCount
            createdAt
            updatedAt
          }
        }
      }
    `;

    const result = await gqlRequest<{ createProductCategory: {
      success: boolean;
      message: string;
      category?: {
        id: string;
        name: string;
        description?: string;
        slug: string;
        parentId?: string;
        isActive: boolean;
        shopId?: string;
        productCount: number;
        createdAt: string;
        updatedAt: string;
      };
    } }>(mutation, { input });

    return result.createProductCategory;
  },

  // Payment Provider functions
  async getPaymentProviders(filter?: {
    search?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPaymentProviders($filter: PaymentProviderFilterInput, $pagination: PaginationInput) {
        paymentProviders(filter: $filter, pagination: $pagination) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          paymentMethods {
            id
            name
            type
          }
          payments {
            id
            amount
            status
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ paymentProviders: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      paymentMethods: Array<{
        id: string;
        name: string;
        type: string;
      }>;
      payments: Array<{
        id: string;
        amount: number;
        status: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.paymentProviders || [];
  },

  async getPaymentProvider(id: string): Promise<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
    }>;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetPaymentProvider($id: ID!) {
        paymentProvider(id: $id) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          paymentMethods {
            id
            name
            type
          }
          payments {
            id
            amount
            status
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ paymentProvider: {
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      paymentMethods: Array<{
        id: string;
        name: string;
        type: string;
      }>;
      payments: Array<{
        id: string;
        amount: number;
        status: string;
      }>;
      createdAt: string;
      updatedAt: string;
    } | null }>(query, { id });

    return result.paymentProvider;
  },

  // Payment Method functions
  async getPaymentMethods(filter?: {
    search?: string;
    providerId?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    providerId: string;
    isActive: boolean;
    processingFeeRate?: number;
    fixedFee?: number;
    provider: {
      id: string;
      name: string;
      type: string;
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPaymentMethods($filter: PaymentMethodFilterInput, $pagination: PaginationInput) {
        paymentMethods(filter: $filter, pagination: $pagination) {
          id
          name
          type
          providerId
          isActive
          processingFeeRate
          fixedFee
          provider {
            id
            name
            type
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
      providerId: string;
      isActive: boolean;
      processingFeeRate?: number;
      fixedFee?: number;
      provider: {
        id: string;
        name: string;
        type: string;
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.paymentMethods || [];
  },

  // Payment functions
  async getPayments(filter?: {
    search?: string;
    orderId?: string;
    status?: string;
    providerId?: string;
    paymentMethodId?: string;
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    orderId?: string;
    amount: number;
    status: string;
    transactionId?: string;
    failureReason?: string;
    refundAmount?: number;
    currency: {
      id: string;
      code: string;
      name: string;
      symbol: string;
    };
    paymentMethod: {
      id: string;
      name: string;
      type: string;
      provider: {
        id: string;
        name: string;
        type: string;
      };
    };
    provider: {
      id: string;
      name: string;
      type: string;
    };
    order?: {
      id: string;
      customerName: string;
      customerEmail: string;
      totalAmount: number;
      shop: {
        id: string;
        name: string;
      };
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPayments($filter: PaymentFilterInput, $pagination: PaginationInput) {
        payments(filter: $filter, pagination: $pagination) {
          id
          orderId
          amount
          status
          transactionId
          failureReason
          refundAmount
          currency {
            id
            code
            name
            symbol
          }
          paymentMethod {
            id
            name
            type
            provider {
              id
              name
              type
            }
          }
          provider {
            id
            name
            type
          }
          order {
            id
            customerName
            customerEmail
            totalAmount
            shop {
              id
              name
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ payments: Array<{
      id: string;
      orderId?: string;
      amount: number;
      status: string;
      transactionId?: string;
      failureReason?: string;
      refundAmount?: number;
      currency: {
        id: string;
        code: string;
        name: string;
        symbol: string;
      };
      paymentMethod: {
        id: string;
        name: string;
        type: string;
        provider: {
          id: string;
          name: string;
          type: string;
        };
      };
      provider: {
        id: string;
        name: string;
        type: string;
      };
      order?: {
        id: string;
        customerName: string;
        customerEmail: string;
        totalAmount: number;
        shop: {
          id: string;
          name: string;
        };
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.payments || [];
  },

  async createPaymentProvider(input: {
    name: string;
    type: string;
    isActive?: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
  }): Promise<{
    success: boolean;
    message: string;
    provider?: {
      id: string;
      name: string;
      type: string;
      isActive: boolean;
    };
  }> {
    const mutation = `
      mutation CreatePaymentProvider($input: CreatePaymentProviderInput!) {
        createPaymentProvider(input: $input) {
          success
          message
          provider {
            id
            name
            type
            isActive
          }
        }
      }
    `;

    const result = await gqlRequest<{ createPaymentProvider: {
      success: boolean;
      message: string;
      provider?: {
        id: string;
        name: string;
        type: string;
        isActive: boolean;
      };
    } }>(mutation, { input });

    return result.createPaymentProvider;
  },

  // Shipping functions
  async getShippingProviders(filter?: {
    search?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    trackingUrl?: string;
    shippingMethods: Array<{
      id: string;
      name: string;
      description?: string;
      isActive: boolean;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      trackingEnabled: boolean;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingProviders($filter: ShippingProviderFilterInput, $pagination: PaginationInput) {
        shippingProviders(filter: $filter, pagination: $pagination) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          trackingUrl
          shippingMethods {
            id
            name
            description
            isActive
            estimatedDaysMin
            estimatedDaysMax
            trackingEnabled
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        type?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shippingProviders: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      trackingUrl?: string;
      shippingMethods: Array<{
        id: string;
        name: string;
        description?: string;
        isActive: boolean;
        estimatedDaysMin?: number;
        estimatedDaysMax?: number;
        trackingEnabled: boolean;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shippingProviders || [];
  },

  async getShippingMethods(filter?: {
    search?: string;
    providerId?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    providerId: string;
    isActive: boolean;
    estimatedDaysMin?: number;
    estimatedDaysMax?: number;
    trackingEnabled: boolean;
    provider: {
      id: string;
      name: string;
      type: string;
    };
    shippingRates: Array<{
      id: string;
      baseRate: number;
      minWeight?: number;
      maxWeight?: number;
      shippingZone: {
        id: string;
        name: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingMethods($filter: ShippingMethodFilterInput, $pagination: PaginationInput) {
        shippingMethods(filter: $filter, pagination: $pagination) {
          id
          name
          description
          providerId
          isActive
          estimatedDaysMin
          estimatedDaysMax
          trackingEnabled
          provider {
            id
            name
            type
          }
          shippingRates {
            id
            baseRate
            minWeight
            maxWeight
            shippingZone {
              id
              name
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        providerId?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shippingMethods: Array<{
      id: string;
      name: string;
      description?: string;
      providerId: string;
      isActive: boolean;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      trackingEnabled: boolean;
      provider: {
        id: string;
        name: string;
        type: string;
      };
      shippingRates: Array<{
        id: string;
        baseRate: number;
        minWeight?: number;
        maxWeight?: number;
        shippingZone: {
          id: string;
          name: string;
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shippingMethods || [];
  },

  async getShippingZones(filter?: {
    search?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    countries: string[];
    states: string[];
    postalCodes: string[];
    isActive: boolean;
    shippingRates: Array<{
      id: string;
      baseRate: number;
      shippingMethod: {
        id: string;
        name: string;
        provider: {
          id: string;
          name: string;
        };
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingZones($filter: ShippingZoneFilterInput, $pagination: PaginationInput) {
        shippingZones(filter: $filter, pagination: $pagination) {
          id
          name
          description
          countries
          states
          postalCodes
          isActive
          shippingRates {
            id
            baseRate
            shippingMethod {
              id
              name
              provider {
                id
                name
              }
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shippingZones: Array<{
      id: string;
      name: string;
      description?: string;
      countries: string[];
      states: string[];
      postalCodes: string[];
      isActive: boolean;
      shippingRates: Array<{
        id: string;
        baseRate: number;
        shippingMethod: {
          id: string;
          name: string;
          provider: {
            id: string;
            name: string;
          };
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shippingZones || [];
  },

  async getShipments(filter?: {
    search?: string;
    orderId?: string;
    status?: string;
    shippingMethodId?: string;
    trackingNumber?: string;
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    orderId: string;
    trackingNumber?: string;
    status: string;
    shippingCost: number;
    weight?: number;
    dimensions?: string;
    fromAddress: string;
    toAddress: string;
    shippedAt?: string;
    estimatedDelivery?: string;
    deliveredAt?: string;
    order: {
      id: string;
      customerName: string;
      customerEmail: string;
      totalAmount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
      shop: {
        id: string;
        name: string;
      };
    };
    shippingMethod: {
      id: string;
      name: string;
      provider: {
        id: string;
        name: string;
        type: string;
      };
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShipments($filter: ShipmentFilterInput, $pagination: PaginationInput) {
        shipments(filter: $filter, pagination: $pagination) {
          id
          orderId
          trackingNumber
          status
          shippingCost
          weight
          dimensions
          fromAddress
          toAddress
          shippedAt
          estimatedDelivery
          deliveredAt
          order {
            id
            customerName
            customerEmail
            totalAmount
            currency {
              id
              code
              symbol
            }
            shop {
              id
              name
            }
          }
          shippingMethod {
            id
            name
            provider {
              id
              name
              type
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        orderId?: string;
        status?: string;
        shippingMethodId?: string;
        trackingNumber?: string;
        dateFrom?: string;
        dateTo?: string;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shipments: Array<{
      id: string;
      orderId: string;
      trackingNumber?: string;
      status: string;
      shippingCost: number;
      weight?: number;
      dimensions?: string;
      fromAddress: string;
      toAddress: string;
      shippedAt?: string;
      estimatedDelivery?: string;
      deliveredAt?: string;
      order: {
        id: string;
        customerName: string;
        customerEmail: string;
        totalAmount: number;
        currency: {
          id: string;
          code: string;
          symbol: string;
        };
        shop: {
          id: string;
          name: string;
        };
      };
      shippingMethod: {
        id: string;
        name: string;
        provider: {
          id: string;
          name: string;
          type: string;
        };
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shipments || [];
  },

};

// Form Builder API functions
async function getForms(): Promise<FormBase[]> {
  const query = `
    query GetForms {
      forms {
        id
        title
        description
        slug
        isMultiStep
        isActive
        successMessage
        redirectUrl
        submitButtonText
        submitButtonStyle
        layout
        styling
        pageId
        createdById
        updatedById
        createdAt
        updatedAt
        fields {
          id
        }
        steps {
          id
          fields {
            id
          }
        }
      }
    }
  `;

  try {
    const response = await gqlRequest<{ forms: FormBase[] }>(query);
    
    // Calcular el número total de campos para cada formulario
    const formsWithFieldCount = response.forms?.map(form => {
      // Campos directos del formulario
      const directFields = form.fields || [];
      
      // Campos en los pasos (si es un formulario de múltiples pasos)
      const stepFields = form.steps?.flatMap(step => step.fields || []) || [];
      
      // Asegurar que fields sea al menos un array vacío
      return {
        ...form,
        fields: directFields,
        totalFieldCount: directFields.length + stepFields.length
      };
    }) || [];
    
    return formsWithFieldCount;
  } catch (error) {
    console.error('Error fetching forms:', error);
    return [];
  }
}

async function getFormById(id: string): Promise<FormBase | null> {
  try {
    const query = `
      query GetForm($id: ID!) {
        form(id: $id) {
          id
          title
          description
          slug
          isMultiStep
          isActive
          successMessage
          redirectUrl
          submitButtonText
          submitButtonStyle
          layout
          styling
          pageId
          createdById
          updatedById
          createdAt
          updatedAt
          fields {
            id
            label
            name
            type
            placeholder
            defaultValue
            helpText
            isRequired
            order
            options
            validationRules
            styling
            width
            createdAt
            updatedAt
          }
          steps {
            id
            title
            description
            order
            isVisible
            validationRules
            createdAt
            updatedAt
            fields {
              id
              label
              name
              type
              placeholder
              defaultValue
              helpText
              isRequired
              order
              options
              validationRules
              styling
              width
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const variables = { id };

    try {
      const response = await gqlRequest<{ form: FormBase }>(query, variables);
      return response.form || null;
    } catch (error) {
      console.warn('Error fetching form by ID, creating fallback:', error);
      // Return a minimal fallback form to prevent UI breakage
      return {
        id,
        title: 'Form Unavailable',
        description: 'This form could not be loaded.',
        slug: 'unavailable-form',
        isMultiStep: false,
        isActive: true,
        fields: [],
        steps: [],
        submitButtonText: 'Submit',
        createdById: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as FormBase;
    }
  } catch (error) {
    console.error('Error in getFormById:', error);
    return null;
  }
}

async function getFormBySlug(slug: string): Promise<FormBase | null> {
  const query = `
    query GetFormBySlug($slug: String!) {
      formBySlug(slug: $slug) {
        id
        title
        description
        slug
        isMultiStep
        isActive
        successMessage
        redirectUrl
        submitButtonText
        submitButtonStyle
        layout
        styling
        pageId
        createdById
        updatedById
        createdAt
        updatedAt
        fields {
          id
          label
          name
          type
          placeholder
          defaultValue
          helpText
          isRequired
          order
          options
          validationRules
          styling
          width
          createdAt
          updatedAt
        }
        steps {
          id
          title
          description
          order
          isVisible
          validationRules
          createdAt
          updatedAt
          fields {
            id
            label
            name
            type
            placeholder
            defaultValue
            helpText
            isRequired
            order
            options
            validationRules
            styling
            width
            createdAt
            updatedAt
          }
        }
      }
    }
  `;

  const variables = { slug };

  try {
    const response = await gqlRequest<{ formBySlug: FormBase }>(query, variables);
    return response.formBySlug || null;
  } catch (error) {
    console.error('Error fetching form by slug:', error);
    return null;
  }
}

async function getFormSteps(formId: string): Promise<FormStepBase[]> {
  const query = `
    query GetFormSteps($formId: ID!) {
      formSteps(formId: $formId) {
        id
        formId
        title
        description
        order
        isVisible
        validationRules
        createdAt
        updatedAt
        fields {
          id
          label
          name
          type
          placeholder
          defaultValue
          helpText
          isRequired
          order
          options
          validationRules
          styling
          width
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { formId };

  try {
    const response = await gqlRequest<{ formSteps: FormStepBase[] }>(query, variables);
    return response.formSteps || [];
  } catch (error) {
    console.error('Error fetching form steps:', error);
    return [];
  }
}

async function getFormFields(formId: string, stepId?: string): Promise<FormFieldBase[]> {
  const query = `
    query GetFormFields($formId: ID!, $stepId: ID) {
      formFields(formId: $formId, stepId: $stepId) {
        id
        formId
        stepId
        label
        name
        type
        placeholder
        defaultValue
        helpText
        isRequired
        order
        options
        validationRules
        styling
        width
        createdAt
        updatedAt
      }
    }
  `;

  const variables = { formId, stepId };

  try {
    const response = await gqlRequest<{ formFields: FormFieldBase[] }>(query, variables);
    return response.formFields || [];
  } catch (error) {
    console.error('Error fetching form fields:', error);
    return [];
  }
}

async function getFormSubmissions(formId: string, limit?: number, offset?: number): Promise<FormSubmissionBase[]> {
  const query = `
    query GetFormSubmissions($formId: ID!, $limit: Int, $offset: Int) {
      formSubmissions(formId: $formId, limit: $limit, offset: $offset) {
        id
        formId
        data
        metadata
        status
        createdAt
        updatedAt
      }
    }
  `;

  const variables = { formId, limit, offset };

  try {
    const response = await gqlRequest<{ formSubmissions: FormSubmissionBase[] }>(query, variables);
    return response.formSubmissions || [];
  } catch (error) {
    console.error('Error fetching form submissions:', error);
    return [];
  }
}

async function getFormSubmissionStats(formId: string): Promise<FormSubmissionStats | null> {
  const query = `
    query GetFormSubmissionStats($formId: ID!) {
      formSubmissionStats(formId: $formId)
    }
  `;

  const variables = { formId };

  try {
    const response = await gqlRequest<{ formSubmissionStats: FormSubmissionStats }>(query, variables);
    return response.formSubmissionStats || null;
  } catch (error) {
    console.error('Error fetching form submission stats:', error);
    return null;
  }
}

async function createForm(input: FormInput): Promise<FormResult> {
  const mutation = `
    mutation CreateForm($input: FormInput!) {
      createForm(input: $input) {
        success
        message
        form {
          id
          title
          description
          slug
          isMultiStep
          isActive
          successMessage
          redirectUrl
          submitButtonText
          submitButtonStyle
          layout
          styling
          pageId
          createdById
          updatedById
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { input };

  try {
    const response = await gqlRequest<{ createForm: FormResult }>(mutation, variables);
    if (response.createForm && response.createForm.success && response.createForm.form) {
      optimizedQueries.invalidateCache('forms'); // General list
      clearCache('forms'); // Local cache general list
      optimizedQueries.invalidateCache(`form:${response.createForm.form.id}`);
      clearCache(`form_${response.createForm.form.id}`); // Local cache specific form
      if (response.createForm.form.slug) {
        optimizedQueries.invalidateCache(`form:${response.createForm.form.slug}`);
        clearCache(`form_slug_${response.createForm.form.slug}`);
      }
    }
    return response.createForm || { success: false, message: 'Failed to create form', form: null };
  } catch (error) {
    console.error('Error creating form:', error);
    return { success: false, message: 'Error creating form', form: null };
  }
}

async function updateForm(id: string, input: Partial<FormInput>): Promise<FormResult> {
  const mutation = `
    mutation UpdateForm($id: ID!, $input: UpdateFormInput!) {
      updateForm(id: $id, input: $input) {
        success
        message
        form {
          id
          title
          description
          slug
          isMultiStep
          isActive
          successMessage
          redirectUrl
          submitButtonText
          submitButtonStyle
          layout
          styling
          pageId
          createdById
          updatedById
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { id, input };

  try {
    const response = await gqlRequest<{ updateForm: FormResult }>(mutation, variables);
    if (response.updateForm && response.updateForm.success && response.updateForm.form) {
      optimizedQueries.invalidateCache(`form:${id}`);
      clearCache(`form_${id}`);
      if (response.updateForm.form.slug) {
        optimizedQueries.invalidateCache(`form:${response.updateForm.form.slug}`);
        clearCache(`form_slug_${response.updateForm.form.slug}`);
      }
      // If the input contained a slug (e.g. if slug could be changed), invalidate old slug too
      if (input.slug && input.slug !== response.updateForm.form.slug) {
         optimizedQueries.invalidateCache(`form:${input.slug}`);
         clearCache(`form_slug_${input.slug}`);
      }
      optimizedQueries.invalidateCache('forms'); // General list
      clearCache('forms');
    }
    return response.updateForm || { success: false, message: 'Failed to update form', form: null };
  } catch (error) {
    console.error('Error updating form:', error);
    return { success: false, message: 'Error updating form', form: null };
  }
}

async function deleteForm(id: string): Promise<FormResult> {
  const mutation = `
    mutation DeleteForm($id: ID!) {
      deleteForm(id: $id) {
        success
        message
      }
    }
  `;

  const variables = { id };

  try {
    const response = await gqlRequest<{ deleteForm: FormResult }>(mutation, variables);
    if (response.deleteForm && response.deleteForm.success) {
      // We need to know the slug if forms are cached by slug by GraphQLOptimizer
      // This example assumes we don't have slug here, so only invalidate by ID for GraphQLOptimizer.
      // If form details (like slug) were fetched before delete or part of response, we could use them.
      optimizedQueries.invalidateCache(`form:${id}`);
      clearCache(`form_${id}`); 
      // To be safe, if slugs are used, we might need to clear a specific slug if known, or be more general.
      optimizedQueries.invalidateCache('forms'); // General list
      clearCache('forms');
    }
    return response.deleteForm || { success: false, message: 'Failed to delete form', form: null };
  } catch (error) {
    console.error('Error deleting form:', error);
    return { success: false, message: 'Error deleting form', form: null };
  }
}

async function createFormStep(input: FormStepInput): Promise<FormStepResult> {
  const mutation = `
    mutation CreateFormStep($input: FormStepInput!) {
      createFormStep(input: $input) {
        success
        message
        step {
          id
          formId
          title
          description
          order
          isVisible
          validationRules
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { input };

  try {
    const response = await gqlRequest<{ createFormStep: FormStepResult }>(mutation, variables);
    if (response.createFormStep && response.createFormStep.success && response.createFormStep.step) {
      const formId = response.createFormStep.step.formId;
      optimizedQueries.invalidateCache(`form:${formId}`);
      clearCache(`form_${formId}`);
      optimizedQueries.invalidateCache('forms'); // Also invalidate general list as form structure changed.
      clearCache('forms');
    }
    return response.createFormStep || { success: false, message: 'Failed to create form step', step: null };
  } catch (error) {
    console.error('Error creating form step:', error);
    return { success: false, message: 'Error creating form step', step: null };
  }
}

async function createFormField(input: FormFieldInput): Promise<FormFieldResult> {
  const mutation = `
    mutation CreateFormField($input: FormFieldInput!) {
      createFormField(input: $input) {
        success
        message
        field {
          id
          formId
          stepId
          label
          name
          type
          placeholder
          defaultValue
          helpText
          isRequired
          order
          options
          validationRules
          styling
          width
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { input };

  try {
    const response = await gqlRequest<{ createFormField: FormFieldResult }>(mutation, variables);
    if (response.createFormField && response.createFormField.success && response.createFormField.field) {
      const formId = response.createFormField.field.formId;
      if (formId) {
        optimizedQueries.invalidateCache(`form:${formId}`);
        clearCache(`form_${formId}`);
        optimizedQueries.invalidateCache('forms'); 
        clearCache('forms');
      }
    }
    return response.createFormField || { success: false, message: 'Failed to create form field', field: null };
  } catch (error) {
    console.error('Error creating form field:', error);
    return { success: false, message: 'Error creating form field', field: null };
  }
}

// Update a form field
async function updateFormField(id: string, input: FormFieldInput): Promise<FormFieldResult> {
  const mutation = `
    mutation UpdateFormField($id: ID!, $input: UpdateFormFieldInput!) {
      updateFormField(id: $id, input: $input) {
        success
        message
        field {
          id
          formId
          stepId
          label
          name
          type
          placeholder
          defaultValue
          helpText
          isRequired
          order
          options
          validationRules
          styling
          width
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { id, input };

  try {
    const response = await gqlRequest<{ updateFormField: FormFieldResult }>(mutation, variables);
    if (response.updateFormField && response.updateFormField.success && response.updateFormField.field) {
      const formId = response.updateFormField.field.formId;
      // The input to updateFormField IS FormFieldInput, which should contain formId
      // However, the returned field object is what we are checking here.
      if (formId) { 
        optimizedQueries.invalidateCache(`form:${formId}`);
        clearCache(`form_${formId}`);
        optimizedQueries.invalidateCache('forms');
        clearCache('forms');
      } else if (input.formId) { // Fallback to input if not in response
        optimizedQueries.invalidateCache(`form:${input.formId}`);
        clearCache(`form_${input.formId}`);
        optimizedQueries.invalidateCache('forms');
        clearCache('forms');
      }
    }
    return response.updateFormField || { success: false, message: 'Failed to update form field', field: null };
  } catch (error) {
    console.error('Error updating form field:', error);
    return { success: false, message: 'Error updating form field', field: null };
  }
}

// Delete a form field
async function deleteFormField(id: string): Promise<{success: boolean; message: string}> {
  const mutation = `
    mutation DeleteFormField($id: ID!) {
      deleteFormField(id: $id) {
        success
        message
      }
    }
  `;

  const variables = { id };

  try {
    const response = await gqlRequest<{ deleteFormField: {success: boolean; message: string} }>(mutation, variables);
    if (response.deleteFormField && response.deleteFormField.success) {
      // ID here is the field ID. FormID is not directly available.
      // Invalidate general forms list as a broader measure.
      optimizedQueries.invalidateCache('forms');
      clearCache('forms');
    }
    return response.deleteFormField || { success: false, message: 'Failed to delete form field' };
  } catch (error) {
    console.error('Error deleting form field:', error);
    return { success: false, message: 'Error deleting form field' };
  }
}

async function submitForm(input: FormSubmissionInput): Promise<FormSubmissionResult> {
  const query = `
    mutation SubmitForm($input: FormSubmissionInput!) {
      submitForm(input: $input) {
        success
        message
        submission {
          id
          formId
          data
          metadata
          status
          createdAt
          updatedAt
        }
      }
    }
  `;

  try {
    const response = await gqlRequest<{ submitForm: FormSubmissionResult }>(query, { input });
    return response.submitForm;
  } catch (error) {
    console.error('Error submitting form:', error);
    throw error;
  }
}

async function updateFormSubmissionStatus(id: string, status: string): Promise<FormSubmissionResult> {
  const query = `
    mutation UpdateFormSubmissionStatus($id: ID!, $status: SubmissionStatus!) {
      updateFormSubmissionStatus(id: $id, status: $status) {
        success
        message
        submission {
          id
          formId
          data
          metadata
          status
          createdAt
          updatedAt
        }
      }
    }
  `;

  try {
    const response = await gqlRequest<{ updateFormSubmissionStatus: FormSubmissionResult }>(query, { id, status });
    return response.updateFormSubmissionStatus;
  } catch (error) {
    console.error('Error updating form submission status:', error);
    throw error;
  }
}

// Update field order
async function updateFieldOrder(id: string, newOrder: number): Promise<FormFieldResult> {
  const mutation = `
    mutation UpdateFieldOrder($id: ID!, $order: Int!) {
      updateFormField(id: $id, input: { order: $order }) {
        success
        message
        field {
          id
          formId
          stepId
          label
          name
          type
          order
          isRequired
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { id, order: newOrder };

  try {
    const response = await gqlRequest<{ updateFormField: FormFieldResult }>(mutation, variables);
    return response.updateFormField || { success: false, message: 'Failed to update field order', field: null };
  } catch (error) {
    console.error('Error updating field order:', error);
    return { success: false, message: 'Error updating field order', field: null };
  }
}

// Update multiple field orders at once
async function updateFieldOrders(updates: Array<{ id: string; order: number }>): Promise<{
  success: boolean;
  message: string;
}> {
  const mutation = `
    mutation UpdateFieldOrders($updates: [FieldOrderUpdate!]!) {
      updateFieldOrders(updates: $updates) {
        success
        message
      }
    }
  `;

  const variables = { updates };

  try {
    const response = await gqlRequest<{ 
      updateFieldOrders: {
        success: boolean;
        message: string;
      }
    }>(mutation, variables);
    
    if (response.updateFieldOrders && response.updateFieldOrders.success) {
      // This is a batch operation. We don't have individual formIds here easily.
      // Invalidate the general forms list.
      optimizedQueries.invalidateCache('forms');
      clearCache('forms');
    }
    
    return response.updateFieldOrders || { 
      success: false, 
      message: 'Failed to update field orders' 
    };
  } catch (error) {
    console.error('Error updating field orders:', error);
    return { 
      success: false, 
      message: 'Error updating field orders' 
    };
  }
}

// Create a variable for the exported object
const graphqlClient = {
  // CMS Operations
  ...cmsOperations,
  
  // Form Builder functions
  getForms,
  getFormById,
  getFormBySlug,
  getFormSteps,
  getFormFields,
  getFormSubmissions,
  getFormSubmissionStats,
  createForm,
  updateForm,
  deleteForm,
  createFormStep,
  updateFormStep,
  deleteFormStep,
  updateStepOrders,
  createFormField,
  updateFormField,
  updateFieldOrder,
  updateFieldOrders,
  deleteFormField,
  submitForm,
  updateFormSubmissionStatus,
  deleteFormSubmission,

  // Blog operations
  async getBlogs() {
    const query = `
      query GetBlogs {
        blogs {
          id
          title
          description
          slug
          isActive
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ blogs: Blog[] }>(query);
      return response.blogs;
    } catch (error) {
      console.error('Error fetching blogs:', error);
      return [];
    }
  },

  async getBlogById(id: string) {
    const query = `
      query GetBlogById($id: ID!) {
        blog(id: $id) {
          id
          title
          description
          slug
          isActive
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ blog: Blog | null }>(query, { id });
      return response.blog;
    } catch (error) {
      console.error('Error fetching blog:', error);
      return null;
    }
  },

  async getBlogBySlug(slug: string) {
    const query = `
      query GetBlogBySlug($slug: String!) {
        blogBySlug(slug: $slug) {
          id
          title
          description
          slug
          isActive
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ blogBySlug: Blog | null }>(query, { slug });
      return response.blogBySlug;
    } catch (error) {
      console.error('Error fetching blog by slug:', error);
      return null;
    }
  },

  async createBlog(input: {
    title: string;
    description?: string | null;
    slug: string;
    isActive: boolean;
  }) {
    const query = `
      mutation CreateBlog($input: BlogInput!) {
        createBlog(input: $input) {
          success
          message
          blog {
            id
            title
            description
            slug
            isActive
            createdAt
            updatedAt
          }
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        createBlog: {
          success: boolean;
          message: string;
          blog: Blog | null;
        };
      }>(query, { input });
      if (response.createBlog && response.createBlog.success && response.createBlog.blog) {
        const newBlog = response.createBlog.blog;
        optimizedQueries.invalidateCache('blogs'); // General list
        clearCache('blogs');
        optimizedQueries.invalidateCache(`blog:${newBlog.id}`);
        clearCache(`blog_${newBlog.id}`);
        if (newBlog.slug) {
          optimizedQueries.invalidateCache(`blog:${newBlog.slug}`);
          clearCache(`blog_slug_${newBlog.slug}`);
        }
      }
      return response.createBlog;
    } catch (error) {
      console.error('Error creating blog:', error);
      return {
        success: false,
        message: 'An error occurred while creating the blog',
        blog: null
      };
    }
  },

  async deleteBlog(id: string) {
    const query = `
      mutation DeleteBlog($id: ID!) {
        deleteBlog(id: $id) {
          success
          message
        }
      }
    `;
    const response = await gqlRequest<{ deleteBlog: { success: boolean; message: string } }>(query, { id });
    if (response.deleteBlog && response.deleteBlog.success) {
      optimizedQueries.invalidateCache(`blog:${id}`);
      clearCache(`blog_${id}`);
      // If slug was known, invalidate it too. For delete, often only ID is available.
      // optimizedQueries.invalidateCache(`blog:${slug}`); 
      optimizedQueries.invalidateCache('blogs');
      clearCache('blogs');
    }
    return response.deleteBlog;
  },

  async updateBlog(id: string, input: {
    title?: string;
    description?: string | null;
    slug?: string;
    isActive?: boolean;
  }) {
    const query = `
      mutation UpdateBlog($id: ID!, $input: BlogInput!) {
        updateBlog(id: $id, input: $input) {
          success
          message
          blog {
            id
            title
            description
            slug
            isActive
            createdAt
            updatedAt
          }
        }
      }
    `;
    
    try {
      const response = await gqlRequest<{
        updateBlog: {
          success: boolean;
          message: string;
          blog: Blog | null;
        };
      }>(query, { id, input });
      
      if (response.updateBlog && response.updateBlog.success && response.updateBlog.blog) {
        const updatedBlog = response.updateBlog.blog;
        optimizedQueries.invalidateCache(`blog:${id}`);
        clearCache(`blog_${id}`);
        if (updatedBlog.slug) {
          optimizedQueries.invalidateCache(`blog:${updatedBlog.slug}`);
          clearCache(`blog_slug_${updatedBlog.slug}`);
        }
        // If input slug is different from response slug (slug changed)
        if (input.slug && updatedBlog.slug && input.slug !== updatedBlog.slug) {
            optimizedQueries.invalidateCache(`blog:${input.slug}`);
            clearCache(`blog_slug_${input.slug}`);
        }
        optimizedQueries.invalidateCache('blogs');
        clearCache('blogs');
      }
      return response.updateBlog;
    } catch (error) {
      console.error('Error updating blog:', error);
      return {
        success: false,
        message: 'Failed to update blog',
        blog: null
      };
    }
  },

  // Post operations
  async createPost(input: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    // featuredImage?: string; // Field removed, use featuredImageId
    featuredImageId?: string; // Ensure this is part of the input type if not already
    status: string;
    blogId: string;
    authorId: string;
    publishedAt?: string | null;
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    categories?: string[];
  }) {
    const mutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          success
          message
          post {
            id
            title
            slug
            content
            excerpt
            # featuredImage // Field removed
            featuredImageMedia {
              fileUrl
            }
            status
            blogId
            authorId
            publishedAt
            metaTitle
            metaDescription
            tags
            categories
            createdAt
            updatedAt
          }
        }
      }
    `;
    const response = await gqlRequest<{ createPost: { success: boolean; message: string; post: Post | null } }>(mutation, { input });
    if (response.createPost && response.createPost.success && response.createPost.post) {
      const newPost = response.createPost.post;
      optimizedQueries.invalidateCache('posts'); // General list
      clearCache('posts');
      optimizedQueries.invalidateCache(`post:${newPost.id}`);
      clearCache(`post_${newPost.id}`);
      if (newPost.slug) {
        optimizedQueries.invalidateCache(`post:${newPost.slug}`);
        clearCache(`post_slug_${newPost.slug}`);
      }
      if (newPost.blogId) { // blogId comes from input, should be in newPost
        optimizedQueries.invalidateCache(`blog:${newPost.blogId}`);
        clearCache(`blog_${newPost.blogId}`); // Assuming blog specific cache might list posts
      }
    }
    return response.createPost;
  },

  async getPosts(filter?: {
    blogId?: string;
    status?: string;
    authorId?: string;
    tags?: string[];
    categories?: string[];
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const query = `
      query GetPosts($filter: PostFilter) {
        posts(filter: $filter) {
          id
          title
          slug
          content
          excerpt
          # featuredImage // Field removed
          featuredImageMedia {
            fileUrl
          }
          status
          blogId
          authorId
          publishedAt
          metaTitle
          metaDescription
          tags
          categories
          readTime
          createdAt
          updatedAt
          author {
            id
            firstName
            lastName
            email
            profileImageUrl
          }
          blog {
            id
            title
            slug
          }
        }
      }
    `;
    const response = await gqlRequest<{ posts: Post[] }>(query, { filter });
    return response.posts || [];
  },
  

  async getPostBySlug(slug: string) {
    const query = `
      query GetPostBySlug($slug: String!) {
        postBySlug(slug: $slug) {
          id
          title
          slug
          content
          excerpt
          # featuredImage // Field removed
          featuredImageMedia {
            fileUrl
          }
          status
          blogId
          authorId
          publishedAt
          metaTitle
          metaDescription
          tags
          categories
          readTime
          createdAt
          updatedAt
          author {
            id
            firstName
            lastName
            email
            profileImageUrl
          }
          blog {
            id
            title
            slug
          }
        }
      }
    `;
    const response = await gqlRequest<{ postBySlug: Post | null }>(query, { slug });
    return response.postBySlug;
  },

  async updatePost(id: string, input: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    // featuredImage?: string; // Field removed, use featuredImageId
    featuredImageId?: string; // Ensure this is part of the input type if not already
    status?: string;
    publishedAt?: string | null;
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
    categories?: string[];
  }) {
    const mutation = `
      mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
        updatePost(id: $id, input: $input) {
          success
          message
          post {
            id
            title
            slug
            status
            updatedAt
          }
        }
      }
    `;
    const response = await gqlRequest<{ updatePost: { success: boolean; message: string; post: Post | null } }>(mutation, { id, input });
    if (response.updatePost && response.updatePost.success && response.updatePost.post) {
      const updatedPost = response.updatePost.post;
      optimizedQueries.invalidateCache(`post:${id}`);
      clearCache(`post_${id}`);
      if (updatedPost.slug) {
        optimizedQueries.invalidateCache(`post:${updatedPost.slug}`);
        clearCache(`post_slug_${updatedPost.slug}`);
      }
       // If input slug is different from response slug (slug changed)
      if (input.slug && updatedPost.slug && input.slug !== updatedPost.slug) {
        optimizedQueries.invalidateCache(`post:${input.slug}`);
        clearCache(`post_slug_${input.slug}`);
      }
      optimizedQueries.invalidateCache('posts');
      clearCache('posts');
      // Assuming blogId does not change on update. If it could, we'd need old and new blogId.
      // If the post details returned included blogId, we could invalidate it:
      // if (updatedPost.blogId) {
      //   optimizedQueries.invalidateCache(`blog:${updatedPost.blogId}`);
      //   clearCache(`blog_${updatedPost.blogId}`);
      // }
    }
    return response.updatePost;
  },

  async deletePost(id: string) {
    const mutation = `
      mutation DeletePost($id: ID!) {
        deletePost(id: $id) {
          success
          message
        }
      }
    `;
    const response = await gqlRequest<{ deletePost: { success: boolean; message: string } }>(mutation, { id });
    if (response.deletePost && response.deletePost.success) {
      optimizedQueries.invalidateCache(`post:${id}`);
      clearCache(`post_${id}`);
      // If slug/blogId were known, invalidate them too.
      // optimizedQueries.invalidateCache(`post:${slug}`);
      // optimizedQueries.invalidateCache(`blog:${blogId}`);
      optimizedQueries.invalidateCache('posts');
      clearCache('posts');
    }
    return response.deletePost;
  },

  // Settings operations
  async getSiteSettings(): Promise<{
    id: string;
    siteName: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale: string;
    footerText?: string;
    maintenanceMode: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales: string[];
    twitterCardType?: string;
    twitterHandle?: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetSiteSettings {
        getSiteSettings {
          id
          siteName
          siteDescription
          logoUrl
          faviconUrl
          primaryColor
          secondaryColor
          googleAnalyticsId
          facebookPixelId
          customCss
          customJs
          contactEmail
          contactPhone
          address
          accentColor
          defaultLocale
          footerText
          maintenanceMode
          metaDescription
          metaTitle
          ogImage
          socialLinks
          supportedLocales
          twitterCardType
          twitterHandle
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ getSiteSettings: {
        id: string;
        siteName: string;
        siteDescription?: string;
        logoUrl?: string;
        faviconUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
        customCss?: string;
        customJs?: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        accentColor?: string;
        defaultLocale: string;
        footerText?: string;
        maintenanceMode: boolean;
        metaDescription?: string;
        metaTitle?: string;
        ogImage?: string;
        socialLinks?: string;
        supportedLocales: string[];
        twitterCardType?: string;
        twitterHandle?: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(query);
      return response.getSiteSettings;
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return null;
    }
  },

  async updateSiteSettings(input: {
    siteName?: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale?: string;
    footerText?: string;
    maintenanceMode?: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales?: string[];
    twitterCardType?: string;
    twitterHandle?: string;
  }): Promise<{
    id: string;
    siteName: string;
    siteDescription?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customCss?: string;
    customJs?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
    accentColor?: string;
    defaultLocale: string;
    footerText?: string;
    maintenanceMode: boolean;
    metaDescription?: string;
    metaTitle?: string;
    ogImage?: string;
    socialLinks?: string;
    supportedLocales: string[];
    twitterCardType?: string;
    twitterHandle?: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const mutation = `
      mutation UpdateSiteSettings($input: UpdateSiteSettingsInput!) {
        updateSiteSettings(input: $input) {
          id
          siteName
          siteDescription
          logoUrl
          faviconUrl
          primaryColor
          secondaryColor
          googleAnalyticsId
          facebookPixelId
          customCss
          customJs
          contactEmail
          contactPhone
          address
          accentColor
          defaultLocale
          footerText
          maintenanceMode
          metaDescription
          metaTitle
          ogImage
          socialLinks
          supportedLocales
          twitterCardType
          twitterHandle
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ updateSiteSettings: {
        id: string;
        siteName: string;
        siteDescription?: string;
        logoUrl?: string;
        faviconUrl?: string;
        primaryColor?: string;
        secondaryColor?: string;
        googleAnalyticsId?: string;
        facebookPixelId?: string;
        customCss?: string;
        customJs?: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        accentColor?: string;
        defaultLocale: string;
        footerText?: string;
        maintenanceMode: boolean;
        metaDescription?: string;
        metaTitle?: string;
        ogImage?: string;
        socialLinks?: string;
        supportedLocales: string[];
        twitterCardType?: string;
        twitterHandle?: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(mutation, { input });
      return response.updateSiteSettings;
    } catch (error) {
      console.error('Error updating site settings:', error);
      throw error;
    }
  },

  // User Settings operations
  async getUserSettings(): Promise<{
    id: string;
    userId: string;
    emailNotifications: boolean;
    theme: string;
    language: string;
    timeFormat: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetUserSettings {
        userSettings {
          id
          userId
          emailNotifications
          theme
          language
          timeFormat
          dateFormat
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ userSettings: {
        id: string;
        userId: string;
        emailNotifications: boolean;
        theme: string;
        language: string;
        timeFormat: string;
        dateFormat: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(query);
      return response.userSettings;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }
  },

  async updateUserSettings(input: {
    emailNotifications?: boolean;
    theme?: string;
    language?: string;
    timeFormat?: string;
    dateFormat?: string;
  }): Promise<{
    id: string;
    userId: string;
    emailNotifications: boolean;
    theme: string;
    language: string;
    timeFormat: string;
    dateFormat: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const mutation = `
      mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
        updateUserSettings(input: $input) {
          id
          userId
          emailNotifications
          theme
          language
          timeFormat
          dateFormat
          createdAt
          updatedAt
        }
      }
    `;

    try {
      const response = await gqlRequest<{ updateUserSettings: {
        id: string;
        userId: string;
        emailNotifications: boolean;
        theme: string;
        language: string;
        timeFormat: string;
        dateFormat: string;
        createdAt: string;
        updatedAt: string;
      } | null }>(mutation, { input });
      return response.updateUserSettings;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  // Staff Management Operations
  async staffProfiles(): Promise<CalendarStaffProfile[]> {
    try {
      const query = `
        query GetStaffProfiles {
          staffProfiles {
            id
            userId
            bio
            specializations
            createdAt
            updatedAt
            user {
              id
              email
              firstName
              lastName
              phoneNumber
              isActive
              profileImageUrl
              role {
                id
                name
              }
            }
            assignedServices {
              id
              name
              description
              durationMinutes
              price
              isActive
            }
            locationAssignments {
              id
              name
              address
              phone
            }
            schedules {
              id
              locationId
              date
              dayOfWeek
              startTime
              endTime
              scheduleType
              isAvailable
              notes
              createdAt
              updatedAt
            }
          }
        }
      `;

      const response = await gqlRequest<{ staffProfiles: CalendarStaffProfile[] }>(query);
      return response.staffProfiles || [];
    } catch (error) {
      console.error('Error fetching staff profiles:', error);
      return [];
    }
  },

  async users(): Promise<CalendarUser[]> {
    try {
      const query = `
        query GetUsers {
          users {
            id
            email
            firstName
            lastName
            phoneNumber
            isActive
            profileImageUrl
            role {
              id
              name
            }
            createdAt
            updatedAt
          }
        }
      `;

      const response = await gqlRequest<{ users: CalendarUser[] }>(query);
      
      // Handle case where users might be null or undefined
      if (!response || !response.users) {
        console.warn('Users query returned null or undefined, returning empty array');
        return [];
      }
      
      return response.users;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.users')) {
        console.warn('Users field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },

  async locations(): Promise<CalendarLocation[]> {
    try {
      const query = `
        query GetLocations {
          locations {
            id
            name
            address
            phone
            operatingHours
            createdAt
            updatedAt
          }
        }
      `;

      const response = await gqlRequest<{ locations: CalendarLocation[] }>(query);
      
      // Handle case where locations might be null or undefined
      if (!response || !response.locations) {
        console.warn('Locations query returned null or undefined, returning empty array');
        return [];
      }
      
      return response.locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.locations')) {
        console.warn('Locations field is null in database, returning empty array');
        return [];
      }
      return [];
    }
  },

  async createStaffProfile(input: { input: {
    userId: string;
    bio?: string;
    specializations?: string[];
  }}): Promise<CalendarStaffProfile> {
    try {
      const mutation = `
        mutation CreateStaffProfile($input: CreateStaffProfileInput!) {
          createStaffProfile(input: $input) {
            success
            message
            staffProfile {
              id
              userId
              bio
              specializations
              createdAt
              updatedAt
              user {
                id
                email
                firstName
                lastName
                phoneNumber
                bio
                department
                isActive
                position
                profileImageUrl
                roleId
              }
            }
          }
        }
      `;

      const response = await gqlRequest<{
        createStaffProfile: {
          success: boolean;
          message: string;
          staffProfile: CalendarStaffProfile | null;
        };
      }>(mutation, input);

      if (!response.createStaffProfile.success || !response.createStaffProfile.staffProfile) {
        throw new Error(response.createStaffProfile.message || 'Failed to create staff profile');
      }

      return response.createStaffProfile.staffProfile;
    } catch (error) {
      console.error('Error creating staff profile:', error);
      throw error;
    }
  },

  async updateStaffProfile(input: { id: string; input: Partial<StaffProfileInput> }): Promise<CalendarStaffProfile> {
    try {
      const mutation = `
        mutation UpdateStaffProfile($id: ID!, $input: UpdateStaffProfileInput!) {
          updateStaffProfile(id: $id, input: $input) {
            success
            message
            staffProfile {
              id
              userId
              bio
              specializations
              createdAt
              updatedAt
              user {
                id
                email
                firstName
                lastName
                phoneNumber
                bio
                department
                isActive
                position
                profileImageUrl
                roleId
              }
            }
          }
        }
      `;

      const response = await gqlRequest<{
        updateStaffProfile: {
          success: boolean;
          message: string;
          staffProfile: CalendarStaffProfile | null;
        };
      }>(mutation, input);

      if (!response.updateStaffProfile.success || !response.updateStaffProfile.staffProfile) {
        throw new Error(response.updateStaffProfile.message || 'Failed to update staff profile');
      }

      return response.updateStaffProfile.staffProfile;
    } catch (error) {
      console.error('Error updating staff profile:', error);
      throw error;
    }
  },

  async deleteStaffProfile(input: { id: string }): Promise<{ success: boolean; message: string }> {
    try {
      const mutation = `
        mutation DeleteStaffProfile($id: ID!) {
          deleteStaffProfile(id: $id) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ deleteStaffProfile: { success: boolean; message: string } }>(mutation, input);
      return response.deleteStaffProfile;
    } catch (error) {
      console.error('Error deleting staff profile:', error);
      throw error;
    }
  },

  async updateStaffSchedule(input: { staffProfileId: string; schedule: CalendarStaffScheduleInput[] }): Promise<{ success: boolean; message: string }> {
    try {
      const mutation = `
        mutation UpdateStaffSchedule($staffProfileId: ID!, $schedule: [StaffScheduleInput!]!) {
          updateStaffSchedule(staffProfileId: $staffProfileId, schedule: $schedule) {
            success
            message
          }
        }
      `;

      const response = await gqlRequest<{ updateStaffSchedule: { success: boolean; message: string } }>(mutation, input);
      return response.updateStaffSchedule;
    } catch (error) {
      console.error('Error updating staff schedule:', error);
      throw error;
    }
  },

  // Calendar Bookings Operations
  async bookings({ filter, pagination }: {
    filter?: {
      dateFrom?: string;
      dateTo?: string;
      status?: string;
      locationId?: string;
      serviceId?: string;
      staffProfileId?: string;
      customerId?: string;
      searchQuery?: string;
    };
    pagination?: {
      page?: number;
      pageSize?: number;
    };
  }): Promise<{
    items: Array<{
      id: string;
      customerName?: string | null;
      customerEmail?: string | null;
      customerPhone?: string | null;
      service: { id: string; name: string };
      location: { id: string; name: string };
      staffProfile?: { id: string; user: { firstName: string; lastName: string } } | null;
      bookingDate: string;
      startTime: string;
      endTime: string;
      status: string;
      notes?: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    totalCount: number;
    page: number;
    pageSize: number;
  } | null> {
    const query = `
      query GetBookings($filter: BookingFilterInput, $pagination: PaginationInput) {
        bookings(filter: $filter, pagination: $pagination) {
          edges {
            node {
              id
              customerName
              customerEmail
              customerPhone
              service {
                id
                name
              }
              location {
                id
                name
              }
              staffProfile {
                id
                user {
                  firstName
                  lastName
                }
              }
              bookingDate
              startTime
              endTime
              status
              notes
              createdAt
              updatedAt
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
          totalCount
        }
      }
    `;

    try {
      const response = await gqlRequest<{
        bookings: {
          edges: Array<{
            node: {
              id: string;
              customerName?: string | null;
              customerEmail?: string | null;
              customerPhone?: string | null;
              service: { id: string; name: string };
              location: { id: string; name: string };
              staffProfile?: { id: string; user: { firstName: string; lastName: string } } | null;
              bookingDate: string;
              startTime: string;
              endTime: string;
              status: string;
              notes?: string | null;
              createdAt: string;
              updatedAt: string;
            };
          }>;
          pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor?: string;
            endCursor?: string;
          };
          totalCount: number;
        };
      }>(query, { filter, pagination });
      
      // Transform the response to match the expected format
      const bookingsData = response.bookings;
      if (!bookingsData) {
        console.warn('Bookings query returned null or undefined, returning empty result');
        return {
          items: [],
          totalCount: 0,
          page: pagination?.page || 1,
          pageSize: pagination?.pageSize || 10
        };
      }
      
      return {
        items: bookingsData.edges.map(edge => edge.node),
        totalCount: bookingsData.totalCount,
        page: pagination?.page || 1,
        pageSize: pagination?.pageSize || 10
      };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      // Check if it's the specific "Cannot return null" error
      if (error instanceof Error && error.message.includes('Cannot return null for non-nullable field Query.bookings')) {
        console.warn('Bookings field is null in database, returning empty result');
        return {
          items: [],
          totalCount: 0,
          page: pagination?.page || 1,
          pageSize: pagination?.pageSize || 10
        };
      }
      // Always return empty result structure instead of null
      return {
        items: [],
        totalCount: 0,
        page: pagination?.page || 1,
        pageSize: pagination?.pageSize || 10
      };
    }
  },

  async getOrders(filter?: {
    search?: string;
    shopId?: string;
    customerId?: string;
    status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    totalAmount: number;
    currency: {
      id: string;
      code: string;
      symbol: string;
    };
    shop: {
      id: string;
      name: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      product: {
        id: string;
        name: string;
        sku?: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetOrders($filter: OrderFilterInput, $pagination: PaginationInput) {
        orders(filter: $filter, pagination: $pagination) {
          id
          customerName
          customerEmail
          status
          totalAmount
          currency {
            id
            code
            symbol
          }
          shop {
            id
            name
          }
          items {
            id
            quantity
            unitPrice
            totalPrice
            product {
              id
              name
              sku
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        shopId?: string;
        customerId?: string;
        status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
        dateFrom?: string;
        dateTo?: string;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ orders: Array<{
      id: string;
      customerName: string;
      customerEmail: string;
      status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
      totalAmount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
      shop: {
        id: string;
        name: string;
      };
      items: Array<{
        id: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        product: {
          id: string;
          name: string;
          sku?: string;
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.orders || [];
  },

};

// Export all functions
export default graphqlClient;

// Get the default page for a locale
async function getDefaultPage(locale: string = 'en'): Promise<PageData | null> {
  try {
    console.log(`[getDefaultPage] Attempting to fetch default page for locale: "${locale}"`);
    
    // Check cache first
    const cacheKey = `default_page_${locale}`;
    const cachedPage = getCachedResponse<PageData>(cacheKey);
    
    if (cachedPage) {
      console.log(`[getDefaultPage] Found cached default page: ${cachedPage.title}`);
      return cachedPage;
    }
    
    const query = `
      query GetDefaultPage($locale: String!) {
        getDefaultPage(locale: $locale) {
          id
          title
          slug
          description
          template
          isPublished
          publishDate
          featuredImage
          metaTitle
          metaDescription
          parentId
          order
          pageType
          locale
          scrollType
          isDefault
          createdAt
          updatedAt
          sections {
            id
            sectionId
            name
            order
          }
          seo {
            title
            description
            keywords
            ogTitle
            ogDescription
            ogImage
            twitterTitle
            twitterDescription
            twitterImage
            canonicalUrl
            structuredData
          }
        }
      }
    `;

    const variables = { locale };
    
    console.log(`[getDefaultPage] Executing GraphQL query with variables:`, variables);
    const result = await gqlRequest<{ 
      getDefaultPage?: PageData; 
      data?: { getDefaultPage: PageData };
      errors?: Array<{ message: string }>
    }>(query, variables);
    
    console.log(`[getDefaultPage] GraphQL result:`, result);
    
    // Check for errors in the response
    if (result.errors && result.errors.length > 0) {
      console.error(`[getDefaultPage] GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
      return null;
    }
    
    // Try to extract page data from different possible response structures
    let page: PageData | null = null;
    
    if (result.getDefaultPage) {
      page = result.getDefaultPage;
    } else if (result.data?.getDefaultPage) {
      page = result.data.getDefaultPage;
    } else {
      console.log(`[getDefaultPage] No default page found for locale "${locale}"`);
      return null;
    }
    
    if (page) {
      // Cache the result for future requests
      setCachedResponse(cacheKey, page);
      console.log(`[getDefaultPage] Found and cached default page: ${page.title}`);
    }
    
    return page;
  } catch (error) {
    console.error('[getDefaultPage] Error fetching default page:', error);
    return null;
  }
}

// Update a form step
async function updateFormStep(id: string, input: Partial<FormStepInput>): Promise<FormStepResult> {
  const mutation = `
    mutation UpdateFormStep($id: ID!, $input: FormStepInput!) {
      updateFormStep(id: $id, input: $input) {
        success
        message
        step {
          id
          formId
          title
          description
          order
          isVisible
          validationRules
          createdAt
          updatedAt
        }
      }
    }
  `;

  const variables = { id, input };

  try {
    const response = await gqlRequest<{ updateFormStep: FormStepResult }>(mutation, variables);
    if (response.updateFormStep && response.updateFormStep.success && response.updateFormStep.step) {
      const formId = response.updateFormStep.step.formId;
      optimizedQueries.invalidateCache(`form:${formId}`);
      clearCache(`form_${formId}`);
      optimizedQueries.invalidateCache('forms');
      clearCache('forms');
    }
    return response.updateFormStep || { success: false, message: 'Failed to update form step', step: null };
  } catch (error) {
    console.error('Error updating form step:', error);
    return { success: false, message: 'Error updating form step', step: null };
  }
}

// Delete a form step
async function deleteFormStep(id: string): Promise<FormStepResult> {
  const mutation = `
    mutation DeleteFormStep($id: ID!) {
      deleteFormStep(id: $id) {
        success
        message
      }
    }
  `;

  const variables = { id };

  try {
    const response = await gqlRequest<{ deleteFormStep: FormStepResult }>(mutation, variables);
    // For delete, the step object might not be returned, or formId might not be in it.
    // If formId is part of the input or can be reliably inferred, use it.
    // Assuming 'id' passed to deleteFormStep is the step's ID, and we don't have formId directly.
    // This makes targeted invalidation hard without fetching step details first or changing API.
    // As a broader measure, we invalidate all forms list cache.
    if (response.deleteFormStep && response.deleteFormStep.success) {
      // Best effort: if step info with formId was returned, use it.
      // if (response.deleteFormStep.step && response.deleteFormStep.step.formId) {
      //   const formId = response.deleteFormStep.step.formId;
      //   optimizedQueries.invalidateCache(`form:${formId}`);
      //   clearCache(`form_${formId}`);
      // }
      optimizedQueries.invalidateCache('forms'); // Invalidate general list
      clearCache('forms');
    }
    return response.deleteFormStep || { success: false, message: 'Failed to delete form step', step: null };
  } catch (error) {
    console.error('Error deleting form step:', error);
    return { success: false, message: 'Error deleting form step', step: null };
  }
}

// Update step orders
async function updateStepOrders(updates: Array<{ id: string; order: number }>): Promise<{
  success: boolean;
  message: string;
}> {
  const mutation = `
    mutation UpdateStepOrders($updates: [StepOrderUpdate!]!) {
      updateStepOrders(updates: $updates) {
        success
        message
      }
    }
  `;

  const variables = { updates };

  try {
    const response = await gqlRequest<{ updateStepOrders: { success: boolean; message: string } }>(mutation, variables);
    return response.updateStepOrders || { success: false, message: 'Failed to update step orders' };
  } catch (error) {
    console.error('Error updating step orders:', error);
    return { success: false, message: 'Error updating step orders' };
  }
}

// Delete a form submission
async function deleteFormSubmission(id: string): Promise<FormSubmissionResult> {
  const mutation = `
    mutation DeleteFormSubmission($id: ID!) {
      deleteFormSubmission(id: $id) {
        success
        message
        submission
      }
    }
  `;

  const variables = { id };

  try {
    const response = await gqlRequest<{ deleteFormSubmission: FormSubmissionResult }>(mutation, variables);
    return response.deleteFormSubmission || { success: false, message: 'Failed to delete form submission', submission: null };
  } catch (error) {
    console.error('Error deleting form submission:', error);
    return { success: false, message: 'Error deleting form submission', submission: null };
  }
}

// E-commerce functions
export const ecommerce = {
  // Shop functions
  async getShops(filter?: {
    search?: string;
    adminUserId?: string;
    currencyId?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    defaultCurrency: {
      id: string;
      code: string;
      name: string;
      symbol: string;
    };
    acceptedCurrencies: Array<{
      id: string;
      code: string;
      name: string;
      symbol: string;
    }>;
    adminUser?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
    };
    products: Array<{
      id: string;
      name: string;
      sku?: string;
      stockQuantity?: number;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShops($filter: ShopFilterInput, $pagination: PaginationInput) {
        shops(filter: $filter, pagination: $pagination) {
          id
          name
          defaultCurrency {
            id
            code
            name
            symbol
          }
          acceptedCurrencies {
            id
            code
            name
            symbol
          }
          adminUser {
            id
            firstName
            lastName
            email
          }
          products {
            id
            name
            sku
            stockQuantity
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ shops: Array<{
      id: string;
      name: string;
      defaultCurrency: {
        id: string;
        code: string;
        name: string;
        symbol: string;
      };
      acceptedCurrencies: Array<{
        id: string;
        code: string;
        name: string;
        symbol: string;
      }>;
      adminUser?: {
        id: string;
        firstName?: string;
        lastName?: string;
        email: string;
      };
      products: Array<{
        id: string;
        name: string;
        sku?: string;
        stockQuantity?: number;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.shops || [];
  },

  async getShop(id: string): Promise<{
    id: string;
    name: string;
    defaultCurrency: {
      id: string;
      code: string;
      name: string;
      symbol: string;
    };
    acceptedCurrencies: Array<{
      id: string;
      code: string;
      name: string;
      symbol: string;
    }>;
    adminUser?: {
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
    };
    products: Array<{
      id: string;
      name: string;
      sku?: string;
      stockQuantity?: number;
      prices: Array<{
        id: string;
        amount: number;
        currency: {
          id: string;
          code: string;
          symbol: string;
        };
      }>;
    }>;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetShop($id: ID!) {
        shop(id: $id) {
          id
          name
          defaultCurrency {
            id
            code
            name
            symbol
          }
          acceptedCurrencies {
            id
            code
            name
            symbol
          }
          adminUser {
            id
            firstName
            lastName
            email
          }
          products {
            id
            name
            sku
            stockQuantity
            prices {
              id
              amount
              currency {
                id
                code
                symbol
              }
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ shop: {
      id: string;
      name: string;
      defaultCurrency: {
        id: string;
        code: string;
        name: string;
        symbol: string;
      };
      acceptedCurrencies: Array<{
        id: string;
        code: string;
        name: string;
        symbol: string;
      }>;
      adminUser?: {
        id: string;
        firstName?: string;
        lastName?: string;
        email: string;
      };
      products: Array<{
        id: string;
        name: string;
        sku?: string;
        stockQuantity?: number;
        prices: Array<{
          id: string;
          amount: number;
          currency: {
            id: string;
            code: string;
            symbol: string;
          };
        }>;
      }>;
      createdAt: string;
      updatedAt: string;
    } | null }>(query, { id });

    return result.shop;
  },

  // Product functions
  async getProducts(filter?: {
    search?: string;
    shopId?: string;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    sku?: string;
    stockQuantity?: number;
    shop: {
      id: string;
      name: string;
    };
    prices: Array<{
      id: string;
      amount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetProducts($filter: ProductFilterInput, $pagination: PaginationInput) {
        products(filter: $filter, pagination: $pagination) {
          id
          name
          description
          sku
          stockQuantity
          shop {
            id
            name
          }
          prices {
            id
            amount
            currency {
              id
              code
              symbol
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ products: Array<{
      id: string;
      name: string;
      description?: string;
      sku?: string;
      stockQuantity?: number;
      shop: {
        id: string;
        name: string;
      };
      prices: Array<{
        id: string;
        amount: number;
        currency: {
          id: string;
          code: string;
          symbol: string;
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.products || [];
  },

  async getProduct(id: string): Promise<{
    id: string;
    name: string;
    description?: string;
    sku?: string;
    stockQuantity?: number;
    shop: {
      id: string;
      name: string;
    };
    prices: Array<{
      id: string;
      amount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetProduct($id: ID!) {
        product(id: $id) {
          id
          name
          description
          sku
          stockQuantity
          shop {
            id
            name
          }
          prices {
            id
            amount
            currency {
              id
              code
              symbol
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ product: {
      id: string;
      name: string;
      description?: string;
      sku?: string;
      stockQuantity?: number;
      shop: {
        id: string;
        name: string;
      };
      prices: Array<{
        id: string;
        amount: number;
        currency: {
          id: string;
          code: string;
          symbol: string;
        };
      }>;
      createdAt: string;
      updatedAt: string;
    } | null }>(query, { id });

    return result.product;
  },

  // Currency functions
  async getCurrencies(): Promise<Array<{
    id: string;
    code: string;
    name: string;
    symbol: string;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetCurrencies {
        currencies {
          id
          code
          name
          symbol
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ currencies: Array<{
      id: string;
      code: string;
      name: string;
      symbol: string;
      createdAt: string;
      updatedAt: string;
    }> }>(query);

    return result.currencies || [];
  },

  async getCurrency(id: string): Promise<{
    id: string;
    code: string;
    name: string;
    symbol: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const query = `
      query GetCurrency($id: ID!) {
        currency(id: $id) {
          id
          code
          name
          symbol
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ currency: {
      id: string;
      code: string;
      name: string;
      symbol: string;
      createdAt: string;
      updatedAt: string;
    } | null }>(query, { id });

    return result.currency;
  },

  // Tax functions
  async getTaxes(shopId?: string): Promise<Array<{
    id: string;
    name: string;
    rate: number;
    isActive: boolean;
    shop: {
      id: string;
      name: string;
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetTaxes($shopId: String) {
        taxes(shopId: $shopId) {
          id
          name
          rate
          isActive
          shop {
            id
            name
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ taxes: Array<{
      id: string;
      name: string;
      rate: number;
      isActive: boolean;
      shop: {
        id: string;
        name: string;
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, { shopId });

    return result.taxes || [];
  },

  // Mutation functions
  async createShop(input: {
    name: string;
    defaultCurrencyId: string;
    adminUserId: string;
    acceptedCurrencyIds?: string[];
  }): Promise<{
    success: boolean;
    message: string;
    shop: {
      id: string;
      name: string;
      defaultCurrency: {
        id: string;
        code: string;
        name: string;
        symbol: string;
      };
      acceptedCurrencies: Array<{
        id: string;
        code: string;
        name: string;
        symbol: string;
      }>;
      adminUser?: {
        id: string;
        firstName?: string;
        lastName?: string;
        email: string;
      };
    } | null;
  }> {
    const mutation = `
      mutation CreateShop($input: CreateShopInput!) {
        createShop(input: $input) {
          success
          message
          shop {
            id
            name
            defaultCurrency {
              id
              code
              name
              symbol
            }
            acceptedCurrencies {
              id
              code
              name
              symbol
            }
            adminUser {
              id
              firstName
              lastName
              email
            }
          }
        }
      }
    `;

    const result = await gqlRequest<{ createShop: {
      success: boolean;
      message: string;
      shop: {
        id: string;
        name: string;
        defaultCurrency: {
          id: string;
          code: string;
          name: string;
          symbol: string;
        };
        acceptedCurrencies: Array<{
          id: string;
          code: string;
          name: string;
          symbol: string;
        }>;
        adminUser?: {
          id: string;
          firstName?: string;
          lastName?: string;
          email: string;
        };
      } | null;
    } }>(mutation, { input });

    return result.createShop;
  },

  async createCurrency(input: {
    code: string;
    name: string;
    symbol: string;
  }): Promise<{
    success: boolean;
    message: string;
    currency: {
      id: string;
      code: string;
      name: string;
      symbol: string;
    } | null;
  }> {
    const mutation = `
      mutation CreateCurrency($input: CreateCurrencyInput!) {
        createCurrency(input: $input) {
          success
          message
          currency {
            id
            code
            name
            symbol
          }
        }
      }
    `;

    const result = await gqlRequest<{ createCurrency: {
      success: boolean;
      message: string;
      currency: {
        id: string;
        code: string;
        name: string;
        symbol: string;
      } | null;
    } }>(mutation, { input });

    return result.createCurrency;
  },

  async getOrders(filter?: {
    search?: string;
    shopId?: string;
    customerId?: string;
    status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    customerName: string;
    customerEmail: string;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
    totalAmount: number;
    currency: {
      id: string;
      code: string;
      symbol: string;
    };
    shop: {
      id: string;
      name: string;
    };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      product: {
        id: string;
        name: string;
        sku?: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetOrders($filter: OrderFilterInput, $pagination: PaginationInput) {
        orders(filter: $filter, pagination: $pagination) {
          id
          customerName
          customerEmail
          status
          totalAmount
          currency {
            id
            code
            symbol
          }
          shop {
            id
            name
          }
          items {
            id
            quantity
            unitPrice
            totalPrice
            product {
              id
              name
              sku
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        shopId?: string;
        customerId?: string;
        status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
        dateFrom?: string;
        dateTo?: string;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ orders: Array<{
      id: string;
      customerName: string;
      customerEmail: string;
      status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
      totalAmount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
      shop: {
        id: string;
        name: string;
      };
      items: Array<{
        id: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        product: {
          id: string;
          name: string;
          sku?: string;
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.orders || [];
  },

  // Payment functions
  async getPayments(filter?: {
    search?: string;
    orderId?: string;
    status?: string;
    providerId?: string;
    paymentMethodId?: string;
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    orderId?: string;
    amount: number;
    status: string;
    transactionId?: string;
    failureReason?: string;
    refundAmount?: number;
    currency: {
      id: string;
      code: string;
      name: string;
      symbol: string;
    };
    paymentMethod: {
      id: string;
      name: string;
      type: string;
      provider: {
        id: string;
        name: string;
        type: string;
      };
    };
    provider: {
      id: string;
      name: string;
      type: string;
    };
    order?: {
      id: string;
      customerName: string;
      customerEmail: string;
      totalAmount: number;
      shop: {
        id: string;
        name: string;
      };
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPayments($filter: PaymentFilterInput, $pagination: PaginationInput) {
        payments(filter: $filter, pagination: $pagination) {
          id
          orderId
          amount
          status
          transactionId
          failureReason
          refundAmount
          currency {
            id
            code
            name
            symbol
          }
          paymentMethod {
            id
            name
            type
            provider {
              id
              name
              type
            }
          }
          provider {
            id
            name
            type
          }
          order {
            id
            customerName
            customerEmail
            totalAmount
            shop {
              id
              name
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        orderId?: string;
        status?: string;
        providerId?: string;
        paymentMethodId?: string;
        dateFrom?: string;
        dateTo?: string;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ payments: Array<{
      id: string;
      orderId?: string;
      amount: number;
      status: string;
      transactionId?: string;
      failureReason?: string;
      refundAmount?: number;
      currency: {
        id: string;
        code: string;
        name: string;
        symbol: string;
      };
      paymentMethod: {
        id: string;
        name: string;
        type: string;
        provider: {
          id: string;
          name: string;
          type: string;
        };
      };
      provider: {
        id: string;
        name: string;
        type: string;
      };
      order?: {
        id: string;
        customerName: string;
        customerEmail: string;
        totalAmount: number;
        shop: {
          id: string;
          name: string;
        };
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.payments || [];
  },

  async getPaymentProviders(filter?: {
    search?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      status: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPaymentProviders($filter: PaymentProviderFilterInput, $pagination: PaginationInput) {
        paymentProviders(filter: $filter, pagination: $pagination) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          paymentMethods {
            id
            name
            type
          }
          payments {
            id
            amount
            status
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        type?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ paymentProviders: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      paymentMethods: Array<{
        id: string;
        name: string;
        type: string;
      }>;
      payments: Array<{
        id: string;
        amount: number;
        status: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.paymentProviders || [];
  },

  async getPaymentMethods(filter?: {
    search?: string;
    providerId?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    providerId: string;
    isActive: boolean;
    processingFeeRate?: number;
    fixedFee?: number;
    provider: {
      id: string;
      name: string;
      type: string;
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetPaymentMethods($filter: PaymentMethodFilterInput, $pagination: PaginationInput) {
        paymentMethods(filter: $filter, pagination: $pagination) {
          id
          name
          type
          providerId
          isActive
          processingFeeRate
          fixedFee
          provider {
            id
            name
            type
          }
          createdAt
          updatedAt
        }
      }
    `;

    const result = await gqlRequest<{ paymentMethods: Array<{
      id: string;
      name: string;
      type: string;
      providerId: string;
      isActive: boolean;
      processingFeeRate?: number;
      fixedFee?: number;
      provider: {
        id: string;
        name: string;
        type: string;
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, { filter, pagination });

    return result.paymentMethods || [];
  },

  // Shipping functions
  async getShippingProviders(filter?: {
    search?: string;
    type?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    apiKey?: string;
    secretKey?: string;
    webhookUrl?: string;
    trackingUrl?: string;
    shippingMethods: Array<{
      id: string;
      name: string;
      description?: string;
      isActive: boolean;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      trackingEnabled: boolean;
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingProviders($filter: ShippingProviderFilterInput, $pagination: PaginationInput) {
        shippingProviders(filter: $filter, pagination: $pagination) {
          id
          name
          type
          isActive
          apiKey
          secretKey
          webhookUrl
          trackingUrl
          shippingMethods {
            id
            name
            description
            isActive
            estimatedDaysMin
            estimatedDaysMax
            trackingEnabled
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        type?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shippingProviders: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
      apiKey?: string;
      secretKey?: string;
      webhookUrl?: string;
      trackingUrl?: string;
      shippingMethods: Array<{
        id: string;
        name: string;
        description?: string;
        isActive: boolean;
        estimatedDaysMin?: number;
        estimatedDaysMax?: number;
        trackingEnabled: boolean;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shippingProviders || [];
  },

  async getShippingMethods(filter?: {
    search?: string;
    providerId?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    providerId: string;
    isActive: boolean;
    estimatedDaysMin?: number;
    estimatedDaysMax?: number;
    trackingEnabled: boolean;
    provider: {
      id: string;
      name: string;
      type: string;
    };
    shippingRates: Array<{
      id: string;
      baseRate: number;
      minWeight?: number;
      maxWeight?: number;
      shippingZone: {
        id: string;
        name: string;
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingMethods($filter: ShippingMethodFilterInput, $pagination: PaginationInput) {
        shippingMethods(filter: $filter, pagination: $pagination) {
          id
          name
          description
          providerId
          isActive
          estimatedDaysMin
          estimatedDaysMax
          trackingEnabled
          provider {
            id
            name
            type
          }
          shippingRates {
            id
            baseRate
            minWeight
            maxWeight
            shippingZone {
              id
              name
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        providerId?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shippingMethods: Array<{
      id: string;
      name: string;
      description?: string;
      providerId: string;
      isActive: boolean;
      estimatedDaysMin?: number;
      estimatedDaysMax?: number;
      trackingEnabled: boolean;
      provider: {
        id: string;
        name: string;
        type: string;
      };
      shippingRates: Array<{
        id: string;
        baseRate: number;
        minWeight?: number;
        maxWeight?: number;
        shippingZone: {
          id: string;
          name: string;
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shippingMethods || [];
  },

  async getShippingZones(filter?: {
    search?: string;
    isActive?: boolean;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    countries: string[];
    states: string[];
    postalCodes: string[];
    isActive: boolean;
    shippingRates: Array<{
      id: string;
      baseRate: number;
      shippingMethod: {
        id: string;
        name: string;
        provider: {
          id: string;
          name: string;
        };
      };
    }>;
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShippingZones($filter: ShippingZoneFilterInput, $pagination: PaginationInput) {
        shippingZones(filter: $filter, pagination: $pagination) {
          id
          name
          description
          countries
          states
          postalCodes
          isActive
          shippingRates {
            id
            baseRate
            shippingMethod {
              id
              name
              provider {
                id
                name
              }
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        isActive?: boolean;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shippingZones: Array<{
      id: string;
      name: string;
      description?: string;
      countries: string[];
      states: string[];
      postalCodes: string[];
      isActive: boolean;
      shippingRates: Array<{
        id: string;
        baseRate: number;
        shippingMethod: {
          id: string;
          name: string;
          provider: {
            id: string;
            name: string;
          };
        };
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shippingZones || [];
  },

  async getShipments(filter?: {
    search?: string;
    orderId?: string;
    status?: string;
    shippingMethodId?: string;
    trackingNumber?: string;
    dateFrom?: string;
    dateTo?: string;
  }, pagination?: {
    limit?: number;
    offset?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Array<{
    id: string;
    orderId: string;
    trackingNumber?: string;
    status: string;
    shippingCost: number;
    weight?: number;
    dimensions?: string;
    fromAddress: string;
    toAddress: string;
    shippedAt?: string;
    estimatedDelivery?: string;
    deliveredAt?: string;
    order: {
      id: string;
      customerName: string;
      customerEmail: string;
      totalAmount: number;
      currency: {
        id: string;
        code: string;
        symbol: string;
      };
      shop: {
        id: string;
        name: string;
      };
    };
    shippingMethod: {
      id: string;
      name: string;
      provider: {
        id: string;
        name: string;
        type: string;
      };
    };
    createdAt: string;
    updatedAt: string;
  }>> {
    const query = `
      query GetShipments($filter: ShipmentFilterInput, $pagination: PaginationInput) {
        shipments(filter: $filter, pagination: $pagination) {
          id
          orderId
          trackingNumber
          status
          shippingCost
          weight
          dimensions
          fromAddress
          toAddress
          shippedAt
          estimatedDelivery
          deliveredAt
          order {
            id
            customerName
            customerEmail
            totalAmount
            currency {
              id
              code
              symbol
            }
            shop {
              id
              name
            }
          }
          shippingMethod {
            id
            name
            provider {
              id
              name
              type
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const variables: {
      filter?: {
        search?: string;
        orderId?: string;
        status?: string;
        shippingMethodId?: string;
        trackingNumber?: string;
        dateFrom?: string;
        dateTo?: string;
      };
      pagination?: {
        limit?: number;
        offset?: number;
        page?: number;
        pageSize?: number;
      };
    } = {};

    if (filter) {
      variables.filter = filter;
    }

    if (pagination) {
      variables.pagination = pagination;
    }

    const result = await gqlRequest<{ shipments: Array<{
      id: string;
      orderId: string;
      trackingNumber?: string;
      status: string;
      shippingCost: number;
      weight?: number;
      dimensions?: string;
      fromAddress: string;
      toAddress: string;
      shippedAt?: string;
      estimatedDelivery?: string;
      deliveredAt?: string;
      order: {
        id: string;
        customerName: string;
        customerEmail: string;
        totalAmount: number;
        currency: {
          id: string;
          code: string;
          symbol: string;
        };
        shop: {
          id: string;
          name: string;
        };
      };
      shippingMethod: {
        id: string;
        name: string;
        provider: {
          id: string;
          name: string;
          type: string;
        };
      };
      createdAt: string;
      updatedAt: string;
    }> }>(query, variables);

    return result.shipments || [];
  },

};