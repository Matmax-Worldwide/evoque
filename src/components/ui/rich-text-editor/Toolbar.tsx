/**
 * @fileoverview This file defines the Toolbar component for the RichTextEditor.
 * It provides a configurable set of UI controls (buttons, dropdowns) for applying
 * various text formatting commands, managing links, and toggling editor views.
 * The toolbar's appearance and available options are determined by a `ToolbarConfig` prop.
 * It interacts with the main RichTextEditor via `editorState` (to reflect current
 * selection state) and `onCommand` (to execute formatting actions).
 * Animations are used for dropdowns and pickers via `framer-motion`.
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link, Unlink, Undo, Redo, Type, Palette, Highlighter,
  Code, RotateCcw, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolbarConfig, EditorState, LinkData } from './types'; // Assumed documented in types.ts
import { FONT_SIZES, HEADING_TYPES, COLOR_PALETTES, BACKGROUND_COLORS } from './constants';
import { EditorUtils } from './utils';

/**
 * Props for the main Toolbar component.
 * `ToolbarConfig` and `EditorState` types are imported from './types'.
 */
interface ToolbarProps {
  /** Configuration object defining which toolbar groups and buttons are visible. */
  config: ToolbarConfig;
  /** Current state of the editor (e.g., isBold, currentTag) to reflect in toolbar UI. */
  editorState: EditorState;
  /** Callback function to execute a formatting command in the editor. */
  onCommand: (command: string, value?: string) => void;
  /** Callback function to trigger an update of the editor state, usually after a command. */
  onStateChange: () => void;
  /** If true, all toolbar controls are disabled. */
  disabled?: boolean;
  /** Optional additional CSS classes for the toolbar container. */
  className?: string;
}

/**
 * Props for the internal ColorPicker component.
 */
interface ColorPickerProps {
  /** Array of color strings (hex, rgb, etc.) to display as selectable swatches. */
  colors: string[];
  /** The currently selected color, to highlight it in the picker. */
  selectedColor: string;
  /** Callback function triggered when a color is selected. */
  onColorSelect: (color: string) => void;
  /** Title displayed above the color swatches (e.g., "Color de texto"). */
  title: string;
}

/**
 * Props for the internal LinkModal component.
 * `LinkData` type is imported from './types'.
 */
interface LinkModalProps {
  /** If true, the modal is visible. */
  isOpen: boolean;
  /** Callback function to close the modal. */
  onClose: () => void;
  /** Callback function when the link form is submitted. */
  onSubmit: (linkData: LinkData) => void;
  /** Optional initial data to pre-fill the link form (e.g., when editing an existing link). */
  initialData?: Partial<LinkData>;
}

/**
 * `ColorPicker` is an internal component used within the `Toolbar` to display a grid
 * of selectable color swatches for text or background color.
 * It uses `framer-motion` for a simple appearance animation.
 *
 * @param {ColorPickerProps} props - The props for the ColorPicker.
 * @returns {React.JSX.Element} A dropdown-like panel with color swatches.
 * @internal
 */
