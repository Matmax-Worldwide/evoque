// src/app/[locale]/signage/backend/graphql/resolvers/schedule.resolvers.ts

import { PrismaClient, Prisma, TargetType as PrismaTargetType, Playlist as PrismaPlaylist, Device as PrismaDevice, ScheduledEvent as PrismaScheduledEvent, RecurrenceException as PrismaRecurrenceException } from '@prisma/client';
// ^^^ For type hints. In a real scenario, only PrismaClient might be directly imported if using it.

// --- In-Memory Database for Scheduling ---
interface MockScheduledEvent extends Omit<PrismaScheduledEvent, 'playlistId' | 'createdAt' | 'updatedAt' | 'startTime' | 'endTime'> {
    id: string; // Ensure id is always string for mock DB
    playlistId: string;
    // For mock 'include', store related objects or IDs
    playlist?: MockPlaylist;
    exceptions?: MockRecurrenceException[];
    targetDeviceIds: string[]; // Keep as string arrays as per Prisma schema
    targetDeviceGroupIds: string[];
    createdAt: Date;
    updatedAt: Date;
    startTime: Date;
    endTime: Date;
}
interface MockRecurrenceException extends Omit<PrismaRecurrenceException, 'eventId'| 'originalInstanceDate' | 'newStartTime' | 'newEndTime' | 'createdAt' | 'updatedAt' | 'newPlaylistId'> {
    id: string; // Ensure id is always string
    eventId: string;
    originalInstanceDate: Date;
    newStartTime?: Date | null;
    newEndTime?: Date | null;
    newPlaylistId?: string | null;
    newPlaylist?: MockPlaylist | null;
    createdAt: Date;
    updatedAt: Date;
}
interface MockPlaylist extends Omit<PrismaPlaylist, 'createdAt' | 'updatedAt'> {
    id: string; // Ensure id is always string
    createdAt: Date; updatedAt: Date;
}
interface MockDevice extends Omit<PrismaDevice, 'createdAt' | 'updatedAt' | 'lastSeenAt' | 'pairingCodeExpiresAt'> {
    id: string; // Ensure id is always string
    createdAt: Date; updatedAt: Date; lastSeenAt?: Date | null; pairingCodeExpiresAt?: Date | null;
}

