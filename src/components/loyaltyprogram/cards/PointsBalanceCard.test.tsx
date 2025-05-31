// src/components/loyaltyprogram/cards/PointsBalanceCard.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import PointsBalanceCard from './PointsBalanceCard';

describe('PointsBalanceCard', () => {
  it('renders current Killa correctly', () => { // Updated
    render(<PointsBalanceCard currentKilla={1250} />);
    expect(screen.getByText('1,250')).toBeInTheDocument();
    // Check for the text node containing KLA, ensuring it's part of the correct element
    const killaValueElement = screen.getByText('1,250');
    const klaUnitElement = killaValueElement.nextElementSibling; // Assuming KLA is in a span next to the value
    expect(klaUnitElement).toHaveTextContent('KLA');
    expect(screen.getByText('Available Killa')).toBeInTheDocument(); // Updated
  });

  it('renders pending Killa when provided', () => { // Updated
    render(<PointsBalanceCard currentKilla={100} pendingKilla={50} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    // Check for KLA with pending Killa
    const pendingKillaValueElement = screen.getByText('50');
    const pendingKlaUnitElement = pendingKillaValueElement.nextElementSibling;
    expect(pendingKlaUnitElement).toHaveTextContent('KLA');
    expect(screen.getByText('Pending Killa')).toBeInTheDocument(); // Updated
  });

  it('does not render pending Killa section if pendingKilla is not provided', () => { // Updated
    render(<PointsBalanceCard currentKilla={100} />);
    expect(screen.queryByText('Pending Killa')).not.toBeInTheDocument(); // Updated
  });

  it('renders tier name when provided', () => {
    render(<PointsBalanceCard currentKilla={100} tierName="Gold" />);
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Current Tier')).toBeInTheDocument();
  });

  it('does not render tier status section if tierName is not provided', () => {
    render(<PointsBalanceCard currentKilla={100} />);
    expect(screen.queryByText('Current Tier')).not.toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    render(<PointsBalanceCard currentKilla={0} isLoading={true} />);
    expect(screen.getByText('Your Killa Wallet')).toBeInTheDocument(); // Updated
    const animatedDivs = document.querySelectorAll('.animate-pulse');
    expect(animatedDivs.length).toBeGreaterThan(0);
  });

  it('renders placeholder text when no optional data is provided', () => {
    render(<PointsBalanceCard currentKilla={100} />);
    expect(screen.getByText('No pending Killa or tier information available.')).toBeInTheDocument(); // Updated
  });

  it('does NOT render placeholder text if pending Killa is provided', () => { // Updated
    render(<PointsBalanceCard currentKilla={100} pendingKilla={5} />);
    expect(screen.queryByText('No pending Killa or tier information available.')).not.toBeInTheDocument(); // Updated
  });

  it('does NOT render placeholder text if tier name is provided', () => {
    render(<PointsBalanceCard currentKilla={100} tierName="Silver" />);
    expect(screen.queryByText('No pending Killa or tier information available.')).not.toBeInTheDocument(); // Updated
  });
});
