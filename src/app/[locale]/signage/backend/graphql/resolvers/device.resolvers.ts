// src/app/[locale]/signage/backend/graphql/resolvers/device.resolvers.ts
import { PrismaClient, DeviceStatus, Prisma, Device as PrismaDevice } from '@prisma/client';
import prisma from '@/lib/prisma'; // Assuming shared Prisma client from the CMS

// Helper functions (generateRandomCode, formatPairingCode) remain as they are utility for pairing codes
const generateRandomCode = (length: number = 6): string => {
    let code = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};
const formatPairingCode = (code: string): string => {
    return code.match(/.{1,2}/g)?.join('-') || code;
};

// Helper to serialize Date objects to ISO strings for GraphQL responses
const serializeDeviceObject = (device: any): any | null => {
    if (!device) return null;
    const serialized = { ...device };
    // Convert main device dates
    if (device.createdAt instanceof Date) serialized.createdAt = device.createdAt.toISOString();
    if (device.updatedAt instanceof Date) serialized.updatedAt = device.updatedAt.toISOString();
    if (device.lastSeenAt instanceof Date) serialized.lastSeenAt = device.lastSeenAt.toISOString();
    else if (device.lastSeenAt === null) serialized.lastSeenAt = null; // Explicitly keep null if null

    if (device.pairingCodeExpiresAt instanceof Date) serialized.pairingCodeExpiresAt = device.pairingCodeExpiresAt.toISOString();
    else if (device.pairingCodeExpiresAt === null) serialized.pairingCodeExpiresAt = null;

    // If currentPlaylist is included and has dates, serialize them too
    if (device.currentPlaylist) {
        const pl = device.currentPlaylist;
        serialized.currentPlaylist = {
            ...pl,
            createdAt: pl.createdAt instanceof Date ? pl.createdAt.toISOString() : pl.createdAt,
            updatedAt: pl.updatedAt instanceof Date ? pl.updatedAt.toISOString() : pl.updatedAt,
            contentUpdatedAt: pl.contentUpdatedAt instanceof Date ? pl.contentUpdatedAt.toISOString() : pl.contentUpdatedAt,
        };
    }
    return serialized;
};


