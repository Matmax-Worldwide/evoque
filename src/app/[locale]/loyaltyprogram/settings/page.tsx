// src/app/[locale]/loyaltyprogram/settings/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import NotificationPreferencesForm from '@/components/loyaltyprogram/forms/NotificationPreferencesForm';
import PrivacySettingsSection, { type PrivacySettingsData } from '@/components/loyaltyprogram/settings/PrivacySettingsSection';
import { NotificationPreferences } from '@/types/loyalty';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCwIcon, CheckCircleIcon, AlertTriangleIcon, KeyRoundIcon, WalletIcon } from 'lucide-react';
// For Toasts, assuming sonner is available as per guidelines, but will use a simple status message for now.
// import { toast } from 'sonner';

type SaveStatusType = 'success' | 'error';
interface SaveStatus {
  type: SaveStatusType;
  message: string;
  section: 'notifications' | 'privacy' | 'general';
}

// Mock initial settings data that would be fetched
const mockFetchedNotificationPrefs: Partial<NotificationPreferences> = {
  emailNotifications: {
    promotions: true,
    killaUpdates: true,
    tierUpdates: false,
  },
  smsNotificationsEnabled: false,
  pushNotificationsEnabled: false,
};

const mockFetchedPrivacySettings: PrivacySettingsData = {
  shareActivityWithPartners: false,
  personalizedOffersBasedOnActivity: true,
};

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true); // For initial load of all settings

  const [notificationPrefs, setNotificationPrefs] = useState<Partial<NotificationPreferences>>({});
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsData>({
    shareActivityWithPartners: false,
    personalizedOffersBasedOnActivity: false,
  });
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);

  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  const fetchAllSettings = useCallback(async () => {
    setIsLoading(true);
    setSaveStatus(null); // Clear previous save status
    console.log("Fetching all settings...");
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
    setNotificationPrefs(mockFetchedNotificationPrefs);
    setPrivacySettings(mockFetchedPrivacySettings);
    setIsLoading(false);
    console.log("Settings fetched.");
  }, []);

  useEffect(() => {
    fetchAllSettings();
  }, [fetchAllSettings]);

  const handleSaveNotificationPrefs = async (updatedPrefs: Partial<NotificationPreferences>) => {
    setIsSavingNotifications(true);
    setSaveStatus(null);
    console.log("Saving notification preferences...", updatedPrefs);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API save
    // Simulate success/error
    const success = Math.random() > 0.2; // 80% success rate
    if (success) {
      setNotificationPrefs(updatedPrefs); // Update local state on successful save
      setSaveStatus({ type: 'success', message: 'Notification preferences saved successfully!', section: 'notifications' });
      // toast.success('Notification preferences saved!');
    } else {
      setSaveStatus({ type: 'error', message: 'Failed to save notification preferences. Please try again.', section: 'notifications' });
      // toast.error('Failed to save notification preferences.');
    }
    setIsSavingNotifications(false);
  };

  const handleSavePrivacySettings = async (updatedSettings: PrivacySettingsData) => {
    setIsSavingPrivacy(true);
    setSaveStatus(null);
    console.log("Saving privacy settings...", updatedSettings);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API save
    const success = Math.random() > 0.2;
    if (success) {
      setPrivacySettings(updatedSettings); // Update local state
      setSaveStatus({ type: 'success', message: 'Privacy settings saved successfully!', section: 'privacy' });
      // toast.success('Privacy settings saved!');
    } else {
      setSaveStatus({ type: 'error', message: 'Failed to save privacy settings. Please try again.', section: 'privacy' });
      // toast.error('Failed to save privacy settings.');
    }
    setIsSavingPrivacy(false);
  };

  // Clear status message after a few seconds
  useEffect(() => {
    if (saveStatus) {
      const timer = setTimeout(() => setSaveStatus(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);


  if (isLoading && Object.keys(notificationPrefs).length === 0 && !privacySettings.personalizedOffersBasedOnActivity) {
    // Show full page loader only on initial settings load (check if both are default/empty)
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"> {/* Adjust min-h as needed */}
        <RefreshCwIcon className="h-10 w-10 text-gray-400 animate-spin" />
        <p className="ml-3 text-gray-500">Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Loyalty Program Settings</h1>
        <Button variant="outline" onClick={fetchAllSettings} disabled={isLoading || isSavingNotifications || isSavingPrivacy}>
          <RefreshCwIcon className={`mr-2 h-4 w-4 ${(isLoading || isSavingNotifications || isSavingPrivacy) ? 'animate-spin' : ''}`} />
          Refresh All Settings
        </Button>
      </div>

      {/* General Save Status Message */}
      {saveStatus && (
        <div className={`p-4 rounded-md text-sm mb-6 ${saveStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`} role="alert">
          {saveStatus.type === 'success' ?
            <CheckCircleIcon className="inline h-5 w-5 mr-2" /> :
            <AlertTriangleIcon className="inline h-5 w-5 mr-2" />
          }
          {saveStatus.message}
        </div>
      )}

      {/* Notification Preferences Section */}
      <NotificationPreferencesForm
        initialPreferences={notificationPrefs}
        onSave={handleSaveNotificationPrefs}
        isSaving={isSavingNotifications}
      />

      {/* Privacy Settings Section */}
      <PrivacySettingsSection
        initialSettings={privacySettings}
        onSave={handleSavePrivacySettings}
        isSaving={isSavingPrivacy}
      />

      {/* Placeholder for Wallet Management */}
      <Card className="shadow-md opacity-60">
        <CardHeader>
          <div className="flex items-center">
            <WalletIcon className="h-6 w-6 mr-3 text-gray-400" />
            <div>
                <CardTitle>Wallet Management</CardTitle>
                <CardDescription>Connect and manage your digital wallets.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 italic">Coming Soon: Manage your connected wallets here.</p>
        </CardContent>
      </Card>

      {/* Placeholder for API Key Management */}
      <Card className="shadow-md opacity-60">
        <CardHeader>
           <div className="flex items-center">
            <KeyRoundIcon className="h-6 w-6 mr-3 text-gray-400" />
            <div>
                <CardTitle>API Key Management (For Partners)</CardTitle>
                <CardDescription>Generate and manage API keys for partner integrations.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 italic">Coming Soon: Partner API key management tools.</p>
        </CardContent>
      </Card>
    </div>
  );
}
