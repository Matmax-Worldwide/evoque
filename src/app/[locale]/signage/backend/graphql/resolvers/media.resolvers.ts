import { GraphQLMedia, UploadMediaInput } from './../types/media.types';

// Placeholder for media data (in-memory store)
// In a real app, use a database.
interface StoredMedia extends GraphQLMedia {
  // any internal-only fields if needed
}
const mediaStore: Map<string, StoredMedia> = new Map();

// Helper to generate a random UUID (simple version for demo)
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const mediaResolvers = {
  Query: {
    getMedia: async (_: any, { id, organizationId }: { id: string, organizationId: string }): Promise<StoredMedia | null> => {
      const media = mediaStore.get(id);
      if (media && media.organizationId === organizationId) {
        return media;
      }
      console.log(`Media not found or org mismatch: id=${id}, orgId=${organizationId}`);
      return null;
    },
    listMedia: async (_: any, { organizationId }: { organizationId: string }): Promise<StoredMedia[]> => {
      const orgMedia: StoredMedia[] = [];
      for (const media of mediaStore.values()) {
        if (media.organizationId === organizationId) {
          orgMedia.push(media);
        }
      }
      return orgMedia;
    },
  },
  Mutation: {
    uploadMedia: async (_: any, { input }: { input: UploadMediaInput }): Promise<StoredMedia> => {
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

      const mediaId = uuidv4();
      const nowISO = new Date().toISOString();

      // Simulate CDN URL
      const simulatedUrl = `https://cdn.example.com/${organizationId}/${mediaId}/${name.replace(/\s+/g, '_')}`;
      const simulatedThumbnailUrl = type === 'IMAGE' || type === 'VIDEO'
        ? `https://cdn.example.com/${organizationId}/${mediaId}/thumbnail.jpg`
        : undefined;

      const newMedia: StoredMedia = {
        id: mediaId,
        name,
        type: type as 'VIDEO' | 'IMAGE' | 'AUDIO' | 'URL' | 'WIDGET', // Cast for store
        mimeType: mimeType || null,
        url: simulatedUrl,
        thumbnailUrl: simulatedThumbnailUrl || null,
        sizeBytes: sizeBytes || null,
        durationSeconds: durationSeconds || null,
        width: width || null,
        height: height || null,
        organizationId,
        uploadedByUserId,
        createdAt: nowISO,
        updatedAt: nowISO,
      };

      mediaStore.set(mediaId, newMedia);
      console.log(`Media '${name}' (ID: ${mediaId}) uploaded for org ${organizationId}. URL: ${simulatedUrl}`);

      return newMedia;
    },
  },
};
