// src/app/[locale]/signage/frontend/components/schedule/ScheduleEventModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, SaveIcon, CalendarClockIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
// Import enums from page or a shared types file
import { PageGraphQLTargetType as GraphQLTargetType, PageRecurrenceType as RecurrenceType, PageMonthlyRecurrenceType as MonthlyRecurrenceType } from '@/app/[locale]/signage/schedules/page';


// Types
interface GraphQLPlaylist { id: string; name: string; }
interface GraphQLDeviceOrGroup { id: string; name: string; type: GraphQLTargetType; }
interface GraphQLScheduledEventTargetInput { id: string; type: GraphQLTargetType; }
interface WeeklyRecurrenceConfig { days: string[]; }
interface MonthlyRecurrenceConfig { type: MonthlyRecurrenceType; dayOfMonth?: number; weekOrdinal?: string; dayOfWeek?: string; }

// This is the main input type for the onSave callback, matching the page's definition
interface PageGraphQLScheduledEventInput {
  title?: string; playlistId: string; targetInputs: GraphQLScheduledEventTargetInput[];
  startTime: string; endTime: string; recurrenceType?: RecurrenceType; rrule?: string;
  weeklyConfig?: WeeklyRecurrenceConfig | null; monthlyConfig?: MonthlyRecurrenceConfig | null;
  // organizationId is added by the page before calling mutate
  playlistName?: string;
  allDay?: boolean | null;
}

// This is the type for an existing event being edited, matching the page's definition
interface PageGraphQLScheduledEvent {
  id: string; organizationId: string; title?: string | null; playlistId: string;
  targets: {id: string; name: string; type: GraphQLTargetType}[];
  startTime: string; endTime: string;
  recurrenceType?: RecurrenceType | null; rrule?: string | null;
  weeklyConfig?: WeeklyRecurrenceConfig | null; monthlyConfig?: MonthlyRecurrenceConfig | null;
  allDay?: boolean | null; timezone?: string | null; exceptions?: any[] | null;
  createdAt: string; updatedAt: string; playlistName?: string | null; targetNames?: string[] | null;
}


interface ScheduleEventModalProps {
  event?: PageGraphQLScheduledEvent | null;
  isOpen: boolean; onOpenChange: (isOpen: boolean) => void;
  onSave: (eventData: PageGraphQLScheduledEventInput) => Promise<boolean>;
  playlists: GraphQLPlaylist[]; devicesAndGroups: GraphQLDeviceOrGroup[]; isLoadingData?: boolean;
  onDeleteRequest?: (eventId: string, eventTitle?: string | null) => void;
}

const mainRecurrenceOptions = [
    { value: RecurrenceType.NONE, label: 'Does not repeat' }, { value: RecurrenceType.DAILY, label: 'Daily' },
    { value: RecurrenceType.WEEKLY, label: 'Weekly' }, { value: RecurrenceType.MONTHLY, label: 'Monthly' },
];
const daysOfWeekOptions = [
    { value: 'MO', label: 'Mon' }, { value: 'TU', label: 'Tue' }, { value: 'WE', label: 'Wed' },
    { value: 'TH', label: 'Thu' }, { value: 'FR', label: 'Fri' }, { value: 'SA', label: 'Sat' }, { value: 'SU', label: 'Sun' }
];
const weekOrdinalOptions = [
    { value: 'FIRST', label: 'First' }, { value: 'SECOND', label: 'Second' },{ value: 'THIRD', label: 'Third' },
    { value: 'FOURTH', label: 'Fourth' }, { value: 'LAST', label: 'Last' }
];


