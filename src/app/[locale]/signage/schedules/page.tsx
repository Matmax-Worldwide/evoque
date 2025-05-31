// src/app/[locale]/signage/schedules/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CalendarView from '@/app/[locale]/signage/frontend/components/schedule/CalendarView';
import ScheduleEventModal from '@/app/[locale]/signage/frontend/components/schedule/ScheduleEventModal';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon, Loader2, AlertTriangleIcon } from 'lucide-react';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog"; // Import AlertDialog
import { toast } from 'sonner';

// Enums (align with Prisma schema & Modal, could be imported from a shared types file)
export enum PageGraphQLTargetType { DEVICE = 'DEVICE', DEVICE_GROUP = 'DEVICE_GROUP' }
export enum PageRecurrenceType { NONE = 'NONE', DAILY = 'DAILY', WEEKLY = 'WEEKLY', MONTHLY = 'MONTHLY' }
export enum PageMonthlyRecurrenceType { DAY_OF_MONTH = 'DAY_OF_MONTH', NTH_DAY_OF_WEEK = 'NTH_DAY_OF_WEEK' }

// --- Page-level GraphQL Type Definitions (mirroring backend/graphql/types and Prisma structures) ---
interface PageGraphQLPlaylist { id: string; name: string; }
interface PageGraphQLDeviceOrGroup { id: string; name: string; type: PageGraphQLTargetType; }

interface PageGraphQLScheduledEventTarget { id: string; name: string; type: PageGraphQLTargetType; }
interface PageGraphQLScheduledEventTargetInput { id: string; type: PageGraphQLTargetType; }

interface PageWeeklyRecurrenceConfig { days: string[]; }
interface PageMonthlyRecurrenceConfig { type: PageMonthlyRecurrenceType; dayOfMonth?: number; weekOrdinal?: string; dayOfWeek?: string; }

interface PageGraphQLScheduledEventInput {
  title?: string; playlistId: string;
  targetInputs: PageGraphQLScheduledEventTargetInput[];
  startTime: string; endTime: string; // ISO strings for GQL layer
  recurrenceType?: PageRecurrenceType; rrule?: string;
  weeklyConfig?: PageWeeklyRecurrenceConfig | null;
  monthlyConfig?: PageMonthlyRecurrenceConfig | null;
  organizationId: string;
  playlistName?: string; // For mock convenience
  allDay?: boolean | null;
}
// For update, most fields are optional, and ID is required
interface PageGraphQLUpdateScheduledEventInput extends Omit<Partial<PageGraphQLScheduledEventInput>, 'organizationId'> {
  // No organizationId needed in update input itself as event is identified by ID
}

interface PageGraphQLScheduledEvent {
  id: string; organizationId: string; title?: string | null; playlistId: string;
  targets: PageGraphQLScheduledEventTarget[]; // Resolved targets
  startTime: string; // ISO string for GQL layer
  endTime: string;   // ISO string for GQL layer
  recurrenceType?: PageRecurrenceType | null; rrule?: string | null;
  weeklyConfig?: PageWeeklyRecurrenceConfig | null; monthlyConfig?: PageMonthlyRecurrenceConfig | null;
  allDay?: boolean | null; timezone?: string | null; exceptions?: any[] | null;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  // For display convenience, often resolved
  playlistName?: string | null;
  targetNames?: string[] | null;
}
interface MockDbScheduledEvent {
    id: string; organizationId: string; title?: string | null; playlistId: string;
    targetDeviceIds: string[]; targetDeviceGroupIds: string[];
    startTime: Date; endTime: Date; recurrenceType?: PageRecurrenceType | null; rrule?: string | null;
    weeklyConfig?: PageWeeklyRecurrenceConfig | null; monthlyConfig?: PageMonthlyRecurrenceConfig | null;
    allDay?: boolean | null; timezone?: string | null; createdAt: Date; updatedAt: Date;
}

