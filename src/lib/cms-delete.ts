/**
 * @fileoverview This module provides a function for deleting CMS sections
 * via a GraphQL mutation.
 */
import { gqlRequest } from './graphql-client';

/**
 * Deletes a CMS section using a GraphQL mutation.
 * @param sectionId - The ID of the CMS section to delete.
 * @returns A promise that resolves to an object containing:
 *          - `success` (boolean): True if the deletion was successful, false otherwise.
 *          - `message` (string, optional): A message providing more details about the outcome.
 */
export async function deleteCMSSection(sectionId: string) {
  try {
    const mutation = `
      mutation DeleteCMSSection($sectionId: ID!) {
        deleteCMSSection(sectionId: $sectionId) {
          success
          message
        }
      }
    `;

    console.log(`Intentando eliminar la sección ${sectionId}`);

    try {
      // Usar la función genérica gqlRequest para hacer la petición
      const result = await gqlRequest<{ 
        deleteCMSSection: { 
          success: boolean; 
          message?: string; 
        } 
      }>(mutation, { sectionId });
      
      console.log('Respuesta del servidor para eliminación:', result);
      
      // Verificar si tenemos la estructura esperada
      if (!result || !result.deleteCMSSection) {
        console.error('La respuesta no contiene deleteCMSSection:', result);
        return { 
          success: false, 
          message: 'La estructura de la respuesta no es la esperada'
        };
      }
      
      return result.deleteCMSSection;
    } catch (error) {
      console.error('Error en la petición GraphQL de eliminación:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error desconocido en la comunicación con el servidor'
      };
    }
  } catch (error) {
    console.error(`Error general al eliminar la sección ${sectionId}:`, error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
} 