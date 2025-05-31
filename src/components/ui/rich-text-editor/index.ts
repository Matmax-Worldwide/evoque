/**
 * @fileoverview This file serves as a barrel file for the RichTextEditor module.
 * It re-exports the main `RichTextEditor` component, the `Toolbar` component,
 * associated TypeScript types (like `RichTextEditorProps`, `ToolbarConfig`, `EditorState`),
 * utility functions (`EditorUtils`), and various constants (e.g., `FONT_SIZES`,
 * `TOOLBAR_CONFIGS`, `KEYBOARD_SHORTCUTS`, `DEFAULT_STYLES`).
 *
 * This provides a single, convenient entry point for importing all necessary
 * elements related to the RichTextEditor from other parts of the application.
 */
// Componente principal
export { default as RichTextEditor } from './RichTextEditor';
export { RichTextEditor as default } from './RichTextEditor';

// Componentes auxiliares
export { Toolbar } from './Toolbar';

// Tipos
export type {
  RichTextEditorProps,
  ToolbarConfig,
  FontSize,
  HeadingType,
  ColorPalette,
  EditorCommand,
  LinkData,
  EditorState,
  ToolbarGroup
} from './types';

// Utilidades
export { EditorUtils } from './utils';

// Constantes
export {
  FONT_SIZES,
  HEADING_TYPES,
  COLOR_PALETTES,
  BACKGROUND_COLORS,
  TOOLBAR_CONFIGS,
  KEYBOARD_SHORTCUTS,
  DEFAULT_STYLES
} from './constants'; 