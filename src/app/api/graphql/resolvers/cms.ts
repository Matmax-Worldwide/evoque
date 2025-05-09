import { prisma } from '@/lib/prisma';
import { Prisma, PageType, ComponentType } from '@prisma/client';
import crypto from 'crypto';

// Tipo para los componentes de una sección
type SectionComponentWithRelation = {
  id: string;
  componentId: string;
  order: number;
  data: Record<string, unknown> | null;
  component: {
    id: string;
    slug: string;
    name: string;
  };
};

// Logs para depuración al inicio
console.log('CMS resolver loaded');

// Definición de los resolvers para CMS
export const cmsResolvers = {
  Query: {
    getAllCMSSections: async () => {
      console.log('======== START getAllCMSSections resolver ========');
      try {
        console.log('Obteniendo todas las secciones CMS');
        
        // Obtener las secciones de la base de datos con sus relaciones
        const sections = await prisma.cMSSection.findMany({
          include: {
            components: {
              include: {
                component: true
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });
        
        console.log(`Se encontraron ${sections.length} secciones`);
        
        return sections;
      } catch (error) {
        console.error('Error al obtener secciones CMS:', error);
        return [];
      }
    },
    
    getPageBySlug: async (_parent: unknown, args: { slug: string }) => {
      console.log('======== START getPageBySlug resolver ========');
      try {
        const { slug } = args;
        console.log(`Buscando página con slug: "${slug}" (type: ${typeof slug})`);
        
        if (!slug) {
          console.log('Error: Se intentó buscar una página sin proporcionar un slug');
          return null;
        }
        
        // Clean the slug - normalize to lowercase, trim spaces, replace accents
        const normalizedSlug = slug.trim().toLowerCase();
        
        // Create additional slug variants for more flexible matching
        const dashedSlug = normalizedSlug.replace(/\s+/g, '-');
        const undashSlug = normalizedSlug.replace(/-/g, ' ');
        
        // Add additional logging for debugging
        console.log('Executing query with parameters:', JSON.stringify({
          originalSlug: slug,
          normalizedSlug,
          dashedSlug,
          undashSlug
        }));
        
        // Try to find the page with any of our slug variants
        console.log('Attempting to find page with multiple slug variants...');
        let page = await prisma.page.findFirst({
          where: { 
            OR: [
              { slug: normalizedSlug },
              { slug: dashedSlug },
              { slug: undashSlug }
            ]
          },
          include: {
            sections: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        });
        
        // If not found with direct variants, try more flexible matching
        if (!page) {
          console.log(`No se encontró ninguna página con slug exacto, intentando alternativas más flexibles...`);
          
          // Try with case-insensitive search
          page = await prisma.page.findFirst({
            where: { 
              OR: [
                { slug: { contains: normalizedSlug, mode: 'insensitive' } },
                { slug: { contains: dashedSlug, mode: 'insensitive' } },
                { slug: { contains: undashSlug, mode: 'insensitive' } }
              ]
            },
            include: {
              sections: {
                orderBy: {
                  order: 'asc'
                }
              }
            }
          });
          
          // If still not found, check if it's substring of a page or vice versa
          if (!page) {
            console.log(`Intentando búsqueda parcial...`);
            
            const allPages = await prisma.page.findMany({
              select: { id: true, slug: true, title: true },
            });
            
            console.log(`Buscando entre ${allPages.length} páginas disponibles...`);
            
            // List all pages for debugging
            console.log(`Páginas disponibles: ${JSON.stringify(allPages.map(p => ({ 
              id: p.id, 
              slug: p.slug,
              title: p.title
            })))}`);
            
            // Find best partial match
            const partialMatches = allPages.filter(p => 
              p.slug.includes(normalizedSlug) || 
              normalizedSlug.includes(p.slug) ||
              p.slug.includes(dashedSlug) || 
              dashedSlug.includes(p.slug)
            );
            
            if (partialMatches.length > 0) {
              console.log(`Encontradas ${partialMatches.length} coincidencias parciales:`, 
                JSON.stringify(partialMatches.map(p => `${p.title} (${p.slug})`)));
              
              // Get the full page data for the first match
              page = await prisma.page.findUnique({
                where: { id: partialMatches[0].id },
                include: {
                  sections: {
                    orderBy: {
                      order: 'asc'
                    }
                  }
                }
              });
            } else {
              return null;
            }
          }
        }
        
        if (page) {
          console.log(`Página encontrada: "${page.title}" (ID: ${page.id}, slug: ${page.slug})`);
          return page;
        }
        
        console.log('No se encontró ninguna página con el slug proporcionado');
        return null;
      } catch (error) {
        console.error('Error al obtener página por slug:', error);
        return null;
      }
    },
    
    getSectionComponents: async (_parent: unknown, args: { sectionId: string }) => {
      console.log('======== START getSectionComponents resolver ========');
      try {
        console.log('========================================');
        
        // Eliminar parámetros de consulta si existen (para evitar problemas con cache busting)
        let { sectionId } = args;
        if (sectionId && sectionId.includes('?')) {
          sectionId = sectionId.split('?')[0];
          console.log('Limpiando sectionId de parámetros de consulta:', sectionId);
        }
        
        console.log('CMS RESOLVER: Getting section components for section ID:', sectionId);
        
        // Obtener los datos de la base de datos
        try {
          console.log('Executing database query...');
          
          // Buscar la sección con sus componentes
          const sectionFromDB = await prisma.cMSSection.findUnique({
            where: { sectionId },
            include: {
              components: {
                include: {
                  component: true
                },
                orderBy: {
                  order: 'asc'
                }
              }
            }
          });
          
          console.log('Query executed, result:', sectionFromDB ? 'found' : 'not found');
          
          if (sectionFromDB) {
            console.log('Section found in database:', sectionId);
            console.log('Raw section data from DB:', JSON.stringify(sectionFromDB, null, 2));
            console.log('Components count:', sectionFromDB.components.length);
            
            // Log each component for debugging
            if (sectionFromDB.components.length > 0) {
              console.log('Components in database:');
              sectionFromDB.components.forEach((sc, index) => {
                console.log(`Component ${index + 1}:`, {
                  id: sc.id,
                  sectionId: sc.sectionId,
                  componentId: sc.componentId,
                  order: sc.order,
                  componentName: sc.component?.name || 'N/A',
                  componentSlug: sc.component?.slug || 'N/A',
                  hasData: sc.data ? true : false
                });
              });
              
              // Transformar los componentes al formato esperado por el cliente
              const components = (sectionFromDB.components as SectionComponentWithRelation[]).map((sc) => ({
                id: sc.id,
                type: sc.component.slug,
                data: sc.data ? sc.data as Prisma.InputJsonValue : Prisma.JsonNull
              }));
              
              console.log('Number of components in section:', components.length);
              console.log('Returning data from database');
              
              return {
                components,
                lastUpdated: sectionFromDB.lastUpdated.toISOString()
              };
            } else {
              console.log('No components found for this section in the database');
              console.log('Section exists but has no components. Initializing with empty array.');
              
              // Section exists but has no components
              return { 
                components: [], 
                lastUpdated: sectionFromDB.lastUpdated.toISOString() 
              };
            }
          } else {
            // Check if the section ID exists but doesn't have the right format
            // Try to find it by matching with the start of the ID
            console.log('Section not found by exact ID, trying to match by prefix...');
            
            const allSections = await prisma.cMSSection.findMany({
              select: { sectionId: true }
            });
            
            console.log('All available section IDs:', allSections.map(s => s.sectionId).join(', '));
            
            // Check if any of the existing IDs start with our sectionId
            const matchingSection = allSections.find(s => 
              sectionId.startsWith(s.sectionId) || s.sectionId.startsWith(sectionId)
            );
            
            if (matchingSection) {
              console.log('Found potential match!', matchingSection.sectionId);
              console.log('Original sectionId:', sectionId);
              console.log('Matched sectionId:', matchingSection.sectionId);
              
              // Retry with the matched ID
              const matchedSectionData = await prisma.cMSSection.findUnique({
                where: { sectionId: matchingSection.sectionId },
                include: {
                  components: {
                    include: {
                      component: true
                    },
                    orderBy: {
                      order: 'asc'
                    }
                  }
                }
              });
              
              if (matchedSectionData && matchedSectionData.components.length > 0) {
                const components = (matchedSectionData.components as SectionComponentWithRelation[]).map((sc) => ({
                  id: sc.id,
                  type: sc.component.slug,
                  data: sc.data ? sc.data as Prisma.InputJsonValue : Prisma.JsonNull
                }));
                
                console.log('Found components through prefix matching!', components.length);
                
                return {
                  components,
                  lastUpdated: matchedSectionData.lastUpdated.toISOString()
                };
              }
            }
            
            // If we get here, we either couldn't find a matching section or the matched section had no components
            console.log('Section not found in database or no matching section found:', sectionId);
            console.log('Returning empty components array');
            return { components: [], lastUpdated: null };
          }
        } catch (dbError) {
          console.error('Error querying database:', dbError);
          throw dbError;
        }
      } catch (error) {
        console.error('========================================');
        console.error('ERROR: Error fetching section data:', error);
        console.error('========================================');
        return { components: [], lastUpdated: null };
      }
    },

    // Nuevo resolver para obtener todos los componentes CMS
    getAllCMSComponents: async () => {
      console.log('======== START getAllCMSComponents resolver ========');
      try {
        console.log('Obteniendo todos los componentes CMS');
        
        // Obtener los componentes de la base de datos
        const components = await prisma.cMSComponent.findMany({
          orderBy: {
            updatedAt: 'desc'
          }
        });
        
        console.log(`Se encontraron ${components.length} componentes`);
        
        return components;
      } catch (error) {
        console.error('Error al obtener componentes CMS:', error);
        return [];
      }
    },

    // Obtener un componente CMS por ID
    getCMSComponent: async (_parent: unknown, args: { id: string }) => {
      console.log('======== START getCMSComponent resolver ========');
      try {
        const { id } = args;
        console.log(`Obteniendo componente con ID: ${id}`);
        
        const component = await prisma.cMSComponent.findUnique({
          where: { id }
        });
        
        if (!component) {
          console.log(`No se encontró ningún componente con ID: ${id}`);
          return null;
        }
        
        console.log(`Componente encontrado: ${component.name}`);
        return component;
      } catch (error) {
        console.error('Error al obtener componente CMS:', error);
        return null;
      }
    },

    // Obtener componentes CMS por tipo
    getCMSComponentsByType: async (_parent: unknown, args: { type: string }) => {
      console.log('======== START getCMSComponentsByType resolver ========');
      try {
        const { type } = args;
        console.log(`Obteniendo componentes de tipo: ${type}`);
        
        const components = await prisma.cMSComponent.findMany({
          where: {
            category: type
          },
          orderBy: {
            name: 'asc'
          }
        });
        
        console.log(`Se encontraron ${components.length} componentes de tipo ${type}`);
        return components;
      } catch (error) {
        console.error(`Error al obtener componentes de tipo ${args.type}:`, error);
        return [];
      }
    },

    // Obtener todas las páginas CMS
    getAllCMSPages: async () => {
      console.log('======== START getAllCMSPages resolver ========');
      try {
        console.log('Obteniendo todas las páginas CMS');
        
        // Obtener las páginas de la base de datos con sus secciones
        const pages = await prisma.page.findMany({
          include: {
            sections: {
              select: {
                id: true,
                order: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });
        
        console.log(`Se encontraron ${pages.length} páginas`);
        
        return pages;
      } catch (error) {
        console.error('Error al obtener páginas CMS:', error);
        return [];
      }
    },

    // Obtener páginas que usan una sección específica
    getPagesUsingSectionId: async (_parent: unknown, args: { sectionId: string }) => {
      console.log('======== START getPagesUsingSectionId resolver ========');
      try {
        const { sectionId } = args;
        console.log(`Buscando páginas que usan la sección con ID: ${sectionId}`);
        
        // Obtener la sección de la base de datos
        const section = await prisma.cMSSection.findFirst({
          where: { sectionId }
        });
        
        if (!section) {
          console.log(`No se encontró ninguna sección con ID: ${sectionId}`);
          return [];
        }
        
        console.log(`Sección encontrada: ${section.id} (${section.name})`);
        
        // Buscar todas las páginas que tienen secciones con datos que contienen el sectionId
        // La búsqueda es más compleja porque el campo data es de tipo JSON
        const pages = await prisma.$queryRaw`
          SELECT p.* 
          FROM "Page" p 
          JOIN "PageSection" ps ON p."id" = ps."pageId" 
          WHERE ps."data"::jsonb ? 'sectionId' 
          AND ps."data"->>'sectionId' = ${sectionId}
          ORDER BY p."updatedAt" DESC
        `;
        
        console.log(`Se encontraron ${Array.isArray(pages) ? pages.length : 0} páginas que usan la sección ${sectionId}`);
        
        // Si no es un array o está vacío, devolver un array vacío
        if (!Array.isArray(pages) || pages.length === 0) {
          return [];
        }
        
        // Para cada página, cargar sus secciones
        const pagesWithSections = await Promise.all(
          pages.map(async (page) => {
            const sections = await prisma.pageSection.findMany({
              where: {
                pageId: page.id
              },
              select: {
                id: true,
                order: true,
                data: true
              },
              orderBy: {
                order: 'asc'
              }
            });
            
            return {
              ...page,
              sections
            };
          })
        );
        
        return pagesWithSections;
      } catch (error) {
        console.error(`Error al obtener páginas usando sectionId ${args.sectionId}:`, error);
        return [];
      }
    },
  },
  
  Mutation: {
    saveSectionComponents: async (_parent: unknown, args: { 
      input: { 
        sectionId: string; 
        components: Array<{ id: string; type: string; data: Record<string, unknown> }> 
      } 
    }) => {
      try {
        console.log('========================================');
        const { input } = args;
        const { components } = input;
        let { sectionId } = input;
        
        // Eliminar parámetros de consulta si existen (para evitar problemas con cache busting)
        if (sectionId && sectionId.includes('?')) {
          sectionId = sectionId.split('?')[0];
          console.log('Limpiando sectionId de parámetros de consulta:', sectionId);
        }
        
        console.log(`CMS RESOLVER: Saving ${components?.length || 0} components for section ${sectionId}`);
        
        // Check if components array is not empty before trying to log the first component
        if (components && components.length > 0) {
          console.log('First component:', JSON.stringify(components[0]).substring(0, 100) + '...');
          console.log('Components to save:', components.map(c => `${c.id} (${c.type})`).join(', '));
        } else {
          console.log('No components to save');
        }
        
        const timestamp = new Date();
        
        // Guardar en la base de datos utilizando Prisma
        try {
          // Buscar si ya existe la sección
          const existingSection = await prisma.cMSSection.findUnique({
            where: { sectionId }
          });
          
          if (existingSection) {
            // Actualizar la sección existente
            console.log('Updating existing section in database:', sectionId);
            
            // 1. Eliminar las relaciones existentes para recrearlas
            await prisma.$executeRaw(
              Prisma.sql`DELETE FROM "SectionComponent" WHERE "sectionId" = ${existingSection.id}`
            );
            
            // 2. Actualizar la sección
            const updatedSection = await prisma.cMSSection.update({
              where: { id: existingSection.id },
              data: {
                lastUpdated: timestamp,
                updatedAt: timestamp
              }
            });
            
            // 3. Crear nuevas relaciones con componentes
            if (components && components.length > 0) {
              // Por cada componente, buscar si existe o crearlo
              for (let i = 0; i < components.length; i++) {
                const component = components[i];
                
                // Buscar el componente por tipo o crearlo si no existe
                let cmsComponent = await prisma.cMSComponent.findFirst({
                  where: { slug: component.type }
                });
                
                if (!cmsComponent) {
                  // Crear el componente si no existe
                  cmsComponent = await prisma.cMSComponent.create({
                    data: {
                      name: component.type,
                      slug: component.type,
                      description: `Componente tipo ${component.type}`,
                      schema: {}, // Schema vacío por defecto
                      isActive: true,
                      createdAt: timestamp,
                      updatedAt: timestamp
                    }
                  });
                }
                
                // Crear la relación entre sección y componente
                await prisma.$executeRaw(
                  Prisma.sql`INSERT INTO "SectionComponent" 
                  ("id", "sectionId", "componentId", "order", "data", "createdAt", "updatedAt") 
                  VALUES (
                    ${crypto.randomUUID()}, 
                    ${updatedSection.id}, 
                    ${cmsComponent.id}, 
                    ${i}, 
                    ${Prisma.sql`${JSON.stringify(component.data || {})}::jsonb`}, 
                    ${timestamp}, 
                    ${timestamp}
                  )`
                );
              }
            }
            
            console.log('Section updated successfully with new components');
          } else {
            // Crear una nueva sección
            console.log('Creating new section in database:', sectionId);
            
            // 1. Crear la sección
            const newSection = await prisma.cMSSection.create({
              data: {
                sectionId,
                name: sectionId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                description: `Sección "${sectionId}"`,
                lastUpdated: timestamp,
                createdAt: timestamp,
                updatedAt: timestamp
              }
            });
            
            // 2. Crear relaciones con componentes
            if (components && components.length > 0) {
              // Por cada componente, buscar si existe o crearlo
              for (let i = 0; i < components.length; i++) {
                const component = components[i];
                
                // Buscar el componente por tipo o crearlo si no existe
                let cmsComponent = await prisma.cMSComponent.findFirst({
                  where: { slug: component.type }
                });
                
                if (!cmsComponent) {
                  // Crear el componente si no existe
                  cmsComponent = await prisma.cMSComponent.create({
                    data: {
                      name: component.type,
                      slug: component.type,
                      description: `Componente tipo ${component.type}`,
                      schema: {}, // Schema vacío por defecto
                      isActive: true,
                      createdAt: timestamp,
                      updatedAt: timestamp
                    }
                  });
                }
                
                // Crear la relación entre sección y componente
                await prisma.$executeRaw(
                  Prisma.sql`INSERT INTO "SectionComponent" 
                  ("id", "sectionId", "componentId", "order", "data", "createdAt", "updatedAt") 
                  VALUES (
                    ${crypto.randomUUID()}, 
                    ${newSection.id}, 
                    ${cmsComponent.id}, 
                    ${i}, 
                    ${Prisma.sql`${JSON.stringify(component.data || {})}::jsonb`}, 
                    ${timestamp}, 
                    ${timestamp}
                  )`
                );
              }
            }
            
            console.log('New section created successfully with components');
          }
          
          const result = {
            success: true,
            message: 'Components saved successfully',
            lastUpdated: timestamp.toISOString(),
          };
          
          console.log('Save result:', result);
          console.log('========================================');
          return result;
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          throw dbError;
        }
      } catch (error) {
        console.error('========================================');
        console.error('ERROR: Error saving section data:', error);
        console.error('========================================');
        return {
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          lastUpdated: null,
        };
      }
    },

    deleteCMSSection: async (_parent: unknown, args: { sectionId: string }) => {
      console.log('======== START deleteCMSSection resolver ========');
      try {
        const { sectionId } = args;
        console.log(`Intentando eliminar la sección con ID: ${sectionId}`);
        
        // Verificar si la sección existe antes de intentar eliminarla
        const existingSection = await prisma.cMSSection.findFirst({
          where: { sectionId }
        });
        
        if (!existingSection) {
          console.log(`No se encontró ninguna sección con ID: ${sectionId}`);
          return {
            success: false,
            message: `No se encontró ninguna sección con ID: ${sectionId}`
          };
        }
        
        // Contar los componentes asociados
        const countResult = await prisma.$queryRaw<[{count: number}]>(
          Prisma.sql`SELECT COUNT(*) as count FROM "SectionComponent" WHERE "sectionId" = ${existingSection.id}`
        );
        
        const componentCount = Number(countResult[0]?.count || 0);
        
        // Eliminar las relaciones primero (debería eliminarse automáticamente por CASCADE pero por seguridad)
        await prisma.$executeRaw(
          Prisma.sql`DELETE FROM "SectionComponent" WHERE "sectionId" = ${existingSection.id}`
        );
        
        // Eliminar la sección
        await prisma.cMSSection.delete({
          where: { id: existingSection.id }
        });
        
        console.log(`Sección con ID: ${sectionId} eliminada correctamente`);
        console.log(`Se desvincularon ${componentCount} componentes de la sección`);
        
        return {
          success: true,
          message: `Sección eliminada correctamente. Se desvincularon ${componentCount} componentes.`
        };
      } catch (error) {
        console.error('Error al eliminar la sección CMS:', error);
        return {
          success: false,
          message: `Error al eliminar la sección: ${error instanceof Error ? error.message : 'Error desconocido'}`
        };
      }
    },

    // Nuevo mutation para crear un componente CMS
    createCMSComponent: async (_parent: unknown, args: { 
      input: { 
        name: string;
        slug: string;
        description?: string;
        category?: string;
        schema?: Record<string, unknown>;
        icon?: string;
      } 
    }) => {
      console.log('======== START createCMSComponent resolver ========');
      try {
        const { input } = args;
        console.log(`Creando nuevo componente: ${input.name}`);
        
        // Validar campos obligatorios
        if (!input.name || !input.slug) {
          throw new Error('Nombre y slug son campos requeridos');
        }
        
        // Verificar si ya existe un componente con el mismo slug
        const existingComponent = await prisma.cMSComponent.findFirst({
          where: { slug: input.slug }
        });
        
        if (existingComponent) {
          return {
            success: false,
            message: `Ya existe un componente con el slug: ${input.slug}`,
            component: null
          };
        }
        
        const timestamp = new Date();
        
        // Crear el nuevo componente
        const newComponent = await prisma.cMSComponent.create({
          data: {
            name: input.name,
            slug: input.slug,
            description: input.description || `Componente ${input.name}`,
            category: input.category || null,
            schema: input.schema as Prisma.InputJsonValue || Prisma.JsonNull,
            icon: input.icon || null,
            isActive: true,
            createdAt: timestamp,
            updatedAt: timestamp
          }
        });
        
        console.log(`Componente creado correctamente: ${newComponent.id}`);
        
        return {
          success: true,
          message: `Componente ${input.name} creado correctamente`,
          component: newComponent
        };
      } catch (error) {
        console.error('Error al crear componente CMS:', error);
        return {
          success: false,
          message: `Error al crear componente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          component: null
        };
      }
    },

    // Mutation para actualizar un componente CMS
    updateCMSComponent: async (_parent: unknown, args: { 
      id: string;
      input: { 
        name?: string;
        description?: string;
        category?: string;
        schema?: Record<string, unknown>;
        icon?: string;
        isActive?: boolean;
      } 
    }) => {
      console.log('======== START updateCMSComponent resolver ========');
      try {
        const { id, input } = args;
        console.log(`Actualizando componente con ID: ${id}`);
        
        // Verificar si el componente existe
        const existingComponent = await prisma.cMSComponent.findUnique({
          where: { id }
        });
        
        if (!existingComponent) {
          return {
            success: false,
            message: `No se encontró ningún componente con ID: ${id}`,
            component: null
          };
        }
        
        // Actualizar el componente
        const updatedComponent = await prisma.cMSComponent.update({
          where: { id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.description && { description: input.description }),
            ...(input.category !== undefined && { category: input.category }),
            ...(input.schema !== undefined && { schema: input.schema as Prisma.InputJsonValue }),
            ...(input.icon !== undefined && { icon: input.icon }),
            ...(input.isActive !== undefined && { isActive: input.isActive }),
            updatedAt: new Date()
          }
        });
        
        console.log(`Componente actualizado correctamente: ${updatedComponent.id}`);
        
        return {
          success: true,
          message: `Componente actualizado correctamente`,
          component: updatedComponent
        };
      } catch (error) {
        console.error('Error al actualizar componente CMS:', error);
        return {
          success: false,
          message: `Error al actualizar componente: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          component: null
        };
      }
    },

    // Mutation para eliminar un componente CMS
    deleteCMSComponent: async (_parent: unknown, args: { id: string }) => {
      console.log('======== START deleteCMSComponent resolver ========');
      try {
        const { id } = args;
        console.log(`Intentando eliminar el componente con ID: ${id}`);
        
        // Verificar si el componente existe
        const existingComponent = await prisma.cMSComponent.findUnique({
          where: { id }
        });
        
        if (!existingComponent) {
          return {
            success: false,
            message: `No se encontró ningún componente con ID: ${id}`
          };
        }
        
        // Verificar si el componente está siendo utilizado en secciones
        const usageCount = await prisma.sectionComponent.count({
          where: { componentId: id }
        });
        
        if (usageCount > 0) {
          return {
            success: false,
            message: `No se puede eliminar el componente porque está siendo utilizado en ${usageCount} secciones`
          };
        }
        
        // Eliminar el componente
        await prisma.cMSComponent.delete({
          where: { id }
        });
        
        console.log(`Componente con ID: ${id} eliminado correctamente`);
        
        return {
          success: true,
          message: `Componente eliminado correctamente`
        };
      } catch (error) {
        console.error('Error al eliminar componente CMS:', error);
        return {
          success: false,
          message: `Error al eliminar componente: ${error instanceof Error ? error.message : 'Error desconocido'}`
        };
      }
    },

    // Mutation para actualizar una sección CMS
    updateCMSSection: async (_parent: unknown, args: { 
      sectionId: string;
      input: { 
        name?: string;
        description?: string;
      } 
    }) => {
      console.log('======== START updateCMSSection resolver ========');
      try {
        const { sectionId, input } = args;
        console.log(`Actualizando sección con ID: ${sectionId}`);
        
        // Verificar si la sección existe
        const existingSection = await prisma.cMSSection.findFirst({
          where: { sectionId }
        });
        
        if (!existingSection) {
          console.log(`No se encontró ninguna sección con ID: ${sectionId}`);
          return {
            success: false,
            message: `No se encontró ninguna sección con ID: ${sectionId}`
          };
        }
        
        // Actualizar la sección
        const timestamp = new Date();
        const updatedSection = await prisma.cMSSection.update({
          where: { id: existingSection.id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.description && { description: input.description }),
            lastUpdated: timestamp,
            updatedAt: timestamp
          }
        });
        
        console.log(`Sección "${updatedSection.name}" actualizada correctamente`);
        
        return {
          success: true,
          message: `Sección actualizada correctamente`,
          lastUpdated: timestamp.toISOString()
        };
      } catch (error) {
        console.error('Error al actualizar sección CMS:', error);
        return {
          success: false,
          message: `Error al actualizar sección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          lastUpdated: null
        };
      }
    },

    // Crear página CMS
    createPage: async (_parent: unknown, args: { 
      input: { 
        title: string;
        slug: string;
        description?: string;
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
        sections?: string[];
      } 
    }) => {
      console.log('======== START createPage resolver ========');
      try {
        const { input } = args;
        console.log(`Creando nueva página: ${input.title} (${input.slug})`);
        
        // Validar campos obligatorios
        if (!input.title || !input.slug) {
          throw new Error('El título y el slug son campos requeridos');
        }
        
        // Verificar si ya existe una página con el mismo slug
        const existingPage = await prisma.page.findFirst({
          where: { slug: input.slug }
        });
        
        if (existingPage) {
          return {
            success: false,
            message: `Ya existe una página con el slug: ${input.slug}`,
            page: null
          };
        }
        
        const timestamp = new Date();
        
        // Crear la página en la base de datos
        const newPage = await prisma.page.create({
          data: {
            title: input.title,
            slug: input.slug,
            description: input.description || null,
            template: input.template || "default",
            isPublished: input.isPublished || false,
            publishDate: input.publishDate ? new Date(input.publishDate) : null,
            featuredImage: input.featuredImage || null,
            metaTitle: input.metaTitle || null,
            metaDescription: input.metaDescription || null,
            parentId: input.parentId || null,
            order: input.order !== undefined ? input.order : 0,
            pageType: (input.pageType as PageType) || PageType.CONTENT,
            locale: input.locale || "en",
            createdById: "system",
            createdAt: timestamp,
            updatedAt: timestamp
          }
        });
        
        // Si hay secciones, crear relaciones
        if (input.sections && input.sections.length > 0) {
          for (let i = 0; i < input.sections.length; i++) {
            const sectionId = input.sections[i];
            
            // Buscar la sección en la base de datos
            const section = await prisma.cMSSection.findFirst({
              where: { sectionId }
            });
            
            if (section) {
              // Crear relación entre la página y la sección
              await prisma.pageSection.create({
                data: {
                  pageId: newPage.id,
                  title: `Section ${i + 1}`,
                  componentType: "CUSTOM",
                  order: i,
                  isVisible: true,
                  data: { sectionId },
                  createdAt: timestamp,
                  updatedAt: timestamp
                }
              });
            } else {
              console.warn(`Sección con ID ${sectionId} no encontrada, omitiendo`);
            }
          }
        }
        
        console.log(`Página creada correctamente: ${newPage.id}`);
        
        // Obtener la página completa con sus secciones
        const pageWithSections = await prisma.page.findUnique({
          where: { id: newPage.id },
          include: {
            sections: {
              select: {
                id: true,
                order: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        });
        
        return {
          success: true,
          message: `Página "${input.title}" creada correctamente`,
          page: pageWithSections
        };
      } catch (error) {
        console.error('Error al crear página CMS:', error);
        return {
          success: false,
          message: `Error al crear página: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          page: null
        };
      }
    },

    // Update page mutation
    updatePage: async (_parent: unknown, args: { 
      id: string;
      input: { 
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
        sections?: Array<{
          id?: string;
          order: number;
          title?: string;
          componentType?: string;
          data?: Record<string, unknown>;
          isVisible?: boolean;
        }>;
      } 
    }) => {
      console.log('======== START updatePage resolver ========');
      try {
        const { id, input } = args;
        console.log(`Actualizando página con ID: ${id}`);
        
        // Verificar si la página existe
        const existingPage = await prisma.page.findUnique({
          where: { id },
          include: {
            sections: true
          }
        });
        
        if (!existingPage) {
          return {
            success: false,
            message: `No se encontró ninguna página con ID: ${id}`,
            page: null
          };
        }
        
        // Actualizar la página básica
        const updatedPage = await prisma.page.update({
          where: { id },
          data: {
            ...(input.title !== undefined && { title: input.title }),
            ...(input.slug !== undefined && { slug: input.slug }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.template !== undefined && { template: input.template }),
            ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
            ...(input.publishDate !== undefined && { publishDate: input.publishDate ? new Date(input.publishDate) : null }),
            ...(input.featuredImage !== undefined && { featuredImage: input.featuredImage }),
            ...(input.metaTitle !== undefined && { metaTitle: input.metaTitle }),
            ...(input.metaDescription !== undefined && { metaDescription: input.metaDescription }),
            ...(input.parentId !== undefined && { parentId: input.parentId }),
            ...(input.order !== undefined && { order: input.order }),
            ...(input.pageType !== undefined && { pageType: input.pageType as PageType }),
            ...(input.locale !== undefined && { locale: input.locale }),
            updatedAt: new Date()
          },
          include: {
            sections: true
          }
        });
        
        // Si hay secciones nuevas o modificadas, actualizarlas
        if (input.sections && Array.isArray(input.sections)) {
          console.log(`Actualizando ${input.sections.length} secciones para la página`);
          
          // Recopilar IDs existentes para eliminar los que ya no están presentes
          const newSectionIds = input.sections
            .filter(s => s.id)
            .map(s => s.id);
          
          const sectionsToDelete = existingPage.sections
            .filter(s => !newSectionIds.includes(s.id));
          
          // Eliminar secciones que ya no están en la lista
          if (sectionsToDelete.length > 0) {
            await prisma.pageSection.deleteMany({
              where: { 
                id: { 
                  in: sectionsToDelete.map(s => s.id) 
                } 
              }
            });
            console.log(`Eliminadas ${sectionsToDelete.length} secciones obsoletas`);
          }
          
          // Procesar cada sección
          for (const section of input.sections) {
            // Preparar datos de componentes si existen
            const componentType = section.componentType || 'CUSTOM';
            
            if (section.id && !section.id.startsWith('temp-')) {
              // Actualizar sección existente
              await prisma.pageSection.update({
                where: { id: section.id },
                data: {
                  title: section.title,
                  order: section.order,
                  componentType: componentType as ComponentType,
                  isVisible: section.isVisible !== false, // default to true if undefined
                  data: section.data ? section.data as Prisma.InputJsonValue : Prisma.JsonNull,
                  updatedAt: new Date()
                }
              });
              console.log(`Sección actualizada: ${section.id}`);
            } else {
              // Crear nueva sección
              await prisma.pageSection.create({
                data: {
                  pageId: id,
                  title: section.title || `Sección ${section.order + 1}`,
                  order: section.order,
                  componentType: componentType as ComponentType,
                  isVisible: section.isVisible !== false, // default to true if undefined
                  data: section.data ? section.data as Prisma.InputJsonValue : Prisma.JsonNull,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              });
              console.log(`Nueva sección creada con orden ${section.order}`);
            }
          }
        }
        
        // Obtener la página actualizada con sus secciones
        const pageWithSections = await prisma.page.findUnique({
          where: { id: updatedPage.id },
          include: {
            sections: {
              select: {
                id: true,
                order: true,
                title: true,
                componentType: true,
                isVisible: true,
                data: true,
                createdAt: true,
                updatedAt: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        });
        
        console.log(`Página "${updatedPage.title}" actualizada correctamente`);
        
        return {
          success: true,
          message: `Página "${updatedPage.title}" actualizada correctamente`,
          page: pageWithSections
        };
      } catch (error) {
        console.error('Error al actualizar página CMS:', error);
        return {
          success: false,
          message: `Error al actualizar página: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          page: null
        };
      }
    },

    // Eliminar página CMS
    deletePage: async (_parent: unknown, args: { id: string }) => {
      console.log('======== START deletePage resolver ========');
      try {
        const { id } = args;
        console.log(`Eliminando página con ID: ${id}`);
        
        // Verificar si la página existe
        const existingPage = await prisma.page.findUnique({
          where: { id },
          include: {
            sections: true
          }
        });
        
        if (!existingPage) {
          return {
            success: false,
            message: `No se encontró ninguna página con ID: ${id}`,
          };
        }
        
        // Eliminar primero las secciones asociadas a la página
        if (existingPage.sections.length > 0) {
          const sectionIds = existingPage.sections.map(section => section.id);
          
          // Eliminar todas las secciones de la página
          await prisma.pageSection.deleteMany({
            where: {
              id: {
                in: sectionIds
              }
            }
          });
          
          console.log(`Se eliminaron ${sectionIds.length} secciones asociadas a la página`);
        }
        
        // Eliminar la página
        await prisma.page.delete({
          where: { id }
        });
        
        console.log(`Página "${existingPage.title}" eliminada correctamente`);
        
        return {
          success: true,
          message: `Página "${existingPage.title}" eliminada correctamente`,
        };
      } catch (error) {
        console.error('Error al eliminar página CMS:', error);
        return {
          success: false,
          message: `Error al eliminar página: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        };
      }
    },
  },
  
  // Scalar resolver
  JSON: {
    __serialize(value: unknown) {
      return value;
    },
  },
}; 