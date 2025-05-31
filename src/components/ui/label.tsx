/**
 * @fileoverview This file provides a Label component, typically used for
 * labeling form elements to improve accessibility and user experience.
 *
 * The `Label` component is based on the Radix UI Label primitive (`@radix-ui/react-label`)
 * and is styled using Tailwind CSS. It utilizes `cva` (class-variance-authority)
 * for its base styling, which includes styles for `peer-disabled` states, allowing
 * the label's appearance to change when an associated peer input is disabled.
 * The `cn` utility is used for merging class names.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with no major project-specific customizations
 * visible directly within this file's code beyond the defined styling.
 *
 * Exported Component:
 * - `Label`: The styled label component that wraps `LabelPrimitive.Root`.
 */
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
