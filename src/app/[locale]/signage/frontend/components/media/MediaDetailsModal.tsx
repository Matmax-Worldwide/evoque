// src/app/[locale]/signage/frontend/components/media/MediaDetailsModal.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react'; // Added useRef
// Shadcn UI
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Added Input
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, AlertTriangleIcon, InfoIcon, Edit3Icon, ReplaceIcon, Trash2Icon, LinkIcon,
    DownloadIcon, ExternalLinkIcon, Image as ImageIconLU, Video as VideoIconLU, FileAudio as AudioIconLU,
    FileTextIcon, SaveIcon, XIcon
} from 'lucide-react'; // Added SaveIcon, XIcon
import { toast } from 'sonner';

interface GraphQLMedia {
  id: string; name: string; type: 'VIDEO' | 'IMAGE' | 'AUDIO' | 'URL' | 'WIDGET' | string;
  mimeType?: string | null; url: string; thumbnailUrl?: string | null; sizeBytes?: number | null;
  durationSeconds?: number | null; width?: number | null; height?: number | null;
  organizationId: string; uploadedByUserId: string; createdAt: string; updatedAt: string;
}

interface MediaDetailsModalProps {
  mediaId: string | null;
  organizationId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onMediaUpdate?: () => void;
  getMedia: (mediaId: string, organizationId: string) => Promise<GraphQLMedia | null>;
  updateMediaName: (mediaId: string, newName: string, organizationId: string) => Promise<GraphQLMedia | null>; // New prop
}

