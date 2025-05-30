/**
 * @fileoverview This module provides utility functions.
 * Currently, it is focused on providing a helper function (`cn`) for conditionally
 * constructing class names, particularly useful with Tailwind CSS, by integrating
 * `clsx` for conditional class joining and `tailwind-merge` for resolving
 * Tailwind CSS class conflicts.
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Conditionally joins class names and merges Tailwind CSS classes.
 * This function uses `clsx` to conditionally join class names based on the inputs
 * and then uses `tailwind-merge` to intelligently merge the resulting class string,
 * resolving any conflicts that arise from Tailwind CSS utility classes.
 *
 * For example, `cn("p-4", "bg-red-500", { "text-white": true, "font-bold": false })`
 * might result in `"p-4 bg-red-500 text-white"`. If later `cn("p-2", existingClasses)`
 * is called, `tailwind-merge` would ensure `p-2` overrides `p-4`.
 *
 * @param inputs - A list of class values. Each value can be a string, an array of strings,
 *                 or an object where keys are class names and values are booleans indicating
 *                 whether the class should be included.
 * @returns A string of combined and intelligently merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
