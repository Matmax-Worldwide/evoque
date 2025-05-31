/**
 * @fileoverview This file provides a set of components for creating collapsible
 * sections of content. These components allow users to show and hide content
 * sections, often used for accordions, dropdowns, or expandable panels.
 *
 * The components (`Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`)
 * are direct re-exports from the Radix UI Collapsible primitives
 * (`@radix-ui/react-collapsible`).
 *
 * This appears to be a standard set of re-exports, likely part of a UI library
 * structure (e.g., ShadCN/ui), intended to be used as unstyled building blocks.
 * No styling or customizations are applied within this file itself; styling would
 * typically be applied where these components are consumed or via a separate
 * styled component that wraps these primitives.
 *
 * Exported Components:
 * - `Collapsible`: The root component that manages the state of the collapsible section.
 * - `CollapsibleTrigger`: The button or element that toggles the open/closed state.
 * - `CollapsibleContent`: The wrapper for the content that is shown or hidden.
 */
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
