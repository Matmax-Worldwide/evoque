/**
 * @fileoverview This file provides a set of components for creating popover
 * user interfaces. Popovers are used to display content floating above other
 * elements, typically triggered by a click or hover on an anchor element.
 *
 * The components (`Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`)
 * are based on the Radix UI Popover primitives (`@radix-ui/react-popover`)
 * and are styled using Tailwind CSS.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with no major project-specific customizations
 * visible directly within this file's code beyond styling and composition of
 * Radix UI primitives.
 *
 * Exported Components and their general roles:
 * - `Popover`: The root component that manages the state of the popover.
 * - `PopoverTrigger`: The element that, when interacted with (e.g., clicked), opens the popover.
 * - `PopoverAnchor`: An optional Radix UI primitive to which the popover content can be anchored.
 * - `PopoverContent`: The container for the content that appears when the popover is open.
 *   It is rendered within a `PopoverPrimitive.Portal` to ensure proper stacking and positioning.
 *   Includes animations for appearance and disappearance.
 */
"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
