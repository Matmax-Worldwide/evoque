import { DeviceStatus } from '@prisma/client';
import { GraphQLError } from 'graphql';
import {prisma} from '@/lib/prisma';

// Helper function to generate IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Helper function to generate pairing codes
function generatePairingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 1 || i === 3) result += '-';
  }
  return result;
}

// Helper function to generate QR code value
function generateQRCodeValue(code: string, organizationId: string): string {
  return `evoque://pair?code=${code}&org=${organizationId}`;
}

// Helper function to generate device token (JWT in production)
function generateDeviceToken(deviceId: string): string {
  return `device_token_${deviceId}_${Date.now()}`;
}

export const signageResolvers = {
  Query: {
    // Device queries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDevice: async (_: any, { id }: { id: string }) => {
      try {
        const device = await prisma.device.findUnique({
          where: { id },
          include: {
            currentPlaylist: {
              include: {
                items: {
                  include: {
                    media: true
                  },
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        });
        return device;
      } catch (error) {
        throw new GraphQLError(`Failed to fetch device: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listDevices: async (_: any, { organizationId }: { organizationId: string }) => {
      try {
        const devices = await prisma.device.findMany({
          where: { organizationId },
          include: {
            currentPlaylist: true
          },
          orderBy: { createdAt: 'desc' }
        });
        return devices;
      } catch (error) {
        throw new GraphQLError(`Failed to fetch devices: ${error}`);
      }
    },

    // Media queries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSignageMedia: async (_: any, { id, organizationId }: { id: string; organizationId: string }) => {
      try {
        const media = await prisma.signageMedia.findFirst({
          where: { 
            id,
            organizationId 
          },
          include: {
            uploadedBy: true
          }
        });
        return media;
      } catch (error) {
        throw new GraphQLError(`Failed to fetch media: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listSignageMedia: async (_: any, { organizationId }: { organizationId: string }) => {
      try {
        const media = await prisma.signageMedia.findMany({
          where: { organizationId },
          include: {
            uploadedBy: true
          },
          orderBy: { createdAt: 'desc' }
        });
        return media;
      } catch (error) {
        throw new GraphQLError(`Failed to fetch media: ${error}`);
      }
    },

    // Playlist queries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getPlaylist: async (_: any, { id, organizationId }: { id: string; organizationId: string }) => {
      try {
        const playlist = await prisma.playlist.findFirst({
          where: { 
            id,
            organizationId 
          },
          include: {
            createdBy: true,
            items: {
              include: {
                media: true
              },
              orderBy: { order: 'asc' }
            },
            assignedDevices: true
          }
        });
        return playlist;
      } catch (error) {
        throw new GraphQLError(`Failed to fetch playlist: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listPlaylists: async (_: any, { organizationId }: { organizationId: string }) => {
      try {
        const playlists = await prisma.playlist.findMany({
          where: { organizationId },
          include: {
            createdBy: true,
            items: {
              include: {
                media: true
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        return playlists;
      } catch (error) {
        throw new GraphQLError(`Failed to fetch playlists: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getPlaylistForDevice: async (_: any, { deviceId }: { deviceId: string }) => {
      try {
        const device = await prisma.device.findUnique({
          where: { id: deviceId },
          include: {
            currentPlaylist: {
              include: {
                items: {
                  include: {
                    media: true
                  },
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        });
        return device?.currentPlaylist || null;
      } catch (error) {
        throw new GraphQLError(`Failed to fetch playlist for device: ${error}`);
      }
    }
  },

  Mutation: {
    // Device pairing mutations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generateDevicePairingCode: async (_: any, { input }: { input: { organizationId: string } }) => {
      try {
        const code = generatePairingCode();
        const qrCodeValue = generateQRCodeValue(code, input.organizationId);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const pairingCode = await prisma.pairingCode.create({
          data: {
            code,
            qrCodeValue,
            organizationId: input.organizationId,
            expiresAt
          }
        });

        return {
          code: pairingCode.code,
          expiresAt: pairingCode.expiresAt.toISOString(),
          qrCodeValue: pairingCode.qrCodeValue
        };
      } catch (error) {
        throw new GraphQLError(`Failed to generate pairing code: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pairSignageDevice: async (_: any, { input }: { input: { pairingCode: string; deviceName?: string } }) => {
      try {
        const pairingCode = await prisma.pairingCode.findUnique({
          where: { code: input.pairingCode }
        });

        if (!pairingCode) {
          return {
            success: false,
            message: 'Invalid pairing code',
            device: null,
            token: null
          };
        }

        if (pairingCode.isUsed) {
          return {
            success: false,
            message: 'Pairing code already used',
            device: null,
            token: null
          };
        }

        if (new Date() > pairingCode.expiresAt) {
          return {
            success: false,
            message: 'Pairing code expired',
            device: null,
            token: null
          };
        }

        // Create or update device
        const deviceToken = generateDeviceToken(pairingCode.id);
        
        const device = await prisma.device.create({
          data: {
            name: input.deviceName || `Device ${Date.now()}`,
            status: DeviceStatus.ONLINE,
            organizationId: pairingCode.organizationId,
            deviceToken,
            lastSeenAt: new Date()
          }
        });

        // Mark pairing code as used and associate with device
        await prisma.pairingCode.update({
          where: { id: pairingCode.id },
          data: {
            isUsed: true,
            deviceId: device.id
          }
        });

        return {
          success: true,
          message: 'Device paired successfully',
          device,
          token: deviceToken
        };
      } catch (error) {
        throw new GraphQLError(`Failed to pair device: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assignPlaylistToDevice: async (_: any, { input }: { input: { organizationId: string; deviceId: string; playlistId?: string } }) => {
      try {
        const device = await prisma.device.findFirst({
          where: {
            id: input.deviceId,
            organizationId: input.organizationId
          }
        });

        if (!device) {
          throw new GraphQLError('Device not found or access denied');
        }

        const updatedDevice = await prisma.device.update({
          where: { id: input.deviceId },
          data: {
            currentPlaylistId: input.playlistId || null
          },
          include: {
            currentPlaylist: {
              include: {
                items: {
                  include: {
                    media: true
                  },
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        });

        return updatedDevice;
      } catch (error) {
        throw new GraphQLError(`Failed to assign playlist to device: ${error}`);
      }
    },

    // Media mutations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uploadSignageMedia: async (_: any, { input }: { input: any }) => {
      try {
        // In production, handle actual file upload here
        const url = `https://cdn.example.com/signage/${generateId()}.${input.type.toLowerCase()}`;
        const thumbnailUrl = input.type === 'VIDEO' || input.type === 'IMAGE' 
          ? `https://cdn.example.com/thumbnails/${generateId()}.jpg` 
          : null;

        const media = await prisma.signageMedia.create({
          data: {
            name: input.name,
            type: input.type,
            mimeType: input.mimeType,
            url,
            thumbnailUrl,
            sizeBytes: input.sizeBytes,
            durationSeconds: input.durationSeconds,
            width: input.width,
            height: input.height,
            organizationId: input.organizationId,
            uploadedByUserId: input.uploadedByUserId
          },
          include: {
            uploadedBy: true
          }
        });

        return media;
      } catch (error) {
        throw new GraphQLError(`Failed to upload media: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deleteSignageMedia: async (_: any, { id }: { id: string }) => {
      try {
        await prisma.signageMedia.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Media deleted successfully',
          media: null
        };
      } catch (error) {
        throw new GraphQLError(`Failed to delete media: ${error}`);
      }
    },

    // Playlist mutations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createPlaylist: async (_: any, { input }: { input: any }) => {
      try {
        const playlist = await prisma.playlist.create({
          data: {
            name: input.name,
            description: input.description,
            organizationId: input.organizationId,
            createdByUserId: input.createdByUserId
          },
          include: {
            createdBy: true,
            items: {
              include: {
                media: true
              },
              orderBy: { order: 'asc' }
            }
          }
        });

        return playlist;
      } catch (error) {
        throw new GraphQLError(`Failed to create playlist: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addMediaToPlaylist: async (_: any, { input }: { input: any }) => {
      try {
        // Get the next order if not specified
        let order = input.order;
        if (!order) {
          const lastItem = await prisma.playlistItem.findFirst({
            where: { playlistId: input.playlistId },
            orderBy: { order: 'desc' }
          });
          order = (lastItem?.order || 0) + 1;
        }

        await prisma.playlistItem.create({
          data: {
            playlistId: input.playlistId,
            mediaId: input.mediaId,
            order,
            durationSeconds: input.durationSeconds
          }
        });

        // Calculate total duration
        const items = await prisma.playlistItem.findMany({
          where: { playlistId: input.playlistId }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalDuration = items.reduce((sum: number, item: any) => sum + item.durationSeconds, 0);

        // Update playlist with total duration
        const playlist = await prisma.playlist.update({
          where: { id: input.playlistId },
          data: { totalDuration },
          include: {
            createdBy: true,
            items: {
              include: {
                media: true
              },
              orderBy: { order: 'asc' }
            }
          }
        });

        return playlist;
      } catch (error) {
        throw new GraphQLError(`Failed to add media to playlist: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatePlaylist: async (_: any, { id, input }: { id: string; input: any }) => {
      try {
        const playlist = await prisma.playlist.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description,
            isActive: input.isActive
          },
          include: {
            createdBy: true,
            items: {
              include: {
                media: true
              },
              orderBy: { order: 'asc' }
            }
          }
        });

        return {
          success: true,
          message: 'Playlist updated successfully',
          playlist
        };
      } catch (error) {
        throw new GraphQLError(`Failed to update playlist: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deletePlaylist: async (_: any, { id }: { id: string }) => {
      try {
        await prisma.playlist.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Playlist deleted successfully',
          playlist: null
        };
      } catch (error) {
        throw new GraphQLError(`Failed to delete playlist: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    removeMediaFromPlaylist: async (_: any, { playlistId, mediaId }: { playlistId: string; mediaId: string }) => {
      try {
        await prisma.playlistItem.deleteMany({
          where: {
            playlistId,
            mediaId
          }
        });

        // Recalculate total duration
        const items = await prisma.playlistItem.findMany({
          where: { playlistId }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const totalDuration = items.reduce((sum: number, item: any) => sum + item.durationSeconds, 0);

        const playlist = await prisma.playlist.update({
          where: { id: playlistId },
          data: { totalDuration },
          include: {
            createdBy: true,
            items: {
              include: {
                media: true
              },
              orderBy: { order: 'asc' }
            }
          }
        });

        return {
          success: true,
          message: 'Media removed from playlist successfully',
          playlist
        };
      } catch (error) {
        throw new GraphQLError(`Failed to remove media from playlist: ${error}`);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateDeviceStatus: async (_: any, { deviceId, status }: { deviceId: string; status: DeviceStatus }) => {
      try {
        const device = await prisma.device.update({
          where: { id: deviceId },
          data: {
            status,
            lastSeenAt: new Date()
          },
          include: {
            currentPlaylist: true
          }
        });

        return {
          success: true,
          message: 'Device status updated successfully',
          device
        };
      } catch (error) {
        throw new GraphQLError(`Failed to update device status: ${error}`);
      }
    }
  }
}; 