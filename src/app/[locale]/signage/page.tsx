// src/app/[locale]/signage/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation'; // To get locale for links

// Shadcn UI components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TvIcon, ListVideoIcon, ListMusicIcon, SettingsIcon, PlusCircleIcon, UsersIcon, MapPinIcon, BarChart3Icon, Loader2, AlertTriangleIcon } from 'lucide-react'; // Added UsersIcon, MapPinIcon, BarChart3Icon for consistency with bookings example
import { toast } from 'sonner';

// Mock GraphQL client (assuming similar structure to other pages)
// Define types inline for mock client for this page
interface GraphQLDevice { id: string; status: string; }
interface GraphQLMedia { id: string; }
interface GraphQLPlaylist { id: string; }

const mockGraphqlClient = {
  listDevices: async (args: { organizationId: string }): Promise<GraphQLDevice[]> => {
    console.log('mockGraphqlClient.listDevices (for overview) called with:', args);
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      { id: 'dev-1', status: 'ONLINE' }, { id: 'dev-2', status: 'OFFLINE' },
      { id: 'dev-3', status: 'ONLINE' }, { id: 'dev-4', status: 'ERROR' },
      { id: 'dev-5', status: 'PENDING_PAIRING' },
    ];
  },
  listMedia: async (args: { organizationId: string }): Promise<GraphQLMedia[]> => {
    console.log('mockGraphqlClient.listMedia (for overview) called with:', args);
    await new Promise(resolve => setTimeout(resolve, 400));
    return [{ id: 'media-1' }, { id: 'media-2' }, { id: 'media-3' }];
  },
  listPlaylists: async (args: { organizationId: string }): Promise<GraphQLPlaylist[]> => {
    console.log('mockGraphqlClient.listPlaylists (for overview) called with:', args);
    await new Promise(resolve => setTimeout(resolve, 500));
    return [{ id: 'pl-1' }, { id: 'pl-2' }];
  }
};
const graphqlClient = mockGraphqlClient;

interface OverviewStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  errorDevices: number;
  pendingDevices: number;
  totalMedia: number;
  totalPlaylists: number;
}

export default function SignageOverviewPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Replace with actual organizationId from context or props
  const organizationId = "org_placeholder_123";

  const fetchOverviewData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [devicesData, mediaData, playlistsData] = await Promise.allSettled([
        graphqlClient.listDevices({ organizationId }),
        graphqlClient.listMedia({ organizationId }),
        graphqlClient.listPlaylists({ organizationId }),
      ]);

      if (devicesData.status === 'rejected') throw new Error('Failed to load device data');
      if (mediaData.status === 'rejected') throw new Error('Failed to load media data');
      if (playlistsData.status === 'rejected') throw new Error('Failed to load playlist data');

      const devices = devicesData.value as GraphQLDevice[];
      const media = mediaData.value as GraphQLMedia[];
      const playlists = playlistsData.value as GraphQLPlaylist[];

      setStats({
        totalDevices: devices.length,
        onlineDevices: devices.filter(d => d.status === 'ONLINE').length,
        offlineDevices: devices.filter(d => d.status === 'OFFLINE').length,
        errorDevices: devices.filter(d => d.status === 'ERROR').length,
        pendingDevices: devices.filter(d => d.status === 'PENDING_PAIRING').length,
        totalMedia: media.length,
        totalPlaylists: playlists.length,
      });

    } catch (err) {
      console.error("Failed to fetch overview data:", err);
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
      toast.error(`Failed to load overview: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const statsCards = stats ? [
    { title: 'Total Devices', value: stats.totalDevices.toString(), icon: TvIcon, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30' },
    { title: 'Online Devices', value: stats.onlineDevices.toString(), icon: TvIcon, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/30' },
    // { title: 'Offline Devices', value: stats.offlineDevices.toString(), icon: TvIcon, color: 'text-gray-600', bgColor: 'bg-gray-50' },
    // { title: 'Error Devices', value: stats.errorDevices.toString(), icon: AlertTriangleIcon, color: 'text-red-600', bgColor: 'bg-red-50' },
    { title: 'Total Media Items', value: stats.totalMedia.toString(), icon: ListVideoIcon, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/30' },
    { title: 'Total Playlists', value: stats.totalPlaylists.toString(), icon: ListMusicIcon, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30' },
  ] : [];

  const quickActions = [
    { title: 'Manage Devices', description: 'View, pair, and manage devices', icon: TvIcon, href: `/${locale}/signage/devices`, color: 'bg-blue-500 hover:bg-blue-600' },
    { title: 'Media Library', description: 'Upload and organize media assets', icon: ListVideoIcon, href: `/${locale}/signage/media`, color: 'bg-purple-500 hover:bg-purple-600' },
    { title: 'Manage Playlists', description: 'Create and edit content playlists', icon: ListMusicIcon, href: `/${locale}/signage/playlists`, color: 'bg-orange-500 hover:bg-orange-600' },
    { title: 'View Schedules', description: 'Manage content schedules (Future)', icon: SettingsIcon /* CalendarDaysIcon */, href: '#', color: 'bg-teal-500 hover:bg-teal-600', disabled: true },
  ];

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]"> {/* Adjust height as needed */}
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        <p className="ml-3 text-lg">Loading Signage Overview...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="text-center">
            <AlertTriangleIcon className="mx-auto h-12 w-12 text-red-500 dark:text-red-400 mb-4" />
            <p className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Failed to Load Overview</p>
            <p className="text-sm text-red-600 dark:text-red-300 mb-4">{error}</p>
            <Button onClick={fetchOverviewData} variant="destructive">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) { // Should not happen if not loading and no error, but as a fallback
      return <p className="text-center py-10">No overview data available.</p>;
  }


  return (
    <div className="space-y-8 p-2"> {/* Added small padding to match other pages if layout doesn't provide enough */}
      {/* Header can be part of the layout, or here if specific */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Signage Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">At a glance summary of your digital signage network.</p>
        </div>
        {/* Optional: A global action like "Go to Live View" or "System Health" */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  {/* Optional: Change indicator if you have past data
                  <p className="text-xs text-gray-500 mt-1">
                    <span className={stat.change?.startsWith('+') ? 'text-green-600' : 'text-gray-500'}>
                      {stat.change}
                    </span> from last month
                  </p> */}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="dark:bg-gray-800">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription className="dark:text-gray-400">Navigate to common management areas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-center justify-center space-y-2 hover:shadow-lg transition-shadow dark:border-gray-700 dark:hover:bg-gray-700/70
                            ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                // Using Link component for client-side navigation wrapped in Button for styling
                // is generally better. For this stub, direct onClick navigation for simplicity.
                onClick={() => {
                  if (!action.disabled && action.href !== '#') {
                    // This is a simple way to navigate; Next.js Link component is preferred for SPA behavior
                    window.location.href = action.href;
                  } else if (action.disabled) {
                    toast.info("This feature is planned for the future.");
                  }
                }}
                disabled={action.disabled}
              >
                <div className={`p-3 rounded-full text-white ${action.disabled ? 'bg-gray-400 dark:bg-gray-600' : action.color}`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="text-center mt-2">
                  <p className="font-medium text-sm text-gray-800 dark:text-white">{action.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for other sections like "Recent Activity" or "Device Status Map" */}
      {/*
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800">
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-500 dark:text-gray-400">Activity feed placeholder...</p></CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader><CardTitle>Device Status Map</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-gray-500 dark:text-gray-400">Map placeholder...</p></CardContent>
        </Card>
      </div>
      */}
    </div>
  );
}
