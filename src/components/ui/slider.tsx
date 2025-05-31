/**
 * @fileoverview This file provides a Slider component for selecting a numeric
 * value from a range.
 *
 * The `Slider` component is based on the Radix UI Slider primitives
 * (`@radix-ui/react-slider`), which include `Root` (the main container),
 * `Track` (the slider bar), `Range` (the part of the track representing the
 * selected value), and `Thumb` (the draggable handle). It is styled using
 * Tailwind CSS.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with customizations primarily focused on
 * applying Tailwind CSS classes to the Radix UI primitives for styling.
 *
 * Exported Component:
 * - `Slider`: The main component that users will interact with. It composes the
 *   Radix UI Slider primitives (`Root`, `Track`, `Range`, `Thumb`) into a single,
 *   styled slider element.
 */
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
