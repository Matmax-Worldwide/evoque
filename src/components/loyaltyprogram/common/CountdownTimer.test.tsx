// src/components/loyaltyprogram/common/CountdownTimer.test.tsx
'use client';

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import CountdownTimer from './CountdownTimer';

// Helper to advance Jest timers
const advanceTimersByTime = (time: number) => {
  act(() => {
    jest.advanceTimersByTime(time);
  });
};

describe('CountdownTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
        jest.runOnlyPendingTimers(); // Clear any remaining timers
    });
    jest.useRealTimers();
  });

  it('renders correctly and displays time left', () => {
    const futureDate = new Date(Date.now() + 1000 * (2 * 24 * 3600 + 3 * 3600 + 45 * 60 + 10)); // 2d 3h 45m 10s
    render(<CountdownTimer targetDate={futureDate.toISOString()} />);

    expect(screen.getByText('02')).toBeInTheDocument(); // Days
    expect(screen.getByText('Days')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument(); // Hours
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument(); // Minutes
    expect(screen.getByText('Minutes')).toBeInTheDocument();
    // Seconds might be tricky due to initial calculation and first tick. Test presence.
    // The initial calculation might show 10, then quickly tick to 09.
    // We test for a value that should be present after the initial setup.
    expect(screen.getByText('Seconds')).toBeInTheDocument();
    expect(screen.getByText( (content, element) => element?.textContent === '10' || element?.textContent === '09')).toBeInTheDocument();

  });

  it('updates time every second', () => {
    const futureDate = new Date(Date.now() + 5000); // 5 seconds from now
    render(<CountdownTimer targetDate={futureDate.toISOString()} />);

    // Initial value could be 05 or 04 depending on precise timing of test runner vs component mount
    expect(screen.getByText((content) => content === '05' || content === '04')).toBeInTheDocument();
    advanceTimersByTime(1000); // Advance 1 second
    expect(screen.getByText((content) => content === '04' || content === '03')).toBeInTheDocument();
    advanceTimersByTime(1000); // Advance 1 more second
    expect(screen.getByText((content) => content === '03' || content === '02')).toBeInTheDocument();
  });

  it('calls onComplete and displays expiredText when countdown finishes', async () => {
    const mockOnComplete = jest.fn();
    const futureDate = new Date(Date.now() + 2000); // 2 seconds from now
    render(
      <CountdownTimer
        targetDate={futureDate.toISOString()}
        onComplete={mockOnComplete}
        expiredText="Campaign Ended!"
      />
    );

    expect(screen.queryByText('Campaign Ended!')).not.toBeInTheDocument();

    // Fast-forward time until 1ms before it should complete
    act(() => { jest.advanceTimersByTime(1999); });
    expect(screen.queryByText('Campaign Ended!')).not.toBeInTheDocument();
    expect(mockOnComplete).not.toHaveBeenCalled();

    // Fast-forward time past completion
    act(() => { jest.advanceTimersByTime(10); }); // Advance 10ms more to ensure completion

    await waitFor(() => {
      expect(screen.getByText('Campaign Ended!')).toBeInTheDocument();
    });
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it('displays ExpiredComponent when provided and countdown finishes', async () => {
    const futureDate = new Date(Date.now() + 1000);
    const CustomExpired = () => <div data-testid="custom-expired">It's Over!</div>;
    render(
      <CountdownTimer
        targetDate={futureDate.toISOString()}
        ExpiredComponent={<CustomExpired />}
      />
    );
    act(() => { jest.advanceTimersByTime(1005); });
    await waitFor(() => {
        expect(screen.getByTestId('custom-expired')).toBeInTheDocument();
    });
    expect(screen.getByText("It's Over!")).toBeInTheDocument();
  });

  it('clears interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const futureDate = new Date(Date.now() + 10000);
    const { unmount } = render(<CountdownTimer targetDate={futureDate.toISOString()} />);

    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('handles targetDate already in the past on mount', () => {
    const pastDate = new Date(Date.now() - 100000).toISOString();
    const mockOnComplete = jest.fn();
    render(<CountdownTimer targetDate={pastDate} onComplete={mockOnComplete} expiredText="Already Over" />);
    expect(screen.getByText('Already Over')).toBeInTheDocument();
    expect(mockOnComplete).toHaveBeenCalledTimes(1); // Should call onComplete immediately
  });

  it('hides leading zero units correctly', () => {
    // Less than a day, only Hours, Mins, Secs
    let futureDate = new Date(Date.now() + 3 * 3600 * 1000 + 30 * 60 * 1000 + 5 * 1000); // 3h 30m 5s
    const { rerender } = render(<CountdownTimer targetDate={futureDate.toISOString()} />);
    expect(screen.queryByText('Days')).not.toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Minutes')).toBeInTheDocument();
    expect(screen.getByText('Seconds')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument(); // Hours
    expect(screen.getByText('30')).toBeInTheDocument(); // Minutes

    // Less than an hour, only Mins, Secs
    futureDate = new Date(Date.now() + 30 * 60 * 1000 + 5 * 1000); // 30m 5s
    rerender(<CountdownTimer targetDate={futureDate.toISOString()} />);
    expect(screen.queryByText('Days')).not.toBeInTheDocument();
    expect(screen.queryByText('Hours')).not.toBeInTheDocument();
    expect(screen.getByText('Minutes')).toBeInTheDocument();
    expect(screen.getByText('Seconds')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument(); // Minutes
  });

  it('shows all units if time is greater than a day', () => {
    const futureDate = new Date(Date.now() + 1 * 24 * 3600 * 1000 + 2 * 3600 * 1000); // 1 day 2 hours
    render(<CountdownTimer targetDate={futureDate.toISOString()} />);
    expect(screen.getByText('Days')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Minutes')).toBeInTheDocument();
    expect(screen.getByText('Seconds')).toBeInTheDocument();
  });
});
