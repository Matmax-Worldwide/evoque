// src/app/[locale]/signage/frontend/components/playlist/PlaylistEditor.tsx
'use client';

import React, { useState, useEffect } from 'react'; // useCallback was not used, removed for now
// Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    PlusIcon, Trash2Icon, GripVerticalIcon, SaveIcon, XIcon, Loader2,
    FilmIcon, ImageIcon, ListMusicIcon, ArrowUpIcon, ArrowDownIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"; // Added Tooltip components

// Types (ideally imported)
interface GraphQLMedia { id: string; name: string; type: string; thumbnailUrl?: string | null; durationSeconds?: number; }
interface GraphQLPlaylistItem { id: string; media: GraphQLMedia; order: number; durationSeconds: number; createdAt?: string; }
interface GraphQLPlaylist {
  id: string; name: string; description?: string | null; items: GraphQLPlaylistItem[];
}
type EditablePlaylistItem = Omit<GraphQLPlaylistItem, 'id' | 'media' | 'createdAt'> & {
    internalId: string;
    mediaId: string;
    mediaName?: string;
    mediaType?: string;
    mediaThumbnailUrl?: string | null;
};

interface PlaylistEditorProps {
  playlist?: GraphQLPlaylist | null;
  availableMedia: GraphQLMedia[];
  onSave: (playlistData: {
    id?: string,
    name: string,
    description?: string | null,
    items: { mediaId: string, order: number, durationSeconds: number }[]
  }) => Promise<boolean>;
  onClose: () => void;
}