// In-Memory Mock Database (as before, `let` for mutability)
let pageLevelMockScheduledEventsDb: MockDbScheduledEvent[] = [];
const pageLevelMockPlaylistsDb: PageGraphQLPlaylist[] = [
    {id: 'pl-1', name: 'Morning Loop'}, {id: 'pl-2', name: 'Weekend Specials'}, {id: 'pl-3', name: 'Afternoon Mix'}
];
const pageLevelMockDevicesAndGroupsDb: PageGraphQLDeviceOrGroup[] = [
    {id: 'dev-1', name: 'Lobby Screen 1 (Device)', type: PageGraphQLTargetType.DEVICE},
    {id: 'group-lobby', name: 'Lobby Screens (Group)', type: PageGraphQLTargetType.DEVICE_GROUP}
];
const initPageMockEvents = () => {
    const today_init = new Date();
    const currentMonth_init = today_init.getMonth();
    const currentYear_init = today_init.getFullYear();
    const createDateObj = (day: number, hour: number, minute: number = 0) => new Date(currentYear_init, currentMonth_init, day, hour, minute);
    pageLevelMockScheduledEventsDb = [
        {
            id: `event-${Date.now() + 1}`, title: 'Daily Morning Brief', playlistId: 'pl-1',
            targetDeviceIds: ['dev-1'], targetDeviceGroupIds: [],
            startTime: createDateObj(today_init.getDate(), 8), endTime: createDateObj(today_init.getDate(), 9),
            organizationId: 'org_placeholder_123', recurrenceType: PageRecurrenceType.DAILY, rrule: 'FREQ=DAILY',
            allDay: false, createdAt: new Date(), updatedAt: new Date()
        },
        {
            id: `event-${Date.now() + 2}`, title: 'Weekly Review Display', playlistId: 'pl-2',
            targetDeviceIds: [], targetDeviceGroupIds: ['group-lobby'],
            startTime: createDateObj(today_init.getDate() + 1, 14), endTime: createDateObj(today_init.getDate() + 1, 15),
            organizationId: 'org_placeholder_123', recurrenceType: PageRecurrenceType.WEEKLY, weeklyConfig: { days: ['FR'] }, rrule: 'FREQ=WEEKLY;BYDAY=FR',
            allDay: false, createdAt: new Date(), updatedAt: new Date()
        },
    ];
};
initPageMockEvents();

const mapDbEventToGqlEvent = (dbEvent?: MockDbScheduledEvent | null): PageGraphQLScheduledEvent | null => {
    if (!dbEvent) return null;
    const targets: PageGraphQLScheduledEventTarget[] = [];
    dbEvent.targetDeviceIds.forEach(id => { const device = pageLevelMockDevicesAndGroupsDb.find(d => d.id === id && d.type === PageGraphQLTargetType.DEVICE); if(device) targets.push({id: device.id, name: device.name, type: PageGraphQLTargetType.DEVICE}); });
    dbEvent.targetDeviceGroupIds.forEach(id => { const group = pageLevelMockDevicesAndGroupsDb.find(g => g.id === id && g.type === PageGraphQLTargetType.DEVICE_GROUP); if(group) targets.push({id: group.id, name: group.name, type: PageGraphQLTargetType.DEVICE_GROUP}); });
    const playlist = pageLevelMockPlaylistsDb.find(p => p.id === dbEvent.playlistId);
    return { ...dbEvent, startTime: dbEvent.startTime.toISOString(), endTime: dbEvent.endTime.toISOString(), createdAt: dbEvent.createdAt.toISOString(), updatedAt: dbEvent.updatedAt.toISOString(), targets, playlistName: playlist?.name, targetNames: targets.map(t => t.name) };
};

