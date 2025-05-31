/**
 * @fileoverview This file provides a Checkbox component for use within the application.
 *
 * The `Checkbox` component is based on the Radix UI Checkbox primitives
 * (`@radix-ui/react-checkbox`), specifically `CheckboxPrimitive.Root` for the main
 * checkbox element and `CheckboxPrimitive.Indicator` for the checkmark display.
 * It is styled using Tailwind CSS, with utility functions like `cn` (from `@/lib/utils`)
 * for conditional class names. The checkmark icon itself is provided by `lucide-react`.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with no major project-specific customizations
 * visible directly within this file's code.
 *
 * Exported Component:
 * - `Checkbox`: The main component that users will interact with. It wraps the Radix UI
 *   primitives and applies the defined styling and behavior.
 */
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
