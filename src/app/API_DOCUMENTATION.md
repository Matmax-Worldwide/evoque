# Digital Signage Module - API Documentation & Next Steps

This document outlines the conceptually implemented GraphQL API endpoints for the core features of the Digital Signage module.

**Note:** The current implementation uses in-memory data stores for all entities (devices, media, playlists). This is for demonstration and initial backend logic setup. For a production system, these need to be replaced with proper database persistence and caching layers (e.g., PostgreSQL, Redis).

## I. GraphQL API Endpoints

The GraphQL schema is notionally split into `device`, `media`, and `playlist` concerns, which are then merged into a root schema.

### A. Device Management (`device.schema.graphql`)

**Types:**

*   `Device`: Represents a signage device.
    *   `id: ID!`
    *   `name: String`
    *   `status: String!` (e.g., PENDING, ONLINE, OFFLINE, ERROR, UNPAIRED)
    *   `lastSeenAt: String` (ISO Date)
    *   `organizationId: ID!`
    *   `createdAt: String!` (ISO Date)
    *   `updatedAt: String!` (ISO Date)
    *   `currentPlaylistId: ID` (Nullable ID of the assigned playlist)
*   `PairingCodeResponse`: Information about a generated pairing code.
    *   `code: String!` (User-friendly format, e.g., XX-XX-XX)
    *   `expiresAt: String!` (ISO Date)
    *   `qrCodeValue: String!`
*   `DevicePairedResponse`: Response after a device pairing attempt.
    *   `success: Boolean!`
    *   `message: String`
    *   `device: Device` (The paired device, if successful)
    *   `token: String` (Conceptual JWT for the device)

**Input Types:**

*   `GenerateDevicePairingCodeInput`:
    *   `organizationId: ID!`
*   `PairSignageDeviceInput`:
    *   `pairingCode: String!`
    *   `deviceName: String` (Optional)
*   `AssignPlaylistToDeviceInput`:
    *   `organizationId: ID!`
    *   `deviceId: ID!`
    *   `playlistId: ID` (Nullable, to assign or unassign)

**Mutations:**

1.  `generateDevicePairingCode(input: GenerateDevicePairingCodeInput!): PairingCodeResponse!`
    *   Generates a new, short-lived pairing code for a device.
    *   Creates a "pending" device entry internally.
2.  `pairSignageDevice(input: PairSignageDeviceInput!): DevicePairedResponse!`
    *   Allows a device to pair itself using a valid pairing code.
    *   Updates the device status to 'ONLINE' and stores its information.
3.  `assignPlaylistToDevice(input: AssignPlaylistToDeviceInput!): Device!`
    *   Assigns or unassigns a playlist to a specified device.
    *   Updates the `currentPlaylistId` on the device.

**Queries:**

1.  `getDevice(id: ID!): Device`
    *   Retrieves a specific device by its ID. (Implicitly scoped by organization via context in a real app).
2.  `listDevices(organizationId: ID!): [Device!]!`
    *   Lists all devices belonging to a given organization.

### B. Media Management (`media.schema.graphql`)

**Types:**

*   `Media`: Represents an uploaded media file.
    *   `id: ID!`
    *   `name: String!`
    *   `type: String!` (e.g., VIDEO, IMAGE)
    *   `mimeType: String`
    *   `url: String!` (Simulated CDN URL)
    *   `thumbnailUrl: String` (Simulated)
    *   `sizeBytes: Int`
    *   `durationSeconds: Int`
    *   `width: Int`
    *   `height: Int`
    *   `organizationId: ID!`
    *   `uploadedByUserId: ID!`
    *   `createdAt: String!` (ISO Date)
    *   `updatedAt: String!` (ISO Date)

**Input Types:**

*   `UploadMediaInput`:
    *   `organizationId: ID!`
    *   `uploadedByUserId: ID!`
    *   `name: String!`
    *   `type: String!`
    *   `mimeType: String` (Optional)
    *   `sizeBytes: Int` (Optional)
    *   `durationSeconds: Int` (Optional)
    *   `width: Int` (Optional)
    *   `height: Int` (Optional)

**Mutations:**

1.  `uploadMedia(input: UploadMediaInput!): Media!`
    *   Simulates a media file upload by creating a metadata record.
    *   Generates a placeholder CDN URL.

**Queries:**

1.  `getMedia(id: ID!, organizationId: ID!): Media`
    *   Retrieves a specific media item by ID, scoped to an organization.
2.  `listMedia(organizationId: ID!): [Media!]!`
    *   Lists all media items for a given organization.

### C. Playlist Management (`playlist.schema.graphql`)

**Types:**

*   `Playlist`: Represents a collection of media items.
    *   `id: ID!`
    *   `name: String!`
    *   `description: String`
    *   `organizationId: ID!`
    *   `createdByUserId: ID!`
    *   `createdAt: String!` (ISO Date)
    *   `updatedAt: String!` (ISO Date)
    *   `items: [PlaylistItem!]!` (Ordered list of media items)
