/**
 * @fileoverview This file provides a system of React components for creating
 * collapsible sidebars. It includes a `SidebarProvider` for managing the
 * collapsed state, a `useSidebar` hook to access this state, and various
 * presentational components (`Sidebar`, `SidebarHeader`, `SidebarItem`, etc.)
 * for building the sidebar structure and content.
 * Specific styling for collapsed states and animations is expected to be handled
 * in the associated `sidebar.css` file.
 */
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import "./sidebar.css" // Associated CSS for specific sidebar styling

/**
 * Props for the `SidebarProvider` component.
 */
interface SidebarProviderProps {
  /** The child components that will have access to the sidebar context. */
  children: React.ReactNode
  /**
   * Optional initial collapsed state of the sidebar.
   * @default false
   */
  defaultCollapsed?: boolean
}

/**
 * Defines the shape of the value provided by `SidebarContext`.
 */
interface SidebarContextValue {
  /** Current collapsed state of the sidebar. True if collapsed, false if expanded. */
  collapsed: boolean
  /** Function to directly set the collapsed state. */
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  /** Function to toggle the collapsed state of the sidebar. */
  toggleCollapsed: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

/**
 * `SidebarProvider` is a context provider component that manages the collapsible
 * state of a sidebar. It should wrap any part of the application that needs
 * to use or interact with the sidebar's collapsed state via the `useSidebar` hook.
 *
 * @param {SidebarProviderProps} props - The props for the SidebarProvider.
 * @returns {React.JSX.Element} The provider component wrapping its children.
 */
export function SidebarProvider({
  children,
  defaultCollapsed = false
}: SidebarProviderProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed(prev => !prev)
  }, [])

  const value = React.useMemo(() => ({
    collapsed,
    setCollapsed,
    toggleCollapsed
  }), [collapsed, toggleCollapsed])

  return (
    <SidebarContext.Provider value={value}>
      <div className="sidebar-provider" data-collapsed={collapsed}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

/**
 * `useSidebar` is a custom hook that allows components nested within a
 * `SidebarProvider` to access the sidebar's `collapsed` state and the
 * `toggleCollapsed` function to change it.
 *
 * It throws an error if used outside of a `SidebarProvider`, ensuring proper context usage.
 *
 * @returns {SidebarContextValue} An object containing `collapsed` state and `toggleCollapsed` function.
 */
export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

/**
 * Props for the main `Sidebar` container component.
 */
interface SidebarProps {
  /** The content to be rendered inside the sidebar. */
  children: React.ReactNode
  /** Optional additional CSS classes to apply to the sidebar container. */
  className?: string
}

/**
 * `Sidebar` is the main visual container for the sidebar.
 * Its width transitions based on the `collapsed` state obtained from the `useSidebar` hook.
 * It typically houses `SidebarHeader`, `SidebarContent`, and `SidebarFooter` components.
 *
 * @param {SidebarProps} props - The props for the Sidebar component.
 * @returns {React.JSX.Element} The rendered sidebar container.
 */
export function Sidebar({ children, className }: SidebarProps) {
  const { collapsed } = useSidebar()

    return (
    <div
            className={cn(
        "h-full border-r border-border bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64", // Width changes based on collapsed state
              className
            )}
          >
            {children}
          </div>
  )
}

/**
 * Props for the `SidebarHeader` component.
 */
interface SidebarHeaderProps {
  /** Content to be rendered within the sidebar header. */
  children?: React.ReactNode
  /** Optional additional CSS classes. */
  className?: string
}

/**
 * `SidebarHeader` is a structural component for the header section of the sidebar.
 * It typically contains a logo, title, or other header-related elements.
 *
 * @param {SidebarHeaderProps} props - The props for the SidebarHeader.
 * @returns {React.JSX.Element} The rendered sidebar header section.
 */
export function SidebarHeader({ children, className }: SidebarHeaderProps) {
      return (
    <div className={cn("p-4 border-b border-border", className)}>
          {children}
        </div>
      )
    }

/**
 * Props for the `SidebarContent` component.
 */
interface SidebarContentProps {
  /** The main content of the sidebar, usually navigation items or groups. */
  children: React.ReactNode
  /** Optional additional CSS classes. */
  className?: string
}

/**
 * `SidebarContent` is a structural component for the main scrollable content area
 * of the sidebar. It's designed to hold `SidebarGroup` and `SidebarItem` components.
 *
 * @param {SidebarContentProps} props - The props for the SidebarContent.
 * @returns {React.JSX.Element} The rendered sidebar content section.
 */
export function SidebarContent({ children, className }: SidebarContentProps) {
      return (
    <div className={cn("flex-1 overflow-auto p-4", className)}>
      {children}
    </div>
  )
}

/**
 * Props for the `SidebarFooter` component.
 */
interface SidebarFooterProps {
  /** Content to be rendered within the sidebar footer. */
  children: React.ReactNode
  /** Optional additional CSS classes. */
  className?: string
}

/**
 * `SidebarFooter` is a structural component for the footer section of the sidebar.
 * It can be used for copyright information, user profile actions, or other footer content.
 *
 * @param {SidebarFooterProps} props - The props for the SidebarFooter.
 * @returns {React.JSX.Element} The rendered sidebar footer section.
 */
export function SidebarFooter({ children, className }: SidebarFooterProps) {
    return (
    <div className={cn("p-4 border-t border-border", className)}>
            {children}
      </div>
    )
  }

/**
 * Props for the `SidebarGroup` component.
 */
interface SidebarGroupProps {
  /** The `SidebarItem` components or other content to be grouped. */
  children: React.ReactNode
  /** Optional title for the group, displayed above the items. Hidden when sidebar is collapsed. */
  title?: string
  /** Optional additional CSS classes. */
  className?: string
}

/**
 * `SidebarGroup` is a component used to group related `SidebarItem`s under an
 * optional title. The title's visibility is dependent on the sidebar's `collapsed` state.
 *
 * @param {SidebarGroupProps} props - The props for the SidebarGroup.
 * @returns {React.JSX.Element} A container for a group of sidebar items.
 */
export function SidebarGroup({ children, title, className }: SidebarGroupProps) {
  const { collapsed } = useSidebar()

  return (
    <div className={cn("mb-4", className)}>
      {title && !collapsed && (
        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  )
}

/**
 * Props for the `SidebarItem` component.
 */
interface SidebarItemProps {
  /** The text label or content of the sidebar item. */
  children: React.ReactNode
  /** Optional icon to display next to the item's text. */
  icon?: React.ReactNode
  /** If true, applies active styling to the item. */
  active?: boolean
  /** If true, the item is rendered as disabled and non-interactive. */
  disabled?: boolean
  /** Optional click handler for the item. */
  onClick?: () => void
  /** Optional additional CSS classes. */
  className?: string
}

/**
 * `SidebarItem` represents a clickable item within the sidebar, typically used for navigation.
 * It can display an icon and a text label. Its rendering adapts to the sidebar's
 * `collapsed` state: when collapsed, it may only show the icon; when expanded,
 * it shows both icon and text.
 *
 * @param {SidebarItemProps} props - The props for the SidebarItem.
 * @returns {React.JSX.Element} A button element representing the sidebar item.
 */
export function SidebarItem({
  children,
  icon,
  active = false,
  disabled = false,
  onClick,
  className
}: SidebarItemProps) {
  const { collapsed } = useSidebar()

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center rounded-md font-medium transition-colors duration-200",
        collapsed ? "justify-center px-2" : "px-3 justify-start", 
        "py-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        disabled && "pointer-events-none opacity-40",
        className
      )}
    >
      {icon && (
        <span className={cn(
          "flex items-center justify-center h-5 w-5", 
          collapsed ? "mx-auto" : "mr-2"
        )}>
          {icon}
        </span>
      )}
      {!collapsed && <span>{children}</span>}
    </button>
  )
}

