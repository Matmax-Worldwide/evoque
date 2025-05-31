// src/app/[locale]/signage/frontend/components/schedule/ScheduleEventModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
// Shadcn UI (Dialog, Button, Input, Label, Textarea, Select, ScrollArea, Checkbox, Loader2, SaveIcon, CalendarClockIcon, Badge as before)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Removed DialogClose
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Removed SelectGroup, SelectLabel as not used
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Added RadioGroup
import { Loader2, SaveIcon, CalendarClockIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
// Import enums from page or a shared types file
import { GraphQLTargetType, RecurrenceType, MonthlyRecurrenceType } from '@/app/[locale]/signage/schedules/page'; // Assuming exported from page for mock


// Types (as before, with detailed recurrence configs)
interface GraphQLPlaylist { id: string; name: string; }
interface GraphQLDeviceOrGroup { id: string; name: string; type: GraphQLTargetType; }
interface GraphQLScheduledEventTargetInput { id: string; type: GraphQLTargetType; }
interface WeeklyRecurrenceConfig { days: string[]; } // MO, TU, WE, TH, FR, SA, SU
interface MonthlyRecurrenceConfig { type: MonthlyRecurrenceType; dayOfMonth?: number; weekOrdinal?: string; dayOfWeek?: string; }
interface GraphQLScheduledEventInput {
  title?: string; playlistId: string; targetInputs: GraphQLScheduledEventTargetInput[];
  startTime: string; endTime: string;
  recurrenceType?: RecurrenceType; rrule?: string; // rrule might be generated from configs later
  weeklyConfig?: WeeklyRecurrenceConfig | null;
  monthlyConfig?: MonthlyRecurrenceConfig | null;
  organizationId?: string; // Page will inject it
  playlistName?: string;
  allDay?: boolean | null;
}
// This is the type for an existing event being edited
interface GraphQLScheduledEvent_EditorType extends Omit<GraphQLScheduledEventInput, 'targetInputs' | 'organizationId' | 'recurrenceType'> {
  id: string;
  organizationId: string;
  targets: {id: string; name: string; type: GraphQLTargetType}[];
  recurrenceType?: RecurrenceType;
  weeklyConfig?: WeeklyRecurrenceConfig | null;
  monthlyConfig?: MonthlyRecurrenceConfig | null;
}

interface ScheduleEventModalProps {
  event?: GraphQLScheduledEvent_EditorType | null;
  isOpen: boolean; onOpenChange: (isOpen: boolean) => void;
  onSave: (eventData: GraphQLScheduledEventInput) => Promise<boolean>;
  playlists: GraphQLPlaylist[];
  devicesAndGroups: GraphQLDeviceOrGroup[];
  isLoadingData?: boolean;
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
    { value: 'FIRST', label: 'First' }, { value: 'SECOND', label: 'Second' }, { value: 'THIRD', label: 'Third' },
    { value: 'FOURTH', label: 'Fourth' }, { value: 'LAST', label: 'Last' }
];

const ScheduleEventModal: React.FC<ScheduleEventModalProps> = ({
  event, isOpen, onOpenChange, onSave, playlists, devicesAndGroups, isLoadingData
}) => {
  const [title, setTitle] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<GraphQLScheduledEventTargetInput[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

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
            setRecurrenceType(event.recurrenceType || RecurrenceType.NONE);
            setWeeklyDays(event.weeklyConfig?.days || []);
            setMonthlyType(event.monthlyConfig?.type || MonthlyRecurrenceType.DAY_OF_MONTH);
            setMonthlyDayOfMonth(event.monthlyConfig?.dayOfMonth || new Date(event.startTime).getDate()); // Use start date's day if available
            setMonthlyWeekOrdinal(event.monthlyConfig?.weekOrdinal || weekOrdinalOptions[0].value);
            setMonthlyDayOfWeek(event.monthlyConfig?.dayOfWeek || daysOfWeekOptions[0].value);
        } else {
            setTitle('');
            setPlaylistId(playlists.length > 0 ? playlists[0].id : '');
            setSelectedTargets([]);
            const now = new Date(); now.setHours(now.getHours() + 1, 0, 0, 0);
            setStartTime(formatDateForInput(now.toISOString()));
            now.setHours(now.getHours() + 1); setEndTime(formatDateForInput(now.toISOString()));
            setRecurrenceType(RecurrenceType.NONE); setWeeklyDays([]);
            setMonthlyType(MonthlyRecurrenceType.DAY_OF_MONTH); setMonthlyDayOfMonth(new Date().getDate());
            setMonthlyWeekOrdinal(weekOrdinalOptions[0].value); setMonthlyDayOfWeek(daysOfWeekOptions[0].value);
        }
    }
  }, [event, isOpen, playlists]);

  const handleTargetSelection = (target: GraphQLDeviceOrGroup) => {
    setSelectedTargets(prev => { const isSelected = prev.some(st => st.id === target.id && st.type === target.type); if (isSelected) { return prev.filter(st => !(st.id === target.id && st.type === target.type)); } else { return [...prev, { id: target.id, type: target.type }]; } });
  };

  const handleWeeklyDayToggle = (dayValue: string) => {
    setWeeklyDays(prev => prev.includes(dayValue) ? prev.filter(d => d !== dayValue) : [...prev, dayValue]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistId) { toast.error("Please select a playlist."); return; }
    if (selectedTargets.length === 0) { toast.error("Please select at least one target."); return; }
    const startDateTime = new Date(startTime); const endDateTime = new Date(endTime);
    if (endDateTime <= startDateTime) { toast.error("End time must be after start time."); return; }
    if (recurrenceType === RecurrenceType.WEEKLY && weeklyDays.length === 0) { toast.error("Please select at least one day for weekly recurrence."); return; }

    setIsSaving(true);
    const selectedPlaylist = playlists.find(p => p.id === playlistId);
    const eventData: GraphQLScheduledEventInput = {
      title: title.trim() || selectedPlaylist?.name || 'Scheduled Content',
      playlistId, targetInputs: selectedTargets,
      startTime: startDateTime.toISOString(), endTime: endDateTime.toISOString(),
      recurrenceType: recurrenceType === RecurrenceType.NONE ? undefined : recurrenceType,
      weeklyConfig: recurrenceType === RecurrenceType.WEEKLY ? { days: weeklyDays.sort() } : null,
      monthlyConfig: recurrenceType === RecurrenceType.MONTHLY ? {
          type: monthlyType,
          dayOfMonth: monthlyType === MonthlyRecurrenceType.DAY_OF_MONTH ? monthlyDayOfMonth : undefined,
          weekOrdinal: monthlyType === MonthlyRecurrenceType.NTH_DAY_OF_WEEK ? monthlyWeekOrdinal : undefined,
          dayOfWeek: monthlyType === MonthlyRecurrenceType.NTH_DAY_OF_WEEK ? monthlyDayOfWeek : undefined,
      } : null,
      playlistName: selectedPlaylist?.name,
      allDay: false, // Default allDay, could be an input
    };

    const success = await onSave(eventData);
    setIsSaving(false);
    if (success) { onOpenChange(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg dark:bg-gray-800">
    <DialogHeader><DialogTitle className="dark:text-white flex items-center"><CalendarClockIcon className="h-5 w-5 mr-2"/>{event ? 'Edit Schedule Entry' : 'Create New Schedule Entry'}</DialogTitle><DialogDescription className="dark:text-gray-400">Select content, targets, time, and recurrence.</DialogDescription></DialogHeader>
    {isLoadingData ? (<div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground dark:text-gray-400"/><p className="ml-2 dark:text-gray-300">Loading data...</p></div>) : (
    <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
      <div><Label htmlFor="eventTitle" className="dark:text-gray-300">Event Title (Optional)</Label><Input id="eventTitle" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Morning Welcome" className="dark:bg-gray-700 dark:text-white dark:border-gray-600"/></div>
      <div><Label htmlFor="playlistSelect" className="dark:text-gray-300">Playlist*</Label><Select value={playlistId} onValueChange={setPlaylistId} required><SelectTrigger id="playlistSelect" className="dark:bg-gray-700 dark:text-white dark:border-gray-600"><SelectValue placeholder="Select a playlist" /></SelectTrigger><SelectContent className="dark:bg-gray-700 dark:text-white">{playlists.length === 0 && <SelectItem value="no-playlists" disabled>No playlists available</SelectItem>}{playlists.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label className="dark:text-gray-300">Targets*</Label><ScrollArea className="h-32 rounded-md border p-2 dark:border-gray-600">{devicesAndGroups.length === 0 && <p className="text-xs text-gray-500 dark:text-gray-400">No targets available</p>}{devicesAndGroups.map(target => (<div key={`${target.type}-${target.id}`} className="flex items-center space-x-2 py-1"><Checkbox id={`target-${target.type}-${target.id}`} checked={selectedTargets.some(st => st.id === target.id && st.type === target.type)} onCheckedChange={() => handleTargetSelection(target)} className="dark:border-gray-500 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"/>
      <Label htmlFor={`target-${target.type}-${target.id}`} className="text-sm font-normal dark:text-gray-300 cursor-pointer">{target.name} {target.type === GraphQLTargetType.DEVICE_GROUP && <Badge variant="secondary" className="ml-1 text-xs dark:bg-gray-600 dark:text-gray-200">Group</Badge>}</Label></div>))}</ScrollArea></div>
      <div className="grid grid-cols-2 gap-4"><div><Label htmlFor="startTime" className="dark:text-gray-300">Start Time*</Label><Input id="startTime" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required className="dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:[color-scheme:dark]"/></div><div><Label htmlFor="endTime" className="dark:text-gray-300">End Time*</Label><Input id="endTime" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required className="dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:[color-scheme:dark]"/></div></div>

      <div><Label htmlFor="recurrenceType" className="dark:text-gray-300">Recurrence</Label><Select value={recurrenceType} onValueChange={(value) => setRecurrenceType(value as RecurrenceType)}><SelectTrigger id="recurrenceType" className="dark:bg-gray-700 dark:text-white dark:border-gray-600"><SelectValue placeholder="Select recurrence" /></SelectTrigger><SelectContent className="dark:bg-gray-700 dark:text-white">{mainRecurrenceOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent></Select></div>

      {recurrenceType === RecurrenceType.WEEKLY && (
        <div className="pl-4 space-y-2 border-l-2 dark:border-gray-600 ml-1">
          <Label className="text-sm font-medium dark:text-gray-300">Repeat on days:</Label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {daysOfWeekOptions.map(day => (
              <Button key={day.value} type="button" variant={weeklyDays.includes(day.value) ? "default" : "outline"} size="sm" onClick={() => handleWeeklyDayToggle(day.value)} className={`text-xs ${weeklyDays.includes(day.value) ? 'dark:bg-blue-600 dark:text-white' : 'dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'}`}>{day.label}</Button>
            ))}
          </div>
        </div>
      )}

      {recurrenceType === RecurrenceType.MONTHLY && (
        <div className="pl-4 space-y-3 border-l-2 dark:border-gray-600 ml-1">
            <RadioGroup value={monthlyType} onValueChange={(value) => setMonthlyType(value as MonthlyRecurrenceType)} className="space-y-1">
                <div className="flex items-center space-x-2"><RadioGroupItem value={MonthlyRecurrenceType.DAY_OF_MONTH} id="monthlyDay" className="dark:border-gray-500 data-[state=checked]:text-blue-600 dark:text-white border-gray-300"/><Label htmlFor="monthlyDay" className="font-normal dark:text-gray-300">On day</Label>
                <Input type="number" value={monthlyDayOfMonth} onChange={e => setMonthlyDayOfMonth(parseInt(e.target.value))} min="1" max="31" className="w-20 h-8 dark:bg-gray-700 dark:text-white dark:border-gray-600" disabled={monthlyType !== MonthlyRecurrenceType.DAY_OF_MONTH}/></div>

                <div className="flex items-center space-x-2"><RadioGroupItem value={MonthlyRecurrenceType.NTH_DAY_OF_WEEK} id="monthlyNthDay" className="dark:border-gray-500 data-[state=checked]:text-blue-600 dark:text-white border-gray-300"/><Label htmlFor="monthlyNthDay" className="font-normal dark:text-gray-300">On the</Label>
                <Select value={monthlyWeekOrdinal} onValueChange={setMonthlyWeekOrdinal} disabled={monthlyType !== MonthlyRecurrenceType.NTH_DAY_OF_WEEK}><SelectTrigger className="w-[100px] h-8 text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600"><SelectValue/></SelectTrigger><SelectContent className="dark:bg-gray-700 dark:text-white">{weekOrdinalOptions.map(opt=><SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>)}</SelectContent></Select>
                <Select value={monthlyDayOfWeek} onValueChange={setMonthlyDayOfWeek} disabled={monthlyType !== MonthlyRecurrenceType.NTH_DAY_OF_WEEK}><SelectTrigger className="w-[100px] h-8 text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600"><SelectValue/></SelectTrigger><SelectContent className="dark:bg-gray-700 dark:text-white">{daysOfWeekOptions.map(opt=><SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>)}</SelectContent></Select>
                </div>
            </RadioGroup>
        </div>
      )}

      <DialogFooter className="pt-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Cancel</Button><Button type="submit" disabled={isSaving || isLoadingData} className="min-w-[100px]">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4 mr-2"/>}{event ? 'Save Changes' : 'Create Schedule'}</Button></DialogFooter>
    </form>
    )}
    </DialogContent></Dialog>
  );
};
export default ScheduleEventModal;
