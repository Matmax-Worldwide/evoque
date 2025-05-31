// src/app/[locale]/signage/backend/graphql/types/playlist.types.ts
import { GraphQLMedia } from './media.types'; // For PlaylistItem.media

export interface GraphQLPlaylist {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  createdByUserId: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  version: number; // <<<< ADD THIS FIELD
  contentUpdatedAt?: string | null; // <<<< ADD THIS FIELD (ISO Date string)
  items: GraphQLPlaylistItem[];
}

export interface GraphQLPlaylistItem {
  id: string;
  media: GraphQLMedia;
  order: number;
  durationSeconds: number;
  createdAt: string; // ISO Date string
}

// --- Content Manifest Types ---
export interface GraphQLManifestMediaItem {
  id: string;
  url: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  contentHash?: string | null;
  updatedAt: string; // Media file's own last update time (ISO Date string)
  name: string;
  type: string; // Media type string
}

export interface GraphQLPlaylistContentManifest {
  playlistId: string;
  playlistName: string;
  version: number;
  contentUpdatedAt?: string | null; // ISO Date string
  mediaItems: GraphQLManifestMediaItem[];
}


export interface CreatePlaylistInput {
  organizationId: string;
  createdByUserId: string;
  name: string;
  description?: string | null;
  // Items might be added via a separate mutation or as part of an UpdatePlaylistInput
}

export interface AddMediaToPlaylistInput {
  organizationId: string;
  playlistId: string;
  mediaId: string;
  order?: number;
  durationSeconds: number;
}
