import { GraphQLPlaylist, GraphQLPlaylistItem, CreatePlaylistInput, AddMediaToPlaylistInput } from './../types/playlist.types';
import { GraphQLMedia } from './../types/media.types';

// HACK: Access to mediaStore from media.resolvers.ts
let mediaStoreRef: Map<string, GraphQLMedia>;
export const __setMediaStoreRef = (store: Map<string, GraphQLMedia>) => {
    console.log("Setting mediaStoreRef in playlist.resolvers");
    mediaStoreRef = store;
};

// HACK: Access to pairedDevicesStore from device.resolvers.ts
let pairedDevicesStoreRef_PlaylistResolver: Map<string, any>; // Should be Map<string, StoredDevice-like>
export const __setPairedDevicesStoreRef_PlaylistResolver = (store: Map<string, any>) => {
    console.log("Setting pairedDevicesStoreRef_PlaylistResolver in playlist.resolvers");
    pairedDevicesStoreRef_PlaylistResolver = store;
};

interface StoredPlaylistItem {
  id: string;
  playlistId: string;
  mediaId: string;
  order: number;
  durationSeconds: number;
  createdAt: string;
}
interface StoredPlaylist {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  itemIds: string[];
}

// Exporting playlistsStoreInstance for device.resolvers.ts to use via root index.ts
export const playlistsStoreInstance = new Map<string, StoredPlaylist>();
const playlistItemsStore: Map<string, StoredPlaylistItem> = new Map();

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const resolveStoredPlaylistToGraphQL = (playlist: StoredPlaylist): GraphQLPlaylist => {
    const items: GraphQLPlaylistItem[] = playlist.itemIds
        .map(itemId => playlistItemsStore.get(itemId))
        .filter((item): item is StoredPlaylistItem => !!item)
        .sort((a, b) => a.order - b.order)
        .map(storedItem => {
            if (!mediaStoreRef) {
                console.warn(`mediaStoreRef not set in playlist.resolvers. Cannot resolve media for item ${storedItem.id}`);
                return null; // Or a placeholder indicating media is missing
            }
            const media = mediaStoreRef.get(storedItem.mediaId);
            if (!media) {
                console.error(`Media not found for playlist item mediaId: ${storedItem.mediaId} in playlist ${playlist.id}`);
                return null;
            }
            const resolvedMedia: GraphQLMedia = { ...media }; // Assuming media matches GraphQLMedia
            return {
                id: storedItem.id,
                media: resolvedMedia,
                order: storedItem.order,
                durationSeconds: storedItem.durationSeconds,
                createdAt: storedItem.createdAt,
            };
        })
        .filter((item): item is GraphQLPlaylistItem => !!item);

    return {
        ...playlist,
        items,
    };
};

