/**
 * @fileoverview This file defines the RichTextEditor component, a custom client-side
 * rich text editing solution. It provides a WYSIWYG (What You See Is What You Get)
 * interface and an optional HTML code view. The editor includes a configurable toolbar
 * for various text formatting options, handles content sanitization, enforces a
 * maximum character length, displays word/character counts, and supports keyboard
 * shortcuts. It is designed to be a comprehensive text input component for applications
 * requiring rich text capabilities.
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { RichTextEditorProps, EditorState } from './types';
import { TOOLBAR_CONFIGS, KEYBOARD_SHORTCUTS, DEFAULT_STYLES } from './constants';
import { EditorUtils } from './utils';
import { Toolbar } from './Toolbar';

/**
 * `RichTextEditor` is a feature-rich client-side component for editing HTML content.
 * It provides a WYSIWYG interface, an optional HTML code view, a configurable toolbar,
 * content sanitization, character/word counting, maxLength enforcement, and keyboard shortcuts.
 *
 * **Props:**
 * The component accepts props defined in the `RichTextEditorProps` interface (imported from './types').
 * Key props include `value` (current HTML content), `onChange` (callback for content changes),
 * `placeholder`, `disabled`, `maxLength`, `showWordCount`, `toolbar` (config name), `height`,
 * `autoFocus`, `onFocus`, and `onBlur`.
 *
 * **State Management:**
 * - `editorState`: Tracks the current formatting state at the cursor/selection (e.g., bold, italic, font size)
 *   to update the `Toolbar`'s appearance.
 * - `showCodeView`: Boolean, toggles between the visual WYSIWYG editor and the HTML code view textarea.
 * - `codeValue`: String, stores the HTML content when `showCodeView` is true.
 * - `isFocused`: Boolean, indicates if either the visual editor or code editor currently has focus.
 * - `wordCount`: Number, displays the current word count of the content.
 * - `charCount`: Number, displays the current character count of the content.
 *
 * **Core Functionality:**
 * - **Refs**:
 *   - `editorRef`: Attached to the `contentEditable` div used as the WYSIWYG editing surface.
 *   - `codeEditorRef`: Attached to the `textarea` used for direct HTML code editing.
 *   - `updateTimeoutRef`: Stores the `NodeJS.Timeout` ID for debouncing `onChange` calls.
 *   - `savedSelectionRef`: Stores the browser's selection `Range` object when the editor loses focus,
 *     allowing selection to be restored before applying toolbar commands.
 * - **`updateEditorState`**: Called on selection changes or content updates in the visual editor.
 *   Uses `EditorUtils.getEditorState()` to query the document's command states (e.g., `bold`, `italic`)
 *   and current block type/font attributes at the selection.
 * - **`handleContentChange`**: Triggered by the `onInput` event of the visual editor.
 *   - Debounces the `onChange` prop call to avoid excessive updates.
 *   - Sanitizes the HTML content using `EditorUtils.sanitizeHTML()`.
 *   - Calculates word and character counts using `EditorUtils.htmlToText()`, `EditorUtils.countWords()`,
 *     and `EditorUtils.countCharacters()`.
 *   - Enforces `maxLength` based on character count of the text content.
 * - **`handleCommand`**: Called when a button on the `Toolbar` is clicked.
 *   - Restores saved selection if available.
 *   - Uses `EditorUtils` to execute browser `document.execCommand` actions (e.g., 'bold', 'italic', 'insertUnorderedList')
 *     or custom formatting functions like `formatHeading`, `applyFontSize`, etc.
 *   - Refocuses the editor and updates `editorState` and content after command execution.
 * - **`handleKeyDown`**: Implements keyboard shortcuts (defined in `KEYBOARD_SHORTCUTS`) by calling `handleCommand`.
 *   Also enforces `maxLength` during typing by preventing default action if limit is reached (excluding navigation/deletion keys).
 * - **`handlePaste`**: Intercepts paste events.
 *   - Sanitizes pasted HTML or converts pasted plain text to HTML.
 *   - Enforces `maxLength` by truncating pasted content if necessary.
 *   - Inserts the sanitized (and potentially truncated) content using `EditorUtils.insertHTML()`.
 * - **`handleFocus`, `handleBlur`**: Manage the `isFocused` state and call `onFocus`/`onBlur` props.
 *   `handleBlur` saves the current selection using `EditorUtils.saveSelection()`.
 * - **`toggleCodeView`**: Switches between the visual editor and the HTML code view.
 *   - When switching to code view, `codeValue` is set from the visual editor's `innerHTML`.
 *   - When switching to visual view, the `codeValue` (after sanitization) is set as `innerHTML` of the visual editor,
 *     and the `onChange` prop is called. Focus is managed accordingly.
 * - **`handleCodeChange`**: Updates `codeValue` and calls `onChange` (debounced) when the HTML code view textarea changes.
 *
 * **Initialization & Effects:**
 * - `useEffect` (on `value`, `showCodeView` change): Initializes the visual editor's content from the `value` prop
 *   when not in code view, and updates word/character counts.
 * - `useEffect` (on `autoFocus`, `showCodeView` change): Handles auto-focusing the visual editor.
 * - `useEffect` (on mount): Injects `DEFAULT_STYLES` (a string of CSS) into a `<style>` tag in the document's head
 *   to ensure consistent base styling for editor-generated content (e.g., blockquote, lists).
 *
 * **UI Structure:**
 * - The main layout consists of the `Toolbar`, the editor area (which switches between visual and code view),
 *   and a status bar.
 * - `AnimatePresence` and `motion.div` from `framer-motion` are used for a fade transition when switching
 *   between the visual editor and the HTML code view.
 * - A placeholder text is conditionally rendered in the visual editor if it's empty and not focused.
 * - The status bar conditionally displays word count, character count, and the `maxLength` limit if configured.
 * - An "HTML" / "Visual" toggle button is shown if the toolbar configuration includes advanced options.
 *
 * **Dependencies:**
 * - `Toolbar`: A separate component for rendering the editor's toolbar.
 * - `./constants`: Provides `TOOLBAR_CONFIGS` (defines different toolbar layouts), `KEYBOARD_SHORTCUTS`,
 *   and `DEFAULT_STYLES` (CSS string for basic content styling).
 * - `./utils`: Provides `EditorUtils` class with helper methods for commands, sanitization, state getting, etc.
 *
 * @param {RichTextEditorProps} props - The props for the RichTextEditor component.
 * @returns {React.JSX.Element} The rendered Rich Text Editor.
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  className,
  disabled = false,
  maxLength,
  showWordCount = false,
  toolbar = 'full',
  height = '300px',
  autoFocus = false,
  onFocus,
  onBlur
}) => {
  /** State tracking current formatting at the cursor/selection for toolbar UI. */
  const [editorState, setEditorState] = useState<EditorState>({
    canUndo: false,
    canRedo: false,
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    fontSize: '3',
    fontColor: '#000000',
    backgroundColor: 'transparent',
    alignment: 'left',
    currentTag: 'p',
  });

  /** State to toggle between WYSIWYG and HTML code view. */
  const [showCodeView, setShowCodeView] = useState(false);
  /** State holding the HTML string when in code view. */
  const [codeValue, setCodeValue] = useState(value);
  /** State to track if the editor (visual or code) has focus. */
  const [isFocused, setIsFocused] = useState(false);
  /** State for the current word count of the editor content. */
  const [wordCount, setWordCount] = useState(0);
  /** State for the current character count of the editor content. */
  const [charCount, setCharCount] = useState(0);

  /** Ref to the contentEditable div for the WYSIWYG editor. */
  const editorRef = useRef<HTMLDivElement>(null);
  /** Ref to the textarea for the HTML code view editor. */
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  /** Ref to store the timeout ID for debouncing content changes. */
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** Ref to store the user's selection range when the editor loses focus. */
  const savedSelectionRef = useRef<Range | null>(null);

  // Configuración de la barra de herramientas
  const toolbarConfig = TOOLBAR_CONFIGS[toolbar] || TOOLBAR_CONFIGS.full;

  // Actualizar el estado del editor
  const updateEditorState = useCallback(() => {
    if (showCodeView) return;
    
    try {
      const newState = EditorUtils.getEditorState();
      setEditorState(newState);
    } catch (error) {
      console.warn('Error updating editor state:', error);
    }
  }, [showCodeView]);

  // Manejar cambios en el contenido
  const handleContentChange = useCallback(() => {
    if (!editorRef.current || showCodeView) return;

    const content = editorRef.current.innerHTML;
    const sanitizedContent = EditorUtils.sanitizeHTML(content);
    
    // Actualizar contadores
    const textContent = EditorUtils.htmlToText(sanitizedContent);
    setWordCount(EditorUtils.countWords(textContent));
    setCharCount(EditorUtils.countCharacters(textContent));

    // Verificar límite de caracteres
    if (maxLength && textContent.length > maxLength) {
      return;
    }

    // Debounce para evitar actualizaciones excesivas
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      onChange(sanitizedContent);
      updateEditorState();
    }, 300);
  }, [onChange, maxLength, showCodeView, updateEditorState]);

  // Manejar comandos de la barra de herramientas
  const handleCommand = useCallback((command: string, value?: string) => {
    if (showCodeView) return;

    // Restaurar selección si existe
    if (savedSelectionRef.current) {
      EditorUtils.restoreSelection(savedSelectionRef.current);
    }

    // Ejecutar comando
    switch (command) {
      case 'formatBlock':
        EditorUtils.formatHeading(value || 'p');
        break;
      case 'fontSize':
        EditorUtils.applyFontSize(value || '3');
        break;
      case 'foreColor':
        EditorUtils.applyTextColor(value || '#000000');
        break;
      case 'backColor':
        EditorUtils.applyBackgroundColor(value || 'transparent');
        break;
      case 'removeFormat':
        EditorUtils.clearFormatting();
        break;
      default:
        EditorUtils.executeCommand({ command, value });
    }

    // Enfocar el editor y actualizar estado
    if (editorRef.current) {
      editorRef.current.focus();
    }
    
    updateEditorState();
    handleContentChange();
  }, [showCodeView, updateEditorState, handleContentChange]);

  // Manejar atajos de teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const key = `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`;
    const command = KEYBOARD_SHORTCUTS[key as keyof typeof KEYBOARD_SHORTCUTS];
    
    if (command) {
      e.preventDefault();
      handleCommand(command);
    }

    // Verificar límite de caracteres
    if (maxLength && !e.ctrlKey && !e.metaKey) {
      const textContent = EditorUtils.htmlToText(editorRef.current?.innerHTML || '');
      if (textContent.length >= maxLength && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
      }
    }
  }, [handleCommand, maxLength]);

  // Manejar pegado
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    
    let content = htmlData || EditorUtils.textToHTML(textData);
    content = EditorUtils.sanitizeHTML(content);
    
    // Verificar límite de caracteres
    if (maxLength) {
      const currentText = EditorUtils.htmlToText(editorRef.current?.innerHTML || '');
      const pasteText = EditorUtils.htmlToText(content);
      
      if (currentText.length + pasteText.length > maxLength) {
        const remainingChars = maxLength - currentText.length;
        const truncatedText = pasteText.substring(0, remainingChars);
        content = EditorUtils.textToHTML(truncatedText);
      }
    }
    
    EditorUtils.insertHTML(content);
    handleContentChange();
  }, [maxLength, handleContentChange]);

  // Manejar foco
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    updateEditorState();
    onFocus?.();
  }, [updateEditorState, onFocus]);

  // Manejar pérdida de foco
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    savedSelectionRef.current = EditorUtils.saveSelection();
    onBlur?.();
  }, [onBlur]);

  // Alternar vista de código
  const toggleCodeView = useCallback(() => {
    if (showCodeView) {
      // Cambiar de código a visual
      const sanitizedHTML = EditorUtils.sanitizeHTML(codeValue);
      if (editorRef.current) {
        editorRef.current.innerHTML = sanitizedHTML;
      }
      onChange(sanitizedHTML);
      setShowCodeView(false);
      
      // Enfocar el editor visual
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 100);
    } else {
      // Cambiar de visual a código
      const currentHTML = editorRef.current?.innerHTML || '';
      setCodeValue(currentHTML);
      setShowCodeView(true);
      
      // Enfocar el editor de código
      setTimeout(() => {
        if (codeEditorRef.current) {
          codeEditorRef.current.focus();
        }
      }, 100);
    }
  }, [showCodeView, codeValue, onChange]);

  // Manejar cambios en el editor de código
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCodeValue(newValue);
    
    // Debounce para evitar actualizaciones excesivas
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  }, [onChange]);

  // Inicializar contenido
  useEffect(() => {
    if (editorRef.current && !showCodeView) {
      editorRef.current.innerHTML = value;
      
      // Actualizar contadores
      const textContent = EditorUtils.htmlToText(value);
      setWordCount(EditorUtils.countWords(textContent));
      setCharCount(EditorUtils.countCharacters(textContent));
    }
  }, [value, showCodeView]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && editorRef.current && !showCodeView) {
      editorRef.current.focus();
    }
  }, [autoFocus, showCodeView]);

  // Limpiar timeouts
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Inyectar estilos CSS
  useEffect(() => {
    const styleId = 'rich-text-editor-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = DEFAULT_STYLES;
      document.head.appendChild(styleElement);
    }
    
    return () => {
      // No remover estilos al desmontar para evitar parpadeos
    };
  }, []);

  return (
    <div className={cn("rich-text-editor border border-gray-300 rounded-lg overflow-hidden bg-white", className)}>
      {/* Barra de herramientas */}
      <Toolbar
        config={toolbarConfig}
        editorState={editorState}
        onCommand={handleCommand}
        onStateChange={updateEditorState}
        disabled={disabled}
      />

      {/* Área de edición */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {showCodeView ? (
            // Editor de código HTML
            <motion.div
              key="code-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <textarea
                ref={codeEditorRef}
                value={codeValue}
                onChange={handleCodeChange}
                disabled={disabled}
                placeholder="Código HTML..."
                className={cn(
                  "w-full p-3 font-mono text-sm border-0 resize-none focus:outline-none",
                  "bg-gray-50 text-gray-800"
                )}
                style={{ height }}
                spellCheck={false}
              />
            </motion.div>
          ) : (
            // Editor visual
            <motion.div
              key="visual-editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div
                ref={editorRef}
                contentEditable={!disabled}
                suppressContentEditableWarning
                onInput={handleContentChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className={cn(
                  "rich-text-editor-content focus:outline-none",
                  disabled && "opacity-50 cursor-not-allowed",
                  isFocused && "ring-2 ring-blue-500 ring-opacity-20"
                )}
                style={{ 
                  height,
                  minHeight: height 
                }}
                data-placeholder={placeholder}
              />
              
              {/* Placeholder personalizado */}
              {!value && !isFocused && (
                <div 
                  className="absolute top-3 left-3 text-gray-400 pointer-events-none select-none"
                  style={{ fontSize: '16px' }}
                >
                  {placeholder}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Barra de estado */}
      {(showWordCount || maxLength) && (
        <div className="flex justify-between items-center px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
          <div className="flex space-x-4">
            {showWordCount && (
              <>
                <span>{wordCount} palabras</span>
                <span>{charCount} caracteres</span>
              </>
            )}
          </div>
          
          {maxLength && (
            <div className={cn(
              "font-medium",
              charCount > maxLength * 0.9 && "text-orange-600",
              charCount >= maxLength && "text-red-600"
            )}>
              {charCount}/{maxLength}
            </div>
          )}
        </div>
      )}

      {/* Botón para alternar vista de código */}
      {toolbarConfig.advanced && (
        <button
          onClick={toggleCodeView}
          disabled={disabled}
          className={cn(
            "absolute top-2 right-2 p-1 rounded text-xs bg-white border border-gray-300 hover:bg-gray-50 transition-colors",
            showCodeView && "bg-blue-100 text-blue-600 border-blue-300"
          )}
          title={showCodeView ? "Vista visual" : "Vista código"}
        >
          {showCodeView ? "Visual" : "HTML"}
        </button>
      )}
    </div>
  );
};

export default RichTextEditor; 