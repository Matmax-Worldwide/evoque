// src/app/[locale]/signage/backend/graphql/resolvers/schedule.resolvers.ts

import { PrismaClient, Prisma, TargetType as PrismaTargetTypeEnum, Playlist as PrismaPlaylist, Device as PrismaDevice, ScheduledEvent as PrismaScheduledEventDef, RecurrenceException as PrismaRecurrenceExceptionDef } from '@prisma/client';
// ^^^ For type hints. In a real scenario, only PrismaClient might be directly imported if using it.

// --- In-Memory Mock Database & Types for Scheduling Resolvers ---
// Enums to be used internally by mock data (values should match Prisma schema enums)
enum ResolverTargetType { DEVICE = 'DEVICE', DEVICE_GROUP = 'DEVICE_GROUP' }
enum ResolverRecurrenceType { NONE = 'NONE', DAILY = 'DAILY', WEEKLY = 'WEEKLY', MONTHLY = 'MONTHLY' }
enum ResolverMonthlyRecurrenceType { DAY_OF_MONTH = 'DAY_OF_MONTH', NTH_DAY_OF_WEEK = 'NTH_DAY_OF_WEEK' }

interface ResolverPlaylist { id: string; name: string; organizationId: string; createdAt: Date; updatedAt: Date; [key: string]: any; }
interface ResolverDevice { id: string; name?: string | null; organizationId: string; pairingCode?: string | null; deviceSpecificConfig?: Prisma.JsonValue | null; firmwareVersion?: string | null; ipAddress?: string | null; macAddress?: string | null; currentPlaylistId?: string | null; status?: any; lastSeenAt?: Date | null; pairingCodeExpiresAt?: Date | null; createdAt: Date; updatedAt: Date; }
interface ResolverDeviceGroup { id: string; name: string; organizationId: string; } // Conceptual

interface ResolverWeeklyRecurrenceConfig { days: string[]; }
interface ResolverMonthlyRecurrenceConfig { type: ResolverMonthlyRecurrenceType; dayOfMonth?: number; weekOrdinal?: string; dayOfWeek?: string; }

// Internal representation for mock DB (uses Date objects)
interface ResolverMockDbScheduledEvent {
    id: string; organizationId: string; title?: string | null; playlistId: string;
    targetDeviceIds: string[]; targetDeviceGroupIds: string[];
    startTime: Date; endTime: Date;
    recurrenceType?: ResolverRecurrenceType | null; rrule?: string | null;
    weeklyConfig?: ResolverWeeklyRecurrenceConfig | null; monthlyConfig?: ResolverMonthlyRecurrenceConfig | null;
    allDay?: boolean | null; timezone?: string | null;
    createdAt: Date; updatedAt: Date;
    // For conceptual 'include' in mock:
    playlist?: ResolverPlaylist | null;
    exceptions?: ResolverMockDbRecurrenceException[] | null;
}
interface ResolverMockDbRecurrenceException { // Simplified for mock
    id: string; eventId: string; originalInstanceDate: Date; isCancelled: boolean;
    newStartTime?: Date | null; newEndTime?: Date | null; newPlaylistId?: string | null;
    newPlaylist?: ResolverPlaylist | null; createdAt: Date; updatedAt: Date;
}

let resolverMockScheduledEventsDb: ResolverMockDbScheduledEvent[] = [];
let resolverMockRecurrenceExceptionsDb: ResolverMockDbRecurrenceException[] = [];
let resolverEventIdCounter = 1;
// let exceptionIdCounter = 1; // Not used yet

