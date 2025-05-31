// Corresponds to backend/models/media.model.ts for GraphQL exposure
export interface GraphQLMedia {
  id: string;
  name: string;
  type: 'VIDEO' | 'IMAGE' | 'AUDIO' | 'URL' | 'WIDGET';
  mimeType?: string | null;
  url: string; // CDN or storage URL
  thumbnailUrl?: string | null;
  sizeBytes?: number | null;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  organizationId: string;
  uploadedByUserId: string; // ID of the user who uploaded
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface UploadMediaInput {
  organizationId: string;
  uploadedByUserId: string;
  name: string; // Typically the filename
  type: 'VIDEO' | 'IMAGE' | 'AUDIO' | 'URL' | 'WIDGET';
  mimeType?: string;
  sizeBytes?: number;
  durationSeconds?: number; // Optional, can be extracted later
  width?: number; // Optional
  height?: number; // Optional
  // In a real scenario, this would also take a File object or stream
  // For now, URL will be simulated.
}
