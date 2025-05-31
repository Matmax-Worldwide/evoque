/**
 * @fileoverview This file provides components for creating scrollable areas
 * with custom-styled scrollbars. These components are typically used to make
 * specific sections of a UI scrollable when their content exceeds the available space.
 *
 * The components (`ScrollArea`, `ScrollBar`) are based on the Radix UI ScrollArea
 * primitives (`@radix-ui/react-scroll-area`) and are styled using Tailwind CSS.
 * The `ScrollArea` component itself also renders Radix UI's `Viewport` and `Corner`
 * primitives internally, and `ScrollBar` renders `ScrollAreaThumb`.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with no major project-specific customizations
 * visible directly within this file's code beyond styling and composition of
 * Radix UI primitives.
 *
 * Exported Components and their general roles:
 * - `ScrollArea`: The main root component that wraps the content to be made scrollable.
 *   It includes a `Viewport` for the content and automatically renders a `ScrollBar` and `Corner`.
 * - `ScrollBar`: The component that displays the scrollbar (either vertical or horizontal).
 *   It contains a `ScrollAreaThumb` for the draggable part of the scrollbar.
 */
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