const ScheduleEventModal: React.FC<ScheduleEventModalProps> = ({
  event, isOpen, onOpenChange, onSave, playlists, devicesAndGroups, isLoadingData, onDeleteRequest
}) => {
  const [title, setTitle] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<GraphQLScheduledEventTargetInput[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(false); // Added allDay state

  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(RecurrenceType.NONE);
  const [weeklyDays, setWeeklyDays] = useState<string[]>([]);
  const [monthlyType, setMonthlyType] = useState<MonthlyRecurrenceType>(MonthlyRecurrenceType.DAY_OF_MONTH);
  const [monthlyDayOfMonth, setMonthlyDayOfMonth] = useState<number>(1);
  const [monthlyWeekOrdinal, setMonthlyWeekOrdinal] = useState<string>(weekOrdinalOptions[0].value);
  const [monthlyDayOfWeek, setMonthlyDayOfWeek] = useState<string>(daysOfWeekOptions[0].value);

  const [isSaving, setIsSaving] = useState(false);

  const formatDateForInput = (isoDate?: string) => {
    if (!isoDate) return ''; const date = new Date(isoDate);
    return date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + 'T' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
  };

  useEffect(() => {
    if (isOpen) {
        if (event) {
            setTitle(event.title || event.playlistName || '');
            setPlaylistId(event.playlistId);
            setSelectedTargets(event.targets?.map(t => ({ id: t.id, type: t.type })) || []);
            setStartTime(formatDateForInput(event.startTime));
            setEndTime(formatDateForInput(event.endTime));
            setAllDay(event.allDay || false);
            setRecurrenceType(event.recurrenceType || RecurrenceType.NONE);
            setWeeklyDays(event.weeklyConfig?.days || []);
            setMonthlyType(event.monthlyConfig?.type || MonthlyRecurrenceType.DAY_OF_MONTH);
            setMonthlyDayOfMonth(event.monthlyConfig?.dayOfMonth || new Date(event.startTime).getDate());
            setMonthlyWeekOrdinal(event.monthlyConfig?.weekOrdinal || weekOrdinalOptions[0].value);
            setMonthlyDayOfWeek(event.monthlyConfig?.dayOfWeek || daysOfWeekOptions[0].value);
        } else {
            setTitle('');
            setPlaylistId(playlists.length > 0 ? playlists[0].id : '');
            setSelectedTargets([]);
            const now = new Date(); now.setHours(now.getHours() + 1, 0, 0, 0);
            setStartTime(formatDateForInput(now.toISOString()));
            now.setHours(now.getHours() + 1); setEndTime(formatDateForInput(now.toISOString()));
            setAllDay(false);
            setRecurrenceType(RecurrenceType.NONE); setWeeklyDays([]);
            setMonthlyType(MonthlyRecurrenceType.DAY_OF_MONTH); setMonthlyDayOfMonth(new Date().getDate());
            setMonthlyWeekOrdinal(weekOrdinalOptions[0].value); setMonthlyDayOfWeek(daysOfWeekOptions[0].value);
        }
    }
  }, [event, isOpen, playlists]);

  const handleTargetSelection = (target: GraphQLDeviceOrGroup) => {
    setSelectedTargets(prev => { const isSelected = prev.some(st => st.id === target.id && st.type === target.type); if (isSelected) { return prev.filter(st => !(st.id === target.id && st.type === target.type)); } else { return [...prev, { id: target.id, type: target.type }]; } });
  };
  const handleWeeklyDayToggle = (dayValue: string) => { setWeeklyDays(prev => prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue]); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistId) { toast.error("Please select a playlist."); return; }
    if (selectedTargets.length === 0) { toast.error("Please select at least one target."); return; }
    const startDateTime = new Date(startTime); const endDateTime = new Date(endTime);
    if (endDateTime <= startDateTime) { toast.error("End time must be after start time."); return; }
    if (recurrenceType === RecurrenceType.WEEKLY && weeklyDays.length === 0) { toast.error("Please select at least one day for weekly recurrence."); return; }
    setIsSaving(true);
    const selectedPlaylist = playlists.find(p => p.id === playlistId);
    const eventData: PageGraphQLScheduledEventInput = { // Use the page-level input type for onSave
      title: title.trim() || selectedPlaylist?.name || 'Scheduled Content', playlistId, targetInputs: selectedTargets,
      startTime: startDateTime.toISOString(), endTime: endDateTime.toISOString(),
      allDay, // Include allDay
      recurrenceType: recurrenceType === RecurrenceType.NONE ? undefined : recurrenceType,
      weeklyConfig: recurrenceType === RecurrenceType.WEEKLY ? { days: weeklyDays.sort() } : null,
      monthlyConfig: recurrenceType === RecurrenceType.MONTHLY ? {
          type: monthlyType,
          dayOfMonth: monthlyType === MonthlyRecurrenceType.DAY_OF_MONTH ? monthlyDayOfMonth : undefined,
          weekOrdinal: monthlyType === MonthlyRecurrenceType.NTH_DAY_OF_WEEK ? monthlyWeekOrdinal : undefined,
          dayOfWeek: monthlyType === MonthlyRecurrenceType.NTH_DAY_OF_WEEK ? monthlyDayOfWeek : undefined,
      } : null,
      playlistName: selectedPlaylist?.name, // For mock convenience
      organizationId: '', // Page will fill this in before calling mutate
    };
    const success = await onSave(eventData); setIsSaving(false); if (success) { onOpenChange(false); }
  };

  const handleDelete = () => {
      if (event?.id && onDeleteRequest) {
          onDeleteRequest(event.id, event.title || event.playlistName);
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg dark:bg-gray-800">
    <DialogHeader><DialogTitle className="dark:text-white flex items-center"><CalendarClockIcon className="h-5 w-5 mr-2"/>{event ? 'Edit Schedule Entry' : 'Create New Schedule Entry'}</DialogTitle><DialogDescription className="dark:text-gray-400">Select content, targets, time, and recurrence.</DialogDescription></DialogHeader>
    {isLoadingData ? (<div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground dark:text-gray-400"/><p className="ml-2 dark:text-gray-300">Loading data...</p></div>) : (
    <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2 pb-2"> {/* Added pb-2 for padding with scroll */}
      <div><Label htmlFor="eventTitle" className="dark:text-gray-300">Event Title (Optional)</Label><Input id="eventTitle" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Morning Welcome" className="dark:bg-gray-700 dark:text-white dark:border-gray-600"/></div>
      <div><Label htmlFor="playlistSelect" className="dark:text-gray-300">Playlist*</Label><Select value={playlistId} onValueChange={setPlaylistId} required><SelectTrigger id="playlistSelect" className="dark:bg-gray-700 dark:text-white dark:border-gray-600"><SelectValue placeholder="Select a playlist" /></SelectTrigger><SelectContent className="dark:bg-gray-700 dark:text-white">{playlists.length === 0 && <SelectItem value="no-playlists" disabled>No playlists available</SelectItem>}{playlists.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label className="dark:text-gray-300">Targets*</Label><ScrollArea className="h-32 rounded-md border p-2 dark:border-gray-600">{devicesAndGroups.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400">No targets available</p>}{devicesAndGroups.map(target => (<div key={`${target.type}-${target.id}`} className="flex items-center space-x-2 py-1"><Checkbox id={`target-${target.type}-${target.id}`} checked={selectedTargets.some(st => st.id === target.id && st.type === target.type)} onCheckedChange={() => handleTargetSelection(target)} className="dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"/>
      <Label htmlFor={`target-${target.type}-${target.id}`} className="text-sm font-normal dark:text-gray-300 cursor-pointer">{target.name} {target.type === GraphQLTargetType.DEVICE_GROUP && <Badge variant="secondary" className="ml-1 text-xs dark:bg-gray-600 dark:text-gray-200">Group</Badge>}</Label></div>))}</ScrollArea></div>

      <div className="flex items-center space-x-2 pt-1">
        <Checkbox id="allDay" checked={allDay} onCheckedChange={(checked) => setAllDay(checked as boolean)} className="dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"/>
        <Label htmlFor="allDay" className="text-sm font-normal dark:text-gray-300 cursor-pointer">All-day event</Label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div><Label htmlFor="startTime" className="dark:text-gray-300">Start Time*</Label><Input id="startTime" type={allDay ? "date" : "datetime-local"} value={allDay ? startTime.split('T')[0] : startTime} onChange={e => setStartTime(e.target.value)} required className="dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:[color-scheme:dark]"/></div>
        <div><Label htmlFor="endTime" className="dark:text-gray-300">End Time*</Label><Input id="endTime" type={allDay ? "date" : "datetime-local"} value={allDay ? endTime.split('T')[0] : endTime} onChange={e => setEndTime(e.target.value)} required className="dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:[color-scheme:dark]"/></div>
      </div>

      <div><Label htmlFor="recurrenceType" className="dark:text-gray-300">Recurrence</Label><Select value={recurrenceType} onValueChange={(value) => setRecurrenceType(value as RecurrenceType)}><SelectTrigger id="recurrenceType" className="dark:bg-gray-700 dark:text-white dark:border-gray-600"><SelectValue placeholder="Select recurrence" /></SelectTrigger><SelectContent className="dark:bg-gray-700 dark:text-white">{mainRecurrenceOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent></Select></div>

      {recurrenceType === RecurrenceType.WEEKLY && ( <div className="pl-4 space-y-2 border-l-2 dark:border-gray-600 ml-1"><Label className="text-sm font-medium dark:text-gray-300">Repeat on days:</Label><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{daysOfWeekOptions.map(day => ( <Button key={day.value} type="button"variant={weeklyDays.includes(day.value) ? "default" : "outline"}size="sm"onClick={() => handleWeeklyDayToggle(day.value)}className={`text-xs ${weeklyDays.includes(day.value) ? 'dark:bg-blue-600 dark:text-white' : 'dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'}`}>{day.label}</Button>))}</div></div>)}
      {recurrenceType === RecurrenceType.MONTHLY && ( <div className="pl-4 space-y-3 border-l-2 dark:border-gray-600 ml-1"><RadioGroup value={monthlyType} onValueChange={(value) => setMonthlyType(value as MonthlyRecurrenceType)} className="space-y-1"><div className="flex items-center space-x-2"><RadioGroupItem value={MonthlyRecurrenceType.DAY_OF_MONTH} id="monthlyDay" className="dark:border-gray-500 data-[state=checked]:text-blue-600 dark:text-white border-gray-300"/><Label htmlFor="monthlyDay" className="font-normal dark:text-gray-300">On day</Label><Input type="number" value={monthlyDayOfMonth} onChange={e => setMonthlyDayOfMonth(parseInt(e.target.value))} min="1" max="31" className="w-20 h-8 dark:bg-gray-700 dark:text-white dark:border-gray-600" disabled={monthlyType !== MonthlyRecurrenceType.DAY_OF_MONTH}/></div><div className="flex items-center space-x-2"><RadioGroupItem value={MonthlyRecurrenceType.NTH_DAY_OF_WEEK} id="monthlyNthDay" className="dark:border-gray-500 data-[state=checked]:text-blue-600 dark:text-white border-gray-300"/><Label htmlFor="monthlyNthDay" className="font-normal dark:text-gray-300">On the</Label><Select value={monthlyWeekOrdinal} onValueChange={setMonthlyWeekOrdinal} disabled={monthlyType !== MonthlyRecurrenceType.NTH_DAY_OF_WEEK}><SelectTrigger className="w-[100px] h-8 text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600"><SelectValue/></SelectTrigger><SelectContent className="dark:bg-gray-700 dark:text-white">{weekOrdinalOptions.map(opt=><SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>)}</SelectContent></Select><Select value={monthlyDayOfWeek} onValueChange={setMonthlyDayOfWeek} disabled={monthlyType !== MonthlyRecurrenceType.NTH_DAY_OF_WEEK}><SelectTrigger className="w-[100px] h-8 text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600"><SelectValue/></SelectTrigger><SelectContent className="dark:bg-gray-700 dark:text-white">{daysOfWeekOptions.map(opt=><SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>)}</SelectContent></Select></div></RadioGroup></div>)}

      <DialogFooter className="pt-4 flex justify-between w-full">
        <div>
          {event && onDeleteRequest && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isSaving} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">
              <Trash2Icon className="h-4 w-4 mr-2"/> Delete
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Cancel</Button>
          <Button type="submit" disabled={isSaving || isLoadingData} className="min-w-[100px]">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4 mr-2"/>}
            {event ? 'Save Changes' : 'Create Schedule'}
          </Button>
        </div>
      </DialogFooter>
    </form>
    )}
    </DialogContent></Dialog>
  );
};
export default ScheduleEventModal;