const PlaylistEditor: React.FC<PlaylistEditorProps> = ({ playlist, availableMedia, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<EditablePlaylistItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description || '');
      // Ensure items are ordered by 'order' field from prop, then map with current array index for internal 'order' state
      const sortedPlaylistItems = [...playlist.items].sort((a, b) => a.order - b.order);
      setItems(sortedPlaylistItems.map((item, index) => ({
        internalId: item.id || `item-${Date.now()}-${index}`,
        mediaId: item.media.id,
        mediaName: item.media.name,
        mediaType: item.media.type,
        mediaThumbnailUrl: item.media.thumbnailUrl,
        order: index, // Use current array index for the editable 'order' state
        durationSeconds: item.durationSeconds,
      })));
    } else {
      setName('');
      setDescription('');
      setItems([]);
    }
  }, [playlist]);

  // Helper to ensure 'order' is always sequential 0 to N-1 based on array position
  const updateItemsWithCorrectOrder = (updatedItems: EditablePlaylistItem[]) => {
    return updatedItems.map((item, index) => ({ ...item, order: index }));
  };

  const handleAddItem = (media: GraphQLMedia) => {
    if (items.find(item => item.mediaId === media.id)) {
        toast.info(`"${media.name}" is already in the playlist.`);
        return;
    }
    const newItem: EditablePlaylistItem = {
      internalId: `new-${media.id}-${Date.now()}`,
      mediaId: media.id,
      mediaName: media.name,
      mediaType: media.type,
      mediaThumbnailUrl: media.thumbnailUrl,
      order: items.length, // Will be correctly set by updateItemsWithCorrectOrder
      durationSeconds: media.durationSeconds || 30,
    };
    setItems(prevItems => updateItemsWithCorrectOrder([...prevItems, newItem]));
    toast.success(`Added "${media.name}" to playlist.`);
    setIsMediaPickerOpen(false);
  };

  const handleRemoveItem = (internalIdToRemove: string, itemName?: string) => {
    // Added window.confirm for item deletion
    if (window.confirm(`Are you sure you want to remove "${itemName || 'this item'}" from the playlist?`)) {
      setItems(prevItems =>
          updateItemsWithCorrectOrder(prevItems.filter(item => item.internalId !== internalIdToRemove))
      );
      toast.info(`Item "${itemName || 'Item'}" removed from editor.`);
    }
  };

  const handleDurationChange = (internalIdToUpdate: string, newDurationStr: string) => {
    const newDuration = parseInt(newDurationStr, 10);
    setItems(prevItems =>
      prevItems.map(item =>
        item.internalId === internalIdToUpdate ? { ...item, durationSeconds: Math.max(1, isNaN(newDuration) ? item.durationSeconds : newDuration) } : item
      )
    );
  };

  const handleMoveItem = (internalIdToMove: string, direction: 'up' | 'down') => {
    const currentIndex = items.findIndex(item => item.internalId === internalIdToMove);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = Array.from(items);
    const [movedItem] = newItems.splice(currentIndex, 1);
    newItems.splice(newIndex, 0, movedItem);

    setItems(updateItemsWithCorrectOrder(newItems));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Playlist name cannot be empty.");
      return;
    }
    setIsSaving(true);
    // The 'order' property in items state is already correct due to updateItemsWithCorrectOrder
    const itemsToSave = items.map(item => ({
      mediaId: item.mediaId,
      order: item.order,
      durationSeconds: item.durationSeconds,
    }));

    const success = await onSave({
      id: playlist?.id,
      name,
      description: description || null,
      items: itemsToSave,
    });
    setIsSaving(false);
    // Parent (PlaylistManagementPage) handles closing the modal on successful save if success is true.
  };

  const getMediaTypeIconSmall = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'IMAGE': return <ImageIcon className="h-4 w-4 text-blue-500" />;
      case 'VIDEO': return <FilmIcon className="h-4 w-4 text-purple-500" />;
      case 'AUDIO': return <ListMusicIcon className="h-4 w-4 text-green-500" />;
      default: return <ListMusicIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <TooltipProvider>
    <div className="space-y-6 max-h-[80vh] flex flex-col">
      <ScrollArea className="flex-grow pr-4">
        <div className="space-y-4">
            <div><Label htmlFor="playlistNameEdit" className="dark:text-gray-300">Playlist Name</Label><Input id="playlistNameEdit" value={name} onChange={e => setName(e.target.value)} placeholder="Enter playlist name" className="dark:bg-gray-700 dark:text-white dark:border-gray-600"/></div>
            <div><Label htmlFor="playlistDescriptionEdit" className="dark:text-gray-300">Description (Optional)</Label><Textarea id="playlistDescriptionEdit" value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter a short description" className="dark:bg-gray-700 dark:text-white dark:border-gray-600"/></div>

            <div className="border-t dark:border-gray-600 pt-4">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-semibold dark:text-white">Playlist Items ({items.length})</h4>
                    <Dialog open={isMediaPickerOpen} onOpenChange={setIsMediaPickerOpen}><DialogTrigger asChild><Button variant="outline" size="sm" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"><PlusIcon className="h-4 w-4 mr-2" /> Add Media</Button></DialogTrigger><DialogContent className="sm:max-w-lg dark:bg-gray-800"><DialogHeader><DialogTitle className="dark:text-white">Select Media to Add</DialogTitle><DialogDescription className="dark:text-gray-400">Click on a media item to add it to the playlist.</DialogDescription></DialogHeader><ScrollArea className="max-h-[60vh] pr-3"><div className="space-y-2 py-2">{availableMedia.length > 0 ? availableMedia.map(media => (<div key={media.id} onClick={() => handleAddItem(media)} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">{media.thumbnailUrl ? (<img src={media.thumbnailUrl} alt={media.name} className="h-10 w-10 object-cover rounded"/>) : (<div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">{getMediaTypeIconSmall(media.type)}</div>)}<div><p className="text-sm font-medium dark:text-white">{media.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{media.type} - {media.durationSeconds ? `${media.durationSeconds}s` : 'N/A'}</p></div></div>)) : <p className="text-sm text-gray-500 dark:text-gray-400">No media items available. Ensure media is loaded on the main playlists page.</p>}</div></ScrollArea></DialogContent></Dialog>
                </div>

                <div className="space-y-2 min-h-[150px] bg-gray-50 dark:bg-gray-700/30 p-3 rounded-md">
                    {items.length === 0 && <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">No items added yet. Click "Add Media".</p>}
                    {items.map((item, index) => (
                        <div
                            key={item.internalId}
                            className="flex items-center space-x-2 p-2.5 border dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="cursor-grab p-1 dark:hover:bg-gray-600" aria-label="Drag to reorder">
                                        <GripVerticalIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>Drag to reorder (not implemented)</p></TooltipContent>
                            </Tooltip>

                            {item.mediaThumbnailUrl ? (<img src={item.mediaThumbnailUrl} alt={item.mediaName} className="h-12 w-12 object-cover rounded-sm"/>) : (<div className="h-12 w-12 bg-gray-200 dark:bg-gray-600 rounded-sm flex items-center justify-center">{getMediaTypeIconSmall(item.mediaType)}</div>)}
                            <div className="flex-grow"><p className="text-sm font-medium dark:text-white truncate max-w-xs">{item.mediaName || item.mediaId}</p><p className="text-xs text-gray-500 dark:text-gray-400">{item.mediaType}</p></div>

                            <div className="flex items-center">
                                <Label htmlFor={`duration-${item.internalId}`} className="sr-only">Duration</Label>
                                <Input
                                    id={`duration-${item.internalId}`} type="number" value={item.durationSeconds}
                                    onChange={e => handleDurationChange(item.internalId, e.target.value)}
                                    className="w-20 h-9 text-sm dark:bg-gray-600 dark:text-white dark:border-gray-500" min="1"
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1.5">sec</span>
                            </div>
                            <div className="flex flex-col space-y-0.5">
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 p-1 dark:hover:bg-gray-600" onClick={() => handleMoveItem(item.internalId, 'up')} disabled={index === 0} aria-label="Move up"><ArrowUpIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" /></Button></TooltipTrigger><TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>Move Up</p></TooltipContent></Tooltip>
                                <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 p-1 dark:hover:bg-gray-600" onClick={() => handleMoveItem(item.internalId, 'down')} disabled={index === items.length - 1} aria-label="Move down"><ArrowDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" /></Button></TooltipTrigger><TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>Move Down</p></TooltipContent></Tooltip>
                            </div>
                            <Tooltip><TooltipTrigger asChild>
                                <Button variant="ghost" size="icon"
                                        onClick={() => handleRemoveItem(item.internalId, item.mediaName)}
                                        className="text-red-500 hover:text-red-700 dark:hover:bg-red-900/20 dark:text-red-400 p-1"
                                        aria-label="Remove item">
                                    <Trash2Icon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger><TooltipContent className="dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"><p>Remove Item</p></TooltipContent></Tooltip>
                        </div>
                    ))}
                </div>
                {items.length > 0 && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Items will be saved in the current displayed order.</p>}
            </div>
        </div>
      </ScrollArea>
      <div className="flex justify-end space-x-2 border-t dark:border-gray-600 pt-4 mt-auto">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Cancel</Button>
        <Button type="button" onClick={handleSubmit} disabled={isSaving || !name.trim()} className="min-w-[120px]">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4 mr-2"/>}{isSaving ? 'Saving...' : (playlist?.id ? 'Save Changes' : 'Create Playlist')}</Button>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default PlaylistEditor;
