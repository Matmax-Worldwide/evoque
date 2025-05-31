/**
 * @fileoverview This file provides a Separator component for visually or
 * semantically separating content within a user interface.
 *
 * The `Separator` component is based on the Radix UI Separator primitive
 * (`@radix-ui/react-separator`) and is styled using Tailwind CSS. It supports
 * different orientations (horizontal or vertical) and can be marked as
 * decorative if it's purely a visual divider.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with no major project-specific customizations
 * visible directly within this file's code beyond styling.
 *
 * Exported Component:
 * - `Separator`: The main component used to render a separator line. It accepts
 *   props like `orientation` (defaulting to 'horizontal') and `decorative`
 *   (defaulting to `true`).
 */
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