*   `PlaylistItem`: Represents a media item within a playlist.
    *   `id: ID!`
    *   `media: Media!` (The resolved media object)
    *   `order: Int!`
    *   `durationSeconds: Int!`
    *   `createdAt: String!` (ISO Date)

**Input Types:**

*   `CreatePlaylistInput`:
    *   `organizationId: ID!`
    *   `createdByUserId: ID!`
    *   `name: String!`
    *   `description: String` (Optional)
*   `AddMediaToPlaylistInput`:
    *   `organizationId: ID!`
    *   `playlistId: ID!`
    *   `mediaId: ID!`
    *   `order: Int` (Optional, appends if not specified)
    *   `durationSeconds: Int!`

**Mutations:**

1.  `createPlaylist(input: CreatePlaylistInput!): Playlist!`
    *   Creates a new playlist.
2.  `addMediaToPlaylist(input: AddMediaToPlaylistInput!): Playlist!`
    *   Adds a media item to a playlist at a specified order and duration.

**Queries:**

1.  `getPlaylist(id: ID!, organizationId: ID!): Playlist`
    *   Retrieves a specific playlist by ID, scoped to an organization.
2.  `listPlaylists(organizationId: ID!): [Playlist!]!`
    *   Lists all playlists for a given organization.
3.  `getPlaylistForDevice(deviceId: ID!): Playlist`
    *   Retrieves the currently assigned playlist for a given device.
    *   (Device's organization is implicitly used for scoping).

## II. Next Steps for Development

This initial phase has laid the groundwork. Significant work remains to make this a production-ready system.

### A. Core Backend Enhancements:

1.  **Database Integration:**
    *   Replace all in-memory stores (`Map` objects in resolvers) with a persistent database (e.g., PostgreSQL, MySQL).
    *   Implement database models/schemas (e.g., using an ORM like Prisma, TypeORM, Sequelize).
    *   Write database migration scripts.
2.  **Authentication & Authorization:**
    *   Integrate with the existing CMS authentication for user sessions.
    *   Implement proper JWT-based authentication for devices.
    *   Enforce RBAC (Role-Based Access Control) based on `organizationId` and user roles for all mutations and queries. User/Device context should be reliably passed to resolvers.
3.  **Real File Uploads:**
    *   Implement actual file handling for media uploads (e.g., using multipart requests).
    *   Integrate with a cloud storage service (AWS S3, Google Cloud Storage) for storing media files.
    *   Generate pre-signed URLs for secure client-side uploads to storage.
4.  **Background Jobs/Workers:**
    *   Thumbnail generation for images/videos.
    *   Video transcoding/processing.
    *   Use a queue system (e.g., RabbitMQ, Redis BullMQ) for these tasks.
5.  **Configuration Management:**
    *   Use environment variables for database connections, API keys, CDN URLs, etc.
6.  **Robust Error Handling & Logging:**
    *   Implement consistent error handling and GraphQL error formatting.
    *   Integrate comprehensive logging (e.g., Winston, Pino) for debugging and auditing.
7.  **Testing:**
    *   Unit tests for resolvers and service logic.
    *   Integration tests for GraphQL API endpoints.

### B. Frontend Development:

1.  **Setup Frontend Framework & Build Tools:**
    *   Choose and set up a modern frontend framework (e.g., React, Next.js, Vue, Angular).
    *   Configure build tools (Webpack, Vite), linters, formatters.
2.  **GraphQL Client Integration:**
    *   Integrate a GraphQL client (e.g., Apollo Client, urql, Relay) for API communication, caching, and state management.
3.  **Component Implementation:**
    *   Develop the actual UI components based on the conceptual stubs and the detailed feature specifications (Sections 2.1 - 2.7 of the original document).
    *   Styling and responsive design.
4.  **Routing:**
    *   Implement client-side routing for different pages/views.
5.  **State Management:**
    *   Implement robust frontend state management.

### C. Real-time Features (Section 3.1):

1.  **WebSocket Integration:**
    *   Set up a WebSocket server (e.g., using Apollo Server subscriptions, Socket.IO).
    *   Implement GraphQL subscriptions for real-time updates (device status, playlist changes).
    *   Device heartbeats and status reporting.

### D. Advanced Features (from original spec):

*   Conditional Content (Section 2.4)
*   Advanced Scheduling System (Section 2.5)
*   Analytics Dashboard (Section 2.6)
*   User Management & Permissions (Section 2.7)
*   Template System (Section 4.1)
*   And many more as outlined in the full technical specification.

### E. DevOps & Infrastructure:

*   Containerization (Docker).
*   CI/CD pipelines.
*   Deployment to cloud environments.
*   Monitoring and alerting for the deployed application.

This list provides a high-level overview of the subsequent development efforts required. Each point represents a substantial piece of work.
