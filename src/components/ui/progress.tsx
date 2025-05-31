/**
 * @fileoverview This file provides a Progress bar component for displaying
 * the progress of an operation or a value within a range.
 *
 * The `Progress` component is based on the Radix UI Progress primitives
 * (`@radix-ui/react-progress`), specifically `ProgressPrimitive.Root` for the
 * container and `ProgressPrimitive.Indicator` for the fill element that
 * visually represents the current progress. It is styled using Tailwind CSS.
 *
 * The fill of the progress bar is controlled by the `value` prop (a number
 * between 0 and 100), which is translated into an inline `transform: translateX`
 * style on the indicator element to show the appropriate level of completion.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with no major project-specific customizations
 * visible directly within this file's code beyond the styling.
 *
 * Exported Component:
 * - `Progress`: The main component for rendering the progress bar.
 */
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
