import { GraphQLMedia } from './media.types'; // To embed media in playlist items

// Corresponds to backend/models/playlist.model.ts
export interface GraphQLPlaylist {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  createdByUserId: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  items: GraphQLPlaylistItem[]; // Ordered list of items in the playlist
}

// Corresponds to backend/models/playlist-item.model.ts
export interface GraphQLPlaylistItem {
  id: string;
  // mediaId: string; // We'll resolve the full media object instead
  media: GraphQLMedia; // The actual media object
  order: number;
  durationSeconds: number;
  // settings?: any; // JSON for item-specific settings, future
  createdAt: string; // ISO Date string
  // updatedAt: string; // ISO Date string for the item itself
}

export interface CreatePlaylistInput {
  organizationId: string;
  createdByUserId: string; // From context in real app
  name: string;
  description?: string | null;
}

export interface AddMediaToPlaylistInput {
  organizationId: string; // For permission checking and data scoping
  playlistId: string;
  mediaId: string;
  order?: number; // Optional: if not given, append to end
  durationSeconds: number; // Duration for this specific item in this playlist
}
