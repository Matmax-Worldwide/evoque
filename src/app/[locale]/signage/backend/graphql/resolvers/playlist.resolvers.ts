// src/app/[locale]/signage/backend/graphql/resolvers/playlist.resolvers.ts

import { PrismaClient, Prisma, Playlist as PrismaPlaylist, PlaylistItem as PrismaPlaylistItem, Media as PrismaMedia } from '@prisma/client';
// Standard import path for a shared Prisma Client instance
import prisma from '@/lib/prisma';

// Assuming GraphQL types would be imported from their respective .types.ts files
// import { CreatePlaylistInput, AddMediaToPlaylistInput, GraphQLPlaylist, GraphQLPlaylistItem } from '../types/playlist.types';
// import { GraphQLMedia } from '../types/media.types';


// Helper to serialize dates for playlist and its items, including nested media
const serializePlaylistWithItemsDates = (playlist: (PrismaPlaylist & { items?: (PrismaPlaylistItem & { media?: PrismaMedia | null })[] }) | null) => {
    if (!playlist) return null;
    return {
        ...playlist,
        createdAt: playlist.createdAt.toISOString(),
        updatedAt: playlist.updatedAt.toISOString(),
        items: playlist.items?.map(item => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
            // No separate updatedAt for PlaylistItem in Prisma schema, so not serialized here
            media: item.media ? {
                ...item.media,
                createdAt: item.media.createdAt.toISOString(),
                updatedAt: item.media.updatedAt.toISOString(),
            } : null,
        })),
    };
};


export const playlistResolvers = {
  Query: {
    getPlaylist: async (_: any, { id, organizationId }: { id: string, organizationId: string }) => {
      const playlist = await prisma.playlist.findUnique({
        where: { id },
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: { media: true },
          },
        },
      });

      if (playlist && playlist.organizationId !== organizationId) {
        console.warn(`Attempt to access playlist ${id} from unauthorized organization ${organizationId}`);
        return null; // Or throw an authorization error
      }
      return serializePlaylistWithItemsDates(playlist);
    },
    listPlaylists: async (_: any, { organizationId }: { organizationId: string }) => {
      const playlists = await prisma.playlist.findMany({
        where: { organizationId },
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: { media: true },
          },
        },
      });
      return playlists.map(serializePlaylistWithItemsDates);
    },
    getPlaylistForDevice: async (_: any, { deviceId }: { deviceId: string }) => {
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        select: { currentPlaylistId: true, organizationId: true }
      });

      if (!device || !device.currentPlaylistId) {
        return null;
      }

      const playlist = await prisma.playlist.findUnique({
        where: { id: device.currentPlaylistId },
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: { media: true },
          },
        },
      });

      if (playlist && playlist.organizationId !== device.organizationId) {
          console.warn(`Data integrity issue or unauthorized access: Playlist ${playlist.id} organization does not match device ${deviceId} organization.`);
          return null;
      }
      return serializePlaylistWithItemsDates(playlist);
    },
  },
  Mutation: {
    createPlaylist: async (_: any, { input }: { input: { organizationId: string, createdByUserId: string, name: string, description?: string | null } }) => {
      const { organizationId, createdByUserId, name, description } = input;

      const newPlaylist = await prisma.playlist.create({
        data: {
          name,
          description: description || null,
          organizationId,
          createdByUserId,
        },
        // No need to include items for a new playlist, they will be empty.
      });
      // Return with empty items array structure for GraphQL response consistency
      return serializePlaylistWithItemsDates({ ...newPlaylist, items: [] });
    },
    addMediaToPlaylist: async (_: any, { input }: { input: { organizationId: string, playlistId: string, mediaId: string, order?: number | null, durationSeconds: number } }) => {
      const { organizationId, playlistId, mediaId, durationSeconds } = input;
      let { order } = input;

      return await prisma.$transaction(async (tx) => {
        const playlist = await tx.playlist.findUnique({
          where: { id: playlistId },
          select: { organizationId: true, items: { select: { id: true, order: true } } }
        });

        if (!playlist || playlist.organizationId !== organizationId) {
          throw new Error("Playlist not found or access denied.");
        }

        const media = await tx.media.findUnique({
          where: { id: mediaId }
        });
        if (!media || media.organizationId !== organizationId) {
          throw new Error("Media not found or access denied.");
        }

        const currentItemCount = playlist.items.length;
        if (order === undefined || order === null || order < 0 || order > currentItemCount) {
          order = currentItemCount;
        } else {
          await tx.playlistItem.updateMany({
            where: {
              playlistId: playlistId,
              order: { gte: order },
            },
            data: {
              order: { increment: 1 },
            },
          });
        }

        await tx.playlistItem.create({
          data: {
            playlistId,
            mediaId,
            order,
            durationSeconds,
            // settings: Prisma.JsonNull, // Default or from input if available
          },
        });

        // Update playlist's updatedAt timestamp
        // This is important as adding an item is a modification to the playlist
        await tx.playlist.update({
            where: { id: playlistId },
            data: { updatedAt: new Date() }
        });

        const updatedPlaylist = await tx.playlist.findUnique({
          where: { id: playlistId },
          include: {
            items: {
              orderBy: { order: 'asc' },
              include: { media: true },
            },
          },
        });
        return serializePlaylistWithItemsDates(updatedPlaylist);
      });
    },
    // TODO: Future mutations: updatePlaylistItem, removePlaylistItem, reorderPlaylistItems
  },
  // PlaylistItem field resolvers (if not using `include` extensively or for custom logic)
  // PlaylistItem: {
  //   media: async (parent: PrismaPlaylistItem, _: any) => {
  //     if (!parent.mediaId) return null;
  //     const media = await prisma.media.findUnique({ where: { id: parent.mediaId } });
  //     return media ? serializeMediaDates(media) : null; // Assuming serializeMediaDates exists
  //   }
  // }
};

// Removed in-memory stores: playlistsStore, playlistItemsStore
// Removed store injection functions: __setMediaStoreRef, __setPairedDevicesStoreRef_PlaylistResolver
// Removed playlistsStoreInstance export.
// The uuidv4 helper can be removed if not used for other purposes (e.g. client-side ID generation)
// as Prisma handles ID generation for database records.
