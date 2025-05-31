// Conceptual schema for the Playlist model

export interface Playlist {
  id: string; // UUID, primary key
  name: string;
  description?: string | null;
  createdByUserId: string; // Foreign key to User
  createdAt: Date;
  updatedAt: Date;
  organizationId: string; // Assuming multi-tenancy
  // Potentially: tags: string[];
  // Potentially: defaultOrientation: 'LANDSCAPE' | 'PORTRAIT';
}
