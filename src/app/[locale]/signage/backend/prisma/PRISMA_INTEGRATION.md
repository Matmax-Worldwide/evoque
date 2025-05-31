# Prisma Integration Guide for the Signage Module (Core Features)

This document provides guidance on integrating the Prisma schema and refactored resolvers for the **core features (Devices, Media, Playlists)** of the Signage Module into your existing CMS backend that uses Prisma and PostgreSQL.

Scheduling-related models (`ScheduledEvent`, `RecurrenceException`, and `TargetType` enum) also exist in the `src/app/[locale]/signage/backend/prisma/schema.prisma` file. While they are designed to be compatible, their full resolver implementation and deeper integration are part of a later phase. For this initial core feature integration, you can choose to:
1.  Include these scheduling models during the migration if you want the tables created. They should not conflict with existing schemas if your CMS doesn't use these exact model names.
2.  Temporarily comment out the scheduling models from your main `schema.prisma` if you prefer to integrate them explicitly later.

## 1. Core Prisma Models for Integration

The primary Prisma models for this integration phase are defined in `src/app/[locale]/signage/backend/prisma/schema.prisma`:

*   **`Device`**: Manages signage devices, pairing codes, status, and the currently assigned playlist.
    *   Uses the `DeviceStatus` enum.
*   **`Media`**: Stores metadata for uploaded media files (videos, images, etc.).
    *   Uses the `MediaType` enum.
*   **`Playlist`**: Defines playlists composed of ordered media items.
*   **`PlaylistItem`**: The junction table linking `Playlist` and `Media`, defining the order and duration of media within a playlist.

**Review `schema.prisma` (Core Models):**
Before proceeding, carefully review these four core models and their two enums in the provided `schema.prisma` file. Pay close attention to:
*   **Relations:** Ensure foreign keys and `@relation` attributes correctly link these models (e.g., `Device.currentPlaylistId` to `Playlist.id`, `PlaylistItem.playlistId` to `Playlist.id`, `PlaylistItem.mediaId` to `Media.id`).
*   **Cascading Deletes & SetNull:** Note the `onDelete: Cascade` rules on `PlaylistItem` for its relations to `Playlist` and `Media`. This means if a Playlist or Media record is deleted, its associated PlaylistItem records will also be deleted. `Device.currentPlaylistId` uses `onDelete: SetNull`, meaning if a Playlist is deleted, the device's link to it is nullified. Review if these align with your desired data integrity rules.
*   **Indexing:** Key fields are indexed (e.g., `organizationId`, `status` on `Device`; `playlistId`, `mediaId` on `PlaylistItem`).

## 2. Integrating into Your Main `schema.prisma`

1.  **Copy Core Models and Enums:** Copy the definitions for `Device`, `DeviceStatus`, `Media`, `MediaType`, `Playlist`, and `PlaylistItem` from the Signage Module's `schema.prisma` into your CMS's main `schema.prisma` file. (Optionally, also copy `ScheduledEvent`, `RecurrenceException`, and `TargetType` if you're including them now).
2.  **Resolve Relations to Global Models (IMPORTANT):**
    *   **Organization & User:** The Signage models include fields like `organizationId`, `uploadedByUserId` (on `Media`), and `createdByUserId` (on `Playlist`). These are currently typed as `String`. If your main schema has `Organization` and `User` Prisma models:
        *   Update these fields to establish proper foreign key relations. For example, if your `User` model has an `id String @id @db.Uuid`, change `createdByUserId String` in `Playlist` to `createdByUserId String @db.Uuid` (or the correct type) and add the `@relation` attribute:
            ```prisma
            // model Playlist {
            //   ...
            //   createdByUser   User   @relation(fields: [createdByUserId], references: [id])
            //   createdByUserId String @db.Uuid // Assuming User ID is UUID
            //   ...
            // }
            ```
        *   Do similarly for `organizationId` fields on `Device`, `Media`, and `Playlist`, and `uploadedByUserId` on `Media`.
        *   Ensure data types and any constraints (like `@db.Uuid`) match your existing global models.
3.  **Datasource & Client Blocks:** Ensure your main `schema.prisma` has the `datasource db` (correctly configured for your PostgreSQL instance using `env("DATABASE_URL")`) and `generator client` blocks.

## 3. Running Prisma Migrations

Once the Signage core models (and optionally scheduling models) are integrated into your main `schema.prisma`:

1.  **Generate Migration Files:** Create SQL migration files. Use a descriptive name.
    ```bash
    npx prisma migrate dev --name add_signage_module_core_features
    ```
    (Or `yarn prisma migrate dev --name add_signage_module_core_features`)
2.  **Review Migration:** **Crucially, inspect the generated SQL migration file.** Ensure it accurately reflects the intended schema changes and will not cause unintended data loss or conflicts with existing tables.
3.  **Apply Migration:** The `migrate dev` command usually applies the migration automatically in development. For staging/production environments, use `prisma migrate deploy` after thorough testing.

## 4. Generating/Updating Prisma Client

After migrations are successfully applied:

1.  **Generate Client:** Run the Prisma generate command:
    ```bash
    npx prisma generate
    ```
    (Or `yarn prisma generate`)
    This updates the `@prisma/client` node module to include types and methods for all models in your schema, including the newly added Signage models.

## 5. Shared Prisma Client Instance

The Signage Module resolvers (in `src/app/[locale]/signage/backend/graphql/resolvers/`) expect a shared, initialized Prisma Client instance.

1.  **Setup (if not already present):** It's standard practice to have a single, shared Prisma Client instance. If you don't have one, create it in your CMS's library (e.g., `src/lib/prisma.ts`):
    ```typescript
    // src/lib/prisma.ts (Example)
    import { PrismaClient } from '@prisma/client';

    let prisma: PrismaClient;

    if (process.env.NODE_ENV === 'production') {
      prisma = new PrismaClient();
    } else {
      // Prevent multiple instances of Prisma Client in development due to hot reloading
      // @ts-ignore
      if (!global.prisma) {
        // @ts-ignore
        global.prisma = new PrismaClient();
      }
      // @ts-ignore
      prisma = global.prisma;
    }

    export default prisma;
    ```
2.  **Resolver Usage:** The Signage resolvers are written to import this instance (e.g., `import prisma from '@/lib/prisma';`). Ensure this path is correct. Alternatively, if your GraphQL server setup passes Prisma Client via context (recommended for testability), the resolvers can be adapted using comments like `const db = context?.prisma || prisma;`.

By following these steps, the Prisma schema for the core Signage Module features should be integrated into your CMS backend, and the resolvers prepared to use it.
