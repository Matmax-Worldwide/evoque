// src/app/[locale]/signage/backend/graphql/resolvers/index.ts

import { deviceResolvers } from './device.resolvers';
import { mediaResolvers } from './media.resolvers';
import { playlistResolvers } from './playlist.resolvers';
import { scheduleResolvers } from './schedule.resolvers'; // Added scheduleResolvers
import { merge } from 'lodash'; // Or any other deep merge utility

// The refactored resolvers (device, media, playlist) and the new scheduleResolvers
// no longer rely on injected in-memory stores (for those refactored).
// They assume a Prisma Client instance is available,
// typically via context or a shared import like '@/lib/prisma'.

// The getRootResolver function now simply merges the resolver maps.
// Any necessary Prisma client instance should be provided to the GraphQL server
// execution context, which then passes it to each resolver.

export const getRootResolver = () => {
  // Deep merge the individual resolver objects.
  // Lodash merge handles nested Query, Mutation, and Type resolvers correctly.
  return merge(
    {},
    deviceResolvers,
    mediaResolvers,
    playlistResolvers,
    scheduleResolvers // Added scheduleResolvers to the merge
  );
};

// Example of how it might look with manual merging if lodash isn't preferred:
// export const getManualRootResolver = () => {
//   return {
//     Query: {
//       ...deviceResolvers.Query,
//       ...mediaResolvers.Query,
//       ...playlistResolvers.Query,
//       ...scheduleResolvers.Query, // Added schedule queries
//     },
//     Mutation: {
//       ...deviceResolvers.Mutation,
//       ...mediaResolvers.Mutation,
//       ...playlistResolvers.Mutation,
//       ...scheduleResolvers.Mutation, // Added schedule mutations
//     },
//     // If there are type-specific resolvers like Device.currentPlaylist, PlaylistItem.media,
//     // ScheduledEvent.playlist, etc., they need to be merged correctly under their type names.
//     Device: deviceResolvers.Device,
//     // PlaylistItem: playlistResolvers.PlaylistItem, (if it exists)
//     // Media: mediaResolvers.Media, (if it exists)
//     ScheduledEvent: scheduleResolvers.ScheduledEvent, // Added ScheduledEvent type resolver
//     // RecurrenceException: scheduleResolvers.RecurrenceException, (if it exists)
//   };
// };

// Note: If any of the individual resolver files (device.resolvers.ts, etc.)
// define type-specific resolvers (e.g., for fields on 'Device' or 'Playlist' or 'ScheduledEvent'),
// lodash.merge will handle them correctly. For manual merge, ensure they are included.
// For example, device.resolvers.ts includes a 'Device' type resolver for 'currentPlaylist'.
// schedule.resolvers.ts includes a 'ScheduledEvent' type resolver.
// These should be automatically merged by lodash.merge.
