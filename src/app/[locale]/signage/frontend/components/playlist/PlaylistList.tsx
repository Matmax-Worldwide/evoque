// src/app/[locale]/signage/frontend/components/playlist/PlaylistList.tsx
'use client';

import React from 'react';
// Shadcn UI (Card, Button, Badge, Tooltip, etc.)
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListMusicIcon, Edit3Icon, Trash2Icon, RefreshCwIcon, FilmIcon, ImageIcon } from 'lucide-react'; // Removed PlusCircleIcon
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GraphQLMedia { id: string; name: string; type: string; }
interface GraphQLPlaylistItem { id: string; media: GraphQLMedia; order: number; durationSeconds: number; }
interface GraphQLPlaylist {
  id: string; name: string; description?: string | null; items: GraphQLPlaylistItem[];
}

interface PlaylistListProps {
  playlists: GraphQLPlaylist[];
  isLoading: boolean;
  onRefresh: () => void;
  onEditPlaylist: (playlist: GraphQLPlaylist) => void;
  onDeletePlaylistRequest: (playlist: {id: string, name?: string | null}) => void; // Updated prop name
}

const PlaylistList: React.FC<PlaylistListProps> = ({
    playlists, isLoading, onRefresh, onEditPlaylist, onDeletePlaylistRequest // Updated prop name
}) => {

  const getTotalDuration = (items: GraphQLPlaylistItem[]): string => {
    const totalSeconds = items.reduce((sum, item) => sum + item.durationSeconds, 0);
    if (totalSeconds === 0) return '0s';
    const h = Math.floor(totalSeconds / 3600); const m = Math.floor((totalSeconds % 3600) / 60); const s = Math.floor(totalSeconds % 60);
    return [ h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', s > 0 ? `${s}s` : '' ].filter(Boolean).join(' ') || '0s';
  };

  const getMediaTypeIconSmall = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'IMAGE': return <ImageIcon className="h-3 w-3 text-blue-500" />;
      case 'VIDEO': return <FilmIcon className="h-3 w-3 text-purple-500" />;
      default: return <ListMusicIcon className="h-3 w-3 text-gray-500" />; // Default or AUDIO
    }
  };

  if (isLoading && playlists.length === 0) { return null; }
  if (!isLoading && playlists.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-gray-800 shadow-sm rounded-lg">
        <ListMusicIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No playlists found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a playlist to organize your media.</p>
         <Button variant="outline" onClick={onRefresh} className="mt-4 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
            <RefreshCwIcon className="mr-2 h-4 w-4"/>
            Refresh
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && playlists.length > 0 && (
            Array.from({length:3}).map((_, index) => (
                <Card key={`skeleton-${index}`} className="animate-pulse dark:bg-gray-800">
                    <CardHeader><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div></CardHeader>
                    <CardContent><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></CardContent>
                    <CardFooter className="flex justify-between border-t dark:border-gray-700 pt-4"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div></CardFooter>
                </Card>
            ))
        )}
        {!isLoading && playlists.map(playlist => (
          <Card key={playlist.id} className="flex flex-col dark:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-start"><div><CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">{playlist.name}</CardTitle>{playlist.description && <CardDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">{playlist.description}</CardDescription>}</div><Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">{playlist.items.length} items</Badge></div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Duration: <span className="font-medium">{getTotalDuration(playlist.items)}</span></div>
              <div className="space-y-1"><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Content Preview:</p>{playlist.items.slice(0, 3).map(item => (<div key={item.id} className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300">{getMediaTypeIconSmall(item.media.type)}<span className="truncate max-w-[180px]">{item.media.name}</span><span className="text-gray-400 dark:text-gray-500">({item.durationSeconds}s)</span></div>))}{playlist.items.length > 3 && <p className="text-xs text-gray-400 dark:text-gray-500">...and {playlist.items.length - 3} more.</p>}{playlist.items.length === 0 && <p className="text-xs text-gray-400 dark:text-gray-500">No items in this playlist.</p>}</div>
            </CardContent>
            <CardFooter className="border-t dark:border-gray-700 pt-4 flex justify-end space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => onEditPlaylist(playlist)} className="dark:text-gray-300 dark:hover:bg-gray-700">
                    <Edit3Icon className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>Edit Playlist</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm"
                          onClick={() => onDeletePlaylistRequest({id: playlist.id, name: playlist.name})} // Call new handler
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300">
                    <Trash2Icon className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>Delete Playlist</p></TooltipContent>
              </Tooltip>
            </CardFooter>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default PlaylistList;
