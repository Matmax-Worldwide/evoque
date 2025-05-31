// Conceptual schema for the PlaylistItem model
// Represents a piece of media within a specific playlist

export interface PlaylistItem {
  id: string; // UUID, primary key
  playlistId: string; // Foreign key to Playlist
  mediaId: string; // Foreign key to Media
  order: number; // Integer for sequencing within the playlist (0-indexed)
  durationSeconds: number; // How long this item should play; can override media's default
  // Item-specific settings that might override media or playlist defaults
  settings?: {
    volume?: number; // 0-100
    transitionFromPrevious?: { // Transition from the PREVIOUS item to this one
      type: 'CUT' | 'FADE' | 'SLIDE_LEFT' | 'SLIDE_RIGHT' | 'SLIDE_UP' | 'SLIDE_DOWN';
      durationSeconds?: number; // Duration of the transition effect
    };
    // Add more item-specific overrides as needed, e.g., mute, fit (contain, cover)
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