// Sample data for related entities (used by ScheduledEvent.targets resolver)
const mockPlaylistsDb: MockPlaylist[] = [
    { id: 'pl-1', name: 'Morning Loop', description: 'Awakening content', organizationId: 'org_placeholder_123', createdByUserId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
    { id: 'pl-2', name: 'Weekend Specials', description: 'Promos', organizationId: 'org_placeholder_123', createdByUserId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
];
const mockDevicesDb: MockDevice[] = [
    { id: 'dev-1', name: 'Lobby Screen 1', status: 'ONLINE', organizationId: 'org_placeholder_123', createdAt: new Date(), updatedAt: new Date(), pairingCode: null, deviceSpecificConfig: null, firmwareVersion: null, ipAddress: null, macAddress: null, currentPlaylistId: null, lastSeenAt: null, pairingCodeExpiresAt: null },
    { id: 'dev-2', name: 'Meeting Room A', status: 'OFFLINE', organizationId: 'org_placeholder_123', createdAt: new Date(), updatedAt: new Date(), pairingCode: null, deviceSpecificConfig: null, firmwareVersion: null, ipAddress: null, macAddress: null, currentPlaylistId: null, lastSeenAt: null, pairingCodeExpiresAt: null },
];
// Conceptual Device Groups (if not a full Prisma model yet)
const mockDeviceGroupsDb = [
    { id: 'group-lobby', name: 'Lobby Screens', organizationId: 'org_placeholder_123' },
    { id: 'group-branch-all', name: 'All Branch Screens', organizationId: 'org_placeholder_123' },
];


let mockScheduledEventsDb: MockScheduledEvent[] = [];
let mockRecurrenceExceptionsDb: MockRecurrenceException[] = [];
let eventIdCounter = 1;
// let exceptionIdCounter = 1; // Not used in current mock logic for creating exceptions

// Initialize with some data
const today = new Date();
const createDateObj = (day: number, hour: number, minute: number = 0) => new Date(today.getFullYear(), today.getMonth(), day, hour, minute);
mockScheduledEventsDb = [
    { id: `event-${eventIdCounter++}`, title: 'Morning Loop @ Lobby Screen 1', playlistId: 'pl-1', targetDeviceIds: ['dev-1'], targetDeviceGroupIds: [], startTime: createDateObj(today.getDate(), 8), endTime: createDateObj(today.getDate(), 12), allDay: false, rrule: 'FREQ=DAILY;UNTIL=20241231T000000Z', timezone: 'America/New_York', organizationId: 'org_placeholder_123', createdAt: new Date(), updatedAt: new Date(), exceptions: [] },
    { id: `event-${eventIdCounter++}`, title: 'Weekend Ads @ All Branch Screens', playlistId: 'pl-2', targetDeviceIds: [], targetDeviceGroupIds: ['group-branch-all'], startTime: createDateObj(today.getDate() + 2, 10), endTime: createDateObj(today.getDate() + 2, 18), allDay: false, rrule: null, timezone: 'America/New_York', organizationId: 'org_placeholder_123', createdAt: new Date(), updatedAt: new Date(), exceptions: [] },
];


const mockPrismaScheduler = {
    scheduledEvent: {
        findUnique: async (args: { where: { id: string }, include?: any }) => {
            const event = mockScheduledEventsDb.find(e => e.id === args.where.id);
            if (!event) return null;
            let resolvedEvent: any = { ...event };
            if (args.include?.playlist) {
                resolvedEvent.playlist = mockPlaylistsDb.find(p => p.id === event.playlistId) || null;
            }
            if (args.include?.exceptions && args.include.exceptions.include?.newPlaylist) {
                resolvedEvent.exceptions = mockRecurrenceExceptionsDb.filter(ex => ex.eventId === event.id)
                    .map(ex => ex.newPlaylistId ?
                        {...ex, newPlaylist: mockPlaylistsDb.find(p=>p.id === ex.newPlaylistId)} : ex);
            } else if (args.include?.exceptions) {
                 resolvedEvent.exceptions = mockRecurrenceExceptionsDb.filter(ex => ex.eventId === event.id);
            }
            return resolvedEvent;
        },
        findMany: async (args: { where?: any, include?: any, orderBy?: any }) => {
            let events = mockScheduledEventsDb;
            if (args.where?.organizationId) {
                events = events.filter(e => e.organizationId === args.where.organizationId);
            }
            if (args.where?.OR && Array.isArray(args.where.OR)) {
                const orConditions = args.where.OR;
                events = events.filter(e => {
                    return orConditions.some((cond:any) => {
                        if(cond.rrule === null && cond.startTime?.lt && cond.endTime?.gt) {
                            return e.rrule === null && e.startTime < new Date(cond.startTime.lt) && e.endTime > new Date(cond.endTime.gt);
                        }
                        if(cond.rrule?.not === null && cond.startTime?.lt) {
                             return e.rrule !== null && e.startTime < new Date(cond.startTime.lt);
                        }
                        return false;
                    });
                });
            }
            if (args.where?.AND && Array.isArray(args.where.AND)) {
                 args.where.AND.forEach((andCond: any) => {
                     if(andCond.OR && Array.isArray(andCond.OR)){
                         const targetConditions = andCond.OR;
                         events = events.filter(e => {
                            return targetConditions.some((tCond: any) => {
                                if(tCond.targetDeviceIds?.hasSome) return tCond.targetDeviceIds.hasSome.some((id: string) => e.targetDeviceIds.includes(id));
                                if(tCond.targetDeviceGroupIds?.hasSome) return tCond.targetDeviceGroupIds.hasSome.some((id: string) => e.targetDeviceGroupIds.includes(id));
                                return false;
                            });
                         });
                     }
                 });
            }

            if (args.orderBy?.startTime) {
                events.sort((a, b) => (a.startTime.getTime() - b.startTime.getTime()) * (args.orderBy.startTime === 'asc' ? 1 : -1));
            }

            return events.map(event => {
                let resolvedEvent: any = { ...event };
                if (args.include?.playlist) {
                    resolvedEvent.playlist = mockPlaylistsDb.find(p => p.id === event.playlistId) || null;
                }
                if (args.include?.exceptions && args.include.exceptions.include?.newPlaylist) {
                     resolvedEvent.exceptions = mockRecurrenceExceptionsDb.filter(ex => ex.eventId === event.id)
                        .map(ex => ex.newPlaylistId ?
                            {...ex, newPlaylist: mockPlaylistsDb.find(p=>p.id === ex.newPlaylistId)} : ex);
                } else if (args.include?.exceptions) {
                     resolvedEvent.exceptions = mockRecurrenceExceptionsDb.filter(ex => ex.eventId === event.id);
                }
                return resolvedEvent;
            });
        },
        create: async (args: { data: any, include?: any }) => {
            const newEventData = { ...args.data };
            const playlistId = newEventData.playlist?.connect?.id;
            delete newEventData.playlist; // Remove connect object

            const newEvent: MockScheduledEvent = {
                ...newEventData,
                id: `event-${eventIdCounter++}`,
                playlistId: playlistId,
                startTime: new Date(args.data.startTime),
                endTime: new Date(args.data.endTime),
                createdAt: new Date(),
                updatedAt: new Date(),
                targetDeviceIds: args.data.targetDeviceIds || [],
                targetDeviceGroupIds: args.data.targetDeviceGroupIds || [],
                exceptions: [],
            };
            mockScheduledEventsDb.push(newEvent);
            let resolvedEvent: any = { ...newEvent };
            if (args.include?.playlist) {
                resolvedEvent.playlist = mockPlaylistsDb.find(p => p.id === newEvent.playlistId) || null;
            }
            return resolvedEvent;
        },
        update: async (args: { where: { id: string }, data: any, include?: any }) => {
            const index = mockScheduledEventsDb.findIndex(e => e.id === args.where.id);
            if (index === -1) throw new Error("Event not found for update");

            const updatedEventData = { ...mockScheduledEventsDb[index], ...args.data };
            if(args.data.startTime) updatedEventData.startTime = new Date(args.data.startTime);
            if(args.data.endTime) updatedEventData.endTime = new Date(args.data.endTime);
            if(args.data.playlist?.connect?.id) updatedEventData.playlistId = args.data.playlist.connect.id;
            delete updatedEventData.playlist;

            updatedEventData.updatedAt = new Date();
            mockScheduledEventsDb[index] = updatedEventData;

            let resolvedEvent: any = { ...updatedEventData };
             if (args.include?.playlist) {
                resolvedEvent.playlist = mockPlaylistsDb.find(p => p.id === updatedEventData.playlistId) || null;
            }
            if (args.include?.exceptions && args.include.exceptions.include?.newPlaylist) {
                resolvedEvent.exceptions = mockRecurrenceExceptionsDb.filter(ex => ex.eventId === updatedEventData.id)
                    .map(ex => ex.newPlaylistId ?
                        {...ex, newPlaylist: mockPlaylistsDb.find(p=>p.id === ex.newPlaylistId)} : ex);
            } else if (args.include?.exceptions) {
                resolvedEvent.exceptions = mockRecurrenceExceptionsDb.filter(ex => ex.eventId === updatedEventData.id);
            }
            return resolvedEvent;
        },
        delete: async (args: { where: { id: string } }) => {
            const index = mockScheduledEventsDb.findIndex(e => e.id === args.where.id);
            if (index === -1) throw new Error("Event not found for delete");
            const deletedEvent = mockScheduledEventsDb.splice(index, 1)[0];
            mockRecurrenceExceptionsDb = mockRecurrenceExceptionsDb.filter(ex => ex.eventId !== args.where.id);
            return deletedEvent;
        },
    },
    device: {
        findMany: async (args: { where: { id: { in: string[] } }, select?: any }) => {
            return mockDevicesDb.filter(d => args.where.id.in.includes(d.id))
                .map(d => args.select ? ({id: d.id, name: d.name}) : d);
        }
    },
    playlist: {
        findUnique: async (args: {where: {id: string}}) => {
            return mockPlaylistsDb.find(p => p.id === args.where.id) || null;
        }
    },
    recurrenceException: {
        findMany: async (args: {where: {eventId: string}, include?: any}) => {
            return mockRecurrenceExceptionsDb.filter(ex => ex.eventId === args.where.eventId)
                .map(ex => args.include?.newPlaylist && ex.newPlaylistId ?
                    {...ex, newPlaylist: mockPlaylistsDb.find(p=>p.id === ex.newPlaylistId)} : ex);
        }
    }
};
const prisma: PrismaClient = mockPrismaScheduler as any as PrismaClient;

const serializeEventDates = (event: any): any => {
    if (!event) return null;
    const serialized = { ...event };
    if (event.startTime) serialized.startTime = new Date(event.startTime).toISOString();
    if (event.endTime) serialized.endTime = new Date(event.endTime).toISOString();
    if (event.createdAt) serialized.createdAt = new Date(event.createdAt).toISOString();
    if (event.updatedAt) serialized.updatedAt = new Date(event.updatedAt).toISOString();

    if (event.playlist && event.playlist.createdAt) {
        serialized.playlist = {
            ...event.playlist,
            createdAt: new Date(event.playlist.createdAt).toISOString(),
            updatedAt: new Date(event.playlist.updatedAt).toISOString(),
        };
    }
    if (event.exceptions) {
        serialized.exceptions = event.exceptions.map((ex: any) => {
            const serializedEx = { ...ex };
            if (ex.originalInstanceDate) serializedEx.originalInstanceDate = new Date(ex.originalInstanceDate).toISOString();
            if (ex.newStartTime) serializedEx.newStartTime = new Date(ex.newStartTime).toISOString();
            if (ex.newEndTime) serializedEx.newEndTime = new Date(ex.newEndTime).toISOString();
            if (ex.createdAt) serializedEx.createdAt = new Date(ex.createdAt).toISOString();
            if (ex.updatedAt) serializedEx.updatedAt = new Date(ex.updatedAt).toISOString();
            if (ex.newPlaylist && ex.newPlaylist.createdAt) {
                 serializedEx.newPlaylist = {
                    ...ex.newPlaylist,
                    createdAt: new Date(ex.newPlaylist.createdAt).toISOString(),
                    updatedAt: new Date(ex.newPlaylist.updatedAt).toISOString(),
                };
            }
            return serializedEx;
        });
    }
    return serialized;
};


export const scheduleResolvers = {
  Query: {
    getScheduledEvent: async (_: any, { id }: { id: string }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const event = await db.scheduledEvent.findUnique({
        where: { id },
        include: {
          playlist: true,
          exceptions: { include: { newPlaylist: true } },
        }
      });
      return serializeEventDates(event);
    },

    listScheduledEvents: async (
        _: any,
        { organizationId, dateRangeStart, dateRangeEnd, targetIds }: {
            organizationId: string, dateRangeStart: string, dateRangeEnd: string, targetIds?: string[]
        },
        context?: { prisma?: PrismaClient }
    ) => {
      const db = context?.prisma || prisma;
      const startDate = new Date(dateRangeStart);
      const endDate = new Date(dateRangeEnd);

      const whereConditions: any = {
        organizationId,
        OR: [ { rrule: null, startTime: { lt: endDate }, endTime: { gt: startDate } }, { rrule: { not: null }, startTime: { lt: endDate } } ]
      };
      if (targetIds && targetIds.length > 0) {
        whereConditions.AND = [{ OR: [ { targetDeviceIds: { hasSome: targetIds } }, { targetDeviceGroupIds: { hasSome: targetIds } } ] }];
      }

      const masterEvents = await db.scheduledEvent.findMany({
        where: whereConditions,
        include: { playlist: true, exceptions: { include: { newPlaylist: true } } },
        orderBy: { startTime: 'asc' },
      });

      console.log(`[Mock Resolver] listScheduledEvents: Fetched ${masterEvents.length} master/single events. Full recurrence expansion (rrule.js) is future work.`);
      return masterEvents.map(serializeEventDates);
    },
  },

  Mutation: {
    createScheduledEvent: async (_: any, { input }: { input: any /* GraphQLCreateScheduledEventInput */ }, context?: { prisma?: PrismaClient, user?: {id: string, organizationId: string} } ) => {
      const db = context?.prisma || prisma;
      const { title, playlistId, targetInputs, startTime, endTime, allDay, rrule, timezone } = input;
      const organizationId = input.organizationId || context?.user?.organizationId || "UNKNOWN_ORG";
      // const createdByUserId = context?.user?.id || "UNKNOWN_USER";

      const targetDeviceIds: string[] = targetInputs.filter((t: any) => t.type === PrismaTargetType.DEVICE).map((t: any) => t.id);
      const targetDeviceGroupIds: string[] = targetInputs.filter((t: any) => t.type === PrismaTargetType.DEVICE_GROUP).map((t: any) => t.id);

      const createdEvent = await db.scheduledEvent.create({
        data: {
          title,
          playlist: { connect: { id: playlistId } },
          targetDeviceIds,
          targetDeviceGroupIds,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          allDay: allDay || false,
          rrule,
          timezone,
          organizationId,
          // createdByUserId,
        },
        include: { playlist: true, exceptions: { include: { newPlaylist: true } } }
      });
      return serializeEventDates(createdEvent);
    },

    updateScheduledEvent: async (_: any, { id, input }: { id: string, input: any /* GraphQLUpdateScheduledEventInput */ }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const { title, playlistId, targetInputs, startTime, endTime, allDay, rrule, timezone } = input;

      const dataToUpdate: any = {};
      if (title !== undefined) dataToUpdate.title = title;
      if (playlistId !== undefined) dataToUpdate.playlist = { connect: { id: playlistId } };
      if (startTime !== undefined) dataToUpdate.startTime = new Date(startTime);
      if (endTime !== undefined) dataToUpdate.endTime = new Date(endTime);
      if (allDay !== undefined) dataToUpdate.allDay = allDay;
      if (rrule !== undefined) dataToUpdate.rrule = rrule;
      if (timezone !== undefined) dataToUpdate.timezone = timezone;
      if (targetInputs !== undefined) {
         dataToUpdate.targetDeviceIds = targetInputs.filter((t: any) => t.type === PrismaTargetType.DEVICE).map((t: any) => t.id);
         dataToUpdate.targetDeviceGroupIds = targetInputs.filter((t: any) => t.type === PrismaTargetType.DEVICE_GROUP).map((t: any) => t.id);
      }

      const updatedEvent = await db.scheduledEvent.update({
        where: { id },
        data: dataToUpdate,
        include: { playlist: true, exceptions: { include: { newPlaylist: true } } }
      });
      return serializeEventDates(updatedEvent);
    },

    deleteScheduledEvent: async (_: any, { id }: { id: string }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const deletedEvent = await db.scheduledEvent.delete({ where: { id } });
      return serializeEventDates(deletedEvent);
    },
  },

  ScheduledEvent: {
    playlist: async (parent: MockScheduledEvent, _: any, context?: { prisma?: PrismaClient }) => {
      if (parent.playlist) return serializeEventDates({playlist: parent.playlist}).playlist;
      const db = context?.prisma || prisma;
      const playlist = await db.playlist.findUnique({ where: { id: parent.playlistId } });
      return playlist ? {...playlist, createdAt: playlist.createdAt.toISOString(), updatedAt: playlist.updatedAt.toISOString()} : null;
    },
    targets: async (parent: MockScheduledEvent, _: any, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const resolvedTargets: {id: string, name: string, type: PrismaTargetType}[] = [];

      if (parent.targetDeviceIds && parent.targetDeviceIds.length > 0) {
        const devices = await db.device.findMany({
            where: { id: { in: parent.targetDeviceIds } },
            select: { id: true, name: true }
        });
        resolvedTargets.push(...devices.map(d => ({ id: d.id, name: d.name || d.id, type: PrismaTargetType.DEVICE })));
      }
      if (parent.targetDeviceGroupIds && parent.targetDeviceGroupIds.length > 0) {
        parent.targetDeviceGroupIds.forEach(groupId => {
            const groupInfo = mockDeviceGroupsDb.find(g => g.id === groupId);
            resolvedTargets.push({ id: groupId, name: groupInfo?.name || `Group: ${groupId.substring(0,8)}...`, type: PrismaTargetType.DEVICE_GROUP })
        });
      }
      return resolvedTargets;
    },
    exceptions: async (parent: MockScheduledEvent, _: any, context?: { prisma?: PrismaClient }) => {
        if (parent.exceptions) return serializeEventDates({exceptions: parent.exceptions}).exceptions;
        const db = context?.prisma || prisma;
        const exceptions = await db.recurrenceException.findMany({
            where: { eventId: parent.id },
            include: { newPlaylist: true }
        });
        // Ensure all dates within each exception are serialized
        return exceptions.map(ex => serializeEventDates({exception: ex}).exception);
    }
  },

  RecurrenceException: {
    newPlaylist: async (parent: MockRecurrenceException, _: any, context?: { prisma?: PrismaClient }) => {
      if (parent.newPlaylist) return serializeEventDates({playlist: parent.newPlaylist}).playlist;
      if (!parent.newPlaylistId) return null;
      const db = context?.prisma || prisma;
      const playlist = await db.playlist.findUnique({ where: { id: parent.newPlaylistId } });
      return playlist ? {...playlist, createdAt: playlist.createdAt.toISOString(), updatedAt: playlist.updatedAt.toISOString()} : null;
    }
  }
};
