import { AssignPlaylistToDeviceInput } from './../types/device.types'; // Added for the new input type

// Placeholder for device pairing data (in-memory store)

// HACK: Reference to playlistsStore from playlist.resolvers.ts
// This will be set by the root resolver (index.ts)
let playlistsStoreRef_DeviceResolver: Map<string, any>;
export const __setPlaylistsStoreRef_DeviceResolver = (store: Map<string, any>) => {
    console.log("Setting playlistsStoreRef_DeviceResolver in device.resolvers");
    playlistsStoreRef_DeviceResolver = store;
};
// Export the pairedDevicesStore so playlist.resolvers.ts can access it via root index.ts
export const pairedDevicesStoreInstance = new Map<string, StoredDevice>();


interface StoredDevice {
  id: string;
  name?: string | null;
  status: 'PENDING' | 'ONLINE' | 'OFFLINE' | 'ERROR' | 'UNPAIRED';
  lastSeenAt?: string | null; // ISO Date string
  organizationId: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  currentPlaylistId?: string | null; // Added
  // Internal fields not exposed via GraphQL directly unless mapped
  pairingCode?: string;
  pairingCodeExpiresAt?: Date; // This was in StoredDevice, but PendingDeviceInternal also has it. Consolidate if makes sense.
}

interface PendingDeviceInternal {
  id: string; // Pre-generated UUID for the device record
  pairingCode: string; // Raw code
  pairingCodeExpiresAt: Date;
  organizationId: string;
  status: 'PENDING_PAIRING'; // Internal status
  createdAt: Date; // Date object
}

const pendingDevicesStore: Map<string, PendingDeviceInternal> = new Map();
// const pairedDevicesStore: Map<string, StoredDevice> = new Map(); // Now using exported pairedDevicesStoreInstance


const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const formatPairingCode = (code: string): string => {
    return code.match(/.{1,2}/g)?.join('-') || code;
}

const generateRandomCode = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const deviceResolvers = {
  Query: {
    getDevice: async (_: any, { id }: { id: string }): Promise<StoredDevice | null> => {
      console.log(`Fetching device with id: ${id}`);
      const device = pairedDevicesStoreInstance.get(id); // Updated to use instance
      if (device) {
        return {
            id: device.id,
            name: device.name,
            status: device.status,
            lastSeenAt: device.lastSeenAt,
            organizationId: device.organizationId,
            createdAt: device.createdAt,
            updatedAt: device.updatedAt,
            currentPlaylistId: device.currentPlaylistId, // Added
        };
      }
      return null;
    },
    listDevices: async (_: any, { organizationId }: { organizationId: string }): Promise<StoredDevice[]> => {
      console.log(`Listing devices for organizationId: ${organizationId}`);
      const devices: StoredDevice[] = [];
      for (const device of pairedDevicesStoreInstance.values()) { // Updated to use instance
        if (device.organizationId === organizationId) {
          devices.push({
            id: device.id,
            name: device.name,
            status: device.status,
            lastSeenAt: device.lastSeenAt,
            organizationId: device.organizationId,
            createdAt: device.createdAt,
            updatedAt: device.updatedAt,
            currentPlaylistId: device.currentPlaylistId, // Added
          });
        }
      }
      return devices;
    },
  },
  Mutation: {
    generateDevicePairingCode: async (_: any, { input }: { input: { organizationId: string } }) => {
      const { organizationId } = input;
      const rawCode = generateRandomCode(6);
      const formattedCode = formatPairingCode(rawCode);
      const expiresInMs = 15 * 60 * 1000;
      const expiresAtDate = new Date(Date.now() + expiresInMs);
      const pendingDeviceId = uuidv4();

      const pendingDevice: PendingDeviceInternal = {
        id: pendingDeviceId,
        pairingCode: rawCode,
        pairingCodeExpiresAt: expiresAtDate,
        organizationId,
        status: 'PENDING_PAIRING',
        createdAt: new Date(),
      };
      pendingDevicesStore.set(rawCode, pendingDevice);

      return {
        code: formattedCode,
        expiresAt: expiresAtDate.toISOString(),
        qrCodeValue: formattedCode,
      };
    },

    pairSignageDevice: async (_: any, { input }: { input: { pairingCode: string, deviceName?: string } }) => {
      const { pairingCode, deviceName } = input;
      const rawPairingCode = pairingCode.replace(/-/g, '');

      const pendingDevice = pendingDevicesStore.get(rawPairingCode);

      if (!pendingDevice) {
        return { success: false, message: 'Invalid or expired pairing code.' };
      }

      if (new Date() > pendingDevice.pairingCodeExpiresAt) {
        pendingDevicesStore.delete(rawPairingCode);
        return { success: false, message: 'Pairing code has expired.' };
      }

      pendingDevicesStore.delete(rawPairingCode);

      const nowISO = new Date().toISOString();
      const newDevice: StoredDevice = {
        id: pendingDevice.id,
        name: deviceName || `Device ${pendingDevice.id.substring(0, 4)}`,
        status: 'ONLINE',
        lastSeenAt: nowISO,
        organizationId: pendingDevice.organizationId,
        createdAt: pendingDevice.createdAt.toISOString(),
        updatedAt: nowISO,
        currentPlaylistId: null, // Initialize to null
      };
      pairedDevicesStoreInstance.set(newDevice.id, newDevice); // Updated to use instance

      // Return object must match GraphQLDevice structure
      const returnedDevice = {
        id: newDevice.id,
        name: newDevice.name,
        status: newDevice.status,
        lastSeenAt: newDevice.lastSeenAt,
        organizationId: newDevice.organizationId,
        createdAt: newDevice.createdAt,
        updatedAt: newDevice.updatedAt,
        currentPlaylistId: newDevice.currentPlaylistId, // Added
      };

      return {
        success: true,
        message: 'Device paired successfully.',
        device: returnedDevice,
        token: `dummy-jwt-for-${newDevice.id}`,
      };
    },
    assignPlaylistToDevice: async (_: any, { input }: { input: AssignPlaylistToDeviceInput }): Promise<StoredDevice | null> => {
      const { organizationId, deviceId, playlistId } = input;

      if (!playlistsStoreRef_DeviceResolver) {
          console.error("playlistsStoreRef_DeviceResolver is not set in device.resolvers. Cannot validate playlist.");
          throw new Error("Internal server configuration error: Playlist store not available.");
      }

      const device = pairedDevicesStoreInstance.get(deviceId); // Updated to use instance

      if (!device || device.organizationId !== organizationId) {
        throw new Error("Device not found or access denied.");
      }

      if (playlistId) {
        const playlist = playlistsStoreRef_DeviceResolver.get(playlistId);
        if (!playlist || playlist.organizationId !== organizationId) {
          throw new Error("Playlist not found, or it does not belong to the same organization.");
        }
        device.currentPlaylistId = playlistId;
      } else {
        device.currentPlaylistId = null;
      }

      device.updatedAt = new Date().toISOString();
      pairedDevicesStoreInstance.set(deviceId, device); // Updated to use instance

      console.log(`Playlist ${playlistId || 'NONE'} assigned to device ${deviceId}.`);

      return { // Ensure all fields for GraphQLDevice are returned
         id: device.id,
         name: device.name,
         status: device.status,
         lastSeenAt: device.lastSeenAt,
         organizationId: device.organizationId,
         createdAt: device.createdAt,
         updatedAt: device.updatedAt,
         currentPlaylistId: device.currentPlaylistId,
      };
    }
  },
};