const graphqlClient = {
  query: async (params: { queryName: string, variables: any }): Promise<any> => {
    console.log(`Page-local mock graphqlClient.query: ${params.queryName}`, params.variables);
    await new Promise(resolve => setTimeout(resolve, 150));
    if (params.queryName === 'listScheduledEvents') { /* ... as before, ensuring mapDbEventToGqlEvent is used ... */
        const { organizationId, dateRangeStart, dateRangeEnd } = params.variables;
        const startFilter = new Date(dateRangeStart); const endFilter = new Date(dateRangeEnd);
        const filteredDbEvents = pageLevelMockScheduledEventsDb.filter(event => {
            const isOrgMatch = event.organizationId === organizationId;
            const overlaps = event.startTime < endFilter && event.endTime > startFilter;
            return isOrgMatch && overlaps;
        });
        return filteredDbEvents.map(mapDbEventToGqlEvent);
    }
    if (params.queryName === 'listPlaylistsForScheduler') { return pageLevelMockPlaylistsDb; }
    if (params.queryName === 'listDeviceGroupsForScheduler') { return pageLevelMockDevicesAndGroupsDb; }
    return [];
  },
  mutate: async (params: { mutationName: string, input: any, id?: string }): Promise<any> => {
    console.log(`Page-local mock graphqlClient.mutate: ${params.mutationName}`, params.id, params.input);
    await new Promise(resolve => setTimeout(resolve, 350));

    if (params.mutationName === 'createScheduledEvent') {
        const input = params.input as PageGraphQLScheduledEventInput;
        const targetDeviceIds: string[] = input.targetInputs.filter(t => t.type === PageGraphQLTargetType.DEVICE).map(t => t.id);
        const targetDeviceGroupIds: string[] = input.targetInputs.filter(t => t.type === PageGraphQLTargetType.DEVICE_GROUP).map(t => t.id);
        const newDbEvent: MockDbScheduledEvent = {
            id: `event-${Date.now()}`, organizationId: input.organizationId, title: input.title, playlistId: input.playlistId,
            targetDeviceIds, targetDeviceGroupIds, startTime: new Date(input.startTime), endTime: new Date(input.endTime),
            recurrenceType: input.recurrenceType, rrule: input.rrule, weeklyConfig: input.weeklyConfig, monthlyConfig: input.monthlyConfig,
            allDay: input.allDay || false, createdAt: new Date(), updatedAt: new Date(),
        };
        pageLevelMockScheduledEventsDb.push(newDbEvent); return mapDbEventToGqlEvent(newDbEvent);
    }
    if (params.mutationName === 'updateScheduledEvent') {
        const id = params.id;
        const input = params.input as PageGraphQLUpdateScheduledEventInput;
        const eventIndex = pageLevelMockScheduledEventsDb.findIndex(e => e.id === id);
        if (eventIndex > -1) {
            const existingEvent = pageLevelMockScheduledEventsDb[eventIndex];
            const updatedDbEvent: MockDbScheduledEvent = {
                ...existingEvent,
                title: input.title !== undefined ? input.title : existingEvent.title,
                playlistId: input.playlistId !== undefined ? input.playlistId : existingEvent.playlistId,
                startTime: input.startTime ? new Date(input.startTime) : existingEvent.startTime,
                endTime: input.endTime ? new Date(input.endTime) : existingEvent.endTime,
                recurrenceType: input.recurrenceType !== undefined ? input.recurrenceType : existingEvent.recurrenceType,
                rrule: input.rrule !== undefined ? input.rrule : existingEvent.rrule,
                weeklyConfig: input.weeklyConfig !== undefined ? input.weeklyConfig : existingEvent.weeklyConfig,
                monthlyConfig: input.monthlyConfig !== undefined ? input.monthlyConfig : existingEvent.monthlyConfig,
                allDay: input.allDay !== undefined ? input.allDay : existingEvent.allDay,
                updatedAt: new Date(),
            };
            if (input.targetInputs) {
                updatedDbEvent.targetDeviceIds = input.targetInputs.filter(t => t.type === PageGraphQLTargetType.DEVICE).map(t => t.id);
                updatedDbEvent.targetDeviceGroupIds = input.targetInputs.filter(t => t.type === PageGraphQLTargetType.DEVICE_GROUP).map(t => t.id);
            }
            pageLevelMockScheduledEventsDb[eventIndex] = updatedDbEvent;
            return mapDbEventToGqlEvent(updatedDbEvent);
        }
        return null;
    }
    if (params.mutationName === 'deleteScheduledEvent') {
        const id = params.input.id;
        const initialLength = pageLevelMockScheduledEventsDb.length;
        pageLevelMockScheduledEventsDb = pageLevelMockScheduledEventsDb.filter(e => e.id !== id);
        if (pageLevelMockScheduledEventsDb.length < initialLength) {
            return { success: true, message: 'Scheduled event deleted (mocked).' };
        }
        return { success: false, message: 'Scheduled event not found (mocked).' };
    }
    return null;
  }
};


