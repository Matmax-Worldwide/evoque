/**
 * @fileoverview This module provides a function for deleting a CMS page
 * and all its associated sections via a GraphQL mutation.
 */
import { gqlRequest } from './graphql-client';

/**
 * Deletes a CMS page and all of its associated sections using a GraphQL mutation.
 * @param pageId - The ID of the CMS page to delete.
 * @returns A promise that resolves to an object containing:
 *          - `success` (boolean): True if the deletion was successful, false otherwise.
 *          - `message` (string): A message providing more details about the outcome.
 */
export async function deletePageWithSections(pageId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const mutation = `
      mutation DeletePage($id: ID!) {
        deletePage(id: $id) {
          success
          message
        }
      }
    `;

    console.log(`Eliminando página con ID: ${pageId} y todas sus secciones asociadas`);

    const result = await gqlRequest<{ 
      deletePage: { 
        success: boolean; 
        message: string; 
      } 
    }>(mutation, { id: pageId });
    
    if (!result || !result.deletePage) {
      console.error('La respuesta no contiene deletePage:', result);
      return { 
        success: false, 
        message: 'La estructura de la respuesta no es la esperada'
      };
    }
    
    return result.deletePage;
  } catch (error) {
    console.error(`Error al eliminar la página ${pageId} con sus secciones:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Error desconocido al eliminar la página'
    };
  }
} 