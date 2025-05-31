# JSDoc Comments and Code Signatures for `src/lib/cms-page-delete.ts`

This document contains extracted JSDoc comments and the code signatures they are associated with from the file `src/lib/cms-page-delete.ts`. The raw JSDoc content is provided for direct interpretation.

---

**JSDoc Block:**

```javascript
/**
 * @fileoverview This module provides a function for deleting a CMS page
 * and all its associated sections via a GraphQL mutation.
 */```

**Associated Code:**

```typescript
import { gqlRequest } from './graphql-client';
```

---

**JSDoc Block:**

```javascript
/**
 * Deletes a CMS page and all of its associated sections using a GraphQL mutation.
 * @param pageId - The ID of the CMS page to delete.
 * @returns A promise that resolves to an object containing:
 *          - `success` (boolean): True if the deletion was successful, false otherwise.
 *          - `message` (string): A message providing more details about the outcome.
 */```

**Associated Code:**

```typescript
export async function deletePageWithSections(pageId: string): Promise<{
```

---
