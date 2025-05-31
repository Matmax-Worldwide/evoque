// src/app/[locale]/signage/backend/graphql/resolvers/playlist.resolvers.ts
import { PrismaClient, Prisma, Playlist as PrismaPlaylist, PlaylistItem as PrismaPlaylistItem, Media as PrismaMedia } from '@prisma/client';
import prisma from '@/lib/prisma';

// Helper to serialize dates and structure for Playlist, its items, and nested media.
const serializePlaylistObject = (
    playlist: (PrismaPlaylist & {
        items?: (PrismaPlaylistItem & { media?: PrismaMedia | null })[]
    }) | null
): any | null => {
    if (!playlist) return null;
    const serialized = { ...playlist } as any; // Start with a basic cast

    if (playlist.createdAt instanceof Date) serialized.createdAt = playlist.createdAt.toISOString();
    if (playlist.updatedAt instanceof Date) serialized.updatedAt = playlist.updatedAt.toISOString();
    if (playlist.contentUpdatedAt instanceof Date) serialized.contentUpdatedAt = playlist.contentUpdatedAt.toISOString();
    else if (playlist.contentUpdatedAt === null) serialized.contentUpdatedAt = null;

    // version is a number, no conversion needed

    if (playlist.items) {
        serialized.items = playlist.items.map((item: any) => {
            const serializedItem = { ...item };
            if (item.createdAt instanceof Date) serializedItem.createdAt = item.createdAt.toISOString();
            if (item.updatedAt instanceof Date) serializedItem.updatedAt = item.updatedAt.toISOString();

            if (item.media && item.media.createdAt instanceof Date) {
                serializedItem.media = {
                    ...item.media,
                    createdAt: item.media.createdAt.toISOString(),
                    updatedAt: item.media.updatedAt.toISOString(),
                    // contentHash from media is already string/null
                };
            }
            return serializedItem;
        }).sort((a: { order: number }, b: { order: number }) => a.order - b.order);
    }
    return serialized;
};


