// src/app/[locale]/signage/backend/graphql/resolvers/media.resolvers.ts
import { PrismaClient, MediaType, Prisma, Media as PrismaMedia } from '@prisma/client';
import prisma from '@/lib/prisma';

// Helper (if not already globally available or imported)
const uuidv4 = (): string => {
    let d = new Date().getTime();
    let d2 = (performance && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        let r = Math.random() * 16;
        if (d > 0) {
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};

const serializeMediaObject = (media: PrismaMedia | null): any | null => {
    if (!media) return null;
    return {
        ...media,
        createdAt: new Date(media.createdAt).toISOString(),
        updatedAt: new Date(media.updatedAt).toISOString(),
        // contentHash is already a string or null
        // Other fields like sizeBytes, durationSeconds, width, height are numbers or null
    };
};

export const mediaResolvers = {
  Query: {
    getMedia: async (_: any, { id, organizationId }: { id: string, organizationId: string }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      try {
        const media = await db.media.findUnique({ where: { id } });
        if (media && media.organizationId !== organizationId) {
          // This check should ideally be part of query if using RLS or service layer auth
          throw new Error("Access denied: Media does not belong to this organization.");
        }
        if (!media) {
            throw new Error("Media not found.");
        }
        return serializeMediaObject(media);
      } catch (error: any) {
        console.error(`Error fetching media ${id}:`, error);
        throw new Error(error.message || `Failed to fetch media.`);
      }
    },
    listMedia: async (_: any, { organizationId }: { organizationId: string }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      try {
        const mediaItems = await db.media.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' }
        });
        return mediaItems.map(serializeMediaObject);
      } catch (error) {
        console.error(`Error fetching media for org ${organizationId}:`, error);
        throw new Error(`Failed to fetch media.`);
      }
    },
  },
  Mutation: {
    uploadMedia: async (_: any, { input }: { input: { organizationId: string, uploadedByUserId: string, name: string, type: string, mimeType?: string, sizeBytes?: number, durationSeconds?: number, width?: number, height?: number, contentHash?: string | null } }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const { organizationId, uploadedByUserId, name, type, mimeType, sizeBytes, durationSeconds, width, height, contentHash } = input;

      // In a real system, file upload to S3/GCS and URL/hash generation would occur here or in a service.
      // The URL and contentHash would then be passed to this resolver.
      // For now, we simulate URL and use provided/generated hash.
      const generatedId = uuidv4(); // Prisma can auto-generate IDs with @default(uuid())
      const simulatedUrl = `https://cdn.example.com/${organizationId}/${generatedId}/${name.replace(/\s+/g, '_')}`;
      const simulatedThumbnailUrl = (type === 'VIDEO' || type === 'IMAGE')
        ? `https://cdn.example.com/${organizationId}/${generatedId}/thumbnail.jpg`
        : undefined;

      // Conceptual: If contentHash is not provided, it should be calculated from the file.
      // For this mock, we use the input or generate a placeholder.
      const finalContentHash = contentHash || `mockhash-${uuidv4().substring(0,8)}`;

      try {
        const newMedia = await db.media.create({
          data: {
            // id: generatedId, // Let Prisma generate ID unless needed for URL pre-construction
            name,
            type: type as MediaType, // Assumes GQL type string matches Prisma enum
            mimeType: mimeType || null,
            url: simulatedUrl,
            thumbnailUrl: simulatedThumbnailUrl || null,
            sizeBytes: sizeBytes || null,
            durationSeconds: durationSeconds || null,
            width: width || null,
            height: height || null,
            contentHash: finalContentHash,
            organizationId,
            uploadedByUserId,
            // metadata: Prisma.JsonNull, // Example for setting a Json field to null
          }
        });
        console.log(`Media '${name}' (ID: ${newMedia.id}) metadata saved for org ${organizationId}.`);
        return serializeMediaObject(newMedia);
      } catch (error) {
        console.error(`Error uploading media metadata for ${name}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Handle specific Prisma errors if needed, e.g., P2002 for unique constraints
        }
        throw new Error(`Failed to upload media metadata.`);
      }
    },
  },
};
