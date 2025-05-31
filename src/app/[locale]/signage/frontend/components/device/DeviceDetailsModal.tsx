// src/app/[locale]/signage/frontend/components/device/DeviceDetailsModal.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react'; // Added useRef
// Shadcn UI
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input'; // Added Input
import { Label } from '@/components/ui/label'; // Added Label
import { Loader2, AlertTriangleIcon, ServerIcon, Edit2Icon, Trash2Icon, PowerIcon, InfoIcon, SaveIcon, XIcon } from 'lucide-react'; // Added SaveIcon, XIcon
import { toast } from 'sonner';

interface GraphQLDevice {
  id: string; name?: string | null; status: string; lastSeenAt?: string | null;
  currentPlaylistId?: string | null; organizationId: string; createdAt: string; updatedAt: string;
  ipAddress?: string | null; macAddress?: string | null; firmwareVersion?: string | null;
  deviceSpecificConfig?: Record<string, any> | null;
}

// Mock getDevice (already in the component from previous step, ensure it's consistent)
// For this subtask, we assume mockGetDevice is present and functional as defined before.

// New prop for updating device name (mock mutation)
interface DeviceDetailsModalProps {
  deviceId: string | null;
  organizationId: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onDeviceUpdate?: () => void;
  getDevice: (deviceId: string, organizationId: string) => Promise<GraphQLDevice | null>; // Already exists
  updateDeviceName: (deviceId: string, newName: string, organizationId: string) => Promise<GraphQLDevice | null>; // New prop for mock mutation
}

