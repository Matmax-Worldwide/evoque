/**
 * @fileoverview This file provides a set of components for creating breadcrumb
 * navigation UI elements. These components are styled with Tailwind CSS and utilize
 * `lucide-react` for icons (e.g., ChevronRight for separators, MoreHorizontal for ellipsis).
 * The `BreadcrumbLink` component also uses `@radix-ui/react-slot` to allow for flexible
 * composition, for instance, when integrating with Next.js `Link` components.
 *
 * The implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with no major project-specific customizations
 * visible directly within this file's code.
 *
 * Exported Components and their general roles:
 * - `Breadcrumb`: The root container for the breadcrumb navigation list.
 * - `BreadcrumbList`: An ordered list (`<ol>`) that holds the breadcrumb items.
 * - `BreadcrumbItem`: A list item (`<li>`) representing an individual element in the breadcrumb trail.
 * - `BreadcrumbLink`: A component for breadcrumb items that are links. It can act as an `<a>` tag
 *   or compose with a child component (e.g., Next.js `Link`) using Radix UI's `Slot`.
 * - `BreadcrumbPage`: A component for the current page in the breadcrumb trail, typically not a link.
 * - `BreadcrumbSeparator`: The visual separator between breadcrumb items (defaults to a ChevronRight icon).
 * - `BreadcrumbEllipsis`: A component to indicate that some breadcrumb items are hidden or truncated,
 *   displaying a "more" ellipsis icon.
 */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
