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
  DialogTitle
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
  Monitor, 
  Plus, 
  QrCode, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  Settings,
  PlayCircle,
  MoreHorizontal,
  Trash2,
  Edit
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMutation, useQuery } from '@apollo/client';
import { 
  GENERATE_DEVICE_PAIRING_CODE, 
  ASSIGN_PLAYLIST_TO_DEVICE
} from '@/lib/graphql/mutations/signage';
import { LIST_DEVICES, LIST_PLAYLISTS } from '@/lib/graphql/queries/signage';
import { toast } from 'sonner';

interface Device {
  id: string;
  name: string;
  status: 'PENDING' | 'ONLINE' | 'OFFLINE' | 'ERROR' | 'UNPAIRED';
  lastSeenAt: string;
  organizationId: string;
  currentPlaylistId?: string;
  currentPlaylist?: {
    id: string;
    name: string;
  };
  ipAddress?: string;
  createdAt: string;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  totalDuration?: number;
}

export default function DeviceManagement() {
  const [showPairingDialog, setShowPairingDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [pairingCode, setPairingCode] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');

  // Mock organization ID - replace with actual context
  const organizationId = 'org_123';

  // GraphQL queries and mutations
  const { data: devicesData, loading: devicesLoading, refetch: refetchDevices } = useQuery(LIST_DEVICES, {
    variables: { organizationId },
    pollInterval: 30000 // Poll every 30 seconds for real-time updates
  });

  const { data: playlistsData } = useQuery(LIST_PLAYLISTS, {
    variables: { organizationId }
  });

  const [generatePairingCode] = useMutation(GENERATE_DEVICE_PAIRING_CODE);
  const [assignPlaylist] = useMutation(ASSIGN_PLAYLIST_TO_DEVICE);

  const devices: Device[] = devicesData?.listDevices || [];
  const playlists: Playlist[] = playlistsData?.listPlaylists || [];

  const handleGeneratePairingCode = async () => {
    try {
      const { data } = await generatePairingCode({
        variables: {
          input: { organizationId }
        }
      });

      if (data?.generateDevicePairingCode) {
        setPairingCode(data.generateDevicePairingCode.code);
        setExpiresAt(data.generateDevicePairingCode.expiresAt);
        setShowPairingDialog(true);
        toast.success('Pairing code generated successfully');
      }
    } catch (error) {
      toast.error('Failed to generate pairing code');
      console.error('Error generating pairing code:', error);
    }
  };

  const handleAssignPlaylist = async (playlistId: string) => {
    if (!selectedDevice) return;

    try {
      await assignPlaylist({
        variables: {
          input: {
            organizationId,
            deviceId: selectedDevice.id,
            playlistId: playlistId || null
          }
        }
      });

      toast.success('Playlist assigned successfully');
      setShowAssignDialog(false);
      setSelectedDevice(null);
      refetchDevices();
    } catch (error) {
      toast.error('Failed to assign playlist');
      console.error('Error assigning playlist:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'OFFLINE': return 'bg-red-500';
      case 'ERROR': return 'bg-yellow-500';
      case 'PENDING': return 'bg-blue-500';
      case 'UNPAIRED': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'default';
      case 'OFFLINE': return 'destructive';
      case 'ERROR': return 'secondary';
      case 'PENDING': return 'secondary';
      case 'UNPAIRED': return 'outline';
      default: return 'outline';
    }
  };

  const formatLastSeen = (lastSeenAt: string) => {
    const date = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Device Management</h2>
          <p className="text-muted-foreground">
            Manage and monitor your digital signage devices
          </p>
        </div>
        <Button onClick={handleGeneratePairingCode}>
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {devices.filter(d => d.status === 'ONLINE').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <WifiOff className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {devices.filter(d => d.status === 'OFFLINE').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {devices.filter(d => d.status === 'ERROR').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>
            All registered devices and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devicesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Current Playlist</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`} />
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-muted-foreground">{device.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(device.status)}>
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {device.currentPlaylist ? (
                        <div className="flex items-center gap-2">
                          <PlayCircle className="h-4 w-4 text-muted-foreground" />
                          <span>{device.currentPlaylist.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No playlist assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {device.lastSeenAt ? formatLastSeen(device.lastSeenAt) : 'Never'}
                    </TableCell>
                    <TableCell>
                      {device.ipAddress || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDevice(device);
                              setShowAssignDialog(true);
                            }}
                          >
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Assign Playlist
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Device
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Device
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

      {/* Pairing Code Dialog */}
      <Dialog open={showPairingDialog} onOpenChange={setShowPairingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Device Pairing Code</DialogTitle>
            <DialogDescription>
              Use this code to pair a new device. The code expires in 15 minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
              <div className="text-center">
                <QrCode className="h-24 w-24 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-muted-foreground">QR Code would be displayed here</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pairing Code</Label>
              <div className="flex items-center gap-2">
                <Input value={pairingCode} readOnly className="text-center text-lg font-mono" />
                <Button 
                  variant="outline" 
                  onClick={() => navigator.clipboard.writeText(pairingCode)}
                >
                  Copy
                </Button>
              </div>
            </div>
            {expiresAt && (
              <p className="text-sm text-muted-foreground">
                Expires: {new Date(expiresAt).toLocaleString()}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Playlist Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Playlist</DialogTitle>
            <DialogDescription>
              Select a playlist to assign to {selectedDevice?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Playlist</Label>
              <Select onValueChange={handleAssignPlaylist}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a playlist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No playlist (unassign)</SelectItem>
                  {playlists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                      {playlist.totalDuration && (
                        <span className="text-muted-foreground ml-2">
                          ({Math.round(playlist.totalDuration / 60)}min)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 