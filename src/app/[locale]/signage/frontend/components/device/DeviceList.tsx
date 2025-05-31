// src/app/[locale]/signage/frontend/components/device/DeviceList.tsx
'use client';

import React from 'react';
// Shadcn UI components (Table, Badge, Button, Tooltip, etc.)
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLinkIcon, ListRestartIcon, Trash2Icon, TvIcon, RefreshCwIcon } from 'lucide-react'; // Added RefreshCwIcon

interface GraphQLDevice {
  id: string; name?: string | null; status: string; lastSeenAt?: string | null;
  currentPlaylistId?: string | null;
}

interface DeviceListProps {
  devices: GraphQLDevice[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectDevice?: (deviceId: string) => void;
  onAssignPlaylist?: (deviceId: string) => void; // Placeholder
  onDeleteDeviceRequest?: (device: {id: string, name?: string | null}) => void; // Updated prop
}

const DeviceList: React.FC<DeviceListProps> = ({
  devices, isLoading, onRefresh, onSelectDevice, onAssignPlaylist, onDeleteDeviceRequest
}) => {

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (status?.toUpperCase()) {
      case 'ONLINE': return 'success';
      case 'OFFLINE': return 'secondary';
      case 'PENDING_PAIRING': return 'warning';
      case 'ERROR': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading && devices.length === 0) { return null; }
  if (!isLoading && devices.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <TvIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No devices found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by pairing a new device.</p>
         <Button variant="outline" onClick={onRefresh} className="mt-4 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
            <RefreshCwIcon className="mr-2 h-4 w-4"/>
            Refresh List
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-gray-700">
              <TableHead className="w-[50px] dark:text-gray-300"></TableHead> {/* Status Indicator */}
              <TableHead className="dark:text-gray-300">Name</TableHead>
              <TableHead className="dark:text-gray-300">Status</TableHead>
              <TableHead className="dark:text-gray-300">Last Seen</TableHead>
              <TableHead className="dark:text-gray-300">Assigned Playlist</TableHead>
              <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && devices.length > 0 && (
              <TableRow className="dark:border-gray-700">
                <TableCell colSpan={6} className="text-center py-4">
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Refreshing device list...</p>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && devices.map(device => (
              <TableRow key={device.id} className="dark:border-gray-700">
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger><span className={`inline-block h-3 w-3 rounded-full ${ device.status?.toUpperCase() === 'ONLINE' ? 'bg-green-500' : device.status?.toUpperCase() === 'OFFLINE' ? 'bg-gray-400' : device.status?.toUpperCase() === 'PENDING_PAIRING' ? 'bg-yellow-500 animate-pulse' : device.status?.toUpperCase() === 'ERROR' ? 'bg-red-500 animate-pulse' : 'bg-gray-300' }`}></span></TooltipTrigger>
                    <TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>{device.status}</p></TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="font-medium text-gray-900 dark:text-white">{device.name || `Device (${device.id.substring(0,8)}...`})</TableCell>
                <TableCell><Badge variant={getStatusBadgeVariant(device.status)} className="capitalize">{device.status?.toLowerCase().replace('_', ' ') || 'Unknown'}</Badge></TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}</TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">{device.currentPlaylistId || 'None'}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onSelectDevice && onSelectDevice(device.id)} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ExternalLinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>View Details</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => onAssignPlaylist && onAssignPlaylist(device.id)} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ListRestartIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>Assign Playlist</p></TooltipContent>
                  </Tooltip>
                   <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon"
                              onClick={() => onDeleteDeviceRequest && onDeleteDeviceRequest({id: device.id, name: device.name})}
                              className="hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Trash2Icon className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>Delete Device</p></TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
};

export default DeviceList;
