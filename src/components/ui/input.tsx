/**
 * @fileoverview This file provides a styled Input component for use in forms
 * and other areas requiring text-like input fields.
 *
 * The `Input` component is a `React.forwardRef` wrapper around a standard HTML
 * `<input>` element. It applies styling using Tailwind CSS, managed via the `cn`
 * (classnames) utility function.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui. Customizations are primarily focused on applying
 * consistent styling (e.g., border, padding, focus states, disabled states)
 * according to a design system. No major project-specific business logic is
 * visible within this file.
 *
 * Exported Component:
 * - `Input`: The styled input component that accepts standard HTML input attributes.
 */
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
