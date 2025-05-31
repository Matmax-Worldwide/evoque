/**
 * @fileoverview This file provides a Switch component, a toggle control that
 * allows users to switch between two states (typically on/off or true/false).
 *
 * The `Switch` component is based on the Radix UI Switch primitives
 * (`@radix-ui/react-switch`), specifically `SwitchPrimitives.Root` for the main
 * switch area and `SwitchPrimitives.Thumb` for the draggable/animated part.
 * It is styled using Tailwind CSS and includes visual transitions for state changes.
 *
 * Styling for different states (checked, unchecked, disabled) is applied via
 * Tailwind CSS classes, including `data-[state=checked]` and `data-[state=unchecked]`
 * selectors provided by Radix UI primitives.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with no major project-specific customizations
 * visible directly within this file's code beyond the defined styling.
 *
 * Exported Component:
 * - `Switch`: The main component for rendering the toggle switch.
 */
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