```

**Worker Notes:**
*   In `schedules/page.tsx`:
    *   `mockGraphqlClient` updated with `updateScheduledEvent` and `deleteScheduledEvent` functions. These modify the `pageLevelMockScheduledEventsDb` array.
    *   `handleSaveEvent` in the page component now distinguishes between creating a new event and updating an existing one based on `editingEvent.id`. It calls the respective mock client mutation (`createScheduledEvent` or `updateScheduledEvent`).
    *   State and handler functions for delete confirmation (`isDeleteScheduleAlertOpen`, `scheduleToDelete`, `isDeletingSchedule`, `handleDeleteScheduleRequest`, `confirmDeleteSchedule`) are added.
    *   `ScheduleEventModal` is now passed an `onDeleteRequest` prop.
    *   An `AlertDialog` for delete confirmation is rendered.
    *   The `PageGraphQLUpdateScheduledEventInput` type is added for clarity on update inputs.
*   In `ScheduleEventModal.tsx`:
    *   A new prop `onDeleteRequest?: (eventId: string, eventTitle?: string | null) => void;` is added.
    *   A "Delete" button is added to the `DialogFooter`. It's only visible if `event` (editing mode) and `onDeleteRequest` are provided.
    *   The `handleDelete` function calls `onDeleteRequest` with the event's ID and title/name.
    *   The `allDay` state is added and linked to a checkbox. The Start/End time inputs now conditionally change their `type` between `datetime-local` and `date` based on this `allDay` state.
    *   The `handleSubmit` function now includes `allDay` in the `eventData`.
    *   The `useEffect` for initializing the form now also handles the `allDay` state and sets `monthlyDayOfMonth` to the start date's day if available when editing.
    *   The type `PageGraphQLScheduledEvent_EditorType` is used for the `event` prop to align with the page's `PageGraphQLScheduledEvent` type. The modal's `onSave` prop still correctly expects `PageGraphQLScheduledEventInput`.
    *   Enums are imported from `schedules/page.tsx` to ensure consistency.
    *   Minor UI adjustments for dark mode consistency and layout.