/**
 * Props for the `SidebarMenu` component.
 * This component seems to be a simple wrapper for grouping menu items, similar to `SidebarGroup`
 * but without a title. Its distinct purpose or advantage over `SidebarGroup` without a title
 * is not immediately clear from its structure alone.
 */
interface SidebarMenuProps {
  /** Child elements, typically `SidebarMenuItem` or `SidebarMenuButton`. */
  children: React.ReactNode
  /** Optional additional CSS classes. */
  className?: string
}

/**
 * `SidebarMenu` appears to be a container for a list of menu items or buttons
 * within the sidebar. It primarily applies spacing to its children.
 *
 * @param {SidebarMenuProps} props - The props for SidebarMenu.
 * @returns {React.JSX.Element} A div container for menu items.
 */
export function SidebarMenu({ children, className }: SidebarMenuProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {children}
    </div>
  )
}

/**
 * Props for the `SidebarMenuItem` component.
 * This component is a simple div wrapper and might be intended for specific styling
 * or semantic grouping of content within a `SidebarMenu` or `SidebarGroup`.
 * Its distinct functionality compared to a plain `div` or `SidebarItem` (if not clickable)
 * is not fully apparent from its structure alone.
 */
interface SidebarMenuItemProps {
  /** Content of the menu item. */
  children: React.ReactNode
  /** Optional additional CSS classes. */
  className?: string
}