export default function ScheduleManagementPage() {
  const [scheduledEvents, setScheduledEvents] = useState<PageGraphQLScheduledEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PageGraphQLScheduledEvent | null>(null);
  const [modalPlaylists, setModalPlaylists] = useState<PageGraphQLPlaylist[]>([]);
  const [modalDevicesAndGroups, setModalDevicesAndGroups] = useState<PageGraphQLDeviceOrGroup[]>([]);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);
  const organizationId = "org_placeholder_123";

  const [isDeleteScheduleAlertOpen, setIsDeleteScheduleAlertOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<{id: string, title?: string | null} | null>(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);

  const fetchScheduledEvents = useCallback(async (currentViewDate?: Date) => { /* ... as before ... */
    setIsLoadingEvents(true); setError(null);
    try {
      const pageDate = currentViewDate || new Date();
      const startDate = new Date(pageDate.getFullYear(), pageDate.getMonth(), 1).toISOString();
      const endDate = new Date(pageDate.getFullYear(), pageDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const result = await graphqlClient.query({ queryName: 'listScheduledEvents', variables: { organizationId, dateRangeStart: startDate, dateRangeEnd: endDate } });
      setScheduledEvents(result || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"; setError(message); toast.error(`Failed to load schedule: ${message}`); setScheduledEvents([]);
    } finally { setIsLoadingEvents(false); }
  }, [organizationId]);

  const fetchModalDropdownData = useCallback(async () => { /* ... as before ... */
    setIsLoadingModalData(true);
    try {
        const [playlistsResult, targetsResult] = await Promise.all([
            graphqlClient.query({ queryName: 'listPlaylistsForScheduler', variables: { organizationId } }),
            graphqlClient.query({ queryName: 'listDeviceGroupsForScheduler', variables: { organizationId } })
        ]);
        setModalPlaylists(playlistsResult || []); setModalDevicesAndGroups(targetsResult || []);
    } catch (error) { toast.error("Failed to load data for scheduler modal."); }
    finally { setIsLoadingModalData(false); }
  }, [organizationId]);

  useEffect(() => { fetchScheduledEvents(); fetchModalDropdownData(); }, [fetchScheduledEvents, fetchModalDropdownData]);

  const handleOpenEventModalForNew = (date?: Date) => { setEditingEvent(null); setIsEventModalOpen(true); };
  const handleOpenEventModalForEdit = (event: PageGraphQLScheduledEvent) => { setEditingEvent(event); setIsEventModalOpen(true); };

  const handleSaveEvent = async (eventData: PageGraphQLScheduledEventInput) => {
    try {
      if (editingEvent?.id) {
        const updateInput: PageGraphQLUpdateScheduledEventInput = { ...eventData };
        delete (updateInput as any).organizationId;

        await graphqlClient.mutate({
            mutationName: 'updateScheduledEvent',
            id: editingEvent.id,
            input: updateInput
        });
        toast.success(`Event "${eventData.title || 'Schedule'}" updated (mocked).`);
      } else {
        await graphqlClient.mutate({
            mutationName: 'createScheduledEvent',
            input: { ...eventData, organizationId }
        });
        toast.success(`Event "${eventData.title || 'Schedule'}" created (mocked).`);
      }
      fetchScheduledEvents(); setIsEventModalOpen(false); return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error during save.";
      toast.error(`Failed to save event: ${msg}`); return false;
    }
  };

  const handleDeleteScheduleRequest = (event: {id: string, title?: string | null}) => {
    setScheduleToDelete(event);
    setIsDeleteScheduleAlertOpen(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    setIsDeletingSchedule(true);
    try {
      const result = await graphqlClient.mutate({
          mutationName: 'deleteScheduledEvent',
          input: { id: scheduleToDelete.id, organizationId }
      });
      if (result.success) {
        toast.success(result.message || `Event "${scheduleToDelete.title || scheduleToDelete.id}" deleted.`);
        fetchScheduledEvents();
        if (editingEvent?.id === scheduleToDelete.id) {
            setIsEventModalOpen(false);
            setEditingEvent(null);
        }
      } else {
        toast.error(result.message || `Failed to delete event "${scheduleToDelete.title || scheduleToDelete.id}".`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      toast.error(`Error deleting event: ${message}`);
    } finally {
      setIsDeletingSchedule(false);
      setIsDeleteScheduleAlertOpen(false);
      setScheduleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-semibold dark:text-white">Content Schedule</h1><p className="text-gray-500 dark:text-gray-400">Plan content plays.</p></div><Button onClick={() => handleOpenEventModalForNew()} disabled={isLoadingModalData}><PlusCircleIcon className="mr-2 h-4 w-4" /> {isLoadingModalData ? "Loading..." : "Create Schedule Entry"}</Button></div>
      {isLoadingEvents && (<div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/><p className="ml-2 dark:text-gray-300">Loading...</p></div>)}
      {error && !isLoadingEvents && (<div className="p-4 bg-red-100 text-red-700 border rounded-md dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"><AlertTriangleIcon className="h-5 w-5 inline mr-2"/>Error: {error}<Button variant="link" onClick={() => fetchScheduledEvents()} className="ml-2 text-red-700 dark:text-red-300">Retry</Button></div>)}
      {!isLoadingEvents && !error && (<CalendarView events={scheduledEvents} onEventClick={handleOpenEventModalForEdit} onDateClick={handleOpenEventModalForNew}/>)}

      {isEventModalOpen && (
        <ScheduleEventModal
            key={editingEvent?.id || 'new-event'}
            event={editingEvent}
            isOpen={isEventModalOpen}
            onOpenChange={setIsEventModalOpen}
            onSave={handleSaveEvent}
            playlists={modalPlaylists}
            devicesAndGroups={modalDevicesAndGroups}
            isLoadingData={isLoadingModalData}
            onDeleteRequest={editingEvent ? () => handleDeleteScheduleRequest({id: editingEvent.id, title: editingEvent.title || editingEvent.playlistName}) : undefined}
        />
      )}

      <AlertDialog open={isDeleteScheduleAlertOpen} onOpenChange={setIsDeleteScheduleAlertOpen}>
        <AlertDialogContent className="dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This action cannot be undone. This will permanently delete the schedule entry
              <span className="font-semibold dark:text-gray-300"> {scheduleToDelete?.title || scheduleToDelete?.id}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" disabled={isDeletingSchedule}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSchedule}
              disabled={isDeletingSchedule}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 dark:text-white"
            >
              {isDeletingSchedule ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, delete schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

```

**Step 2: Update `src/app/[locale]/signage/frontend/components/schedule/ScheduleEventModal.tsx`**
