/**
 * @fileoverview This file provides the AspectRatio component for maintaining
 * the aspect ratio of content, such as images or videos.
 *
 * It directly re-exports the `Root` component from the Radix UI AspectRatio primitive
 * (`@radix-ui/react-aspect-ratio`). This is a standard wrapper around the Radix UI
 * primitive, commonly found in UI libraries like ShadCN/ui, and is used to ensure
 * that embedded content scales correctly while preserving its proportions.
 *
 * No project-specific customizations or additional styling are applied in this file;
 * it serves as a direct pass-through to the underlying Radix UI component.
 */
"use client"

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

const AspectRatio = AspectRatioPrimitive.Root

export { AspectRatio }
