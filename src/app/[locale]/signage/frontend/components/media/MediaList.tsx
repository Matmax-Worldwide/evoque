// src/app/[locale]/signage/frontend/components/media/MediaList.tsx
'use client';

import React from 'react';
// Shadcn UI components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge"; // Not used in this version directly
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageIcon, VideoIcon, FileAudioIcon, LinkIcon, InfoIcon, Trash2Icon, Edit3Icon, RefreshCwIcon } from 'lucide-react';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface GraphQLMedia {
  id: string; name: string; type: 'VIDEO' | 'IMAGE' | 'AUDIO' | 'URL' | 'WIDGET' | string;
  mimeType?: string | null; url: string; thumbnailUrl?: string | null;
  sizeBytes?: number | null; durationSeconds?: number | null; createdAt: string;
}

interface MediaListProps {
  mediaItems: GraphQLMedia[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectMedia?: (mediaId: string) => void;
  onDeleteMediaRequest?: (media: {id: string, name?: string | null}) => void; // Updated prop
}

const MediaList: React.FC<MediaListProps> = ({
  mediaItems, isLoading, onRefresh, onSelectMedia, onDeleteMediaRequest
}) => {

  const getMediaTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'IMAGE': return <ImageIcon className="h-5 w-5 text-blue-500" />;
      case 'VIDEO': return <VideoIcon className="h-5 w-5 text-purple-500" />;
      case 'AUDIO': return <FileAudioIcon className="h-5 w-5 text-green-500" />;
      case 'URL': return <LinkIcon className="h-5 w-5 text-orange-500" />;
      default: return <InfoIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  const formatBytes = (bytes?: number, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024; const dm = decimals < 0 ? 0 : decimals; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds === 0) return '-';
    const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = Math.floor(seconds % 60);
    return [ h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', s > 0 ? `${s}s` : '' ].filter(Boolean).join(' ') || '0s';
  };

  if (isLoading && mediaItems.length === 0) { return null; }
  if (!isLoading && mediaItems.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No media items found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Upload media to get started.</p>
        <Button variant="outline" onClick={onRefresh} className="mt-4 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
            <RefreshCwIcon className="mr-2 h-4 w-4"/>
            Refresh
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <ScrollArea className="w-full whitespace-nowrap">
          <Table>
            <TableHeader>
              <TableRow className="dark:border-gray-700">
                <TableHead className="w-[50px] dark:text-gray-300">Type</TableHead>
                <TableHead className="dark:text-gray-300">Name</TableHead>
                <TableHead className="dark:text-gray-300">Size</TableHead>
                <TableHead className="dark:text-gray-300">Duration</TableHead>
                <TableHead className="dark:text-gray-300">Date Added</TableHead>
                <TableHead className="text-right dark:text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && mediaItems.length > 0 && (
                <TableRow className="dark:border-gray-700">
                  <TableCell colSpan={6} className="text-center py-4">
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Refreshing media list...</p>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && mediaItems.map(media => (
                <TableRow key={media.id} className="dark:border-gray-700">
                  <TableCell><Tooltip><TooltipTrigger>{getMediaTypeIcon(media.type)}</TooltipTrigger><TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>{media.type}</p></TooltipContent></Tooltip></TableCell>
                  <TableCell className="font-medium text-gray-900 dark:text-white"><div className="flex items-center space-x-2">{media.thumbnailUrl ? (<img src={media.thumbnailUrl} alt={media.name} className="h-8 w-8 object-cover rounded-sm" />) : (<div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-sm flex items-center justify-center">{getMediaTypeIcon(media.type)}</div>)}<span>{media.name}</span></div></TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">{formatBytes(media.sizeBytes)}</TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">{formatDuration(media.durationSeconds)}</TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">{new Date(media.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onSelectMedia && onSelectMedia(media.id)} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Edit3Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>Edit Details / Preview</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon"
                                onClick={() => onDeleteMediaRequest && onDeleteMediaRequest({id: media.id, name: media.name})} // Call new handler
                                className="hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Trash2Icon className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>Delete Media</p></TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
};

export default MediaList;
