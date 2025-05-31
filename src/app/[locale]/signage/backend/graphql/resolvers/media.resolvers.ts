// src/app/[locale]/signage/backend/graphql/resolvers/media.resolvers.ts

import { PrismaClient, MediaType, Media as PrismaMedia } from '@prisma/client';
// Standard import path for a shared Prisma Client instance
import prisma from '@/lib/prisma';

// Assuming GraphQLMedia and UploadMediaInput would be imported from types
// import { GraphQLMedia, UploadMediaInput } from './../types/media.types';

// Helper to serialize dates (if not handled by GraphQL server/scalars)
const serializeMediaDates = (media: PrismaMedia | null) => {
    if (!media) return null;
    return {
        ...media,
        createdAt: media.createdAt.toISOString(),
        updatedAt: media.updatedAt.toISOString(),
    };
};

// Helper (if not already globally available or imported)
// Used for pre-generating ID for simulated URL construction
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};


export const mediaResolvers = {
  Query: {
    getMedia: async (_: any, { id, organizationId }: { id: string, organizationId: string }) => {
      const media = await prisma.media.findUnique({
        where: { id },
      });
      // Validate organizationId if media is found
      if (media && media.organizationId !== organizationId) {
        // Or throw an authorization error
        console.warn(`Attempt to access media ${id} from unauthorized organization ${organizationId}`);
        return null;
      }
      return serializeMediaDates(media);
    },
    listMedia: async (_: any, { organizationId }: { organizationId: string }) => {
      const mediaItems = await prisma.media.findMany({
        where: { organizationId },
      });
      return mediaItems.map(serializeMediaDates);
    },
  },
  Mutation: {
    uploadMedia: async (_: any, { input }: { input: { organizationId: string, uploadedByUserId: string, name: string, type: string, mimeType?: string, sizeBytes?: number, durationSeconds?: number, width?: number, height?: number } }) => {
      const {
        organizationId,
        uploadedByUserId,
        name,
        type,
        mimeType,
        sizeBytes,
        durationSeconds,
        width,
        height
      } = input;

      const generatedId = uuidv4();
      const simulatedUrl = `https://cdn.example.com/${organizationId}/${generatedId}/${name.replace(/\s+/g, '_')}`;
      const simulatedThumbnailUrl = (type === 'VIDEO' || type === 'IMAGE')
        ? `https://cdn.example.com/${organizationId}/${generatedId}/thumbnail.jpg`
        : undefined;

      const newMedia = await prisma.media.create({
        data: {
          id: generatedId,
          name,
          type: type as MediaType, // Cast to Prisma enum MediaType
          mimeType: mimeType || null,
          url: simulatedUrl,
          thumbnailUrl: simulatedThumbnailUrl || null,
          sizeBytes: sizeBytes || null,
          durationSeconds: durationSeconds || null,
          width: width || null,
          height: height || null,
          organizationId,
          uploadedByUserId,
          // metadata: Prisma.JsonNull, // Or specific JSON structure
        }
      });

      console.log(`Media '${name}' (ID: ${newMedia.id}) metadata saved for org ${organizationId}. URL: ${newMedia.url}`);
      return serializeMediaDates(newMedia);
    },
  },
};

// Note: The in-memory 'mediaStore' or 'mediaStoreInstance' and its export are removed.
// If playlist.resolvers.ts (or any other resolver) depended on an exported in-memory store
// from this file, that dependency is now broken and needs to be updated to use Prisma,
// or the cross-resolver logic in the root resolver (index.ts) needs to be re-evaluated.
// Specifically, the __setMediaStoreRef function in playlist.resolvers.ts will no longer
// receive an in-memory store from here. Playlist resolvers should fetch media data via Prisma.
