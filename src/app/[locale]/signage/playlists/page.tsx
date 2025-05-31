// src/app/[locale]/signage/playlists/page.tsx
'use client';

// IMPORTANT: This page now expects a global `graphqlClient` (e.g., from '@/lib/graphql-client')
// The previous page-local mock client has been removed.

import React, { useState, useEffect, useCallback } from 'react';
import PlaylistList from '@/app/[locale]/signage/frontend/components/playlist/PlaylistList';
import PlaylistEditor from '@/app/[locale]/signage/frontend/components/playlist/PlaylistEditor';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircleIcon, Loader2, ListMusicIcon, AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';

// Assuming global graphqlClient import
// import graphqlClient from '@/lib/graphql-client';
const graphqlClient: any = {
    query: async (params: {queryName: string, variables: any}) => { console.warn(`graphqlClient.query for ${params.queryName} not implemented. Backend not connected.`); return []; },
    mutate: async (params: {mutationName: string, input: any}) => { console.warn(`graphqlClient.mutate for ${params.mutationName} not implemented. Backend not connected.`); return null; }
};

// Types (ensure these match actual GraphQL types from your schema)
interface GraphQLMedia { id: string; name: string; type: string; thumbnailUrl?: string | null; durationSeconds?: number; }
interface GraphQLPlaylistItemInput { mediaId: string; order: number; durationSeconds: number; }
interface GraphQLPlaylistItem extends GraphQLPlaylistItemInput { id: string; media: GraphQLMedia; createdAt: string; }
interface GraphQLPlaylist {
  id: string; name: string; description?: string | null; organizationId: string;
  createdByUserId: string; createdAt: string; updatedAt: string; items: GraphQLPlaylistItem[];
}
interface CreatePlaylistInput {
  organizationId: string; createdByUserId: string; name: string; description?: string | null;
  items: GraphQLPlaylistItemInput[];
}
interface UpdatePlaylistInput {
  playlistId: string; name?: string; description?: string | null; organizationId: string; // OrgId for authz check
  items?: GraphQLPlaylistItemInput[];
}
// interface DeletePlaylistInput { playlistId: string; organizationId: string; }