export const playlistResolvers = {
  Query: {
    getPlaylist: async (_: any, { id, organizationId }: { id: string, organizationId: string }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      try {
        const playlist = await db.playlist.findUnique({
          where: { id },
          include: {
            items: { orderBy: { order: 'asc' }, include: { media: true } },
          },
        });
        if (playlist && playlist.organizationId !== organizationId) {
          throw new Error("Access denied: Playlist does not belong to this organization.");
        }
        if (!playlist) {
            throw new Error("Playlist not found.");
        }
        return serializePlaylistObject(playlist);
      } catch (error: any) {
        console.error(`Error fetching playlist ${id}:`, error);
        throw new Error(error.message || `Failed to fetch playlist.`);
      }
    },
    listPlaylists: async (_: any, { organizationId }: { organizationId: string }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      try {
        const playlists = await db.playlist.findMany({
          where: { organizationId },
          include: { items: { orderBy: { order: 'asc' }, include: { media: true } } },
          orderBy: { createdAt: 'desc' }
        });
        return playlists.map(serializePlaylistObject);
      } catch (error) {
        console.error(`Error fetching playlists for org ${organizationId}:`, error);
        throw new Error(`Failed to fetch playlists.`);
      }
    },
    getPlaylistForDevice: async (_: any, { deviceId }: { deviceId: string }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      try {
        const device = await db.device.findUnique({
          where: { id: deviceId },
          select: { currentPlaylistId: true, organizationId: true }
        });
        if (!device || !device.currentPlaylistId) return null;

        const playlist = await db.playlist.findUnique({
          where: { id: device.currentPlaylistId },
          include: { items: { orderBy: { order: 'asc' }, include: { media: true } } },
        });
        if (playlist && playlist.organizationId !== device.organizationId) {
            throw new Error(`Data integrity issue or unauthorized access: Playlist ${playlist.id} organization does not match device ${deviceId} organization.`);
        }
        return serializePlaylistObject(playlist);
      } catch (error: any) {
        console.error(`Error fetching playlist for device ${deviceId}:`, error);
        throw new Error(error.message || `Failed to fetch playlist for device.`);
      }
    },
    getPlaylistContentManifest: async (_: any, { playlistId, organizationId }: { playlistId: string, organizationId: string }, context?: { prisma?: PrismaClient }) => {
        const db = context?.prisma || prisma;
        try {
            const playlist = await db.playlist.findUnique({
                where: { id: playlistId },
                include: { items: { include: { media: true }, orderBy: { order: 'asc' } } }
            });

            if (!playlist || playlist.organizationId !== organizationId) {
                throw new Error("Playlist not found or access denied.");
            }

            const uniqueMediaItemsMap = new Map();
            playlist.items.forEach(item => {
                if (item.media && !uniqueMediaItemsMap.has(item.media.id)) {
                    uniqueMediaItemsMap.set(item.media.id, {
                        id: item.media.id,
                        url: item.media.url,
                        mimeType: item.media.mimeType,
                        sizeBytes: item.media.sizeBytes,
                        contentHash: item.media.contentHash,
                        updatedAt: new Date(item.media.updatedAt).toISOString(),
                        name: item.media.name,
                        type: item.media.type.toString(),
                    });
                }
            });

            return {
                playlistId: playlist.id,
                playlistName: playlist.name,
                version: playlist.version,
                contentUpdatedAt: playlist.contentUpdatedAt ? new Date(playlist.contentUpdatedAt).toISOString() : new Date(playlist.updatedAt).toISOString(), // Fallback for contentUpdatedAt
                mediaItems: Array.from(uniqueMediaItemsMap.values()),
            };
        } catch (error: any) {
            console.error(`Error generating content manifest for playlist ${playlistId}:`, error);
            throw new Error(error.message || "Failed to generate playlist content manifest.");
        }
    }
  },
  Mutation: {
    createPlaylist: async (_: any, { input }: { input: { organizationId: string, createdByUserId: string, name: string, description?: string | null } }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const { organizationId, createdByUserId, name, description } = input;
      try {
        const now = new Date();
        const newPlaylist = await db.playlist.create({
          data: {
            name, description: description || null, organizationId, createdByUserId,
            version: 1,
            contentUpdatedAt: now,
          }
        });
        return serializePlaylistObject({...newPlaylist, items: []});
      } catch (error) {
        console.error(`Error creating playlist "${name}":`, error);
        throw new Error(`Failed to create playlist.`);
      }
    },
    addMediaToPlaylist: async (_: any, { input }: { input: { organizationId: string, playlistId: string, mediaId: string, order?: number | null, durationSeconds: number } }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const { organizationId, playlistId, mediaId, durationSeconds } = input;
      let { order } = input;

      try {
        return await db.$transaction(async (tx) => {
          const playlist = await tx.playlist.findUnique({
            where: { id: playlistId },
            select: { organizationId: true, items: { select: { id: true, order: true } } }
          });

          if (!playlist || playlist.organizationId !== organizationId) {
            throw new Error("Playlist not found or access denied.");
          }
          const media = await tx.media.findFirst({ where: {id: mediaId, organizationId }});
          if (!media) throw new Error("Media item not found or access denied.");

          const currentItemCount = playlist.items.length;
          if (order === undefined || order === null || order < 0 || order > currentItemCount) {
            order = currentItemCount;
          } else {
            await tx.playlistItem.updateMany({
              where: { playlistId: playlistId, order: { gte: order } },
              data: { order: { increment: 1 } },
            });
          }

          await tx.playlistItem.create({
            data: {
              playlist: { connect: { id: playlistId } },
              media: { connect: { id: mediaId } },
              order,
              durationSeconds,
            },
          });

          await tx.playlist.update({
              where: { id: playlistId },
              data: {
                  version: { increment: 1 },
                  contentUpdatedAt: new Date()
              }
          });

          const updatedPlaylistWithItems = await tx.playlist.findUnique({
            where: { id: playlistId },
            include: { items: { orderBy: { order: 'asc' }, include: { media: true } } },
          });
          return serializePlaylistObject(updatedPlaylistWithItems);
        });
      } catch (error: any) {
          console.error(`Error adding media ${mediaId} to playlist ${playlistId}:`, error);
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
              throw new Error("Failed to add media: An item with this order might already exist.");
          }
          throw new Error(error.message || `Failed to add media to playlist.`);
      }
    },
  },
};