export const deviceResolvers = {
  Query: {
    getDevice: async (_: any, { id }: { id: string }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      try {
        const device = await db.device.findUnique({
          where: { id },
          include: { currentPlaylist: true }
        });
        return serializeDeviceObject(device);
      } catch (error) {
        console.error(`Error fetching device ${id}:`, error);
        throw new Error(`Failed to fetch device.`);
      }
    },
    listDevices: async (_: any, { organizationId }: { organizationId: string }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      try {
        const devices = await db.device.findMany({
          where: { organizationId },
          include: { currentPlaylist: true },
          orderBy: { createdAt: 'desc' }
        });
        return devices.map(serializeDeviceObject);
      } catch (error) {
        console.error(`Error fetching devices for org ${organizationId}:`, error);
        throw new Error(`Failed to fetch devices.`);
      }
    },
  },
  Mutation: {
    generateDevicePairingCode: async (_: any, { input }: { input: { organizationId: string } }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const { organizationId } = input;
      const rawCode = generateRandomCode(6);
      const expiresInMs = 15 * 60 * 1000;
      const expiresAt = new Date(Date.now() + expiresInMs);

      try {
        // Prisma will auto-generate the ID if not provided and @default(uuid()) or similar is set
        await db.device.create({ // Removed 'newDevice =' as it's not directly used for the return value
          data: {
            organizationId,
            pairingCode: rawCode,
            pairingCodeExpiresAt: expiresAt,
            status: DeviceStatus.PENDING_PAIRING,
          }
        });
        return {
          code: formatPairingCode(rawCode),
          expiresAt: expiresAt.toISOString(),
          qrCodeValue: formatPairingCode(rawCode),
        };
      } catch (error) {
        console.error(`Error generating pairing code for org ${organizationId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            // This error code is for unique constraint violation (e.g. on pairingCode if it happened to collide)
            throw new Error("Failed to generate a unique pairing code due to a conflict. Please try again.");
        }
        throw new Error(`Failed to generate pairing code.`);
      }
    },

    pairSignageDevice: async (_: any, { input }: { input: { pairingCode: string, deviceName?: string } }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const { pairingCode, deviceName } = input;
      const rawPairingCode = pairingCode.replace(/-/g, '');

      try {
        const deviceToPair = await db.device.findUnique({
          where: { pairingCode: rawPairingCode },
        });

        if (!deviceToPair) {
          return { success: false, message: 'Invalid pairing code.' };
        }
        if (deviceToPair.status !== DeviceStatus.PENDING_PAIRING) {
           return { success: false, message: 'Pairing code already used or device is not pending.' };
        }
        if (deviceToPair.pairingCodeExpiresAt && new Date() > deviceToPair.pairingCodeExpiresAt) {
          // Optionally update status to UNPAIRED or similar
          // await db.device.update({ where: {id: deviceToPair.id}, data: {status: DeviceStatus.UNPAIRED, pairingCode: null, pairingCodeExpiresAt: null }});
          return { success: false, message: 'Pairing code has expired.' };
        }

        const updatedDevice = await db.device.update({
          where: { id: deviceToPair.id },
          data: {
            name: deviceName || `Device ${deviceToPair.id.substring(0, 8)}`, // Prisma ID is usually longer
            status: DeviceStatus.ONLINE,
            lastSeenAt: new Date(),
            pairingCode: null,
            pairingCodeExpiresAt: null,
          },
          include: { currentPlaylist: true }
        });
        return {
          success: true,
          message: 'Device paired successfully.',
          device: serializeDeviceObject(updatedDevice),
          token: `dummy-jwt-for-${updatedDevice.id}`,
        };
      } catch (error) {
        console.error(`Error pairing device with code ${pairingCode}:`, error);
        throw new Error(`Device pairing failed.`);
      }
    },

    assignPlaylistToDevice: async (_: any, { input }: { input: { organizationId: string, deviceId: string, playlistId?: string | null } }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const { organizationId, deviceId, playlistId } = input;

      try {
        const device = await db.device.findFirst({ where: {id: deviceId, organizationId }});
        if (!device) throw new Error("Device not found or not part of this organization.");

        if (playlistId) {
          const playlist = await db.playlist.findFirst({ where: { id: playlistId, organizationId }});
          if (!playlist) throw new Error("Playlist not found or not part of this organization.");
        }

        const updatedDevice = await db.device.update({
          where: { id: deviceId }, // Must use a unique field for where in update
          data: {
            currentPlaylistId: playlistId,
          },
          include: { currentPlaylist: true }
        });
        return serializeDeviceObject(updatedDevice);
      } catch (error) {
        console.error(`Error assigning playlist ${playlistId} to device ${deviceId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025: Record to update not found (might happen if deviceId is wrong but passed initial check, or race condition)
            if (error.code === 'P2025') throw new Error("Device to update not found.");
        }
        throw new Error(`Failed to assign playlist.`);
      }
    }
  },
  // Type specific resolver for Device.currentPlaylist
  // This is useful if `currentPlaylist` is not always included in parent queries,
  // or if custom logic is needed for resolving it.
  // If `include: { currentPlaylist: true }` is used in parent resolvers, this might not be strictly necessary
  // unless specific transformations on the playlist object are needed here.
  Device: {
    currentPlaylist: async (parent: PrismaDevice, _: any, context?: { prisma?: PrismaClient }) => {
      // If currentPlaylist was already fetched by parent resolver with include, return it.
      // The type of parent here would be PrismaDevice & { currentPlaylist?: PrismaPlaylist | null }
      if ((parent as any).currentPlaylist !== undefined) {
          return (parent as any).currentPlaylist ? serializeDeviceObject({ nested: (parent as any).currentPlaylist }).nested : null;
      }
      // Otherwise, if only currentPlaylistId is available, fetch the playlist.
      if (!parent.currentPlaylistId) return null;

      const db = context?.prisma || prisma;
      try {
        const playlist = await db.playlist.findUnique({ where: { id: parent.currentPlaylistId } });
        // Assuming playlist serialization should also handle its own dates if not covered by serializeDeviceObject
        return playlist ? serializeDeviceObject({ nested: playlist }).nested : null;
      } catch (error) {
        console.error(`Error fetching currentPlaylist ${parent.currentPlaylistId} for device ${parent.id}:`, error);
        throw new Error('Failed to fetch assigned playlist.');
      }
    }
  }
};
