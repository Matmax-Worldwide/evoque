# JSDoc Comments and Code Signatures for `src/lib/cms-update.ts`

This document contains extracted JSDoc comments and the code signatures they are associated with from the file `src/lib/cms-update.ts`. The raw JSDoc content is provided for direct interpretation.

---

**JSDoc Block:**

```javascript
/**
 * @fileoverview This module provides a function for updating CMS sections
 * via a GraphQL mutation.
 */```

**Associated Code:**

```typescript
import { gqlRequest } from './graphql-client';
```

---

**JSDoc Block:**

```javascript
/**
 * Updates a CMS section using a GraphQL mutation.
 * @param sectionId - The ID of the CMS section to update.
 * @param input - An object containing the fields to update.
 * @param input.name - Optional new name for the section.
 * @param input.description - Optional new description for the section.
 * @param input.backgroundImage - Optional new background image URL for the section.
 * @param input.backgroundType - Optional new background type for the section.
 * @param input.gridDesign - Optional new grid design for the section.
 * @returns A promise that resolves to an object containing:
 *          - `success` (boolean): True if the update was successful, false otherwise.
 *          - `message` (string): A message providing more details about the outcome.
 *          - `lastUpdated` (string | null): The timestamp of the last update, or null if the update failed.
 */```

**Associated Code:**

```typescript
export async function updateCMSSection(sectionId: string, input: {
```

---
