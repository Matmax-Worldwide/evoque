'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Image, 
  Video, 
  FileText, 
  Music, 
  Plus, 
  Upload,
  MoreHorizontal,
  Trash2,
  Edit,
  Eye,
  Download,
  Search,
  Filter
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutation, useQuery } from '@apollo/client';
import { 
  UPLOAD_SIGNAGE_MEDIA, 
  DELETE_SIGNAGE_MEDIA
} from '@/lib/graphql/mutations/signage';
import { LIST_SIGNAGE_MEDIA } from '@/lib/graphql/queries/signage';
import { toast } from 'sonner';

interface SignageMedia {
  id: string;
  name: string;
  type: 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'AUDIO';
  mimeType?: string;
  url: string;
  thumbnailUrl?: string;
  sizeBytes?: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  organizationId: string;
  uploadedByUserId: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export default function MediaManagement() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'IMAGE' as 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'AUDIO',
    file: null as File | null
  });

  // Mock organization ID and user ID - replace with actual context
  const organizationId = 'org_123';
  const currentUserId = 'user_123';

  // GraphQL queries and mutations
  const { data: mediaData, loading: mediaLoading, refetch: refetchMedia } = useQuery(LIST_SIGNAGE_MEDIA, {
    variables: { organizationId }
  });

  const [uploadMedia] = useMutation(UPLOAD_SIGNAGE_MEDIA);
  const [deleteMedia] = useMutation(DELETE_SIGNAGE_MEDIA);

  const media: SignageMedia[] = mediaData?.listSignageMedia || [];

  // Filter media based on search and type
  const filteredMedia = media.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleUploadMedia = async () => {
    if (!uploadForm.name || !uploadForm.file) {
      toast.error('Please provide a name and select a file');
      return;
    }

    try {
      // In production, upload file to storage service first
      const mockFileSize = uploadForm.file.size;
      const mockDuration = uploadForm.type === 'VIDEO' || uploadForm.type === 'AUDIO' ? 120 : undefined;
      const mockDimensions = uploadForm.type === 'IMAGE' || uploadForm.type === 'VIDEO' 
        ? { width: 1920, height: 1080 } 
        : {};

      await uploadMedia({
        variables: {
          input: {
            organizationId,
            uploadedByUserId: currentUserId,
            name: uploadForm.name,
            type: uploadForm.type,
            mimeType: uploadForm.file.type,
            sizeBytes: mockFileSize,
            durationSeconds: mockDuration,
            ...mockDimensions
          }
        }
      });

      toast.success('Media uploaded successfully');
      setShowUploadDialog(false);
      setUploadForm({ name: '', type: 'IMAGE', file: null });
      refetchMedia();
    } catch (error) {
      toast.error('Failed to upload media');
      console.error('Error uploading media:', error);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await deleteMedia({
        variables: { id: mediaId }
      });

      toast.success('Media deleted successfully');
      refetchMedia();
    } catch (error) {
      toast.error('Failed to delete media');
      console.error('Error deleting media:', error);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'VIDEO': return 'bg-blue-100 text-blue-800';
      case 'IMAGE': return 'bg-green-100 text-green-800';
      case 'DOCUMENT': return 'bg-purple-100 text-purple-800';
      case 'AUDIO': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Media Management</h2>
          <p className="text-muted-foreground">
            Upload and manage your digital signage media content
          </p>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Upload Media
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
              <DialogDescription>
                Upload a new media file for your digital signage displays
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Media Name</Label>
                <Input
                  id="name"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter media name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Media Type</Label>
                <Select 
                  value={uploadForm.type} 
                  onValueChange={(value: 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'AUDIO') => 
                    setUploadForm(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="AUDIO">Audio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadForm(prev => ({ 
                    ...prev, 
                    file: e.target.files?.[0] || null 
                  }))}
                  accept={
                    uploadForm.type === 'IMAGE' ? 'image/*' :
                    uploadForm.type === 'VIDEO' ? 'video/*' :
                    uploadForm.type === 'AUDIO' ? 'audio/*' :
                    '.pdf,.doc,.docx,.ppt,.pptx'
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUploadMedia}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
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
            <CardTitle className="text-sm font-medium">Total Media</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{media.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <Image className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {media.filter(m => m.type === 'IMAGE').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Video className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {media.filter(m => m.type === 'VIDEO').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {media.filter(m => m.type === 'DOCUMENT').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="IMAGE">Images</SelectItem>
                <SelectItem value="VIDEO">Videos</SelectItem>
                <SelectItem value="DOCUMENT">Documents</SelectItem>
                <SelectItem value="AUDIO">Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Media Table */}
      <Card>
        <CardHeader>
          <CardTitle>Media Library</CardTitle>
          <CardDescription>
            All uploaded media files ({filteredMedia.length} items)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mediaLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Media</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedia.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.thumbnailUrl ? (
                          <img 
                            src={item.thumbnailUrl} 
                            alt={item.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                            {getMediaIcon(item.type)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(item.type)}>
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(item.sizeBytes)}</TableCell>
                    <TableCell>
                      {formatDuration(item.durationSeconds) || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {item.uploadedBy.firstName} {item.uploadedBy.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.uploadedBy.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteMedia(item.id)}
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
    </div>
  );
} 