export const playlistResolvers = {
  Query: {
    getPlaylist: async (_: any, { id, organizationId }: { id: string, organizationId: string }): Promise<GraphQLPlaylist | null> => {
      const playlist = playlistsStoreInstance.get(id); // Use instance
      if (playlist && playlist.organizationId === organizationId) {
        if (!mediaStoreRef) console.warn("mediaStoreRef not set in playlistResolvers. PlaylistItem.media will be unresolved.");
        return resolveStoredPlaylistToGraphQL(playlist);
      }
      return null;
    },
    listPlaylists: async (_: any, { organizationId }: { organizationId: string }): Promise<GraphQLPlaylist[]> => {
      if (!mediaStoreRef) console.warn("mediaStoreRef not set in playlistResolvers. PlaylistItem.media will be unresolved.");
      const orgPlaylists: GraphQLPlaylist[] = [];
      for (const playlist of playlistsStoreInstance.values()) { // Use instance
        if (playlist.organizationId === organizationId) {
          orgPlaylists.push(resolveStoredPlaylistToGraphQL(playlist));
        }
      }
      return orgPlaylists;
    },
    getPlaylistForDevice: async (_: any, { deviceId }: { deviceId: string }): Promise<GraphQLPlaylist | null> => {
      if (!pairedDevicesStoreRef_PlaylistResolver) {
          console.error("pairedDevicesStoreRef_PlaylistResolver not set. Cannot fetch device info.");
          throw new Error("Internal server configuration error: Device store not available.");
      }
      const device = pairedDevicesStoreRef_PlaylistResolver.get(deviceId);
      if (!device) {
        console.warn(`Device not found for getPlaylistForDevice: ${deviceId}`);
        return null;
      }

      const currentPlaylistId = device.currentPlaylistId;
      if (!currentPlaylistId) {
        console.log(`Device ${deviceId} has no assigned playlist.`);
        return null;
      }

      const playlist = playlistsStoreInstance.get(currentPlaylistId); // Use instance
      if (playlist && playlist.organizationId === device.organizationId) {
        if (!mediaStoreRef) console.warn("mediaStoreRef not set in playlistResolvers. PlaylistItem.media will be unresolved.");
        return resolveStoredPlaylistToGraphQL(playlist);
      }
      console.warn(`Playlist ${currentPlaylistId} not found or org mismatch for device ${deviceId}.`);
      return null;
    }
  },
  Mutation: {
    createPlaylist: async (_: any, { input }: { input: CreatePlaylistInput }): Promise<GraphQLPlaylist> => {
      const { organizationId, createdByUserId, name, description } = input;
      const playlistId = uuidv4();
      const nowISO = new Date().toISOString();

      const newPlaylist: StoredPlaylist = {
        id: playlistId,
        name,
        description: description || null,
        organizationId,
        createdByUserId,
        createdAt: nowISO,
        updatedAt: nowISO,
        itemIds: [],
      };
      playlistsStoreInstance.set(playlistId, newPlaylist); // Use instance
      console.log(`Playlist '${name}' (ID: ${playlistId}) created for org ${organizationId}.`);
      if (!mediaStoreRef) console.warn("mediaStoreRef not set in playlistResolvers. PlaylistItem.media will be unresolved for new playlist.");
      return resolveStoredPlaylistToGraphQL(newPlaylist);
    },
    addMediaToPlaylist: async (_: any, { input }: { input: AddMediaToPlaylistInput }): Promise<GraphQLPlaylist | null> => {
      const { organizationId, playlistId, mediaId, durationSeconds } = input;
      let { order } = input;

      if (!mediaStoreRef) {
        console.error("mediaStoreRef not set in playlistResolvers. Cannot validate media or resolve PlaylistItem.media.");
        throw new Error("Internal server configuration error: media store not available for playlists.");
      }

      const playlist = playlistsStoreInstance.get(playlistId); // Use instance
      if (!playlist || playlist.organizationId !== organizationId) {
        throw new Error("Playlist not found or access denied.");
      }

      const media = mediaStoreRef.get(mediaId);
      if (!media || media.organizationId !== organizationId) {
        throw new Error("Media not found or access denied.");
      }

      const itemId = uuidv4();
      const nowISO = new Date().toISOString();
      const currentItems = playlist.itemIds.map(id => playlistItemsStore.get(id)!).filter(Boolean).sort((a,b) => a.order - b.order);

      if (order === undefined || order === null || order < 0 || order > currentItems.length) {
        order = currentItems.length;
      }

      for (let i = 0; i < currentItems.length; i++) {
        if (currentItems[i].order >= order) {
          currentItems[i].order++;
          playlistItemsStore.set(currentItems[i].id, currentItems[i]);
        }
      }

      const newPlaylistItem: StoredPlaylistItem = {
        id: itemId,
        playlistId,
        mediaId,
        order,
        durationSeconds,
        createdAt: nowISO,
      };
      playlistItemsStore.set(itemId, newPlaylistItem);

      const updatedItemIds = [...currentItems.map(item => item.id)];
      updatedItemIds.splice(order, 0, itemId);
      playlist.itemIds = updatedItemIds;
      playlist.updatedAt = nowISO;
      playlistsStoreInstance.set(playlistId, playlist); // Use instance

      console.log(`Media ID ${mediaId} added to playlist ID ${playlistId} at order ${order}.`);
      return resolveStoredPlaylistToGraphQL(playlist);
    },
  },
};
