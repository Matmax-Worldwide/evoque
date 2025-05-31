// Conceptual schema for the Media model

export interface Media {
  id: string; // UUID, primary key
  name: string; // Original filename or user-defined name
  type: 'VIDEO' | 'IMAGE' | 'AUDIO' | 'URL' | 'WIDGET'; // Type of media
  mimeType?: string | null; // e.g., "video/mp4", "image/jpeg"
  url: string; // URL to the media file (e.g., CDN link)
  thumbnailUrl?: string | null;
  sizeBytes?: number | null;
  durationSeconds?: number | null; // For time-based media
  width?: number | null; // For visual media
  height?: number | null; // For visual media
  uploadedByUserId: string; // Foreign key to User
  createdAt: Date;
  updatedAt: Date;
  organizationId: string; // Assuming multi-tenancy
  // Potentially: metadata: JSON; (for EXIF, etc.)
  // Potentially: processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}
