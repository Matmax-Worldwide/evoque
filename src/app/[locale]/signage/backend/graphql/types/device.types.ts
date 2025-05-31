// Corresponds to a subset of backend/models/device.model.ts for GraphQL exposure
export interface GraphQLDevice {
  id: string;
  name?: string | null;
  status: 'PENDING' | 'ONLINE' | 'OFFLINE' | 'ERROR' | 'UNPAIRED';
  lastSeenAt?: string | null; // ISO Date string
  organizationId: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  currentPlaylistId?: string | null; // ID of the currently assigned playlist
}

export interface PairingCode {
  code: string;
  expiresAt: string; // ISO Date string
  qrCodeValue: string;
}

export interface DevicePairedResponse {
  success: boolean;
  message?: string;
  device?: GraphQLDevice; // Ensure this uses the updated GraphQLDevice interface
  token?: string;
}

export interface GenerateDevicePairingCodeInput {
  organizationId: string;
}

export interface PairSignageDeviceInput {
  pairingCode: string;
  deviceName?: string;
}

export interface AssignPlaylistToDeviceInput {
  organizationId: string;
  deviceId: string;
  playlistId?: string | null; // Allow unassigning by passing null
}