const ColorPicker: React.FC<ColorPickerProps> = ({ colors, selectedColor, onColorSelect, title }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full left-0 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]"
    >
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="grid grid-cols-6 gap-1">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorSelect(color)}
            className={cn(
              "w-6 h-6 rounded border-2 transition-all hover:scale-110",
              selectedColor === color ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
            )}
            style={{ backgroundColor: color === 'transparent' ? '#ffffff' : color }}
            title={color}
          >
            {color === 'transparent' && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-3 h-0.5 bg-red-500 rotate-45"></div>
              </div>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * `LinkModal` is an internal component used by the `Toolbar` to provide a form
 * for inserting or editing hyperlinks. It appears as a modal dialog.
 * It manages its own form state for URL, link text, and target (`_blank` or `_self`).
 * Uses `framer-motion` for appearance animation.
 *
 * @param {LinkModalProps} props - The props for the LinkModal.
 * @returns {React.JSX.Element | null} The rendered modal form, or null if `isOpen` is false.
 * @internal
 */
const LinkModal: React.FC<LinkModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [linkData, setLinkData] = useState<LinkData>({
    url: initialData?.url || '',
    text: initialData?.text || '',
    target: initialData?.target || '_blank'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkData.url.trim()) {
      onSubmit(linkData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
      >
        <h3 className="text-lg font-semibold mb-4">Insertar Enlace</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL
            </label>
            <input
              type="url"
              value={linkData.url}
              onChange={(e) => setLinkData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://ejemplo.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texto del enlace (opcional)
            </label>
            <input
              type="text"
              value={linkData.text}
              onChange={(e) => setLinkData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Texto que se mostrará"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={linkData.target === '_blank'}
                onChange={(e) => setLinkData(prev => ({ 
                  ...prev, 
                  target: e.target.checked ? '_blank' : '_self' 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Abrir en nueva ventana</span>
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Insertar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, active, disabled, title, children, className }) => (
  /**
   * `ToolbarButton` is a generic internal button component used within the `Toolbar`.
   * It standardizes the appearance and behavior of toolbar buttons, including active states
   * and disabled states.
   *
   * @param {object} props - Component props.
   * @param {() => void} props.onClick - Callback for when the button is clicked.
   * @param {boolean} [props.active] - If true, applies active styling.
   * @param {boolean} [props.disabled] - If true, applies disabled styling and behavior.
   * @param {string} props.title - Tooltip text for the button.
   * @param {React.ReactNode} props.children - Typically the icon for the button.
   * @param {string} [props.className] - Optional additional CSS classes.
   * @returns {React.JSX.Element} A styled button element.
   * @internal
   */
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "p-2 rounded-md transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed",
      active && "bg-blue-100 text-blue-600 hover:bg-blue-200",
      className
    )}
  >
    {children}
  </button>
);

const ToolbarDropdown: React.FC<{
  trigger: React.ReactNode;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}> = ({ trigger, children, title, disabled }) => {
  /**
   * `ToolbarDropdown` is an internal component that creates a dropdown menu within the `Toolbar`.
   * It takes a `trigger` element (e.g., text with an icon) and `children` (the dropdown content).
   * Manages its open/closed state and closes when a click occurs outside of it.
   * Uses `framer-motion` for appearance animation of the dropdown panel.
   *
   * @param {object} props - Component props.
   * @param {React.ReactNode} props.trigger - The element that toggles the dropdown.
   * @param {React.ReactNode} props.children - The content to display within the dropdown panel.
   * @param {string} props.title - Tooltip text for the dropdown trigger button.
   * @param {boolean} [props.disabled] - If true, the dropdown trigger is disabled.
   * @returns {React.JSX.Element} A dropdown component with a trigger and animated panel.
   * @internal
   */
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        title={title}
        className={cn(
          "p-2 rounded-md transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1",
          isOpen && "bg-gray-100"
        )}
      >
        {trigger}
        <ChevronDown className="w-3 h-3" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Toolbar: React.FC<ToolbarProps> = ({
  config,
  editorState,
  onCommand,
  onStateChange,
  disabled = false,
  className
}) => {
  /**
 * `Toolbar` is the main component that renders the rich text editor's toolbar.
 * It dynamically generates groups of formatting controls (buttons and dropdowns)
 * based on the `config` prop. The active state of these controls is determined
 * by the `editorState` prop. When a control is interacted with, it calls the
 * `onCommand` prop to execute the corresponding formatting action in the parent
 * `RichTextEditor`, and then `onStateChange` to refresh the editor state.
 *
 * **Functionality:**
 * - **Dynamic Control Rendering**: Iterates through the `config` object (e.g., `config.headings`,
 *   `config.formatting`, `config.colors`) to conditionally render groups of toolbar elements.
 *   Uses internal components like `ToolbarButton` and `ToolbarDropdown`.
 * - **State Reflection**: Uses the `editorState` prop (e.g., `editorState.isBold`, `editorState.currentTag`)
 *   to visually indicate the active formatting state of the current selection (e.g., highlighting
 *   the "Bold" button if the selected text is bold).
 * - **Command Execution**: When a button or dropdown item is clicked, it calls the `handleCommand`
 *   internal function, which in turn calls the `onCommand` and `onStateChange` props passed
 *   from the `RichTextEditor`. This decouples the toolbar from direct editor manipulation.
 * - **Special Controls**:
 *   - **Color Pickers**: Manages visibility of `ColorPicker` components for text and background
 *     colors via `showTextColorPicker` and `showBgColorPicker` states.
 *   - **Link Modal**: Manages visibility of the `LinkModal` for inserting/editing hyperlinks
 *     via the `showLinkModal` state. The `handleLinkSubmit` function processes data from the modal.
 *   - **Code View Toggle**: A button to toggle the HTML code view is rendered if `config.advanced` is true.
 *     Its active state is managed by the local `showCodeView` state, which should ideally be
 *     synchronized with the parent `RichTextEditor`'s code view state (though direct management
 *     of parent's `showCodeView` isn't done here; it relies on `onCommand('toggleCodeView')`).
 * - **Dependencies**: Uses `HEADING_TYPES`, `FONT_SIZES`, `COLOR_PALETTES`, `BACKGROUND_COLORS`
 *   from `./constants` to populate dropdowns and color pickers. Icons are from `lucide-react`.
 *   Animations for dropdowns and pickers use `framer-motion`.
 *
 * @param {ToolbarProps} props - Props for the Toolbar component.
 * @returns {React.JSX.Element} The rendered toolbar UI.
 */
  /** State to control visibility of the text color picker dropdown. */
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  /** State to control visibility of the background color picker dropdown. */
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  /** State to control visibility of the link insertion modal. */
  const [showLinkModal, setShowLinkModal] = useState(false);
  /**
   * State to reflect if the editor is in code view. This is primarily used to set the
   * active state of the "View Code" toggle button. The actual toggling logic
   * is handled by the parent `RichTextEditor` via the `onCommand` prop.
   */
  const [showCodeView, setShowCodeView] = useState(false); // This seems to be for button state, actual toggle via onCommand

  const textColorRef = useRef<HTMLDivElement>(null);
  const bgColorRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textColorRef.current && !textColorRef.current.contains(event.target as Node)) {
        setShowTextColorPicker(false);
      }
      if (bgColorRef.current && !bgColorRef.current.contains(event.target as Node)) {
        setShowBgColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCommand = (command: string, value?: string) => {
    onCommand(command, value);
    onStateChange();
  };

  const handleLinkSubmit = (linkData: LinkData) => {
    EditorUtils.insertLink(linkData.url, linkData.text);
    onStateChange();
  };

  const allTextColors = COLOR_PALETTES.flatMap(palette => palette.colors);

  return (
    <>
      <div className={cn(
        "flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200 rounded-t-lg",
        className
      )}>
        {/* Deshacer/Rehacer */}
        {config.advanced && (
          <>
            <ToolbarButton
              onClick={() => handleCommand('undo')}
              disabled={disabled || !editorState.canUndo}
              title="Deshacer (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => handleCommand('redo')}
              disabled={disabled || !editorState.canRedo}
              title="Rehacer (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
          </>
        )}

        {/* Encabezados */}
        {config.headings && (
          <>
            <ToolbarDropdown
              trigger={
                <div className="flex items-center">
                  <Type className="w-4 h-4" />
                  <span className="ml-1 text-sm">
                    {HEADING_TYPES.find(h => h.tag === editorState.currentTag)?.label || 'Párrafo'}
                  </span>
                </div>
              }
              title="Tipo de texto"
              disabled={disabled}
            >
              <div className="py-1">
                {HEADING_TYPES.map((heading) => (
                  <button
                    key={heading.tag}
                    onClick={() => {
                      handleCommand('formatBlock', heading.tag);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors",
                      editorState.currentTag === heading.tag && "bg-blue-100 text-blue-600"
                    )}
                  >
                    <span className={heading.className}>{heading.label}</span>
                  </button>
                ))}
              </div>
            </ToolbarDropdown>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
          </>
        )}

        {/* Tamaño de fuente */}
        {config.fontSize && (
          <>
            <ToolbarDropdown
              trigger={
                <div className="flex items-center">
                  <span className="text-sm">
                    {FONT_SIZES.find(f => f.value === editorState.fontSize)?.label || '16px'}
                  </span>
                </div>
              }
              title="Tamaño de fuente"
              disabled={disabled}
            >
              <div className="py-1 max-h-48 overflow-y-auto">
                {FONT_SIZES.map((fontSize) => (
                  <button
                    key={fontSize.value}
                    onClick={() => {
                      handleCommand('fontSize', fontSize.value);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors",
                      editorState.fontSize === fontSize.value && "bg-blue-100 text-blue-600"
                    )}
                  >
                    <span style={{ fontSize: `${Math.min(fontSize.pixels, 18)}px` }}>
                      {fontSize.label}
                    </span>
                  </button>
                ))}
              </div>
            </ToolbarDropdown>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
          </>
        )}

        {/* Formato de texto */}
        {config.formatting && (
          <>
            <ToolbarButton
              onClick={() => handleCommand('bold')}
              active={editorState.isBold}
              disabled={disabled}
              title="Negrita (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => handleCommand('italic')}
              active={editorState.isItalic}
              disabled={disabled}
              title="Cursiva (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => handleCommand('underline')}
              active={editorState.isUnderline}
              disabled={disabled}
              title="Subrayado (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => handleCommand('strikethrough')}
              active={editorState.isStrikethrough}
              disabled={disabled}
              title="Tachado"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
          </>
        )}

        {/* Colores */}
        {config.colors && (
          <>
            <div className="relative" ref={textColorRef}>
              <ToolbarButton
                onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                disabled={disabled}
                title="Color de texto"
              >
                <div className="flex flex-col items-center">
                  <Palette className="w-4 h-4" />
                  <div 
                    className="w-4 h-1 mt-0.5 border border-gray-300"
                    style={{ backgroundColor: editorState.fontColor }}
                  />
                </div>
              </ToolbarButton>
              
              <AnimatePresence>
                {showTextColorPicker && (
                  <ColorPicker
                    colors={allTextColors}
                    selectedColor={editorState.fontColor}
                    onColorSelect={(color) => {
                      handleCommand('foreColor', color);
                      setShowTextColorPicker(false);
                    }}
                    title="Color de texto"
                  />
                )}
              </AnimatePresence>
            </div>
            
            <div className="relative" ref={bgColorRef}>
              <ToolbarButton
                onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                disabled={disabled}
                title="Color de fondo"
              >
                <div className="flex flex-col items-center">
                  <Highlighter className="w-4 h-4" />
                  <div 
                    className="w-4 h-1 mt-0.5 border border-gray-300"
                    style={{ backgroundColor: editorState.backgroundColor === 'transparent' ? '#ffffff' : editorState.backgroundColor }}
                  />
                </div>
              </ToolbarButton>
              
              <AnimatePresence>
                {showBgColorPicker && (
                  <ColorPicker
                    colors={BACKGROUND_COLORS}
                    selectedColor={editorState.backgroundColor}
                    onColorSelect={(color) => {
                      handleCommand('backColor', color);
                      setShowBgColorPicker(false);
                    }}
                    title="Color de fondo"
                  />
                )}
              </AnimatePresence>
            </div>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
          </>
        )}

        {/* Alineación */}
        {config.alignment && (
          <>
            <ToolbarButton
              onClick={() => handleCommand('justifyLeft')}
              active={editorState.alignment === 'left'}
              disabled={disabled}
              title="Alinear a la izquierda (Ctrl+L)"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => handleCommand('justifyCenter')}
              active={editorState.alignment === 'center'}
              disabled={disabled}
              title="Centrar (Ctrl+E)"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => handleCommand('justifyRight')}
              active={editorState.alignment === 'right'}
              disabled={disabled}
              title="Alinear a la derecha (Ctrl+R)"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => handleCommand('justifyFull')}
              active={editorState.alignment === 'justify'}
              disabled={disabled}
              title="Justificar (Ctrl+J)"
            >
              <AlignJustify className="w-4 h-4" />
            </ToolbarButton>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
          </>
        )}

        {/* Listas */}
        {config.lists && (
          <>
            <ToolbarButton
              onClick={() => handleCommand('insertUnorderedList')}
              disabled={disabled}
              title="Lista con viñetas"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => handleCommand('insertOrderedList')}
              disabled={disabled}
              title="Lista numerada"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
          </>
        )}

        {/* Enlaces */}
        {config.links && (
          <>
            <ToolbarButton
              onClick={() => setShowLinkModal(true)}
              disabled={disabled}
              title="Insertar enlace"
            >
              <Link className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => handleCommand('unlink')}
              disabled={disabled}
              title="Quitar enlace"
            >
              <Unlink className="w-4 h-4" />
            </ToolbarButton>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
          </>
        )}

        {/* Funciones avanzadas */}
        {config.advanced && (
          <>
            <ToolbarButton
              onClick={() => handleCommand('removeFormat')}
              disabled={disabled}
              title="Limpiar formato"
            >
              <RotateCcw className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => setShowCodeView(!showCodeView)}
              active={showCodeView}
              disabled={disabled}
              title="Ver código HTML"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Modal de enlace */}
      <AnimatePresence>
        {showLinkModal && (
          <LinkModal
            isOpen={showLinkModal}
            onClose={() => setShowLinkModal(false)}
            onSubmit={handleLinkSubmit}
          />
        )}
      </AnimatePresence>
    </>
  );
}; 