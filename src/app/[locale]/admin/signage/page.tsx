'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Image, 
  PlayCircle, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  Users
} from 'lucide-react';
import DeviceManagement from '@/components/signage/DeviceManagement';
import MediaManagement from '@/components/signage/MediaManagement';
import PlaylistManagement from '@/components/signage/PlaylistManagement';

export default function SignagePage() {
  const [activeTab, setActiveTab] = useState('devices');

  // Mock data for overview stats - replace with actual GraphQL queries
  const overviewStats = {
    totalDevices: 12,
    onlineDevices: 8,
    offlineDevices: 3,
    errorDevices: 1,
    totalMedia: 45,
    totalPlaylists: 8,
    activeUsers: 5
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Digital Signage</h1>
          <p className="text-muted-foreground">
            Manage your digital signage devices, media content, and playlists
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewStats.totalDevices}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-green-600" />
                <span>{overviewStats.onlineDevices} online</span>
              </div>
              <div className="flex items-center gap-1">
                <WifiOff className="h-3 w-3 text-gray-500" />
                <span>{overviewStats.offlineDevices} offline</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-red-600" />
                <span>{overviewStats.errorDevices} error</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media Files</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewStats.totalMedia}</div>
            <p className="text-xs text-muted-foreground">
              Images, videos, documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Playlists</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewStats.totalPlaylists}</div>
            <p className="text-xs text-muted-foreground">
              Content sequences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overviewStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Managing content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Devices
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="playlists" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Playlists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <DeviceManagement />
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <MediaManagement />
        </TabsContent>

        <TabsContent value="playlists" className="space-y-4">
          <PlaylistManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
} 