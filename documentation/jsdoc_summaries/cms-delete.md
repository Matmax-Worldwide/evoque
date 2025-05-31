# JSDoc Comments and Code Signatures for `src/lib/cms-delete.ts`

This document contains extracted JSDoc comments and the code signatures they are associated with from the file `src/lib/cms-delete.ts`. The raw JSDoc content is provided for direct interpretation.

---

**JSDoc Block:**

```javascript
/**
 * @fileoverview This module provides a function for deleting CMS sections
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
 * Deletes a CMS section using a GraphQL mutation.
 * @param sectionId - The ID of the CMS section to delete.
 * @returns A promise that resolves to an object containing:
 *          - `success` (boolean): True if the deletion was successful, false otherwise.
 *          - `message` (string, optional): A message providing more details about the outcome.
 */```

**Associated Code:**

```typescript
export async function deleteCMSSection(sectionId: string) {
```

---
