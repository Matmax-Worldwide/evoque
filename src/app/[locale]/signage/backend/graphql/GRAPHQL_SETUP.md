# GraphQL Server Setup for Signage Module (Core Features)

This guide explains how to integrate the GraphQL schemas and resolvers for the **core features (Devices, Media, Playlists)** of the Signage Module into your main GraphQL server.

The scheduling-related GraphQL definitions (`schedule.schema.graphql`, `schedule.types.ts`, `schedule.resolvers.ts`) are part of a later phase. While the `schedule.resolvers.ts` file is already included in the root resolver merge in `resolvers/index.ts`, and `schedule.schema.graphql` in `schemas/index.graphql`, you can choose to exclude them from your GraphQL server build process if you are phasing the integration.

## 1. GraphQL Schema Definitions (Type Definitions)

The Signage Module's GraphQL type definitions for core features are located in:
*   `src/app/[locale]/signage/backend/graphql/schemas/device.schema.graphql`
*   `src/app/[locale]/signage/backend/graphql/schemas/media.schema.graphql`
*   `src/app/[locale]/signage/backend/graphql/schemas/playlist.schema.graphql`

(And `schedule.schema.graphql` for the scheduling features, which you may integrate now or later.)

**Integration Steps:**

1.  **Schema Merging Strategy:** Your GraphQL server setup (e.g., Apollo Server, GraphQL Yoga) will have a method for loading and merging GraphQL type definitions. Common approaches include:
    *   **Using `@graphql-tools/load-files` and `@graphql-tools/merge`:**
        If you use these tools, ensure the path `src/app/[locale]/signage/backend/graphql/schemas/` (or specifically the `device`, `media`, `playlist`, and optionally `schedule` files) is included in the patterns that `loadFilesSync` processes. The `mergeTypeDefs` function can then combine these with your existing schemas.
        ```typescript
        // Example conceptual server setup snippet
        // import { loadFilesSync } from '@graphql-tools/load-files';
        // import { mergeTypeDefs } from '@graphql-tools/merge';
        // const signageSchemasPath = 'src/app/[locale]/signage/backend/graphql/schemas/**/*.graphql'; // Adapt as needed
        // const globalSchemasPath = 'src/path/to/your/global/schemas/**/*.graphql';
        // const typesArray = loadFilesSync([globalSchemasPath, signageSchemasPath]);
        // const typeDefs = mergeTypeDefs(typesArray);
        ```
    *   **Manual Import/Stitching:** If you manually construct your schema, you'll need to import the string contents of these `.graphql` files and concatenate or stitch them appropriately.
2.  **Root `Query` and `Mutation` Types:**
    *   The file `src/app/[locale]/signage/backend/graphql/schemas/index.graphql` provides a **conceptual merged view** of the `Query` and `Mutation` types, including operations from all Signage module's schema files.
    *   Ensure that your final, merged schema correctly extends the root `Query` and `Mutation` types with the operations defined in the Signage module's schema files. If your schema loading tool doesn't automatically extend root types from multiple files, you might need to define root `Query` and `Mutation` types that explicitly include all fields, or use schema stitching techniques. The `index.graphql` file is structured to facilitate this.
3.  **Scalars and Enums:**
    *   Ensure any custom scalars used (like `DateTime` or `Json`) are defined in your GraphQL server setup.
    *   Enums like `DeviceStatus`, `MediaType`, and `TargetType` are defined within their respective `.schema.graphql` files and should be automatically picked up by most schema merging tools.

## 2. GraphQL Resolvers

The Signage Module's resolvers are:
*   `src/app/[locale]/signage/backend/graphql/resolvers/device.resolvers.ts`
*   `src/app/[locale]/signage/backend/graphql/resolvers/media.resolvers.ts`
*   `src/app/[locale]/signage/backend/graphql/resolvers/playlist.resolvers.ts`
*   `src/app/[locale]/signage/backend/graphql/resolvers/schedule.resolvers.ts` (Contains conceptual Prisma logic for scheduling features)

The file `src/app/[locale]/signage/backend/graphql/resolvers/index.ts` exports a `getRootResolver()` function that deep-merges these individual resolver objects.

**Integration Steps:**

1.  **Import Root Signage Resolver:** Import the `getRootResolver` function (or the resolver object it returns) into your main GraphQL server setup file where you define your global resolvers map.
    ```typescript
    // Example conceptual server setup snippet
    // import { getRootResolver as getSignageRootResolver } from '@/app/[locale]/signage/backend/graphql/resolvers'; // Adjust path
    // import { someOtherGlobalResolvers } from '@/path/to/your/global/resolvers';
    // import { merge } from 'lodash'; // Or your preferred deep merge utility

    // const signageResolvers = getSignageRootResolver();
    // const resolvers = merge({}, someOtherGlobalResolvers, signageResolvers);
    ```
2.  **Merge with Global Resolvers:** Deep-merge the Signage module's resolver map with your existing global resolver map. Ensure that `Query`, `Mutation`, and any type-specific resolvers (like `Device`, `Playlist`, `ScheduledEvent`, etc.) are correctly combined. `lodash.merge` typically handles this well.
3.  **Prisma Client in Context (Recommended):** The Signage resolvers (for Device, Media, Playlist, and conceptually for Schedule) are designed to use a Prisma Client instance. The recommended way is to add this instance to your GraphQL server's context.
    ```typescript
    // Example: Adding Prisma to Apollo Server context
    // import prisma from '@/lib/prisma'; // Your shared Prisma instance (see PRISMA_INTEGRATION.md)
    // const server = new ApolloServer({
    //   typeDefs, // Your merged type definitions
    //   resolvers, // Your merged resolvers
    //   context: async ({ req }) => {
    //     // ... your existing context setup (e.g., for auth)
    //     return {
    //       // ... existing context properties
    //       prisma, // Add Prisma client to context
    //       user: req.user // Example: if user is attached by auth middleware
    //     };
    //   },
    // });
    ```
    The Signage resolvers attempt to use `context.prisma` first, then fall back to a direct import of `prisma` (e.g., `import prisma from '@/lib/prisma';`). Using the context is generally preferred for better testability and request-level scoping if needed.

## 3. TypeScript Types

The directory `src/app/[locale]/signage/backend/graphql/types/` contains TypeScript definitions that correspond to the GraphQL schema types. These are primarily for:
*   Type-checking in your resolver implementations (though Prisma types are often used directly within resolvers).
*   Potentially for generating client-side types if you are not using a tool like GraphQL Code Generator.

If you use GraphQL Code Generator, it will generate types based on your final merged schema, which would be the preferred source for client-side types.

## 4. Updating Client-Side GraphQL Client

After your GraphQL server's schema has been updated to include the Signage module's types, queries, and mutations:

1.  **GraphQL Code Generator:** If you use GraphQL Code Generator:
    *   Ensure your codegen configuration points to your updated GraphQL server endpoint or schema file.
    *   Re-run your codegen script (e.g., `npm run codegen`). This will generate new TypeScript types for your queries, mutations, and potentially updated client instance or hooks.
2.  **Manual Client Updates:** If you manage client-side queries/mutations manually:
    *   Write new GQL query/mutation strings for Signage operations.
    *   Update your client helper functions (e.g., in `@/lib/graphql-client`) to execute these.
3.  **UI Integration:** The Signage UI pages and components are set up to use a conceptual `graphqlClient`. Once your actual client is updated with Signage operations, these UI parts can be transitioned from mock clients to the live API.

By following these steps, your GraphQL server and client-side setup should be correctly configured to support the Signage Module.
