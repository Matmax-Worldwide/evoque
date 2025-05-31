// src/app/[locale]/signage/backend/graphql/types/schedule.types.ts

// Assuming global GraphQLDateTime scalar is mapped to string (ISO Date) or Date object
// And Playlist type would be imported from its own types file.
// import { GraphQLPlaylist } from './playlist.types';

// For now, define a simplified GraphQLPlaylist for structure
interface PlaceholderGraphQLPlaylist {
    id: string;
    name: string;
}

export enum GraphQLTargetType {
  DEVICE = 'DEVICE',
  DEVICE_GROUP = 'DEVICE_GROUP',
}

export interface GraphQLEventTarget {
  id: string;
  name: string;
  type: GraphQLTargetType;
}

export interface GraphQLRecurrenceException {
  id: string;
  originalInstanceDate: string; // ISO DateTime string
  isCancelled: boolean;
  newStartTime?: string | null; // ISO DateTime string
  newEndTime?: string | null;   // ISO DateTime string
  newPlaylistId?: string | null;
  newPlaylist?: PlaceholderGraphQLPlaylist | null; // Simplified for this type file
  // newTargets?: GraphQLEventTarget[] | null;
  // newTitle?: string | null;
  createdAt: string; // ISO DateTime string
  updatedAt: string; // ISO DateTime string
}

export interface GraphQLScheduledEvent {
  id: string;
  title?: string | null;
  startTime: string; // ISO DateTime string
  endTime: string;   // ISO DateTime string
  allDay: boolean;
  rrule?: string | null;
  timezone?: string | null;
  playlistId: string;
  playlist?: PlaceholderGraphQLPlaylist | null; // Simplified
  targets: GraphQLEventTarget[];
  playlistName?: string | null; // Denormalized for display
  targetNames?: string[] | null; // Denormalized for display
  organizationId: string;
  // createdByUserId?: string | null;
  exceptions?: GraphQLRecurrenceException[] | null;
  createdAt: string; // ISO DateTime string
  updatedAt: string; // ISO DateTime string
}


// --- Input Types ---

export interface GraphQLScheduledEventTargetInput {
  id: string;
  type: GraphQLTargetType;
}

export interface GraphQLCreateScheduledEventInput {
  title?: string | null;
  playlistId: string;
  targetInputs: GraphQLScheduledEventTargetInput[];
  startTime: string; // ISO DateTime string
  endTime: string;   // ISO DateTime string
  allDay?: boolean | null;
  rrule?: string | null;
  timezone?: string | null;
  organizationId: string;
  // createdByUserId: string;
}

export interface GraphQLUpdateScheduledEventInput {
  title?: string | null;
  playlistId?: string | null;
  targetInputs?: GraphQLScheduledEventTargetInput[] | null;
  startTime?: string | null; // ISO DateTime string
  endTime?: string | null;   // ISO DateTime string
  allDay?: boolean | null;
  rrule?: string | null;
  timezone?: string | null;
}

// Simplified input for recurrence exceptions for now
// export interface GraphQLRecurrenceExceptionInput { ... }