const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  deviceId, organizationId, isOpen, onOpenChange, onDeviceUpdate, getDevice, updateDeviceName
}) => {
  const [device, setDevice] = useState<GraphQLDevice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for inline name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editableName, setEditableName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (isOpen && deviceId) {
      const fetchDeviceDetails = async () => {
        setIsLoading(true); setError(null); setDevice(null); setIsEditingName(false); // Reset editing state
        try {
          const result = await getDevice(deviceId, organizationId);
          if (result) {
            setDevice(result);
            setEditableName(result.name || ''); // Initialize editableName
          } else {
            setError("Device not found or access denied."); toast.error("Device not found.");
          }
        } catch (err) {
          console.error("Failed to fetch device details:", err);
          const message = err instanceof Error ? err.message : "An unknown error occurred.";
          setError(message); toast.error(`Failed to load device details: ${message}`);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDeviceDetails();
    } else {
      // Reset states when modal is closed or no deviceId
      setIsEditingName(false);
      setEditableName('');
    }
  }, [isOpen, deviceId, organizationId, getDevice]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);


  const handleAction = async (actionName: string) => {
    toast.info(`Action "${actionName}" for device ${device?.name || deviceId} (not implemented).`);
  };

  const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
    switch (status?.toUpperCase()) {
      case 'ONLINE': return 'success';
      case 'OFFLINE': return 'secondary';
      case 'PENDING_PAIRING': return 'warning';
      case 'ERROR': return 'destructive';
      default: return 'outline';
    }
  };

  const handleSaveName = async () => {
    if (!device || !editableName.trim()) {
      toast.error("Device name cannot be empty.");
      return;
    }
    if (editableName.trim() === device.name) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      const updatedDevice = await updateDeviceName(device.id, editableName.trim(), device.organizationId);
      if (updatedDevice) {
        setDevice(updatedDevice); // Update local device state
        setEditableName(updatedDevice.name || '');
        toast.success("Device name updated successfully!");
        setIsEditingName(false);
        onDeviceUpdate?.(); // Trigger list refresh
      } else {
        toast.error("Failed to update device name (mock response).");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      toast.error(`Error updating name: ${message}`);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditableName(device?.name || ''); // Reset to original name
    setIsEditingName(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) setIsEditingName(false); }}>
      <DialogContent className="sm:max-w-lg dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center dark:text-white">
            <ServerIcon className="h-6 w-6 mr-2 text-blue-600 dark:text-blue-400" />
            Device Details
          </DialogTitle>
          {device && !isEditingName && <DialogDescription className="dark:text-gray-400">Information for {device.name || `Device ID: ${device.id}`}</DialogDescription>}
          {device && isEditingName && <DialogDescription className="dark:text-gray-400">Editing name for {device.id}</DialogDescription>}
        </DialogHeader>

        {isLoading && ( <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /><p className="ml-2 dark:text-gray-300">Loading...</p></div>)}
        {error && !isLoading && ( <div className="p-4 my-4 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"><AlertTriangleIcon className="h-5 w-5 inline mr-2" />{error}</div>)}

        {!isLoading && !error && device && (
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm items-center">
              <Label className="text-gray-500 dark:text-gray-400 col-span-1">Name:</Label>
              {isEditingName ? (
                <div className="col-span-2 flex items-center space-x-2">
                  <Input
                    ref={nameInputRef}
                    value={editableName}
                    onChange={(e) => setEditableName(e.target.value)}
                    className="h-8 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    disabled={isSavingName}
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveName} disabled={isSavingName} className="h-8 w-8 p-0">
                    {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4 text-green-600" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleCancelEditName} disabled={isSavingName} className="h-8 w-8 p-0">
                    <XIcon className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ) : (
                <div className="col-span-2 flex items-center space-x-2">
                  <span className="font-medium dark:text-white">{device.name || '-'}</span>
                  <Button variant="ghost" size="icon" onClick={() => { setIsEditingName(true); setEditableName(device.name || ''); }} className="h-6 w-6 p-0">
                    <Edit2Icon className="h-4 w-4 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" />
                  </Button>
                </div>
              )}

              <Label className="text-gray-500 dark:text-gray-400 col-span-1">ID:</Label>
              <span className="col-span-2 text-gray-700 dark:text-gray-300 font-mono text-xs">{device.id}</span>

              <Label className="text-gray-500 dark:text-gray-400 col-span-1">Status:</Label>
              <span className="col-span-2">
                <Badge variant={getStatusBadgeVariant(device.status)} className="capitalize">
                  {device.status?.toLowerCase().replace('_', ' ') || 'Unknown'}
                </Badge>
              </span>
              <Label className="text-gray-500 dark:text-gray-400 col-span-1">Last Seen:</Label>
              <span className="col-span-2 dark:text-gray-300">{device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}</span>
              <Label className="text-gray-500 dark:text-gray-400 col-span-1">IP Address:</Label>
              <span className="col-span-2 dark:text-gray-300">{device.ipAddress || '-'}</span>
              <Label className="text-gray-500 dark:text-gray-400 col-span-1">Firmware:</Label>
              <span className="col-span-2 dark:text-gray-300">{device.firmwareVersion || '-'}</span>
              <Label className="text-gray-500 dark:text-gray-400 col-span-1">Playlist ID:</Label>
              <span className="col-span-2 dark:text-gray-300">{device.currentPlaylistId || 'None Assigned'}</span>
            </div>

            {device.deviceSpecificConfig && Object.keys(device.deviceSpecificConfig).length > 0 && (
                 <div><h4 className="font-medium mb-1 mt-3 dark:text-white">Device Config:</h4><pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded-md overflow-x-auto">{JSON.stringify(device.deviceSpecificConfig, null, 2)}</pre></div>
            )}

            <div className="border-t dark:border-gray-700 pt-4 mt-4 space-x-2 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAction('Restart Device')} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                    <PowerIcon className="h-4 w-4 mr-2"/> Restart
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleAction('Unpair Device')} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">
                    <Trash2Icon className="h-4 w-4 mr-2"/> Unpair Device
                </Button>
            </div>
          </div>
        )}
        {!isLoading && !error && !device && deviceId && (
             <div className="p-4 my-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700 rounded-md text-sm"><InfoIcon className="h-5 w-5 inline mr-2" />Could not load details for the selected device. It might have been recently unpaired or deleted.</div>
        )}
        <DialogFooter className="pt-4">
          <DialogClose asChild><Button type="button" variant="outline" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Close</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default DeviceDetailsModal;
