'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  PlayCircle, 
  Plus, 
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Clock,
  Image,
  Video,
  FileText,
  Music,
  GripVertical,
  Search
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutation, useQuery } from '@apollo/client';
import { 
  CREATE_PLAYLIST, 
  UPDATE_PLAYLIST,
  DELETE_PLAYLIST,
  ADD_MEDIA_TO_PLAYLIST,
  REMOVE_MEDIA_FROM_PLAYLIST
} from '@/lib/graphql/mutations/signage';
import { LIST_PLAYLISTS, LIST_SIGNAGE_MEDIA } from '@/lib/graphql/queries/signage';
import { toast } from 'sonner';

interface PlaylistItem {
  id: string;
  order: number;
  durationSeconds: number;
  media: {
    id: string;
    name: string;
    type: 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'AUDIO';
    url: string;
    thumbnailUrl?: string;
    durationSeconds?: number;
  };
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdByUserId: string;
  isActive: boolean;
  totalDuration?: number;
  createdAt: string;
  createdBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  items: PlaylistItem[];
  assignedDevices: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

interface SignageMedia {
  id: string;
  name: string;
  type: 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'AUDIO';
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

export default function PlaylistManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddMediaDialog, setShowAddMediaDialog] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    description: ''
  });
  const [addMediaForm, setAddMediaForm] = useState({
    mediaId: '',
    durationSeconds: 10
  });

  // Mock organization ID and user ID - replace with actual context
  const organizationId = 'org_123';
  const currentUserId = 'user_123';

  // GraphQL queries and mutations
  const { data: playlistsData, loading: playlistsLoading, refetch: refetchPlaylists } = useQuery(LIST_PLAYLISTS, {
    variables: { organizationId }
  });

  const { data: mediaData } = useQuery(LIST_SIGNAGE_MEDIA, {
    variables: { organizationId }
  });

  const [createPlaylist] = useMutation(CREATE_PLAYLIST);
  const [updatePlaylist] = useMutation(UPDATE_PLAYLIST);
  const [deletePlaylist] = useMutation(DELETE_PLAYLIST);
  const [addMediaToPlaylist] = useMutation(ADD_MEDIA_TO_PLAYLIST);
  const [removeMediaFromPlaylist] = useMutation(REMOVE_MEDIA_FROM_PLAYLIST);

  const playlists: Playlist[] = playlistsData?.listPlaylists || [];
  const media: SignageMedia[] = mediaData?.listSignageMedia || [];

  // Filter playlists based on search
  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePlaylist = async () => {
    if (!createForm.name) {
      toast.error('Please provide a playlist name');
      return;
    }

    try {
      await createPlaylist({
        variables: {
          input: {
            organizationId,
            createdByUserId: currentUserId,
            name: createForm.name,
            description: createForm.description
          }
        }
      });

      toast.success('Playlist created successfully');
      setShowCreateDialog(false);
      setCreateForm({ name: '', description: '' });
      refetchPlaylists();
    } catch (error) {
      toast.error('Failed to create playlist');
      console.error('Error creating playlist:', error);
    }
  };

  const handleUpdatePlaylist = async () => {
    if (!selectedPlaylist) return;

    try {
      await updatePlaylist({
        variables: {
          id: selectedPlaylist.id,
          input: {
            name: createForm.name,
            description: createForm.description,
            isActive: selectedPlaylist.isActive
          }
        }
      });

      toast.success('Playlist updated successfully');
      setShowEditDialog(false);
      setSelectedPlaylist(null);
      setCreateForm({ name: '', description: '' });
      refetchPlaylists();
    } catch (error) {
      toast.error('Failed to update playlist');
      console.error('Error updating playlist:', error);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await deletePlaylist({
        variables: { id: playlistId }
      });

      toast.success('Playlist deleted successfully');
      refetchPlaylists();
    } catch (error) {
      toast.error('Failed to delete playlist');
      console.error('Error deleting playlist:', error);
    }
  };

  const handleAddMediaToPlaylist = async () => {
    if (!selectedPlaylist || !addMediaForm.mediaId) {
      toast.error('Please select media and duration');
      return;
    }

    try {
      await addMediaToPlaylist({
        variables: {
          input: {
            organizationId,
            playlistId: selectedPlaylist.id,
            mediaId: addMediaForm.mediaId,
            durationSeconds: addMediaForm.durationSeconds
          }
        }
      });

      toast.success('Media added to playlist successfully');
      setShowAddMediaDialog(false);
      setAddMediaForm({ mediaId: '', durationSeconds: 10 });
      refetchPlaylists();
    } catch (error) {
      toast.error('Failed to add media to playlist');
      console.error('Error adding media to playlist:', error);
    }
  };

  const handleRemoveMediaFromPlaylist = async (playlistId: string, mediaId: string) => {
    try {
      await removeMediaFromPlaylist({
        variables: {
          playlistId,
          mediaId
        }
      });

      toast.success('Media removed from playlist successfully');
      refetchPlaylists();
    } catch (error) {
      toast.error('Failed to remove media from playlist');
      console.error('Error removing media from playlist:', error);
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Video className="h-4 w-4" />;
      case 'IMAGE': return <Image className="h-4 w-4" />;
      case 'DOCUMENT': return <FileText className="h-4 w-4" />;
      case 'AUDIO': return <Music className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openEditDialog = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setCreateForm({
      name: playlist.name,
      description: playlist.description || ''
    });
    setShowEditDialog(true);
  };

  const openAddMediaDialog = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowAddMediaDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Playlist Management</h2>
          <p className="text-muted-foreground">
            Create and manage playlists for your digital signage displays
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Playlist</DialogTitle>
              <DialogDescription>
                Create a new playlist for your digital signage content
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Playlist Name</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter playlist name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter playlist description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePlaylist}>
                  Create Playlist
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playlists.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Playlists</CardTitle>
            <PlayCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {playlists.filter(p => p.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Image className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {playlists.reduce((sum, p) => sum + p.items.length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Devices</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {playlists.reduce((sum, p) => sum + p.assignedDevices.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Playlists Table */}
      <Card>
        <CardHeader>
          <CardTitle>Playlists</CardTitle>
          <CardDescription>
            All playlists and their content ({filteredPlaylists.length} items)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {playlistsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Playlist</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlaylists.map((playlist) => (
                  <TableRow key={playlist.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <PlayCircle className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{playlist.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {playlist.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{playlist.items.length}</span>
                        <span className="text-muted-foreground">items</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {playlist.totalDuration ? formatDuration(playlist.totalDuration) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={playlist.isActive ? 'default' : 'secondary'}>
                        {playlist.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{playlist.assignedDevices.length}</span>
                        <span className="text-muted-foreground">devices</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {playlist.createdBy.firstName} {playlist.createdBy.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(playlist.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAddMediaDialog(playlist)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Media
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(playlist)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Playlist
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeletePlaylist(playlist.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Playlist Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Playlist: {selectedPlaylist?.name}</DialogTitle>
            <DialogDescription>
              Edit playlist details and manage media items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Playlist Name</Label>
                <Input
                  id="edit-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter playlist name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter playlist description"
                />
              </div>
            </div>

            {/* Playlist Items */}
            {selectedPlaylist && selectedPlaylist.items.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Playlist Items</h3>
                <div className="space-y-2">
                  {selectedPlaylist.items.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium w-8">{index + 1}</span>
                      {getMediaIcon(item.media.type)}
                      <div className="flex-1">
                        <p className="font-medium">{item.media.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.media.type} • {formatDuration(item.durationSeconds)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMediaFromPlaylist(selectedPlaylist.id, item.media.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePlaylist}>
                Update Playlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Media Dialog */}
      <Dialog open={showAddMediaDialog} onOpenChange={setShowAddMediaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Media to Playlist</DialogTitle>
            <DialogDescription>
              Select media to add to {selectedPlaylist?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Media</Label>
              <Select 
                value={addMediaForm.mediaId} 
                onValueChange={(value) => setAddMediaForm(prev => ({ ...prev, mediaId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose media file" />
                </SelectTrigger>
                <SelectContent>
                  {media.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        {getMediaIcon(item.type)}
                        <span>{item.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {item.type}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Display Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={addMediaForm.durationSeconds}
                onChange={(e) => setAddMediaForm(prev => ({ 
                  ...prev, 
                  durationSeconds: parseInt(e.target.value) || 10 
                }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddMediaDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMediaToPlaylist}>
                Add to Playlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 