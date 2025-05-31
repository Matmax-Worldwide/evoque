/**
 * @fileoverview This file provides a set of components for creating pagination
 * controls, enabling users to navigate through pages of content.
 *
 * The components are styled using Tailwind CSS and utilize `lucide-react` for
 * navigation icons (e.g., ChevronLeft, ChevronRight, MoreHorizontal).
 * The interactive elements like page links, previous, and next buttons leverage
 * `buttonVariants` from the local Button component (`@/components/ui/button`)
 * for consistent styling.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, designed for building accessible and stylable
 * pagination controls with no major project-specific customizations visible directly
 * within this file's code.
 *
 * Exported Components and their general roles:
 * - `Pagination`: The root container (`<nav>`) for the pagination controls.
 * - `PaginationContent`: An unordered list (`<ul>`) that holds all pagination items.
 * - `PaginationItem`: A list item (`<li>`) wrapper for individual pagination elements like links or ellipsis.
 * - `PaginationLink`: An anchor (`<a>`) styled as a button, used for page numbers and can indicate the active page.
 * - `PaginationPrevious`: A specialized `PaginationLink` for navigating to the previous page, including an icon and "Previous" text.
 * - `PaginationNext`: A specialized `PaginationLink` for navigating to the next page, including an icon and "Next" text.
 * - `PaginationEllipsis`: A component to indicate truncated page numbers, displaying a "more pages" ellipsis icon.
 */
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
