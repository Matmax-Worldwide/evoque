/**
 * @fileoverview This file provides Avatar components (`Avatar`, `AvatarImage`,
 * `AvatarFallback`) for displaying user profile pictures or placeholders.
 *
 * These components are based on the Radix UI Avatar primitives (`@radix-ui/react-avatar`)
 * and are styled using Tailwind CSS, following conventions commonly found in UI
 * libraries like ShadCN/ui.
 *
 * The implementation appears to be a standard setup, likely generated or adapted
 * from such a UI library, with no major project-specific customizations visible
 * directly within this file's code.
 *
 * Exported Components and their general roles:
 * - `Avatar`: The main root component that wraps the avatar image and fallback.
 * - `AvatarImage`: The component used to display the actual image. It handles image loading states.
 * - `AvatarFallback`: The component displayed as a placeholder if the image fails to load
 *   or while it's loading (e.g., displaying initials).
 */
"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
