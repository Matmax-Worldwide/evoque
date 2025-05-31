// src/app/[locale]/signage/backend/graphql/types/media.types.ts

export interface GraphQLMedia {
  id: string;
  name: string;
  type: 'VIDEO' | 'IMAGE' | 'AUDIO' | 'URL' | 'WIDGET' | string; // Allow string for flexibility if enum not strictly enforced
  mimeType?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  sizeBytes?: number | null;
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  organizationId: string;
  uploadedByUserId: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  contentHash?: string | null; // <<<< ADD THIS FIELD
}

export interface UploadMediaInput {
  organizationId: string;
  uploadedByUserId: string;
  name: string;
  type: 'VIDEO' | 'IMAGE' | 'AUDIO' | 'URL' | 'WIDGET' | string;
  mimeType?: string;
  sizeBytes?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  contentHash?: string | null; // Client might not provide this; backend would generate post-upload.
}
