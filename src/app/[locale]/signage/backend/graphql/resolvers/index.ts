import {
    deviceResolvers,
    __setPlaylistsStoreRef_DeviceResolver,
    pairedDevicesStoreInstance // Expecting device.resolvers.ts to export this
} from './device.resolvers';
import {
    mediaResolvers,
    // mediaStoreInstance // Expecting media.resolvers.ts to export this (will attempt dynamic require)
} from './media.resolvers';
import {
    playlistResolvers,
    __setMediaStoreRef,
    __setPairedDevicesStoreRef_PlaylistResolver,
    playlistsStoreInstance // Expecting playlist.resolvers.ts to export this
} from './playlist.resolvers';
import { merge } from 'lodash';
import { GraphQLMedia } from './../types/media.types';

// --- Attempt to wire up shared stores ---
// This is a hacky way to do dependency injection for the in-memory demo.
// In a real app, use a proper DI framework or pass context through resolvers.

// 1. Inject mediaStore into playlistResolvers
try {
  const mediaModule = require('./media.resolvers');
  let actualMediaStore: Map<string, GraphQLMedia> | undefined;

  if (mediaModule.mediaStoreInstance) {
    actualMediaStore = mediaModule.mediaStoreInstance;
  } else if (mediaModule.mediaStore) {
    actualMediaStore = mediaModule.mediaStore;
  }

  if (actualMediaStore) {
    __setMediaStoreRef(actualMediaStore);
    console.log("Successfully injected mediaStore into playlistResolvers.");
  } else {
    console.warn(
      "Failed to find 'mediaStoreInstance' or 'mediaStore' export in media.resolvers.ts. " +
      "PlaylistItem.media resolution will likely fail."
    );
  }
} catch (e) {
  console.warn(
    "Error importing/accessing mediaStoreInstance from media.resolvers.ts. " +
    "PlaylistItem.media resolution will likely fail.", e
  );
}

// 2. Inject playlistsStore into deviceResolvers
if (playlistsStoreInstance) {
  __setPlaylistsStoreRef_DeviceResolver(playlistsStoreInstance);
  console.log("Successfully injected playlistsStoreInstance into deviceResolvers.");
} else {
  console.warn(
    "playlistsStoreInstance is not available from playlist.resolvers.ts. " +
    "assignPlaylistToDevice mutation in deviceResolvers might fail to validate playlists."
  );
}

// 3. Inject pairedDevicesStore into playlistResolvers
if (pairedDevicesStoreInstance) {
  __setPairedDevicesStoreRef_PlaylistResolver(pairedDevicesStoreInstance);
  console.log("Successfully injected pairedDevicesStoreInstance into playlistResolvers.");
} else {
  console.warn(
    "pairedDevicesStoreInstance is not available from device.resolvers.ts. " +
    "getPlaylistForDevice query in playlistResolvers might fail."
  );
}

// --- Merge all resolvers ---
export const rootResolver = merge(
  {},
  deviceResolvers,
  mediaResolvers,
  playlistResolvers
);

// Note on store exports:
// device.resolvers.ts should have: `export const pairedDevicesStoreInstance = new Map<string, StoredDevice>();`
// playlist.resolvers.ts should have: `export const playlistsStoreInstance = new Map<string, StoredPlaylist>();`
// media.resolvers.ts (from a previous step) should ideally have: `export const mediaStoreInstance = mediaStore;`
// If these exports are not in place, the injections above will fail.
