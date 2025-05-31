/**
 * @fileoverview This file defines and exports TypeScript types and interfaces
 * used by the RichTextEditor component and its associated sub-components like
 * the Toolbar. These types help ensure data consistency and provide clear
 * contracts for component props and state.
 */

/**
 * Defines the props for the main RichTextEditor component.
 */
export interface RichTextEditorProps {
  /** The current HTML content of the editor. */
  value: string;
  /** Callback function triggered when the editor's content changes. Receives the new HTML content as a string. */
  onChange: (html: string) => void;
  /** Optional placeholder text to display when the editor is empty. */
  placeholder?: string;
  /** Optional CSS class name to apply to the root editor container. */
  className?: string;
  /** If true, the editor is disabled and content cannot be modified. */
  disabled?: boolean;
  /** Optional maximum number of characters allowed in the editor (based on plain text conversion). */
  maxLength?: number;
  /** If true, displays word and character counts in the status bar. */
  showWordCount?: boolean;
  /**
   * Specifies which toolbar configuration to use.
   * Maps to keys in `TOOLBAR_CONFIGS` (e.g., 'full', 'basic', 'minimal').
   * Defaults to 'full' if not provided or if the key is invalid.
   */
  toolbar?: 'full' | 'basic' | 'minimal';
  /**
   * Optional CSS height string for the editor area (e.g., '300px', '50vh').
   * Defaults to '300px'.
   */
  height?: string;
  /** If true, the editor will attempt to focus itself on initial render. */
  autoFocus?: boolean;
  /** Optional callback function triggered when the editor gains focus. */
  onFocus?: () => void;
  /** Optional callback function triggered when the editor loses focus. */
  onBlur?: () => void;
}

/**
 * Defines the structure for a toolbar configuration object.
 * Each boolean property determines if a specific group of formatting
 * controls is visible on the toolbar.
 */
export interface ToolbarConfig {
  /** If true, basic text formatting buttons (bold, italic, underline, strikethrough) are shown. */
  formatting: boolean;
  /** If true, the heading level selection dropdown is shown. */
  headings: boolean;
  /** If true, the font size selection dropdown is shown. */
  fontSize: boolean;
  /** If true, text color and background color pickers are shown. */
  colors: boolean;
  /** If true, text alignment buttons (left, center, right, justify) are shown. */
  alignment: boolean;
  /** If true, list formatting buttons (ordered, unordered) are shown. */
  lists: boolean;
  /** If true, link insertion and removal buttons are shown. */
  links: boolean;
  /** If true, advanced controls like undo, redo, clear formatting, and code view toggle are shown. */
  advanced: boolean;
}

/**
 * Defines the structure for a font size option in the toolbar dropdown.
 */
export interface FontSize {
  /** The text label displayed for the font size (e.g., "16px"). */
  label: string;
  /**
   * The value passed to the editor command for font size.
   * Historically, these were numbers '1' through '7' for `<font size="...">`.
   */
  value: string;
  /** The actual pixel size corresponding to the font size option. */
  pixels: number;
}

/**
 * Defines the structure for a heading type/block format option in the toolbar dropdown.
 */
export interface HeadingType {
  /** The HTML tag for the heading or block type (e.g., 'p', 'h1', 'h2'). */
  tag: string;
  /** The display label for the heading type (e.g., "Párrafo", "Título 1"). */
  label: string;
  /** CSS class name (likely Tailwind) associated with this heading type for styling previews or application. */
  className: string;
}

/**
 * Defines the structure for a color palette used in color pickers.
 */
export interface ColorPalette {
  /** The display label for the color palette group (e.g., "Colores básicos"). */
  label: string;
  /** An array of color strings (e.g., hex codes) included in this palette. */
  colors: string[];
}

/**
 * Defines the structure for an editor command object, typically used internally
 * for mapping toolbar actions or keyboard shortcuts to `document.execCommand` parameters.
 * @deprecated This interface might not be directly used by external consumers if commands are opaque.
 */
export interface EditorCommand {
  /** The command name (e.g., 'bold', 'insertUnorderedList'). */
  command: string;
  /** Optional value for commands that require one (e.g., 'fontSize' needs a size value). */
  value?: string;
  /** If true, indicates the command might require a UI for value input (not directly used by execCommand). */
  showUI?: boolean;
}

/**
 * Defines the structure for data related to inserting or editing a hyperlink.
 */
export interface LinkData {
  /** The URL of the hyperlink. */
  url: string;
  /** The display text for the hyperlink. If empty, the URL itself might be used. */
  text: string;
  /** Specifies where to open the linked document (e.g., '_blank' for a new tab). */
  target: '_blank' | '_self';
}

/**
 * Defines the structure for the editor's current formatting state.
 * This is used to update the visual state of toolbar buttons (e.g., to show
 * if the current selection is bold).
 */
export interface EditorState {
  /** True if an undo operation can be performed. */
  canUndo: boolean;
  /** True if a redo operation can be performed. */
  canRedo: boolean;
  /** True if the current selection or cursor position is bold. */
  isBold: boolean;
  /** True if the current selection or cursor position is italic. */
  isItalic: boolean;
  /** True if the current selection or cursor position is underlined. */
  isUnderline: boolean;
  /** True if the current selection or cursor position is strikethrough. */
  isStrikethrough: boolean;
  /** The current font size value (typically '1'-'7') at the cursor/selection. */
  fontSize: string;
  /** The current text color (hex or rgb string) at the cursor/selection. */
  fontColor: string;
  /** The current background color (hex or rgb string, or 'transparent') at the cursor/selection. */
  backgroundColor: string;
  /** The current text alignment ('left', 'center', 'right', 'justify') at the cursor/selection. */
  alignment: string;
  /** The HTML tag name of the current block element at the cursor/selection (e.g., 'p', 'h1'). */
  currentTag: string;
}

/**
 * A string literal union type representing the valid names for toolbar groups/sections.
 * These keys are used in `ToolbarConfig` to determine which groups of controls are visible.
 */
export type ToolbarGroup = 
  | 'formatting' 
  | 'headings' 
  | 'fontSize' 
  | 'colors' 
  | 'alignment' 
  | 'lists' 
  | 'links' 
  | 'advanced'; 