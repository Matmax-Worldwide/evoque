/**
 * @fileoverview This file provides a Toaster component for displaying toast
 * notifications (small, non-intrusive messages) to the user.
 *
 * The `Toaster` component is a styled wrapper around the `Toaster` component
 * from the `sonner` library. It integrates with `next-themes` to automatically
 * adapt its appearance (light/dark) based on the application's current theme.
 *
 * Custom styling is applied to the toasts using Tailwind CSS classes via the
 * `toastOptions.classNames` prop of the `sonner` Toaster. This allows the
 * notifications to match the application's overall design system.
 *
 * This implementation appears to be a standard setup for integrating the `sonner`
 * library into an application, likely following patterns from a UI library like
 * ShadCN/ui, with customizations focused on theming and styling.
 *
 * Exported Component:
 * - `Toaster`: The main component that should be placed at the root of the application
 *   (or a relevant layout) to enable toast notifications.
 */
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