export default function PlaylistManagementPage() {
  const [playlists, setPlaylists] = useState<GraphQLPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<GraphQLPlaylist | null>(null);
  const [availableMedia, setAvailableMedia] = useState<GraphQLMedia[]>([]);
  const [isLoadingModalData, setIsLoadingModalData] = useState(false);
  const [isDeletePlaylistAlertOpen, setIsDeletePlaylistAlertOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<{id: string, name?: string | null} | null>(null);
  const [isDeletingPlaylist, setIsDeletingPlaylist] = useState(false);

  const organizationId = "org_placeholder_123";
  const userId = "user_placeholder_abc";

  const fetchPlaylists = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      console.log("Attempting to fetch playlists via global graphqlClient.");
      const result = await graphqlClient.query({
        queryName: 'listPlaylists', // Conceptual GQL operation name
        variables: { organizationId }
      });
      setPlaylists(result || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error fetching playlists.";
      setError(message); toast.error(`Failed to load playlists: ${message}`);
      setPlaylists([]);
    } finally { setIsLoading(false); }
  }, [organizationId]);

  const fetchAvailableMedia = useCallback(async () => {
    setIsLoadingModalData(true);
    try {
      console.log("Attempting to fetch available media via global graphqlClient.");
      const media = await graphqlClient.query({
        queryName: 'listMedia', // Conceptual GQL operation name
        variables: { organizationId }
      });
      setAvailableMedia(media || []);
    } catch (err) {
      toast.error("Could not load media for playlist editor.");
    } finally { setIsLoadingModalData(false); }
  }, [organizationId]);

  useEffect(() => { fetchPlaylists(); fetchAvailableMedia(); }, [fetchPlaylists, fetchAvailableMedia]);

  const handleOpenEditorForNew = () => { setEditingPlaylist(null); setIsEditorModalOpen(true); };
  const handleOpenEditorForEdit = (playlist: GraphQLPlaylist) => { setEditingPlaylist(playlist); setIsEditorModalOpen(true); };

  const handleSavePlaylist = async (playlistData: { id?: string, name: string, description?: string | null, items: GraphQLPlaylistItemInput[] }) => {
    try {
      let savedPlaylist;
      if (playlistData.id) {
        console.log("Attempting to update playlist via global graphqlClient.");
        const input: UpdatePlaylistInput = { playlistId: playlistData.id, name: playlistData.name, description: playlistData.description, items: playlistData.items, organizationId };
        savedPlaylist = await graphqlClient.mutate({
            mutationName: 'updatePlaylist', // Conceptual GQL operation name
            input
        });
        toast.success(`Playlist "${savedPlaylist?.name}" updated successfully!`);
      } else {
        console.log("Attempting to create playlist via global graphqlClient.");
        const input: CreatePlaylistInput = { organizationId, createdByUserId: userId, name: playlistData.name, description: playlistData.description, items: playlistData.items };
        savedPlaylist = await graphqlClient.mutate({
            mutationName: 'createPlaylist', // Conceptual GQL operation name
            input
        });
        toast.success(`Playlist "${savedPlaylist?.name}" created successfully!`);
      }
      setIsEditorModalOpen(false); fetchPlaylists(); return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error saving playlist.";
      toast.error(`Failed to save playlist: ${message}`); return false;
    }
  };

  const handleDeletePlaylistRequest = (playlist: {id: string, name?: string | null}) => { setPlaylistToDelete(playlist); setIsDeletePlaylistAlertOpen(true); };
  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    setIsDeletingPlaylist(true);
    try {
      console.log("Attempting to delete playlist via global graphqlClient.");
      const result = await graphqlClient.mutate({
        mutationName: 'deletePlaylist', // Conceptual GQL operation name
        input: { id: playlistToDelete.id, organizationId } // Matches conceptual GQL input
    });
      if (result?.success) {
        toast.success(result.message || `Playlist "${playlistToDelete.name || playlistToDelete.id}" deleted.`);
        fetchPlaylists();
      } else {
        toast.error(result?.message || `Failed to delete playlist "${playlistToDelete.name || playlistToDelete.id}".`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error deleting playlist.";
      toast.error(`Error deleting playlist: ${message}`);
    } finally {
      setIsDeletingPlaylist(false); setIsDeletePlaylistAlertOpen(false); setPlaylistToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold dark:text-white">Playlist Management</h1><p className="text-gray-500 dark:text-gray-400">Create, edit, and manage content playlists.</p></div>
        <Button onClick={handleOpenEditorForNew} disabled={isLoadingModalData}><PlusCircleIcon className="mr-2 h-4 w-4" /> Create New Playlist</Button>
      </div>

      {error && ( <div className="p-4 bg-red-100 text-red-700 border rounded-md dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"><AlertTriangleIcon className="inline h-5 w-5 mr-2"/>Error: {error} <Button variant="link" onClick={fetchPlaylists} className="text-red-700 dark:text-red-300">Retry</Button></div>)}

      <PlaylistList
        playlists={playlists}
        isLoading={isLoading}
        onEditPlaylist={handleOpenEditorForEdit}
        onDeletePlaylistRequest={handleDeletePlaylistRequest}
        onRefresh={fetchPlaylists}
      />

      <Dialog open={isEditorModalOpen} onOpenChange={setIsEditorModalOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl dark:bg-gray-800">
          <DialogHeader><DialogTitle className="dark:text-white">{editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}</DialogTitle><DialogDescription className="dark:text-gray-400">{editingPlaylist ? `Editing "${editingPlaylist.name}".` : 'Configure details.'}</DialogDescription></DialogHeader>
          <PlaylistEditor key={editingPlaylist?.id || 'new'} playlist={editingPlaylist} availableMedia={availableMedia} onSave={handleSavePlaylist} onClose={() => setIsEditorModalOpen(false)}/>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeletePlaylistAlertOpen} onOpenChange={setIsDeletePlaylistAlertOpen}>
        <AlertDialogContent className="dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This action cannot be undone. This will permanently delete the playlist
              <span className="font-semibold dark:text-gray-300"> {playlistToDelete?.name || playlistToDelete?.id}</span>.
              Devices assigned this playlist may stop playing content or switch to a default.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" disabled={isDeletingPlaylist}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePlaylist}
              disabled={isDeletingPlaylist}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 dark:text-white"
            >
              {isDeletingPlaylist ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, delete playlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
