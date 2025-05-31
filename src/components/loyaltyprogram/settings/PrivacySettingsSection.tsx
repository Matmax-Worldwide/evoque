// src/components/loyaltyprogram/settings/PrivacySettingsSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2Icon, SaveIcon, ShieldCheckIcon } from 'lucide-react';

// Define a simple local type for this component's specific settings
export interface PrivacySettingsData {
  shareActivityWithPartners: boolean;
  personalizedOffersBasedOnActivity: boolean;
  // Add more privacy settings as needed
}

interface PrivacySettingsSectionProps {
  initialSettings: PrivacySettingsData;
  onSave: (updatedSettings: PrivacySettingsData) => Promise<void>; // Make it async
  isSaving?: boolean;
}

const PrivacySettingsSection: React.FC<PrivacySettingsSectionProps> = ({
  initialSettings,
  onSave,
  isSaving = false,
}) => {
  const [settings, setSettings] = useState<PrivacySettingsData>(initialSettings);

  useEffect(() => {
    // Update form state if initialSettings prop changes
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSettingChange = (key: keyof PrivacySettingsData, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSave(settings);
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center">
          <ShieldCheckIcon className="h-6 w-6 mr-3 text-blue-600" />
          <div>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>Control how your Killa Program data is used.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-4">
          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg bg-gray-50/50">
            <Label htmlFor="shareActivity" className="flex flex-col space-y-1 cursor-pointer flex-1">
              <span>Share Killa Activity with Partners</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs">
                Allow trusted partners to see anonymized activity to offer relevant services.
              </span>
            </Label>
            <Switch
              id="shareActivity"
              checked={settings.shareActivityWithPartners}
              onCheckedChange={(value) => handleSettingChange('shareActivityWithPartners', value)}
              disabled={isSaving}
              aria-label="Share Killa Activity with Partners"
            />
          </div>

          <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg bg-gray-50/50">
            <Label htmlFor="personalizedOffers" className="flex flex-col space-y-1 cursor-pointer flex-1">
              <span>Personalized Offers Based on Activity</span>
              <span className="font-normal leading-snug text-muted-foreground text-xs">
                Receive offers and recommendations tailored to your Killa Program interactions.
              </span>
            </Label>
            <Switch
              id="personalizedOffers"
              checked={settings.personalizedOffersBasedOnActivity}
              onCheckedChange={(value) => handleSettingChange('personalizedOffersBasedOnActivity', value)}
              disabled={isSaving}
              aria-label="Personalized Offers Based on Activity"
            />
          </div>

          {/* Add more privacy settings toggles here as needed */}

        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SaveIcon className="mr-2 h-4 w-4" />
            )}
            Save Privacy Settings
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default PrivacySettingsSection;
