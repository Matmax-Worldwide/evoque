/**
 * @fileoverview This file provides a Skeleton component, used for displaying
 * a placeholder preview of content while data is loading. This helps improve
 * user experience by indicating that content is on its way.
 *
 * The `Skeleton` component is styled using Tailwind CSS and includes a pulsing
 * animation (`animate-pulse`) to visually signify a loading state.
 *
 * This implementation appears to be a standard setup, likely generated or adapted
 * from a UI library like ShadCN/ui, with no major project-specific customizations
 * visible directly within this file's code beyond the defined styling.
 *
 * Exported Component:
 * - `Skeleton`: The main component used to render a skeleton placeholder.
 */
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
