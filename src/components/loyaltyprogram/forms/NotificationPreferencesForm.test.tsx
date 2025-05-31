// src/components/loyaltyprogram/forms/NotificationPreferencesForm.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NotificationPreferencesForm from './NotificationPreferencesForm';
import { NotificationPreferences } from '@/types/loyalty';

const mockInitialPreferences: Partial<NotificationPreferences> = {
  emailNotifications: {
    promotions: true,
    killaUpdates: false,
    tierUpdates: true,
  },
  smsNotificationsEnabled: false,
  pushNotificationsEnabled: true,
};

describe('NotificationPreferencesForm', () => {
  const mockOnSave = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockOnSave.mockClear();
  });

  it('renders form with initial preferences correctly', () => {
    render(
      <NotificationPreferencesForm
        initialPreferences={mockInitialPreferences}
        onSave={mockOnSave}
      />
    );

    // Using aria-label for switches
    expect(screen.getByLabelText(/Promotions & Offers/i)).toBeInTheDocument(); // This checks the Label component
    expect(screen.getByRole('switch', { name: /Promotions and Offers Email Notifications/i })).toBeChecked();

    expect(screen.getByLabelText(/Killa Balance Updates/i)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Killa Balance Updates Email Notifications/i })).not.toBeChecked();

    expect(screen.getByLabelText(/Tier Status Changes/i)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Tier Status Changes Email Notifications/i })).toBeChecked();

    // Check placeholder sections (switches are disabled)
    const smsSwitch = screen.getByRole('switch', { name: /Enable SMS Alerts/i});
    expect(smsSwitch).toBeDisabled();
    expect(smsSwitch).not.toBeChecked(); // Based on mockInitialPreferences.smsNotificationsEnabled = false

    const pushSwitch = screen.getByRole('switch', { name: /Enable App Notifications/i});
    expect(pushSwitch).toBeDisabled();
    expect(pushSwitch).toBeChecked(); // Based on mockInitialPreferences.pushNotificationsEnabled = true
  });

  it('updates internal state when switches are toggled', () => {
    render(
      <NotificationPreferencesForm
        initialPreferences={{ emailNotifications: { promotions: false, killaUpdates: false, tierUpdates: false } }}
        onSave={mockOnSave}
      />
    );
    const promotionsSwitch = screen.getByRole('switch', { name: /Promotions and Offers Email Notifications/i });
    fireEvent.click(promotionsSwitch);
    expect(promotionsSwitch).toBeChecked();
  });

  it('calls onSave with updated preferences when form is submitted', async () => {
    // Reset initialPreferences for this test to ensure sms/push are part of the submitted object correctly
    const specificInitialPrefs: Partial<NotificationPreferences> = {
        emailNotifications: { promotions: false, killaUpdates: true, tierUpdates: false },
        smsNotificationsEnabled: false,
        pushNotificationsEnabled: false,
    };

    render(
      <NotificationPreferencesForm
        initialPreferences={specificInitialPrefs}
        onSave={mockOnSave}
      />
    );

    const promotionsSwitch = screen.getByRole('switch', { name: /Promotions and Offers Email Notifications/i });
    fireEvent.click(promotionsSwitch); // promotions: true

    const tierUpdatesSwitch = screen.getByRole('switch', { name: /Tier Status Changes Email Notifications/i });
    fireEvent.click(tierUpdatesSwitch); // tierUpdates: true

    // Note: smsEnabled and pushEnabled switches are disabled, so their state won't change via click.
    // Their values in the submission will be their initial values.

    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    fireEvent.submit(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        emailNotifications: {
          promotions: true, // Changed
          killaUpdates: true, // Initial for this test
          tierUpdates: true,  // Changed
        },
        smsNotificationsEnabled: false, // Initial from specificInitialPrefs
        pushNotificationsEnabled: false, // Initial from specificInitialPrefs
      });
    });
  });

  it('shows loading state on Save button when isSaving is true', () => {
    render(
      <NotificationPreferencesForm
        initialPreferences={mockInitialPreferences}
        onSave={mockOnSave}
        isSaving={true}
      />
    );
    const saveButton = screen.getByRole('button', { name: /Save Preferences/i });
    expect(saveButton).toBeDisabled();
    expect(saveButton.querySelector('svg[class*="animate-spin"]')).toBeInTheDocument();

    expect(screen.getByRole('switch', { name: /Promotions and Offers Email Notifications/i })).toBeDisabled();
  });

  it('updates form if initialPreferences prop changes', () => {
    const initialPrefs1: Partial<NotificationPreferences> = { emailNotifications: { promotions: false } };
    const { rerender } = render(
      <NotificationPreferencesForm initialPreferences={initialPrefs1} onSave={mockOnSave} />
    );
    expect(screen.getByRole('switch', { name: /Promotions and Offers Email Notifications/i })).not.toBeChecked();

    const initialPrefs2: Partial<NotificationPreferences> = { emailNotifications: { promotions: true } };
    rerender(
      <NotificationPreferencesForm initialPreferences={initialPrefs2} onSave={mockOnSave} />
    );
    expect(screen.getByRole('switch', { name: /Promotions and Offers Email Notifications/i })).toBeChecked();
  });
});
