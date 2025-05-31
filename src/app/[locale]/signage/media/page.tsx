// src/app/[locale]/signage/media/page.tsx
'use client';

// IMPORTANT: This page now expects a global `graphqlClient` (e.g., from '@/lib/graphql-client')
// to be configured and capable of handling Signage module queries and mutations.
// The previous page-local mock client has been removed.

import React, { useState, useEffect, useCallback } from 'react';
import MediaList from '@/app/[locale]/signage/frontend/components/media/MediaList';
import MediaUploadForm from '@/app/[locale]/signage/frontend/components/media/MediaUploadForm';
import MediaDetailsModal from '@/app/[locale]/signage/frontend/components/media/MediaDetailsModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircleIcon, Loader2, UploadCloudIcon, AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';


// Assuming global graphqlClient import
// import graphqlClient from '@/lib/graphql-client';
const graphqlClient: any = {
    query: async (params: {queryName: string, variables: any}) => { console.warn(`graphqlClient.query for ${params.queryName} not implemented. Backend not connected.`); return []; },
    mutate: async (params: {mutationName: string, input: any}) => { console.warn(`graphqlClient.mutate for ${params.mutationName} not implemented. Backend not connected.`); return null; }
};


interface GraphQLMedia {
  id: string; name: string; type: 'VIDEO' | 'IMAGE' | 'AUDIO' | 'URL' | 'WIDGET' | string;
  mimeType?: string | null; url: string; thumbnailUrl?: string | null; sizeBytes?: number | null;
  durationSeconds?: number | null; width?: number | null; height?: number | null;
  organizationId: string; uploadedByUserId: string; createdAt: string; updatedAt: string;
}
// Input types for mutations would also be defined/imported from generated types
// interface UploadMediaInput { /* ... */ }
// interface UpdateMediaNameInput { /* ... */ }
// interface DeleteMediaInput { /* ... */ }


export default function MediaManagementPage() {
  const [mediaItems, setMediaItems] = useState<GraphQLMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteMediaAlertOpen, setIsDeleteMediaAlertOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<{id: string, name?: string | null} | null>(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  const organizationId = "org_placeholder_123";
  const userId = "user_placeholder_abc";

  const fetchMedia = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      console.log("Attempting to fetch media via global graphqlClient.");
      const result = await graphqlClient.query({
        queryName: 'listMedia', // Conceptual GQL operation name
        variables: { organizationId }
      });
      setMediaItems(result || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error fetching media.";
      setError(message); toast.error(`Failed to load media: ${message}`);
      setMediaItems([]);
    } finally { setIsLoading(false); }
  }, [organizationId]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const handleMediaUpload = async (formData: {name: string, type: string, file: File | null}) => {
    try {
      // Note: Actual file upload is a complex process, often involving:
      // 1. A separate request to a backend endpoint (not GraphQL) to get a pre-signed URL for S3/GCS.
      // 2. Uploading the file directly to cloud storage using that URL from the client.
      // 3. Then, calling a GraphQL mutation (like 'createMedia' or 'finalizeMediaUpload')
      //    with the metadata (name, type, URL from cloud storage, size, etc.).
      const uploadInput = {
        organizationId, uploadedByUserId: userId, name: formData.name || formData.file?.name || 'Unnamed Media',
        type: formData.type.toUpperCase(), mimeType: formData.file?.type, sizeBytes: formData.file?.size,
        // url: "simulated_url_from_storage_after_upload", // This would come from actual upload step
      };
      console.log("Attempting to upload media (metadata) via global graphqlClient.");
      const metadataResult = await graphqlClient.mutate({
        mutationName: 'uploadMedia', // Conceptual GQL operation name
        input: uploadInput
      });

      toast.success(`Media "${metadataResult?.name || 'item'}" (metadata) recorded!`);
      setIsUploadModalOpen(false); fetchMedia();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error uploading media.";
      toast.error(`Media upload failed: ${message}`);
    }
  };

  const handleViewMediaDetails = (mediaId: string) => { setSelectedMediaId(mediaId); setIsDetailsModalOpen(true); };
  const handleMediaUpdate = () => { fetchMedia(); };

  const getMediaForModal = useCallback(async (mediaId: string, orgId: string) => {
    console.log("Attempting to get media for modal via global graphqlClient.");
    return await graphqlClient.query({
        queryName: 'getMedia', // Conceptual GQL operation name
        variables: { id: mediaId, organizationId: orgId }
    });
  }, []);

  const updateMediaNameForModal = useCallback(async (mediaId: string, newName: string, orgId: string) => {
    console.log("Attempting to update media name via global graphqlClient.");
    return await graphqlClient.mutate({
        mutationName: 'updateMediaName', // Conceptual GQL operation name
        input: { mediaId, name: newName, organizationId: orgId } // Matches conceptual GQL input
    });
  }, []);

  const handleDeleteMediaRequest = (media: {id: string, name?: string | null}) => { setMediaToDelete(media); setIsDeleteMediaAlertOpen(true); };
  const confirmDeleteMedia = async () => {
    if (!mediaToDelete) return;
    setIsDeletingMedia(true);
    try {
      console.log("Attempting to delete media via global graphqlClient.");
      const result = await graphqlClient.mutate({
        mutationName: 'deleteMedia', // Conceptual GQL operation name
        input: { id: mediaToDelete.id, organizationId } // Matches conceptual GQL input
      });
      if (result?.success) {
        toast.success(result.message || `Media "${mediaToDelete.name || mediaToDelete.id}" deleted.`);
        fetchMedia();
        if (selectedMediaId === mediaToDelete.id) { setIsDetailsModalOpen(false); setSelectedMediaId(null); }
      } else {
        toast.error(result?.message || `Failed to delete media "${mediaToDelete.name || mediaToDelete.id}".`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error deleting media.";
      toast.error(`Error deleting media: ${message}`);
    } finally {
      setIsDeletingMedia(false); setIsDeleteMediaAlertOpen(false); setMediaToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">Media Library</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your images, videos, and other media assets.</p>
        </div>
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <UploadCloudIcon className="mr-2 h-4 w-4" /> Upload Media
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Upload New Media</DialogTitle>
            </DialogHeader>
            <MediaUploadForm
              onUpload={handleMediaUpload}
              organizationId={organizationId}
              userId={userId}
              onClose={() => setIsUploadModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
          <AlertTriangleIcon className="h-5 w-5 inline mr-2" />
          <p className="inline">Error: {error}</p>
          <Button variant="link" onClick={fetchMedia} className="text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200 ml-2">Retry</Button>
        </div>
      )}

      <MediaList
        mediaItems={mediaItems}
        isLoading={isLoading}
        onRefresh={fetchMedia}
        onSelectMedia={handleViewMediaDetails}
        onDeleteMediaRequest={handleDeleteMediaRequest}
      />

      {selectedMediaId && (
        <MediaDetailsModal
          mediaId={selectedMediaId}
          organizationId={organizationId}
          isOpen={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          onMediaUpdate={handleMediaUpdate}
          getMedia={getMediaForModal}
          updateMediaName={updateMediaNameForModal}
        />
      )}

      <AlertDialog open={isDeleteMediaAlertOpen} onOpenChange={setIsDeleteMediaAlertOpen}>
        <AlertDialogContent className="dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This action cannot be undone. This will permanently delete the media item
              <span className="font-semibold dark:text-gray-300"> {mediaToDelete?.name || mediaToDelete?.id}</span>.
              It might also affect playlists using this media.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" disabled={isDeletingMedia}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMedia}
              disabled={isDeletingMedia}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 dark:text-white"
            >
              {isDeletingMedia ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, delete media
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
