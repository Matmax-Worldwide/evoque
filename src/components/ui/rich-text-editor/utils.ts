/**
 * @fileoverview This file provides the `EditorUtils` class, a collection of
 * static utility methods for interacting with the browser's contentEditable features,
 * the Selection API, and `document.execCommand`. These utilities are designed to
 * support the functionality of the `RichTextEditor` component.
 */
import { EditorCommand, EditorState } from './types';

/**
 * `EditorUtils` is a class containing static methods to abstract and manage
 * common operations required for a rich text editor, such as executing commands,
 * querying editor state, sanitizing HTML, and managing selection.
 */
export class EditorUtils {
  /**
   * Executes a browser `document.execCommand`.
   * @param {EditorCommand} command - An object containing the command name,
   *                                  optional UI flag, and optional value.
   * @returns {boolean} True if the command was successfully executed, false otherwise.
   */
  static executeCommand(command: EditorCommand): boolean {
    try {
      return document.execCommand(command.command, command.showUI || false, command.value);
    } catch (error) {
      console.error('Error executing editor command:', error);
      return false;
    }
  }

  /**
   * Gets the current formatting state of the selection within the editor.
   * Queries the document for various command states (bold, italic, etc.) and values
   * (fontSize, foreColor, backColor) as well as current alignment and block tag.
   * @returns {EditorState} An object representing the current editor state.
   */
  static getEditorState(): EditorState {
    return {
      canUndo: document.queryCommandEnabled('undo'),
      canRedo: document.queryCommandEnabled('redo'),
      isBold: document.queryCommandState('bold'),
      isItalic: document.queryCommandState('italic'),
      isUnderline: document.queryCommandState('underline'),
      isStrikethrough: document.queryCommandState('strikethrough'),
      fontSize: document.queryCommandValue('fontSize') || '3', // '3' is often the default for <p>
      fontColor: document.queryCommandValue('foreColor') || '#000000',
      backgroundColor: document.queryCommandValue('backColor') || 'transparent',
      alignment: this.getCurrentAlignment(),
      currentTag: this.getCurrentTag(),
    };
  }

  /**
   * Determines the current text alignment of the selection.
   * @private
   * @returns {string} The current alignment ('left', 'center', 'right', 'justify'), defaults to 'left'.
   */
  private static getCurrentAlignment(): string {
    if (document.queryCommandState('justifyLeft')) return 'left';
    if (document.queryCommandState('justifyCenter')) return 'center';
    if (document.queryCommandState('justifyRight')) return 'right';
    if (document.queryCommandState('justifyFull')) return 'justify';
    return 'left'; // Default alignment
  }

  /**
   * Determines the HTML tag name of the current block element containing the selection.
   * Traverses up the DOM tree from the common ancestor of the selection.
   * @private
   * @returns {string} The tag name (e.g., 'p', 'h1'), defaults to 'p'.
   */
  private static getCurrentTag(): string {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 'p';
    
    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    
    // If the common ancestor is a text node, get its parent element
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement!;
    }
    
