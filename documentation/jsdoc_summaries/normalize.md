# JSDoc Comments and Code Signatures for `src/lib/normalize.ts`

This document contains extracted JSDoc comments and the code signatures they are associated with from the file `src/lib/normalize.ts`. The raw JSDoc content is provided for direct interpretation.

---

**JSDoc Block:**

```javascript
/**
 * @fileoverview Utility functions for text normalization.
 * This module provides functions to handle:
 * - Conversion of accented characters (e.g., á → a, é → e).
 * - Conversion of 'ñ' to 'n'.
 * - Replacement of spaces with underscores or hyphens.
 * - Removal or replacement of special characters.
 * - Creation of slugs, valid file names, and variable names.
 * - Basic error handling for normalization processes.
 */```

**Associated Code:**

```typescript
/**
```

---

**JSDoc Block:**

```javascript
 * It converts the string to lowercase, removes diacritics (accents),
 * converts 'ñ' to 'n', replaces spaces with underscores, removes special characters
 * (keeping only alphanumeric and underscores), and cleans up consecutive/leading/trailing underscores.
 *
 * @param value - The string to normalize.
 * @returns The normalized string, suitable for use as an identifier. Returns an empty string if input is invalid or an error occurs.
 */```

**Associated Code:**

```typescript
export function normalizeValue(value: string): string {
```

---

**JSDoc Block:**

```javascript
/**
 * Creates a URL-friendly slug from a given string.
 * It converts the string to lowercase, removes diacritics, converts 'ñ' to 'n',
 * replaces spaces and special characters (like '&', '@', '%', '+') with hyphens or their textual representation,
 * removes other special characters (keeping only alphanumeric and hyphens),
 * cleans up consecutive/leading/trailing hyphens, and truncates to a specified maximum length.
 *
 * @param value - The string to convert into a slug.
 * @param maxLength - Optional. The maximum desired length for the slug. Defaults to 50.
 * @returns The generated slug, suitable for URLs. Returns an empty string if input is invalid or an error occurs.
 */```

**Associated Code:**

```typescript
export function createSlug(value: string, maxLength = 50): string {
```

---

**JSDoc Block:**

```javascript
/**
 * Creates a normalized file name from a given string.
 * It converts the string to lowercase, removes diacritics, converts 'ñ' to 'n',
 * replaces spaces and characters not allowed in file names (e.g., '/', ':', '*') with underscores,
 * removes other special characters (keeping alphanumeric, underscores, dots, hyphens),
 * cleans up consecutive/leading/trailing underscores, and truncates to a maximum length of 100 characters.
 * An optional file extension can be appended.
 *
 * @param value - The string to convert into a file name.
 * @param extension - Optional. The file extension (without the dot) to append to the generated name. Defaults to an empty string.
 * @returns A normalized file name string. Returns an empty string if input is invalid or an error occurs.
 */```

**Associated Code:**

```typescript
export function createFileName(value: string, extension = ''): string {
```

---

**JSDoc Block:**

```javascript
/**
 * Creates a valid JavaScript/TypeScript variable name from a given string.
 * It removes diacritics, converts 'ñ' to 'n', removes special characters (keeping only alphanumeric and spaces),
 * removes leading digits, and then converts the result to either camelCase or snake_case.
 *
 * @param value - The string to convert into a variable name.
 * @param isCamelCase - Optional. If true, the output will be in camelCase (e.g., `myVariable`).
 *                      If false (default), the output will be in snake_case (e.g., `my_variable`).
 * @returns A valid variable name string. Returns "variable" if the input is invalid, results in an empty string, or an error occurs.
 */```

**Associated Code:**

```typescript
export function createVariableName(value: string, isCamelCase = false): string {
```

---
