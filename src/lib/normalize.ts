/**
 * @fileoverview Utility functions for text normalization.
 * This module provides functions to handle:
 * - Conversion of accented characters (e.g., á → a, é → e).
 * - Conversion of 'ñ' to 'n'.
 * - Replacement of spaces with underscores or hyphens.
 * - Removal or replacement of special characters.
 * - Creation of slugs, valid file names, and variable names.
 * - Basic error handling for normalization processes.
 */

/**
 * Normalizes a string value to be used as a field identifier or a similar token.
 * It converts the string to lowercase, removes diacritics (accents),
 * converts 'ñ' to 'n', replaces spaces with underscores, removes special characters
 * (keeping only alphanumeric and underscores), and cleans up consecutive/leading/trailing underscores.
 * 
 * @param value - The string to normalize.
 * @returns The normalized string, suitable for use as an identifier. Returns an empty string if input is invalid or an error occurs.
 */
export function normalizeValue(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    return value
      .toLowerCase()
      .normalize('NFD') // Descompone caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Elimina marcas diacríticas
      .replace(/[ñÑ]/g, 'n') // Convierte ñ a n
      .replace(/\s+/g, ' ') // Normaliza espacios múltiples
      .trim() // Elimina espacios al inicio y final
      .replace(/\s/g, '_') // Convierte espacios a guiones bajos
      .replace(/[^a-z0-9_]/g, '_') // Reemplaza caracteres especiales por guiones bajos
      .replace(/_+/g, '_') // Elimina guiones bajos consecutivos
      .replace(/^_+|_+$/g, ''); // Elimina guiones bajos al inicio y final
  } catch (error) {
    console.error('Error normalizando valor:', error);
    return '';
  }
}

/**
 * Creates a URL-friendly slug from a given string.
 * It converts the string to lowercase, removes diacritics, converts 'ñ' to 'n',
 * replaces spaces and special characters (like '&', '@', '%', '+') with hyphens or their textual representation,
 * removes other special characters (keeping only alphanumeric and hyphens),
 * cleans up consecutive/leading/trailing hyphens, and truncates to a specified maximum length.
 * 
 * @param value - The string to convert into a slug.
 * @param maxLength - Optional. The maximum desired length for the slug. Defaults to 50.
 * @returns The generated slug, suitable for URLs. Returns an empty string if input is invalid or an error occurs.
 */
export function createSlug(value: string, maxLength = 50): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    const customReplacements: Record<string, string> = {
      '&': 'and',
      '@': 'at',
      '%': 'percent',
      '+': 'plus'
    };

    let normalized = value;
    
    // Aplicar reemplazos personalizados
    Object.entries(customReplacements).forEach(([from, to]) => {
      normalized = normalized.replace(new RegExp(from, 'gi'), to);
    });

    normalized = normalized
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ñÑ]/g, 'n')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (maxLength && normalized.length > maxLength) {
      normalized = normalized.substring(0, maxLength).replace(/-+$/, '');
    }

    return normalized;
  } catch (error) {
    console.error('Error creando slug:', error);
    return '';
  }
}

/**
 * Creates a normalized file name from a given string.
 * It converts the string to lowercase, removes diacritics, converts 'ñ' to 'n',
 * replaces spaces and characters not allowed in file names (e.g., '/', ':', '*') with underscores,
 * removes other special characters (keeping alphanumeric, underscores, dots, hyphens),
 * cleans up consecutive/leading/trailing underscores, and truncates to a maximum length of 100 characters.
 * An optional file extension can be appended.
 * 
 * @param value - The string to convert into a file name.
 * @param extension - Optional. The file extension (without the dot) to append to the generated name. Defaults to an empty string.
 * @returns A normalized file name string. Returns an empty string if input is invalid or an error occurs.
 */
export function createFileName(value: string, extension = ''): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    const fileReplacements: Record<string, string> = {
      '/': '_',
      '\\': '_',
      ':': '_',
      '*': '_',
      '?': '_',
      '"': '_',
      '<': '_',
      '>': '_',
      '|': '_'
    };

    let normalized = value;
    
    // Reemplazar caracteres no permitidos en nombres de archivo
    Object.entries(fileReplacements).forEach(([from, to]) => {
      normalized = normalized.replace(new RegExp(`\\${from}`, 'g'), to);
    });

    normalized = normalized
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ñÑ]/g, 'n')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '_')
      .replace(/[^a-z0-9_.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (normalized.length > 100) {
      normalized = normalized.substring(0, 100).replace(/_+$/, '');
    }

    return extension ? `${normalized}.${extension}` : normalized;
  } catch (error) {
    console.error('Error creando nombre de archivo:', error);
    return '';
  }
}

/**
 * Creates a valid JavaScript/TypeScript variable name from a given string.
 * It removes diacritics, converts 'ñ' to 'n', removes special characters (keeping only alphanumeric and spaces),
 * removes leading digits, and then converts the result to either camelCase or snake_case.
 * 
 * @param value - The string to convert into a variable name.
 * @param isCamelCase - Optional. If true, the output will be in camelCase (e.g., `myVariable`).
 *                      If false (default), the output will be in snake_case (e.g., `my_variable`).
 * @returns A valid variable name string. Returns "variable" if the input is invalid, results in an empty string, or an error occurs.
 */
export function createVariableName(value: string, isCamelCase = false): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    const normalized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[ñÑ]/g, 'n')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/^\d+/, ''); // Elimina dígitos al inicio

    if (normalized.length === 0) {
      return 'variable';
    }

    if (isCamelCase) {
      // Convertir a camelCase
      return normalized
        .split(/\s+/)
        .map((word, index) => {
          if (index === 0) {
            return word.toLowerCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
    } else {
      // Convertir a snake_case
      return normalized
        .toLowerCase()
        .replace(/\s+/g, '_');
    }
  } catch (error) {
    console.error('Error creando nombre de variable:', error);
    return 'variable';
  }
} 