    // Traverse up to find the nearest block-level element recognized by the editor
    while (element && element !== document.body) {
      const tagName = (element as Element).tagName?.toLowerCase();
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'div', 'blockquote', 'pre'].includes(tagName)) {
        return tagName === 'div' ? 'p' : tagName; // Treat 'div' as 'p' for simplicity in state
      }
      element = element.parentElement!;
    }
    
    return 'p'; // Default tag
  }

  /**
   * Inserts HTML content at the current cursor position or replaces the current selection.
   * @param {string} html - The HTML string to insert.
   */
  static insertHTML(html: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    range.deleteContents(); // Delete any selected content

    // Create a temporary div to parse the HTML string
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Create a document fragment to hold the parsed nodes
    const fragment = document.createDocumentFragment();
    let node;
    while ((node = div.firstChild)) {
      fragment.appendChild(node);
    }
    
    range.insertNode(fragment);
    
    // Move the cursor to the end of the inserted content
    range.collapse(false); // false to collapse to the end of the range
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Gets the currently selected text as a plain string.
   * @returns {string} The selected text, or an empty string if no selection.
   */
  static getSelectedText(): string {
    const selection = window.getSelection();
    return selection ? selection.toString() : '';
  }

  /**
   * Selects all content within a given HTML element.
   * @param {HTMLElement} element - The HTML element whose content is to be selected.
   */
  static selectAll(element: HTMLElement): void {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  /**
   * Clears all formatting (bold, italic, links, etc.) from the current selection.
   */
  static clearFormatting(): void {
    this.executeCommand({ command: 'removeFormat' });
    this.executeCommand({ command: 'unlink' }); // Explicitly remove links as removeFormat might not cover it
  }

  /**
   * Inserts or modifies a hyperlink. If text is selected, it wraps the selection
   * with the link. If no text is selected, it inserts the link with provided text or URL as text.
   * @param {string} url - The URL for the hyperlink.
   * @param {string} [text] - Optional display text for the link. If not provided and text is selected,
   *                          the selected text is used. If no text selected and no text provided, URL is used.
   */
  static insertLink(url: string, text?: string): void {
    const selectedText = this.getSelectedText();
    const linkText = text || selectedText || url;
    
    if (selectedText) {
      // If text is selected, execCommand 'createLink' is usually preferred
      // as it correctly handles replacing the selection with the link.
      this.executeCommand({ command: 'createLink', value: url });
      // Note: Some browsers might not use linkText with createLink if text is selected.
      // Forcing linkText might require more complex DOM manipulation if createLink is insufficient.
    } else {
      // If no text is selected, insert the link as HTML
      const linkHTML = `<a href="${url}" target="_blank">${linkText}</a>`; // Default to target="_blank"
      this.insertHTML(linkHTML);
    }
  }

  /**
   * Removes any hyperlink from the current selection.
   */
  static removeLink(): void {
    this.executeCommand({ command: 'unlink' });
  }

  /**
   * Formats the current selection or the block containing the cursor as a heading
   * or paragraph, using `document.execCommand('formatBlock')`.
   * @param {string} tag - The HTML tag to apply (e.g., 'h1', 'p').
   */
  static formatHeading(tag: string): void {
    this.executeCommand({ command: 'formatBlock', value: tag });
  }

  /**
   * Applies the specified text color to the current selection.
   * @param {string} color - The CSS color value (e.g., hex, rgb).
   */
  static applyTextColor(color: string): void {
    this.executeCommand({ command: 'foreColor', value: color });
  }

  /**
   * Applies the specified background color to the current selection.
   * If 'transparent' is passed, it attempts to remove background color by using 'removeFormat'.
   * @param {string} color - The CSS color value (e.g., hex, rgb, 'transparent').
   */
  static applyBackgroundColor(color: string): void {
    if (color === 'transparent') {
      // Attempt to remove background color. 'removeFormat' can be broad.
      // A more targeted approach might be needed if 'removeFormat' has unwanted side effects.
      this.executeCommand({ command: 'removeFormat' });
    } else {
      this.executeCommand({ command: 'backColor', value: color });
    }
  }

  /**
   * Applies the specified font size to the current selection.
   * The `size` parameter typically corresponds to HTML font sizes 1-7.
   * @param {string} size - The font size value (e.g., '1', '3', '7').
   */
  static applyFontSize(size: string): void {
    this.executeCommand({ command: 'fontSize', value: size });
  }

  /**
   * Counts the number of words in a given plain text string.
   * Words are considered sequences of non-whitespace characters.
   * @param {string} text - The text to count words in.
   * @returns {number} The total word count.
   */
  static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Counts the number of characters in a given plain text string.
   * @param {string} text - The text to count characters in.
   * @returns {number} The total character count.
   */
  static countCharacters(text: string): number {
    return text.length;
  }

  /**
   * Sanitizes an HTML string by removing disallowed tags and attributes.
   * This is a basic sanitizer and might not be robust against all XSS vectors.
   * For production use, a more comprehensive, well-tested sanitization library is recommended.
   * @param {string} html - The HTML string to sanitize.
   * @returns {string} The sanitized HTML string.
   * @warning This is a basic sanitizer. For security-sensitive applications,
   *          consider using a more robust HTML sanitization library.
   */
  static sanitizeHTML(html: string): string {
    const allowedTags = [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'span', 'div', // 'div' can be problematic if not styled carefully
      'blockquote', 'code', 'pre'
    ];
    
    // 'style' and 'class' can be risky if not carefully managed downstream.
    const allowedAttributes = ['href', 'target', 'style', 'class'];
    
    // Create a temporary element to parse the HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Recursive function to clean elements
    const cleanElement = (element: Element): void => {
      const tagName = element.tagName.toLowerCase();
      
      // If the tag is not allowed, replace its content with a span, effectively stripping the tag
      // but keeping its text content. More sophisticated handling might be needed.
      if (!allowedTags.includes(tagName)) {
        const span = document.createElement('span');
        // Recursively clean children before assigning innerHTML to avoid re-introducing disallowed tags
        Array.from(element.childNodes).forEach(childNode => {
          if (childNode.nodeType === Node.ELEMENT_NODE) {
            cleanElement(childNode as Element);
          }
          span.appendChild(childNode.cloneNode(true));
        });
        element.parentNode?.replaceChild(span, element);
        return; // Element replaced, no further processing needed for original element
      }
      
      // Clean attributes
      const attributes = Array.from(element.attributes);
      attributes.forEach(attr => {
        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
          element.removeAttribute(attr.name);
        }
        // Potentially add more specific checks for attribute values (e.g., for 'style' or 'href')
      });
      
      // Clean children recursively
      Array.from(element.children).forEach(child => {
        cleanElement(child);
      });
    };
    
    Array.from(temp.children).forEach(child => {
      cleanElement(child);
    });
    
    return temp.innerHTML;
  }

  /**
   * Converts a plain text string to a basic HTML string,
   * primarily by replacing newlines with `<br>` tags and escaping HTML special characters.
   * @param {string} text - The plain text to convert.
   * @returns {string} The HTML representation.
   */
  static textToHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\n/g, '<br>');
  }

  /**
   * Converts an HTML string to its plain text representation by stripping HTML tags.
   * @param {string} html - The HTML string to convert.
   * @returns {string} The extracted plain text.
   */
  static htmlToText(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  /**
   * Checks if the browser supports the `contentEditable` attribute.
   * @returns {boolean} True if `contentEditable` is supported, false otherwise.
   */
  static isContentEditableSupported(): boolean {
    return 'contentEditable' in document.createElement('div');
  }

  /**
   * Checks if the browser supports a given `document.execCommand`.
   * @param {string} command - The command name to check (e.g., 'bold').
   * @returns {boolean} True if the command is supported, false otherwise.
   */
  static isExecCommandSupported(command: string): boolean {
    return document.queryCommandSupported(command);
  }

  /**
   * Saves the current user selection (Range) from the document.
   * This is useful for restoring selection after operations that might remove focus
   * from the editor, like clicking a toolbar button.
   * @returns {Range | null} The current selection Range object, or null if no selection.
   */
  static saveSelection(): Range | null {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0).cloneRange();
    }
    return null;
  }

  /**
   * Restores a previously saved selection Range to the document.
   * @param {Range} range - The Range object to restore.
   */
  static restoreSelection(range: Range): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
} 