const MediaDetailsModal: React.FC<MediaDetailsModalProps> = ({
  mediaId, organizationId, isOpen, onOpenChange, onMediaUpdate, getMedia, updateMediaName
}) => {
  const [mediaItem, setMediaItem] = useState<GraphQLMedia | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editableName, setEditableName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && mediaId) {
      const fetchMediaDetails = async () => {
        setIsLoading(true); setError(null); setMediaItem(null); setIsEditingName(false); // Reset editing
        try {
          const result = await getMedia(mediaId, organizationId);
          if (result) {
            setMediaItem(result);
            setEditableName(result.name || ''); // Init editableName
          } else {
            setError("Media item not found or access denied."); toast.error("Media item not found.");
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error.";
          setError(msg); toast.error(`Failed to load media details: ${msg}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMediaDetails();
    } else {
      setIsEditingName(false); setEditableName(''); // Reset on close
    }
  }, [isOpen, mediaId, organizationId, getMedia]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleAction = async (actionName: string) => {
    toast.info(`Action "${actionName}" for media ${mediaItem?.name || mediaId} (not implemented).`);
  };

  const getMediaTypeIconBig = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'IMAGE': return <ImageIconLU className="h-8 w-8 text-blue-500" />;
      case 'VIDEO': return <VideoIconLU className="h-8 w-8 text-purple-500" />;
      case 'AUDIO': return <AudioIconLU className="h-8 w-8 text-green-500" />;
      case 'URL': return <LinkIcon className="h-8 w-8 text-orange-500" />;
      default: return <FileTextIcon className="h-8 w-8 text-gray-500" />;
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

  const handleSaveName = async () => {
    if (!mediaItem || !editableName.trim()) {
      toast.error("Media name cannot be empty.");
      return;
    }
    if (editableName.trim() === mediaItem.name) {
      setIsEditingName(false); return;
    }
    setIsSavingName(true);
    try {
      const updatedMedia = await updateMediaName(mediaItem.id, editableName.trim(), mediaItem.organizationId);
      if (updatedMedia) {
        setMediaItem(updatedMedia); setEditableName(updatedMedia.name || '');
        toast.success("Media name updated successfully!"); setIsEditingName(false);
        onMediaUpdate?.();
      } else {
        toast.error("Failed to update media name (mock response).");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error.";
      toast.error(`Error updating name: ${message}`);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditableName(mediaItem?.name || ''); setIsEditingName(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) setIsEditingName(false); }}>
      <DialogContent className="sm:max-w-2xl dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center dark:text-white">
            {mediaItem ? getMediaTypeIconBig(mediaItem.type) : <FileTextIcon className="h-6 w-6 mr-2" />}
            <span className="ml-2">Media Details</span>
          </DialogTitle>
          {mediaItem && !isEditingName && <DialogDescription className="dark:text-gray-400">Details for {mediaItem.name}</DialogDescription>}
          {mediaItem && isEditingName && <DialogDescription className="dark:text-gray-400">Editing name for {mediaItem.id}</DialogDescription>}
        </DialogHeader>

        {isLoading && ( <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/><p className="ml-2 dark:text-gray-300">Loading...</p></div>)}
        {error && !isLoading && ( <div className="p-4 my-4 bg-red-50 text-red-700 border rounded-md text-sm dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"><AlertTriangleIcon className="h-5 w-5 inline mr-2"/>{error}</div>)}

        {!isLoading && !error && mediaItem && (
          <div className="space-y-3 py-2 max-h-[70vh] overflow-y-auto pr-2">
            <div className="flex flex-col md:flex-row gap-4 items-start">
                {mediaItem.thumbnailUrl || (mediaItem.type === 'IMAGE' && mediaItem.url) ? ( <div className="w-full md:w-1/3 flex-shrink-0"><img src={mediaItem.thumbnailUrl || mediaItem.url} alt={mediaItem.name} className="rounded-lg object-contain border dark:border-gray-700 max-h-60 w-full"/></div>)
                : (<div className="w-full md:w-1/3 h-40 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">{getMediaTypeIconBig(mediaItem.type)}</div>)}

                <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 text-sm flex-grow w-full md:w-2/3">
                    <Label className="text-gray-500 dark:text-gray-400 col-span-1 pt-1.5">Name:</Label>
                    {isEditingName ? (
                        <div className="col-span-2 flex items-center space-x-1">
                        <Input ref={nameInputRef} value={editableName} onChange={(e) => setEditableName(e.target.value)} className="h-8 dark:bg-gray-700 dark:text-white dark:border-gray-600" disabled={isSavingName}/>
                        <Button size="icon" variant="ghost" onClick={handleSaveName} disabled={isSavingName} className="h-8 w-8 p-0">{isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4 text-green-600" />}</Button>
                        <Button size="icon" variant="ghost" onClick={handleCancelEditName} disabled={isSavingName} className="h-8 w-8 p-0"><XIcon className="h-4 w-4 text-red-600" /></Button>
                        </div>
                    ) : (
                        <div className="col-span-2 flex items-center space-x-1">
                        <span className="font-medium dark:text-white break-all py-1.5">{mediaItem.name}</span>
                        <Button variant="ghost" size="icon" onClick={() => { setIsEditingName(true); setEditableName(mediaItem.name || ''); }} className="h-6 w-6 p-0"><Edit3Icon className="h-4 w-4 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" /></Button>
                        </div>
                    )}
                    <Label className="text-gray-500 dark:text-gray-400 col-span-1">Type:</Label><span className="col-span-2 dark:text-gray-300 capitalize">{mediaItem.type.toLowerCase()}</span>
                    <Label className="text-gray-500 dark:text-gray-400 col-span-1">MIME Type:</Label><span className="col-span-2 dark:text-gray-300 font-mono text-xs">{mediaItem.mimeType || '-'}</span>
                    <Label className="text-gray-500 dark:text-gray-400 col-span-1">Size:</Label><span className="col-span-2 dark:text-gray-300">{formatBytes(mediaItem.sizeBytes)}</span>
                    {(mediaItem.type === 'VIDEO' || mediaItem.type === 'AUDIO') && (<><Label className="text-gray-500 dark:text-gray-400 col-span-1">Duration:</Label><span className="col-span-2 dark:text-gray-300">{formatDuration(mediaItem.durationSeconds)}</span></>)}
                    {(mediaItem.type === 'VIDEO' || mediaItem.type === 'IMAGE') && (<><Label className="text-gray-500 dark:text-gray-400 col-span-1">Dimensions:</Label><span className="col-span-2 dark:text-gray-300">{mediaItem.width && mediaItem.height ? `${mediaItem.width} x ${mediaItem.height}` : '-'}</span></>)}
                    <Label className="text-gray-500 dark:text-gray-400 col-span-1">URL:</Label><span className="col-span-2 dark:text-gray-300"><a href={mediaItem.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs break-all">{mediaItem.url} <ExternalLinkIcon className="inline h-3 w-3 ml-1"/></a></span>
                    <Label className="text-gray-500 dark:text-gray-400 col-span-1">Uploaded By:</Label><span className="col-span-2 dark:text-gray-300 text-xs">{mediaItem.uploadedByUserId} (details TBD)</span>
                    <Label className="text-gray-500 dark:text-gray-400 col-span-1">Added On:</Label><span className="col-span-2 dark:text-gray-300">{new Date(mediaItem.createdAt).toLocaleString()}</span>
                </div>
            </div>
            <div className="border-t dark:border-gray-700 pt-4 mt-4 space-x-2 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAction('Replace File')} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"><ReplaceIcon className="h-4 w-4 mr-2"/> Replace File</Button>
                <Button variant="outline" size="sm" onClick={() => window.open(mediaItem.url, '_blank')} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"><DownloadIcon className="h-4 w-4 mr-2"/> Download</Button>
                <Button variant="destructive" size="sm" onClick={() => handleAction('Delete Media')} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"><Trash2Icon className="h-4 w-4 mr-2"/> Delete Media</Button>
            </div>
          </div>
        )}
        {!isLoading && !error && !mediaItem && mediaId && (
             <div className="p-4 my-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 rounded-md text-sm"><InfoIcon className="h-5 w-5 inline mr-2" />Could not load details for the selected media.</div>
        )}
        <DialogFooter className="pt-4">
          <DialogClose asChild><Button type="button" variant="outline" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default MediaDetailsModal;
