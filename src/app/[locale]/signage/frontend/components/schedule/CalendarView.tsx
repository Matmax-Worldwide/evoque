// src/app/[locale]/signage/frontend/components/schedule/CalendarView.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Removed CardTitle as it's not directly used here
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip

// Type for scheduled events
interface GraphQLScheduledEvent {
  id: string;
  title?: string;
  playlistName?: string;
  targetNames?: string[];
  startTime: string; // ISO Date string
  endTime: string;   // ISO Date string
  // Add a conceptual color property for mock display
  color?: string;
}

interface CalendarViewProps {
  events: GraphQLScheduledEvent[];
  initialView?: 'month' | 'week';
  onEventClick?: (event: GraphQLScheduledEvent) => void;
  onDateClick?: (date: Date) => void;
  // conceptual prop for highlighting a date that might have been selected for new event creation
  selectedDateForNewEvent?: Date | null;
}

// Helper to get days in a month
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)

// Mock color generation based on playlist name or event title hash
const generateEventColor = (text?: string): string => {
    if (!text) return 'bg-gray-400 dark:bg-gray-500'; // Default color
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    const colors = [
        'bg-blue-500 dark:bg-blue-600', 'bg-green-500 dark:bg-green-600',
        'bg-purple-500 dark:bg-purple-600', 'bg-orange-500 dark:bg-orange-600',
        'bg-red-500 dark:bg-red-600', 'bg-yellow-500 dark:bg-yellow-600',
        'bg-pink-500 dark:bg-pink-600', 'bg-teal-500 dark:bg-teal-600'
    ];
    return colors[Math.abs(hash) % colors.length];
};


