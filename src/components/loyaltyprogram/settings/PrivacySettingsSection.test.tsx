// src/components/loyaltyprogram/settings/PrivacySettingsSection.test.tsx
'use client';

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrivacySettingsSection, { type PrivacySettingsData } from './PrivacySettingsSection';

const mockInitialSettings: PrivacySettingsData = {
  shareActivityWithPartners: true,
  personalizedOffersBasedOnActivity: false,
};

describe('PrivacySettingsSection', () => {
  const mockOnSave = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    mockOnSave.mockClear();
  });

  it('renders form with initial settings correctly', () => {
    render(
      <PrivacySettingsSection
        initialSettings={mockInitialSettings}
        onSave={mockOnSave}
      />
    );

    // Use the aria-label on the switch for querying
    expect(screen.getByRole('switch', {name: /Share Killa Activity with Partners/i})).toBeChecked();
    expect(screen.getByRole('switch', {name: /Personalized Offers Based on Activity/i})).not.toBeChecked();
  });

  it('updates internal state when switches are toggled', () => {
    render(
      <PrivacySettingsSection
        initialSettings={{ shareActivityWithPartners: false, personalizedOffersBasedOnActivity: false }}
        onSave={mockOnSave}
      />
    );
    const shareSwitch = screen.getByRole('switch', {name: /Share Killa Activity with Partners/i});
    fireEvent.click(shareSwitch);
    expect(shareSwitch).toBeChecked();
  });

  it('calls onSave with updated settings when form is submitted', async () => {
    render(
      <PrivacySettingsSection
        initialSettings={{ shareActivityWithPartners: false, personalizedOffersBasedOnActivity: true }}
        onSave={mockOnSave}
      />
    );

    const shareSwitch = screen.getByRole('switch', {name: /Share Killa Activity with Partners/i});
    fireEvent.click(shareSwitch); // shareActivity: true

    const personalizedSwitch = screen.getByRole('switch', {name: /Personalized Offers Based on Activity/i});
    fireEvent.click(personalizedSwitch); // personalizedOffers: false (toggled from true)

    const saveButton = screen.getByRole('button', { name: /Save Privacy Settings/i });
    fireEvent.submit(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        shareActivityWithPartners: true,
        personalizedOffersBasedOnActivity: false,
      });
    });
  });

  it('shows loading state on Save button and disables switches when isSaving is true', () => {
    render(
      <PrivacySettingsSection
        initialSettings={mockInitialSettings}
        onSave={mockOnSave}
        isSaving={true}
      />
    );
    const saveButton = screen.getByRole('button', { name: /Save Privacy Settings/i });
    expect(saveButton).toBeDisabled();
    expect(saveButton.querySelector('svg[class*="animate-spin"]')).toBeInTheDocument();

    expect(screen.getByRole('switch', {name: /Share Killa Activity with Partners/i})).toBeDisabled();
    expect(screen.getByRole('switch', {name: /Personalized Offers Based on Activity/i})).toBeDisabled();
  });

  it('updates form if initialSettings prop changes', () => {
    const { rerender } = render(
      <PrivacySettingsSection initialSettings={{ shareActivityWithPartners: false, personalizedOffersBasedOnActivity: false }} onSave={mockOnSave} />
    );
    expect(screen.getByRole('switch', {name: /Share Killa Activity with Partners/i})).not.toBeChecked();

    rerender(
      <PrivacySettingsSection initialSettings={{ shareActivityWithPartners: true, personalizedOffersBasedOnActivity: false }} onSave={mockOnSave} />
    );
    expect(screen.getByRole('switch', {name: /Share Killa Activity with Partners/i})).toBeChecked();
  });
});
