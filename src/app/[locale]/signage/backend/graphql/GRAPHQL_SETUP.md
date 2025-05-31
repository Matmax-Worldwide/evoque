# GraphQL Server Setup for Signage Module

This guide explains how to integrate the GraphQL schemas and resolvers for the Signage Module into your main GraphQL server.

**Integration Phasing:**
*   **Core Features (Recommended First Pass):** Devices, Media, Playlists. The resolvers for these (`device.resolvers.ts`, `media.resolvers.ts`, `playlist.resolvers.ts`) have been refactored to use a standard Prisma Client (e.g., imported from `@/lib/prisma` or via context).
*   **Scheduling Features:** The `schedule.schema.graphql` defines scheduling operations, and `schedule.resolvers.ts` provides a **detailed mock implementation** of these resolvers (it does not use the live Prisma client yet, but simulates it with in-memory data).

You can choose to integrate only the core features first, or include the scheduling features with their current mock resolver behavior for early UI testing.

## 1. GraphQL Schema Definitions (Type Definitions)

The Signage Module's GraphQL type definitions are located in:
*   `src/app/[locale]/signage/backend/graphql/schemas/device.schema.graphql` (Core)
*   `src/app/[locale]/signage/backend/graphql/schemas/media.schema.graphql` (Core)
*   `src/app/[locale]/signage/backend/graphql/schemas/playlist.schema.graphql` (Core)
*   `src/app/[locale]/signage/backend/graphql/schemas/schedule.schema.graphql` (Scheduling - mock resolvers)

**Integration Steps:**

1.  **Schema Merging Strategy:** Your GraphQL server setup (e.g., Apollo Server, GraphQL Yoga) will have a method for loading and merging GraphQL type definitions.
    *   **Using `@graphql-tools/load-files` and `@graphql-tools/merge`:**
        Include the path `src/app/[locale]/signage/backend/graphql/schemas/` in the patterns `loadFilesSync` processes. If you're phasing, you might specifically list only the core files first.
        ```typescript
        // Example conceptual server setup snippet
        // import { loadFilesSync } from '@graphql-tools/load-files';
        // import { mergeTypeDefs } from '@graphql-tools/merge';
        // const signageCoreSchemasPath = [
        //   'src/app/[locale]/signage/backend/graphql/schemas/device.schema.graphql',
        //   'src/app/[locale]/signage/backend/graphql/schemas/media.schema.graphql',
        //   'src/app/[locale]/signage/backend/graphql/schemas/playlist.schema.graphql',
        //   // Optionally add '.../schedule.schema.graphql' if integrating its schema now
        // ];
        // const globalSchemasPath = 'src/path/to/your/global/schemas/**/*.graphql';
        // const typesArray = loadFilesSync([globalSchemasPath, ...signageCoreSchemasPath]);
        // const typeDefs = mergeTypeDefs(typesArray);
        ```
2.  **Root `Query` and `Mutation` Types:**
    *   The file `src/app/[locale]/signage/backend/graphql/schemas/index.graphql` provides a merged view of all `Query` and `Mutation` types from the Signage module.
    *   Ensure your final schema correctly extends your root `Query` and `Mutation` types with the operations from the Signage module's schema files you choose to include.
3.  **Scalars and Enums:**
    *   Ensure custom scalars (`DateTime`, `Json`) are defined.
    *   Enums (`DeviceStatus`, `MediaType`, `TargetType`) are defined in their respective schema files.

## 2. GraphQL Resolvers

The Signage Module's resolvers are:
*   `device.resolvers.ts` (Core - uses live Prisma client)
*   `media.resolvers.ts` (Core - uses live Prisma client)
*   `playlist.resolvers.ts` (Core - uses live Prisma client)
*   `schedule.resolvers.ts` (**Uses its own internal mock data structures, not the live Prisma client yet**)

The file `src/app/[locale]/signage/backend/graphql/resolvers/index.ts` exports `getRootResolver()` which deep-merges all these.

**Integration Steps:**

1.  **Import Root Signage Resolver:**
    ```typescript
    // Example:
    // import { getRootResolver as getSignageRootResolver } from '@/app/[locale]/signage/backend/graphql/resolvers'; // Adjust path
    // const signageResolvers = getSignageRootResolver();
    ```
2.  **Merge with Global Resolvers:** Deep-merge `signageResolvers` with your existing global resolver map.
    ```typescript
    // const resolvers = merge({}, someOtherGlobalResolvers, signageResolvers);
    ```
    **Note:** Even if you exclude `schedule.schema.graphql` from your schema build initially, `schedule.resolvers.ts` is still part of the merged `signageResolvers`. This is generally fine; GraphQL will simply ignore resolvers for types or fields not present in the schema.
3.  **Prisma Client in Context (Recommended):**
    The core resolvers (`device`, `media`, `playlist`) expect the Prisma Client instance via context or a direct import (`@/lib/prisma`). The `schedule.resolvers.ts` currently uses its own internal mock data, but is structured to accept a Prisma client from context in the future.
    ```typescript
    // Example: Adding Prisma to Apollo Server context
    // import prisma from '@/lib/prisma';
    // context: async ({ req }) => ({ /* ... */ prisma, user: req.user });
    ```

## 3. TypeScript Types

The `src/app/[locale]/signage/backend/graphql/types/` directory contains TypeScript definitions corresponding to the GraphQL types. These were primarily for guiding development and for the mock client setups. If you use GraphQL Code Generator against your final merged schema, its output will be the source of truth for client-side and potentially server-side (resolver signature) types.

## 4. Updating Client-Side GraphQL Client

After updating your GraphQL server schema:
1.  **GraphQL Code Generator:** Re-run your codegen script. This will generate new TypeScript types for queries, mutations, and client helpers based on the included Signage operations.
2.  **Manual Client Updates:** Write new GQL query/mutation strings for Signage operations and update client helper functions.
3.  **UI Integration:** The Signage UI pages are prepared to use a global `graphqlClient`. Update this client to use the newly generated operations.

By following these steps, your GraphQL server and client-side setup can be configured to support the Signage Module, starting with the core features and optionally including the mock-resolver-backed scheduling features for early UI testing.
