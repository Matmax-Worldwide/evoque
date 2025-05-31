// src/app/[locale]/signage/devices/page.tsx
'use client';

// IMPORTANT: This page now expects a global `graphqlClient` (e.g., from '@/lib/graphql-client')
// to be configured and capable of handling Signage module queries and mutations.
// The previous page-local mock client has been removed.
// Ensure backend integration (Prisma, GraphQL server setup) is complete.

import React, { useState, useEffect, useCallback } from 'react';
import DeviceList from '@/app/[locale]/signage/frontend/components/device/DeviceList';
import DevicePairingDisplay from '@/app/[locale]/signage/frontend/components/device/DevicePairingDisplay';
import DeviceDetailsModal from '@/app/[locale]/signage/frontend/components/device/DeviceDetailsModal';

import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { PlusCircleIcon, Loader2, AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';

// Assuming global graphqlClient import (actual implementation depends on CMS setup)
// import graphqlClient from '@/lib/graphql-client';
// For demonstration purposes, if graphqlClient is not available, operations will fail.
// A placeholder to prevent runtime errors IF this file were executed directly without a real client:
const graphqlClient: any = {
    query: async (params: {queryName: string, variables: any}) => { console.warn(`graphqlClient.query for ${params.queryName} not implemented. Backend not connected.`); return []; },
    mutate: async (params: {mutationName: string, input: any}) => { console.warn(`graphqlClient.mutate for ${params.mutationName} not implemented. Backend not connected.`); return null; }
};


interface GraphQLDevice {
  id: string; name?: string | null; status: string; lastSeenAt?: string | null;
  currentPlaylistId?: string | null; organizationId: string; createdAt: string; updatedAt: string;
  ipAddress?: string | null; macAddress?: string | null; firmwareVersion?: string | null;
  deviceSpecificConfig?: Record<string, any> | null;
}
// Input types for mutations would also be defined/imported from generated types
// interface GenerateDevicePairingCodeInput { organizationId: string; }
// interface UpdateDeviceNameInput { deviceId: string; newName: string; organizationId: string; }
// interface DeleteDeviceInput { deviceId: string; organizationId: string; }


export default function DeviceManagementPage() {
  const [devices, setDevices] = useState<GraphQLDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDeviceAlertOpen, setIsDeleteDeviceAlertOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<{id: string, name?: string | null} | null>(null);
  const [isDeletingDevice, setIsDeletingDevice] = useState(false);

  const organizationId = "org_placeholder_123"; // TODO: Get from context/session

  const fetchDevices = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      console.log("Attempting to fetch devices via global graphqlClient.");
      const result = await graphqlClient.query({
        queryName: 'listDevices', // Conceptual GQL operation name
        variables: { organizationId }
      });
      setDevices(result || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error fetching devices.";
      setError(message); toast.error(`Failed to load devices: ${message}`);
      setDevices([]);
    } finally { setIsLoading(false); }
  }, [organizationId]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleGeneratePairingCode = async () => {
    try {
      console.log("Attempting to generate pairing code via global graphqlClient.");
      const result = await graphqlClient.mutate({
        mutationName: 'generateDevicePairingCode', // Conceptual GQL operation name
        input: { organizationId } // Matches GQL input type
      });
      if (!result) throw new Error("No pairing info returned");
      fetchDevices();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error generating code.";
      toast.error(`Pairing code generation failed: ${message}`); return null;
    }
  };

  const handleViewDeviceDetails = (deviceId: string) => { setSelectedDeviceId(deviceId); setIsDetailsModalOpen(true); };
  const handleDeviceUpdate = () => { fetchDevices(); };

  const getDeviceForModal = useCallback(async (deviceId: string, orgId: string) => {
    console.log("Attempting to get device for modal via global graphqlClient.");
    return await graphqlClient.query({
        queryName: 'getDevice', // Conceptual GQL operation name
        variables: { id: deviceId, organizationId: orgId }
    });
  }, []);

  const updateDeviceNameForModal = useCallback(async (deviceId: string, newName: string, orgId: string) => {
    console.log("Attempting to update device name via global graphqlClient.");
    return await graphqlClient.mutate({
        mutationName: 'updateDeviceName', // Conceptual GQL operation name
        input: { deviceId, name: newName, organizationId: orgId } // Matches conceptual GQL input
    });
  }, []);

  const handleDeleteDeviceRequest = (device: {id: string, name?: string | null}) => { setDeviceToDelete(device); setIsDeleteDeviceAlertOpen(true); };
  const confirmDeleteDevice = async () => {
    if (!deviceToDelete) return;
    setIsDeletingDevice(true);
    try {
      console.log("Attempting to delete device via global graphqlClient.");
      const result = await graphqlClient.mutate({
        mutationName: 'deleteDevice', // Conceptual GQL operation name
        input: { id: deviceToDelete.id, organizationId } // Matches conceptual GQL input
      });
      if (result?.success) { // Assuming mutation returns { success: boolean, message?: string }
        toast.success(result.message || `Device "${deviceToDelete.name || deviceToDelete.id}" deleted.`);
        fetchDevices();
      } else {
        toast.error(result?.message || `Failed to delete device "${deviceToDelete.name || deviceToDelete.id}".`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error deleting device.";
      toast.error(`Error deleting device: ${message}`);
    } finally {
      setIsDeletingDevice(false); setIsDeleteDeviceAlertOpen(false); setDeviceToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">Device Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and pair your digital signage devices.</p>
        </div>
        <Dialog open={isPairingModalOpen} onOpenChange={setIsPairingModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircleIcon className="mr-2 h-4 w-4" /> Pair New Device
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Pair New Signage Device</DialogTitle>
            </DialogHeader>
            <DevicePairingDisplay onGenerateCode={handleGeneratePairingCode} />
            <DialogFooter className="pt-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Close</Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-300 dark:border-red-700">
          <AlertTriangleIcon className="h-5 w-5 inline mr-2" />
          Error: {error}
          <Button variant="link" onClick={fetchDevices} className="text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200 ml-2">Retry</Button>
        </div>
      )}

      <DeviceList
        devices={devices}
        isLoading={isLoading}
        onRefresh={fetchDevices}
        onSelectDevice={handleViewDeviceDetails}
        onDeleteDeviceRequest={handleDeleteDeviceRequest}
      />

      {selectedDeviceId && (
        <DeviceDetailsModal
          deviceId={selectedDeviceId}
          organizationId={organizationId}
          isOpen={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          onDeviceUpdate={handleDeviceUpdate}
          getDevice={getDeviceForModal}
          updateDeviceName={updateDeviceNameForModal}
        />
      )}

      <AlertDialog open={isDeleteDeviceAlertOpen} onOpenChange={setIsDeleteDeviceAlertOpen}>
        <AlertDialogContent className="dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              This action cannot be undone. This will permanently delete the device
              <span className="font-semibold dark:text-gray-300"> {deviceToDelete?.name || deviceToDelete?.id}</span> and remove its association with the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" disabled={isDeletingDevice}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDevice}
              disabled={isDeletingDevice}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 dark:text-white"
            >
              {isDeletingDevice ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Yes, delete device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
