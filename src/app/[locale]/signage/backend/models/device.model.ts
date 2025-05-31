// Conceptual schema for the Device model

export interface Device {
  id: string; // UUID, primary key
  pairingCode?: string | null;
  pairingCodeExpiresAt?: Date | null;
  name?: string | null;
  status: 'PENDING' | 'ONLINE' | 'OFFLINE' | 'ERROR' | 'UNPAIRED'; // UNPAIRED for initial state before code generation
  lastSeenAt?: Date | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  firmwareVersion?: string | null;
  currentPlaylistId?: string | null; // Foreign key to Playlist
  createdAt: Date;
  updatedAt: Date;
  organizationId: string; // Assuming multi-tenancy
  // Potentially: deviceSpecificConfig: JSON;
}
