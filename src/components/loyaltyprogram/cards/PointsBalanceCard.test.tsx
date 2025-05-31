// src/components/loyaltyprogram/cards/PointsBalanceCard.test.tsx
'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import PointsBalanceCard from './PointsBalanceCard';

describe('PointsBalanceCard', () => {
  it('renders current points correctly', () => {
    render(<PointsBalanceCard currentPoints={1250} />);
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByText('Available Points')).toBeInTheDocument();
  });

  it('renders pending points when provided', () => {
    render(<PointsBalanceCard currentPoints={100} pendingPoints={50} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Pending Points')).toBeInTheDocument();
  });

  it('does not render pending points section if pendingPoints is not provided', () => {
    render(<PointsBalanceCard currentPoints={100} />);
    expect(screen.queryByText('Pending Points')).not.toBeInTheDocument();
  });

  it('renders tier name when provided', () => {
    render(<PointsBalanceCard currentPoints={100} tierName="Gold" />);
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Current Tier')).toBeInTheDocument();
  });

  it('does not render tier status section if tierName is not provided', () => {
    render(<PointsBalanceCard currentPoints={100} />);
    expect(screen.queryByText('Current Tier')).not.toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    const { container } = render(<PointsBalanceCard currentPoints={0} isLoading={true} />);
    // Check for presence of shimmer/skeleton elements or specific loading text/ARIA roles
    // For this example, we check the main title within the card, assuming it's different or absent in loading state.
    // A more robust test would use data-testid on skeleton elements.
    expect(screen.getByText('Your Points Balance')).toBeInTheDocument(); // Header title is still there
    // Check for an element that indicates loading, e.g. one of the shimmer divs
    const animatedDivs = container.querySelectorAll('.animate-pulse');
    expect(animatedDivs.length).toBeGreaterThan(0);
  });

  it('renders placeholder text when no optional data is provided', () => {
    render(<PointsBalanceCard currentPoints={100} />);
    // This specific message appears if both pendingPoints and tierName are absent
    expect(screen.getByText('No pending points or tier information available.')).toBeInTheDocument();
  });

  it('does NOT render placeholder text if pending points is provided', () => {
    render(<PointsBalanceCard currentPoints={100} pendingPoints={5} />);
    expect(screen.queryByText('No pending points or tier information available.')).not.toBeInTheDocument();
  });

  it('does NOT render placeholder text if tier name is provided', () => {
    render(<PointsBalanceCard currentPoints={100} tierName="Silver" />);
    expect(screen.queryByText('No pending points or tier information available.')).not.toBeInTheDocument();
  });
});
