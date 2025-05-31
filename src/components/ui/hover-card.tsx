/**
 * @fileoverview This file provides a set of components for creating hover-triggered
 * informational cards or popovers. These components allow content to be displayed
 * when a user hovers over a trigger element.
 *
 * The components (`HoverCard`, `HoverCardTrigger`, `HoverCardContent`) are based
 * on the Radix UI HoverCard primitives (`@radix-ui/react-hover-card`) and are
 * styled using Tailwind CSS.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with no major project-specific customizations
 * visible directly within this file's code beyond styling and composition of
 * Radix UI primitives.
 *
 * Exported Components and their general roles:
 * - `HoverCard`: The root component that wraps all parts of a hover card.
 * - `HoverCardTrigger`: The element that, when hovered, triggers the display of the hover card content.
 * - `HoverCardContent`: The container for the content that appears when the trigger is hovered.
 *   It includes animations for appearance and disappearance.
 */
"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-hover-card-content-transform-origin]",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
