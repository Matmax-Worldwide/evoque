// src/app/[locale]/signage/backend/graphql/resolvers/device.resolvers.ts

import { PrismaClient, DeviceStatus, Device as PrismaDevice, Playlist as PrismaPlaylist } from '@prisma/client';
// Standard import path for a shared Prisma Client instance in many projects
import prisma from '@/lib/prisma';

// Helper to format pairing code (still useful)
const formatPairingCode = (code: string): string => {
    return code.match(/.{1,2}/g)?.join('-') || code;
}

// Helper to generate a random alphanumeric code (still useful for pairing codes)
const generateRandomCode = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Assuming these types are imported from the .types.ts file
// import { GenerateDevicePairingCodeInput, PairSignageDeviceInput, AssignPlaylistToDeviceInput, GraphQLDevice } from '../types/device.types';

// Helper function to ensure all Date objects are ISO strings for GraphQL responses
const serializeDeviceDates = (device: PrismaDevice) => {
    return {
        ...device,
        createdAt: device.createdAt.toISOString(),
        updatedAt: device.updatedAt.toISOString(),
        lastSeenAt: device.lastSeenAt?.toISOString() || null,
        pairingCodeExpiresAt: device.pairingCodeExpiresAt?.toISOString() || null,
    };
};

export const deviceResolvers = {
  Query: {
    getDevice: async (_: any, { id }: { id: string }) => {
      const device = await prisma.device.findUnique({
        where: { id },
      });
      return device ? serializeDeviceDates(device) : null;
    },
    listDevices: async (_: any, { organizationId }: { organizationId: string }) => {
      const devices = await prisma.device.findMany({
        where: { organizationId },
      });
      return devices.map(serializeDeviceDates);
    },
  },
  Mutation: {
    generateDevicePairingCode: async (_: any, { input }: { input: { organizationId: string } }) => {
      const { organizationId } = input;
      const rawCode = generateRandomCode(6);
      const expiresInMs = 15 * 60 * 1000; // 15 minutes
      const expiresAt = new Date(Date.now() + expiresInMs);

      const newDevice = await prisma.device.create({
        data: {
          organizationId,
          pairingCode: rawCode,
          pairingCodeExpiresAt: expiresAt,
          status: DeviceStatus.PENDING_PAIRING,
        }
      });

      console.log(`Generated pairing code ${formatPairingCode(rawCode)} for org ${organizationId}, device ID ${newDevice.id}`);

      return {
        code: formatPairingCode(rawCode),
        expiresAt: expiresAt.toISOString(),
        qrCodeValue: formatPairingCode(rawCode),
      };
    },

    pairSignageDevice: async (_: any, { input }: { input: { pairingCode: string, deviceName?: string } }) => {
      const { pairingCode, deviceName } = input;
      const rawPairingCode = pairingCode.replace(/-/g, '');

      const deviceToPair = await prisma.device.findUnique({
        where: { pairingCode: rawPairingCode },
      });

      if (!deviceToPair) {
        return { success: false, message: 'Invalid pairing code.' };
      }

      if (deviceToPair.status !== DeviceStatus.PENDING_PAIRING) {
         return { success: false, message: 'Pairing code already used or device is not pending.' };
      }

      if (deviceToPair.pairingCodeExpiresAt && new Date() > deviceToPair.pairingCodeExpiresAt) {
        // Optionally update status to UNPAIRED, or let a cleanup job handle it
        // For now, just fail the pairing
        return { success: false, message: 'Pairing code has expired.' };
      }

      const updatedDevice = await prisma.device.update({
        where: { id: deviceToPair.id },
        data: {
          name: deviceName || `Device ${deviceToPair.id.substring(0, 8)}`, // Prisma ID is longer
          status: DeviceStatus.ONLINE,
          lastSeenAt: new Date(),
          pairingCode: null,
          pairingCodeExpiresAt: null,
        }
      });

      console.log(`Device ${updatedDevice.id} paired successfully for org ${updatedDevice.organizationId}. Name: ${updatedDevice.name}`);

      return {
        success: true,
        message: 'Device paired successfully.',
        device: serializeDeviceDates(updatedDevice),
        token: `dummy-jwt-for-${updatedDevice.id}`, // Placeholder token
      };
    },

    assignPlaylistToDevice: async (_: any, { input }: { input: { organizationId: string, deviceId: string, playlistId?: string | null } }) => {
      const { organizationId, deviceId, playlistId } = input;

      const device = await prisma.device.findFirst({
        where: { id: deviceId, organizationId }
      });
      if (!device) {
        throw new Error("Device not found or access denied.");
      }

      if (playlistId) {
        const playlist = await prisma.playlist.findFirst({
          where: { id: playlistId, organizationId }
        });
        if (!playlist) {
          throw new Error("Playlist not found, or it does not belong to the same organization.");
        }
      }

      const updatedDevice = await prisma.device.update({
        where: { id: deviceId },
        data: {
          currentPlaylistId: playlistId,
        }
      });

      console.log(`Playlist ${playlistId || 'NONE'} assigned to device ${deviceId}.`);
      return serializeDeviceDates(updatedDevice);
    }
  },
  // Resolver for related fields on the Device type, if defined in GraphQL schema
  // For example, if your GraphQL `Device` type has a `currentPlaylist` field:
  Device: {
    currentPlaylist: async (parent: PrismaDevice, _: any) => {
      if (!parent.currentPlaylistId) return null;
      const playlist = await prisma.playlist.findUnique({
          where: { id: parent.currentPlaylistId }
      });
      // Serialize playlist dates if necessary, similar to serializeDeviceDates
      return playlist ? { ...playlist, createdAt: playlist.createdAt.toISOString(), updatedAt: playlist.updatedAt.toISOString() } : null;
    }
  }
};