const resolverMockPlaylistsDb: ResolverPlaylist[] = [
    { id: 'pl-1', name: 'Morning Loop', description: 'Awakening content', organizationId: 'org_placeholder_123', createdByUserId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
    { id: 'pl-2', name: 'Weekend Specials', description: 'Promos', organizationId: 'org_placeholder_123', createdByUserId: 'user-1', createdAt: new Date(), updatedAt: new Date() },
];
const resolverMockDevicesDb: ResolverDevice[] = [
    { id: 'dev-1', name: 'Lobby Screen 1', status: 'ONLINE', organizationId: 'org_placeholder_123', createdAt: new Date(), updatedAt: new Date() },
    { id: 'dev-2', name: 'Meeting Room A', status: 'OFFLINE', organizationId: 'org_placeholder_123', createdAt: new Date(), updatedAt: new Date() },
];
const resolverMockDeviceGroupsDb: ResolverDeviceGroup[] = [
    { id: 'group-lobby', name: 'Lobby Screens', organizationId: 'org_placeholder_123' },
];

const initResolverMockEvents = () => {
    const today_init = new Date();
    const createDateObj = (day: number, hour: number, minute: number = 0) => new Date(today_init.getFullYear(), today_init.getMonth(), day, hour, minute);
    resolverMockScheduledEventsDb = [
        { id: `event-${resolverEventIdCounter++}`, title: 'Daily Morning Brief', playlistId: 'pl-1', targetDeviceIds: ['dev-1'], targetDeviceGroupIds: [], startTime: createDateObj(today_init.getDate(), 8), endTime: createDateObj(today_init.getDate(), 9), organizationId: 'org_placeholder_123', recurrenceType: ResolverRecurrenceType.DAILY, rrule: 'FREQ=DAILY', allDay: false, createdAt: new Date(), updatedAt: new Date() },
        { id: `event-${resolverEventIdCounter++}`, title: 'Weekly Review Display', playlistId: 'pl-2', targetDeviceIds: [], targetDeviceGroupIds: ['group-lobby'], startTime: createDateObj(today_init.getDate() + 1, 14), endTime: createDateObj(today_init.getDate() + 1, 15), organizationId: 'org_placeholder_123', recurrenceType: ResolverRecurrenceType.WEEKLY, weeklyConfig: { days: ['FR'] }, rrule: 'FREQ=WEEKLY;BYDAY=FR', allDay: false, createdAt: new Date(), updatedAt: new Date() },
    ];
};
initResolverMockEvents();

// --- Mock Prisma Client for Scheduling ---
const mockPrismaClientForScheduling = {
    scheduledEvent: {
        findUnique: async (args: { where: { id: string }; include?: any }) => {
            console.log("[ResolverMock] findUnique ScheduledEvent:", args.where);
            const event = resolverMockScheduledEventsDb.find(e => e.id === args.where.id);
            if (!event) return null;
            let res: any = { ...event };
            if (args.include?.playlist) res.playlist = resolverMockPlaylistsDb.find(p => p.id === event.playlistId) || null;
            if (args.include?.exceptions) {
                res.exceptions = resolverMockRecurrenceExceptionsDb.filter(ex => ex.eventId === event.id)
                    .map(ex => (args.include.exceptions.include?.newPlaylist && ex.newPlaylistId) ?
                        {...ex, newPlaylist: resolverMockPlaylistsDb.find(p=>p.id === ex.newPlaylistId)} : ex);
            }
            return res;
        },
        findMany: async (args: { where?: any; include?: any; orderBy?: any; take?: number; skip?: number; }) => {
            console.log("[ResolverMock] findMany ScheduledEvent:", args.where);
            let events = resolverMockScheduledEventsDb;
            if (args.where?.organizationId) events = events.filter(e => e.organizationId === args.where.organizationId);
            if (args.where?.OR && Array.isArray(args.where.OR)) {
                const orConditions = args.where.OR;
                events = events.filter(e => orConditions.some((cond:any) =>
                    (cond.rrule === null && e.rrule === null && e.startTime < new Date(cond.startTime.lt) && e.endTime > new Date(cond.endTime.gt)) ||
                    (cond.rrule?.not === null && e.rrule !== null && e.startTime < new Date(cond.startTime.lt))
                ));
            }
            if (args.where?.AND && Array.isArray(args.where.AND)) {
                 args.where.AND.forEach((andCond: any) => {
                     if(andCond.OR && Array.isArray(andCond.OR)){
                         events = events.filter(e => andCond.OR.some((tCond: any) =>
                            (tCond.targetDeviceIds?.hasSome && tCond.targetDeviceIds.hasSome.some((id: string) => e.targetDeviceIds.includes(id))) ||
                            (tCond.targetDeviceGroupIds?.hasSome && tCond.targetDeviceGroupIds.hasSome.some((id: string) => e.targetDeviceGroupIds.includes(id)))
                         ));
                     }
                 });
            }
            if (args.orderBy?.startTime) events.sort((a, b) => (a.startTime.getTime() - b.startTime.getTime()) * (args.orderBy.startTime === 'asc' ? 1 : -1));

            return events.map(event => {
                let res: any = { ...event };
                if (args.include?.playlist) res.playlist = resolverMockPlaylistsDb.find(p => p.id === event.playlistId) || null;
                if (args.include?.exceptions) {
                    res.exceptions = resolverMockRecurrenceExceptionsDb.filter(ex => ex.eventId === event.id)
                        .map(ex => (args.include.exceptions.include?.newPlaylist && ex.newPlaylistId) ?
                            {...ex, newPlaylist: resolverMockPlaylistsDb.find(p=>p.id === ex.newPlaylistId)} : ex);
                }
                return res;
            });
        },
        create: async (args: { data: any; include?: any }) => {
            console.log("[ResolverMock] create ScheduledEvent:", args.data);
            const newEventData = { ...args.data };
            const playlistId = newEventData.playlist?.connect?.id;
            delete newEventData.playlist;

            const newEvent: ResolverMockDbScheduledEvent = {
                ...newEventData,
                id: `event-${resolverEventIdCounter++}`,
                playlistId: playlistId,
                startTime: new Date(args.data.startTime),
                endTime: new Date(args.data.endTime),
                createdAt: new Date(),
                updatedAt: new Date(),
                targetDeviceIds: args.data.targetDeviceIds || [],
                targetDeviceGroupIds: args.data.targetDeviceGroupIds || [],
                exceptions: [],
            };
            resolverMockScheduledEventsDb.push(newEvent);
            let res: any = { ...newEvent };
            if (args.include?.playlist) res.playlist = resolverMockPlaylistsDb.find(p => p.id === newEvent.playlistId) || null;
            return res;
        },
        update: async (args: { where: { id: string }; data: any; include?: any }) => {
            console.log("[ResolverMock] update ScheduledEvent:", args.where.id, args.data);
            const index = resolverMockScheduledEventsDb.findIndex(e => e.id === args.where.id);
            if (index === -1) throw new Error("Event not found for update");

            const existingEvent = resolverMockScheduledEventsDb[index];
            const updatedDataFromInput = { ...args.data };
            if(updatedDataFromInput.startTime) updatedDataFromInput.startTime = new Date(updatedDataFromInput.startTime);
            if(updatedDataFromInput.endTime) updatedDataFromInput.endTime = new Date(updatedDataFromInput.endTime);
            if(updatedDataFromInput.playlist?.connect?.id) {
                updatedDataFromInput.playlistId = updatedDataFromInput.playlist.connect.id;
                delete updatedDataFromInput.playlist;
            }

            resolverMockScheduledEventsDb[index] = { ...existingEvent, ...updatedDataFromInput, updatedAt: new Date() };
            let res: any = { ...resolverMockScheduledEventsDb[index] };
            if (args.include?.playlist) res.playlist = resolverMockPlaylistsDb.find(p => p.id === res.playlistId) || null;
            if (args.include?.exceptions) {
                res.exceptions = resolverMockRecurrenceExceptionsDb.filter(ex => ex.eventId === res.id)
                    .map(ex => (args.include.exceptions.include?.newPlaylist && ex.newPlaylistId) ?
                        {...ex, newPlaylist: resolverMockPlaylistsDb.find(p=>p.id === ex.newPlaylistId)} : ex);
            }
            return res;
        },
        delete: async (args: { where: { id: string } }) => {
            console.log("[ResolverMock] delete ScheduledEvent:", args.where.id);
            const index = resolverMockScheduledEventsDb.findIndex(e => e.id === args.where.id);
            if (index === -1) throw new Error("Event not found for delete");
            const deletedEvent = resolverMockScheduledEventsDb.splice(index, 1)[0];
            resolverMockRecurrenceExceptionsDb = resolverMockRecurrenceExceptionsDb.filter(ex => ex.eventId !== args.where.id);
            return deletedEvent;
        },
    },
    device: {
        findMany: async (args: { where: { id: { in: string[] } }; select?: any }) => {
            return resolverMockDevicesDb.filter(d => args.where.id.in.includes(d.id))
                .map(d => args.select ? ({id: d.id, name: d.name}) : d);
        }
    },
    playlist: {
        findUnique: async (args: {where: {id: string}}) => {
            return resolverMockPlaylistsDb.find(p => p.id === args.where.id) || null;
        }
    },
    recurrenceException: {
        findMany: async (args: {where: {eventId: string}, include?: any}) => {
            const exceptions = resolverMockRecurrenceExceptionsDb.filter(ex => ex.eventId === args.where.eventId);
            return exceptions.map(ex => {
                let res: any = {...ex};
                if(args.include?.newPlaylist && ex.newPlaylistId) res.newPlaylist = resolverMockPlaylistsDb.find(p => p.id === ex.newPlaylistId);
                return res;
            });
        }
    }
};
const prisma: PrismaClient = mockPrismaClientForScheduling as any as PrismaClient;


const serializeDatesInEvent = (event: any): any => {
    if (!event) return null;
    const serialized = { ...event };
    const dateFields: string[] = ['startTime', 'endTime', 'createdAt', 'updatedAt', 'originalInstanceDate', 'newStartTime', 'newEndTime'];
    for (const field of dateFields) {
        if (serialized[field] instanceof Date) {
            serialized[field] = (serialized[field] as Date).toISOString();
        }
    }
    if (serialized.playlist && serialized.playlist.createdAt instanceof Date) {
        serialized.playlist = { ...serialized.playlist, createdAt: serialized.playlist.createdAt.toISOString(), updatedAt: serialized.playlist.updatedAt.toISOString() };
    }
    if (serialized.exceptions) {
        serialized.exceptions = serialized.exceptions.map((ex: any) => serializeDatesInEvent(ex));
    }
    if (serialized.newPlaylist && serialized.newPlaylist.createdAt instanceof Date) {
        serialized.newPlaylist = { ...serialized.newPlaylist, createdAt: serialized.newPlaylist.createdAt.toISOString(), updatedAt: serialized.newPlaylist.updatedAt.toISOString() };
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
      return serializeDatesInEvent(event);
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
        OR: [
          { rrule: null, startTime: { lt: endDate }, endTime: { gt: startDate } },
          { rrule: { not: null }, startTime: { lt: endDate } }
        ]
      };
      if (targetIds && targetIds.length > 0) {
        whereConditions.AND = [{ OR: [ { targetDeviceIds: { hasSome: targetIds } }, { targetDeviceGroupIds: { hasSome: targetIds } } ] }];
      }

      const masterEvents = await db.scheduledEvent.findMany({
        where: whereConditions,
        include: { playlist: true, exceptions: { include: { newPlaylist: true } } },
        orderBy: { startTime: 'asc' },
      });

      console.log(`[Resolver] listScheduledEvents: Fetched ${masterEvents.length} master/single events from mock DB. Full recurrence expansion is future work.`);
      return masterEvents.map(serializeDatesInEvent);
    },
  },

  Mutation: {
    createScheduledEvent: async (_: any, { input }: { input: any /* GraphQLCreateScheduledEventInput */ }, context?: { prisma?: PrismaClient, user?: {id: string, organizationId: string} } ) => {
      const db = context?.prisma || prisma;
      const { title, playlistId, targetInputs, startTime, endTime, allDay, rrule, timezone, recurrenceType, weeklyConfig, monthlyConfig } = input;
      const organizationId = input.organizationId || context?.user?.organizationId || "UNKNOWN_ORG";
      // const createdByUserId = context?.user?.id;

      const targetDeviceIds: string[] = targetInputs.filter((t: any) => t.type === ResolverTargetType.DEVICE).map((t: any) => t.id);
      const targetDeviceGroupIds: string[] = targetInputs.filter((t: any) => t.type === ResolverTargetType.DEVICE_GROUP).map((t: any) => t.id);

      const createdEvent = await db.scheduledEvent.create({
        data: {
          title,
          playlist: { connect: { id: playlistId } },
          targetDeviceIds, targetDeviceGroupIds,
          startTime: new Date(startTime), endTime: new Date(endTime),
          allDay: allDay || false, rrule, timezone,
          recurrenceType, weeklyConfig, monthlyConfig,
          organizationId,
          // createdByUserId,
        },
        include: { playlist: true, exceptions: true }
      });
      return serializeDatesInEvent(createdEvent);
    },

    updateScheduledEvent: async (_: any, { id, input }: { id: string, input: any /* GraphQLUpdateScheduledEventInput */ }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const { title, playlistId, targetInputs, startTime, endTime, allDay, rrule, timezone, recurrenceType, weeklyConfig, monthlyConfig } = input;

      const dataToUpdate: any = {};
      if (title !== undefined) dataToUpdate.title = title;
      if (playlistId !== undefined) dataToUpdate.playlist = { connect: { id: playlistId } };
      if (startTime !== undefined) dataToUpdate.startTime = new Date(startTime);
      if (endTime !== undefined) dataToUpdate.endTime = new Date(endTime);
      if (allDay !== undefined) dataToUpdate.allDay = allDay;
      if (rrule !== undefined) dataToUpdate.rrule = rrule;
      if (timezone !== undefined) dataToUpdate.timezone = timezone;
      if (recurrenceType !== undefined) dataToUpdate.recurrenceType = recurrenceType;
      if (weeklyConfig !== undefined) dataToUpdate.weeklyConfig = weeklyConfig;
      if (monthlyConfig !== undefined) dataToUpdate.monthlyConfig = monthlyConfig;

      if (targetInputs !== undefined) {
         dataToUpdate.targetDeviceIds = targetInputs.filter((t: any) => t.type === ResolverTargetType.DEVICE).map((t: any) => t.id);
         dataToUpdate.targetDeviceGroupIds = targetInputs.filter((t: any) => t.type === ResolverTargetType.DEVICE_GROUP).map((t: any) => t.id);
      }

      const updatedEvent = await db.scheduledEvent.update({
        where: { id }, data: dataToUpdate,
        include: { playlist: true, exceptions: { include: { newPlaylist: true } } }
      });
      return serializeDatesInEvent(updatedEvent);
    },

    deleteScheduledEvent: async (_: any, { id }: { id: string }, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const deletedEvent = await db.scheduledEvent.delete({ where: { id } });
      return serializeDatesInEvent(deletedEvent);
    },
  },

  ScheduledEvent: {
    playlist: async (parent: ResolverMockDbScheduledEvent, _: any, context?: { prisma?: PrismaClient }) => {
      if (parent.playlist && parent.playlist.createdAt instanceof Date) return serializeDatesInEvent({ nested: parent.playlist }).nested;
      const db = context?.prisma || prisma;
      const playlist = await db.playlist.findUnique({ where: { id: parent.playlistId } });
      return playlist ? serializeDatesInEvent({ nested: playlist }).nested : null;
    },
    targets: async (parent: ResolverMockDbScheduledEvent, _: any, context?: { prisma?: PrismaClient }) => {
      const db = context?.prisma || prisma;
      const resolvedTargets: {id: string, name: string, type: ResolverTargetType}[] = [];

      if (parent.targetDeviceIds && parent.targetDeviceIds.length > 0) {
        const devices = await db.device.findMany({ where: { id: { in: parent.targetDeviceIds } }, select: { id: true, name: true } });
        resolvedTargets.push(...devices.map(d => ({ id: d.id, name: d.name || d.id, type: ResolverTargetType.DEVICE })));
      }
      if (parent.targetDeviceGroupIds && parent.targetDeviceGroupIds.length > 0) {
        parent.targetDeviceGroupIds.forEach(groupId => {
            const groupInfo = resolverMockDeviceGroupsDb.find(g => g.id === groupId);
            resolvedTargets.push({ id: groupId, name: groupInfo?.name || `Group ${groupId.substring(0,4)}...`, type: ResolverTargetType.DEVICE_GROUP })
        });
      }
      return resolvedTargets;
    },
    exceptions: async (parent: ResolverMockDbScheduledEvent, _: any, context?: { prisma?: PrismaClient }) => {
        if (parent.exceptions && parent.exceptions.every(ex => ex.createdAt instanceof Date)) return serializeDatesInEvent({ nestedList: parent.exceptions }).nestedList;
        const db = context?.prisma || prisma;
        const exceptions = await db.recurrenceException.findMany({
            where: { eventId: parent.id },
            include: { newPlaylist: true }
        });
        return exceptions.map(ex => serializeDatesInEvent(ex));
    }
  },

  RecurrenceException: {
    newPlaylist: async (parent: ResolverMockDbRecurrenceException, _: any, context?: { prisma?: PrismaClient }) => {
      if (parent.newPlaylist && parent.newPlaylist.createdAt instanceof Date) return serializeDatesInEvent({ nested: parent.newPlaylist }).nested;
      if (!parent.newPlaylistId) return null;
      const db = context?.prisma || prisma;
      const playlist = await db.playlist.findUnique({ where: { id: parent.newPlaylistId } });
      return playlist ? serializeDatesInEvent({ nested: playlist }).nested : null;
    }
  }
};