/**
 * `SidebarMenuItem` seems to be a simple wrapper for content within a `SidebarMenu`.
 * It doesn't have inherent interactivity like `SidebarItem`.
 *
 * @param {SidebarMenuItemProps} props - The props for SidebarMenuItem.
 * @returns {React.JSX.Element} A div container.
 */
export function SidebarMenuItem({ children, className }: SidebarMenuItemProps) {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  )
}

/**
 * Props for the `SidebarMenuButton` component.
 */
interface SidebarMenuButtonProps {
  /** The content of the button, typically text or an icon. Hidden when sidebar is collapsed. */
  children: React.ReactNode
  /** Optional additional CSS classes. */
  className?: string
  /** Optional click handler for the button. */
  onClick?: () => void
}

/**
 * `SidebarMenuButton` is a button component designed for use within a `SidebarMenu`.
 * It adapts to the sidebar's `collapsed` state by hiding its children (text/content)
 * when the sidebar is collapsed, potentially leaving only an icon visible if icons were
 * handled by its children or parent structure.
 *
 * @param {SidebarMenuButtonProps} props - The props for SidebarMenuButton.
 * @returns {React.JSX.Element} A button element.
 */
export function SidebarMenuButton({
  children,
  className,
  onClick
}: SidebarMenuButtonProps) {
  const { collapsed } = useSidebar()

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center rounded-md px-3 py-2",
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        "transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {!collapsed && children}
    </button>
  )
}

/**
 * Props for the `SidebarCollapseButton` component.
 */
interface SidebarCollapseButtonProps {
  /** The icon to display within the button (e.g., a chevron or menu icon). */
  icon?: React.ReactNode
  /** Optional additional CSS classes. */
  className?: string
}

/**
 * `SidebarCollapseButton` is a button specifically designed to toggle the
 * collapsed state of the sidebar. It uses the `useSidebar` hook to access
 * the `toggleCollapsed` function and the current `collapsed` state.
 *
 * Its detailed visual styling when collapsed (e.g., positioning, specific icon transformations)
 * is often influenced by the associated `sidebar.css` file.
 *
 * @param {SidebarCollapseButtonProps} props - The props for the SidebarCollapseButton.
 * @returns {React.JSX.Element} A button element to toggle sidebar collapse state.
 */
export function SidebarCollapseButton({
  icon,
  className
}: SidebarCollapseButtonProps) {
  const { toggleCollapsed, collapsed } = useSidebar()

  return (
    <button
      onClick={toggleCollapsed}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-200",
        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed && "mx-auto", // Center icon when collapsed
        className
      )}
    >
      <span className="sidebar-collapse-icon-wrapper">
        {icon}
      </span>
    </button>
  )
}
