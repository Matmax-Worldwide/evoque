// src/components/loyaltyprogram/forms/NotificationPreferencesForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { NotificationPreferences } from '@/types/loyalty'; // Using updated types
import { Loader2Icon, SaveIcon } from 'lucide-react';

interface NotificationPreferencesFormProps {
  initialPreferences: Partial<NotificationPreferences>; // Renamed for clarity
  onSave: (updatedPreferences: Partial<NotificationPreferences>) => Promise<void>; // Make it async
  isSaving?: boolean;
  // onPreferencesChange could be used for live updates to parent if needed, but onSave is primary
}

// Define a local type for the form's state structure, matching NotificationPreferences.emailNotifications
interface EmailPrefsFormState {
  promotions: boolean;
  killaUpdates: boolean;
  tierUpdates: boolean;
}

const NotificationPreferencesForm: React.FC<NotificationPreferencesFormProps> = ({
  initialPreferences,
  onSave,
  isSaving = false,
}) => {
  const [emailPrefs, setEmailPrefs] = useState<EmailPrefsFormState>({
    promotions: initialPreferences.emailNotifications?.promotions ?? false,
    killaUpdates: initialPreferences.emailNotifications?.killaUpdates ?? false,
    tierUpdates: initialPreferences.emailNotifications?.tierUpdates ?? false,
  });

  // Placeholder states for other notification types
  const [smsEnabled, setSmsEnabled] = useState(initialPreferences.smsNotificationsEnabled ?? false);
  const [pushEnabled, setPushEnabled] = useState(initialPreferences.pushNotificationsEnabled ?? false);


  useEffect(() => {
    // Update form state if initialPreferences prop changes
    setEmailPrefs({
      promotions: initialPreferences.emailNotifications?.promotions ?? false,
      killaUpdates: initialPreferences.emailNotifications?.killaUpdates ?? false,
      tierUpdates: initialPreferences.emailNotifications?.tierUpdates ?? false,
    });
    setSmsEnabled(initialPreferences.smsNotificationsEnabled ?? false);
    setPushEnabled(initialPreferences.pushNotificationsEnabled ?? false);
  }, [initialPreferences]);

  const handleEmailPrefChange = (prefKey: keyof EmailPrefsFormState, value: boolean) => {
    setEmailPrefs(prev => ({ ...prev, [prefKey]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const updatedPrefs: Partial<NotificationPreferences> = {
      // Preserve other parts of preferences not managed by this form directly
      // Only update what this form controls.
      // If initialPreferences had other top-level keys, they would be lost if not spread here.
      // However, for this form, we are only concerned with email, sms, push.
      // Let's assume initialPreferences might be a subset, so we build from scratch for these.
      emailNotifications: emailPrefs,
      smsNotificationsEnabled: smsEnabled,
      pushNotificationsEnabled: pushEnabled,
    };
    await onSave(updatedPrefs);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive updates about the Killa Program.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Email Notifications Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
            <h4 className="text-md font-semibold text-gray-700">Email Notifications</h4>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="email-promotions" className="flex flex-col space-y-1">
                <span>Promotions & Offers</span>
                <span className="font-normal leading-snug text-muted-foreground text-xs">
                  Receive emails about new campaigns and special Killa offers.
                </span>
              </Label>
              <Switch
                id="email-promotions"
                checked={emailPrefs.promotions}
                onCheckedChange={(value) => handleEmailPrefChange('promotions', value)}
                disabled={isSaving}
                aria-label="Promotions and Offers Email Notifications"
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="email-killa-updates" className="flex flex-col space-y-1">
                <span>Killa Balance Updates</span>
                <span className="font-normal leading-snug text-muted-foreground text-xs">
                  Get notified about significant changes to your Killa balance.
                </span>
              </Label>
              <Switch
                id="email-killa-updates"
                checked={emailPrefs.killaUpdates}
                onCheckedChange={(value) => handleEmailPrefChange('killaUpdates', value)}
                disabled={isSaving}
                aria-label="Killa Balance Updates Email Notifications"
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="email-tier-updates" className="flex flex-col space-y-1">
                <span>Tier Status Changes</span>
                <span className="font-normal leading-snug text-muted-foreground text-xs">
                  Receive updates when you achieve a new loyalty tier.
                </span>
              </Label>
              <Switch
                id="email-tier-updates"
                checked={emailPrefs.tierUpdates}
                onCheckedChange={(value) => handleEmailPrefChange('tierUpdates', value)}
                disabled={isSaving}
                aria-label="Tier Status Changes Email Notifications"
              />
            </div>
          </div>

          {/* SMS Notifications Placeholder Section */}
          <div className="space-y-2 p-4 border rounded-lg opacity-50">
            <h4 className="text-md font-semibold text-gray-700">SMS Notifications</h4>
            <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="sms-notifications" className="flex flex-col space-y-1">
                    <span>Enable SMS Alerts</span>
                    <span className="font-normal leading-snug text-muted-foreground text-xs">
                    (Coming Soon) Receive critical alerts via SMS.
                    </span>
                </Label>
                <Switch id="sms-notifications" disabled={true} checked={smsEnabled} aria-label="Enable SMS Alerts (Coming Soon)" />
            </div>
          </div>

          {/* Push Notifications Placeholder Section */}
          <div className="space-y-2 p-4 border rounded-lg opacity-50">
            <h4 className="text-md font-semibold text-gray-700">Push Notifications</h4>
             <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                    <span>Enable App Notifications</span>
                    <span className="font-normal leading-snug text-muted-foreground text-xs">
                    (Coming Soon) Get real-time updates in our mobile app.
                    </span>
                </Label>
                <Switch id="push-notifications" disabled={true} checked={pushEnabled} aria-label="Enable App Notifications (Coming Soon)" />
            </div>
          </div>

        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SaveIcon className="mr-2 h-4 w-4" />
            )}
            Save Preferences
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default NotificationPreferencesForm;