const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  initialView = 'month',
  onEventClick,
  onDateClick,
  selectedDateForNewEvent
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>(initialView);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrev = () => {
    if (viewType === 'month') setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    else setCurrentDate(new Date(new Date(currentDate).setDate(currentDate.getDate() - 7))); // Ensure new Date object
  };
  const handleNext = () => {
    if (viewType === 'month') setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    else setCurrentDate(new Date(new Date(currentDate).setDate(currentDate.getDate() + 7))); // Ensure new Date object
  };
  const handleToday = () => { setCurrentDate(new Date()); };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    let firstDayOfWeekIndex = getFirstDayOfMonth(currentYear, currentMonth); // 0 for Sunday, 1 for Monday etc.
    firstDayOfWeekIndex = firstDayOfWeekIndex === 0 ? 6 : firstDayOfWeekIndex - 1; // Monday is 0, Sunday is 6

    const dayCells = [];
    for (let i = 0; i < firstDayOfWeekIndex; i++) {
      // These are styled as part of the grid cells below now
      dayCells.push(<div key={`empty-prev-${i}`} className="p-1 h-28"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentYear, currentMonth, day);
      const cellDateString = cellDate.toDateString();
      const isToday = new Date().toDateString() === cellDateString;
      const isSelectedForNew = selectedDateForNewEvent?.toDateString() === cellDateString;

      const dayEvents = events.filter(event => {
        const eventStart = new Date(event.startTime);
        const eventEnd = new Date(event.endTime);
        return cellDate >= new Date(eventStart.toDateString()) && cellDate <= new Date(eventEnd.toDateString());
      }).map(e => ({...e, color: generateEventColor(e.playlistName || e.title)})); // Add color to event

      let cellInnerDivClasses = "p-1.5 h-28 overflow-y-auto relative group hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors duration-150";
      if (onDateClick) cellInnerDivClasses += " cursor-pointer";
      if (isSelectedForNew) cellInnerDivClasses += " bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500 z-10";


      dayCells.push(
        <div
            key={day}
            className={cellInnerDivClasses}
            onClick={() => onDateClick && onDateClick(cellDate)}
        >
          <span className={`text-xs font-medium mb-1 block text-right pr-1
            ${isToday ? 'text-blue-600 dark:text-blue-300 font-bold rounded-full bg-blue-100 dark:bg-blue-700/50 inline-block px-1.5 py-0.5 leading-tight' : 'text-gray-600 dark:text-gray-400'}
            ${isSelectedForNew ? 'text-blue-700 dark:text-blue-200' : ''}
          `}>
            {day}
          </span>
          <div className="space-y-0.5">
            {dayEvents.slice(0, 3).map(event => (
              <TooltipProvider key={event.id} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center space-x-1.5 p-0.5 rounded text-xs cursor-pointer hover:opacity-80"
                      onClick={(e) => { e.stopPropagation(); onEventClick && onEventClick(event); }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${event.color || 'bg-gray-400'}`}></span>
                      <span className="truncate text-gray-700 dark:text-gray-200">{event.title || event.playlistName || 'Event'}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
                    <p className="font-semibold">{event.title || event.playlistName}</p>
                    <p className="text-xs">{new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    {event.targetNames && <p className="text-xs text-gray-500 dark:text-gray-400">Targets: {event.targetNames.join(', ')}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {dayEvents.length > 3 && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); onDateClick && onDateClick(cellDate); }}>
                + {dayEvents.length - 3} more
              </p>
            )}
          </div>
        </div>
      );
    }
    // Calculate total cells for full weeks (5 or 6 rows)
    const totalCellsInGrid = Math.ceil((firstDayOfWeekIndex + daysInMonth) / 7) * 7;
    while (dayCells.length < totalCellsInGrid) {
        dayCells.push(<div key={`empty-next-${dayCells.length}`} className="p-1 h-28"></div>);
    }

    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return (
      <>
        <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-x dark:border-gray-700">
          {weekdays.map(dayName => <div key={dayName} className="py-2 border-r dark:border-gray-700 last:border-r-0">{dayName}</div>)}
        </div>
        <div className="grid grid-cols-7 bg-gray-200 dark:bg-gray-900/20 border dark:border-gray-700 border-t-0">
          {dayCells.map((cellContent, index) =>
            <div key={index} className="bg-white dark:bg-gray-800 border-r border-b dark:border-gray-700 last:border-r-0">
              {cellContent}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - (currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1));
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const weekEvents = events.filter(event => { const eventStart = new Date(event.startTime); return eventStart >= weekStart && eventStart <= weekEnd; })
        .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        .map(e => ({...e, color: generateEventColor(e.playlistName || e.title)}));

    return (
      <div className="space-y-3 p-4">
        <h3 className="text-lg font-semibold dark:text-white">Events this week ({weekStart.toLocaleDateString([], {month:'short', day:'numeric'})} - {weekEnd.toLocaleDateString([], {month:'short', day:'numeric'})})</h3>
        {weekEvents.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No events scheduled for this week.</p>}
        {weekEvents.map(event => (
          <Card key={event.id} className="dark:bg-gray-700/80 hover:shadow-md transition-shadow" onClick={() => onEventClick && onEventClick(event)}>
            <CardContent className="p-3 flex items-start space-x-3">
              <span className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${event.color || 'bg-gray-400'}`}></span>
              <div className="flex-grow">
                <p className="font-semibold text-sm dark:text-white">{event.title || event.playlistName}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  <span className="ml-2 text-gray-400 dark:text-gray-500">({new Date(event.startTime).toLocaleDateString([], {weekday: 'short'})})</span>
                </p>
                {event.targetNames && <p className="text-xs text-gray-500 dark:text-gray-400">Targets: {event.targetNames.join(', ')}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Card className="dark:bg-gray-800 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 pt-4 px-4 md:px-6 border-b dark:border-gray-700">
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handlePrev} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 h-8 w-8"><ChevronLeftIcon className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={handleToday} className="px-3 h-8 text-sm dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Today</Button>
            <Button variant="outline" size="icon" onClick={handleNext} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 h-8 w-8"><ChevronRightIcon className="h-4 w-4" /></Button>
            <h2 className="text-xl font-semibold pl-3 dark:text-white">
            {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            {viewType === 'week' && ` - Week ${Math.ceil(currentDate.getDate() / 7)}`}
            </h2>
        </div>
        <div className="space-x-1">
          <Button variant={viewType === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('month')} className={`h-8 ${viewType === 'month' ? "dark:bg-blue-600 dark:text-white" : "dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"}`}>Month</Button>
          <Button variant={viewType === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setViewType('week')} className={`h-8 ${viewType === 'week' ? "dark:bg-blue-600 dark:text-white" : "dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"}`}>Week</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0"> {/* Month view handles its own padding/borders now */}
        {viewType === 'month' ? renderMonthView() : renderWeekView()}
      </CardContent>
    </Card>
  );
};

export default CalendarView;
