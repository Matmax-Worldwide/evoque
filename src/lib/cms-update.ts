/**
 * @fileoverview This module provides a function for updating CMS sections
 * via a GraphQL mutation.
 */
import { gqlRequest } from './graphql-client';

/**
 * Updates a CMS section using a GraphQL mutation.
 * @param sectionId - The ID of the CMS section to update.
 * @param input - An object containing the fields to update.
 * @param input.name - Optional new name for the section.
 * @param input.description - Optional new description for the section.
 * @param input.backgroundImage - Optional new background image URL for the section.
 * @param input.backgroundType - Optional new background type for the section.
 * @param input.gridDesign - Optional new grid design for the section.
 * @returns A promise that resolves to an object containing:
 *          - `success` (boolean): True if the update was successful, false otherwise.
 *          - `message` (string): A message providing more details about the outcome.
 *          - `lastUpdated` (string | null): The timestamp of the last update, or null if the update failed.
 */
export async function updateCMSSection(sectionId: string, input: { 
  name?: string; 
  description?: string; 
  backgroundImage?: string; 
  backgroundType?: string;
  gridDesign?: string;
}) {
  try {
    console.log('Actualizando sección con ID:', sectionId, input);
    
    const query = `
      mutation UpdateCMSSection($sectionId: ID!, $input: UpdateCMSSectionInput!) {
        updateCMSSection(sectionId: $sectionId, input: $input) {
          success
          message
          lastUpdated
        }
      }
    `;
    
    const variables = {
      sectionId,
      input
    };
    
    const result = await gqlRequest<{
      updateCMSSection: {
        success: boolean;
        message: string;
        lastUpdated: string | null;
      }
    }>(query, variables);
    
    if (!result || !result.updateCMSSection) {
      console.error('La respuesta no contiene updateCMSSection:', result);
      return {
        success: false,
        message: 'Error al actualizar la sección: Respuesta inválida del servidor',
        lastUpdated: null
      };
    }
    
    console.log('Resultado de actualización:', result.updateCMSSection);
    
    return result.updateCMSSection;
  } catch (error) {
    console.error('Error al actualizar la sección:', error);
    return {
      success: false,
      message: `Error al actualizar la sección: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      lastUpdated: null
    };
  }
} 