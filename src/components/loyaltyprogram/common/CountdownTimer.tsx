// src/components/loyaltyprogram/common/CountdownTimer.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: string | Date;
  onComplete?: () => void;
  expiredText?: string; // Text to show when expired
  ExpiredComponent?: React.ReactNode; // Component to show when expired
  className?: string;
  digitClassName?: string; // Class for individual digit groups
  labelClassName?: string; // Class for labels (Days, Hours, etc.)
}

const calculateTimeLeft = (target: Date): TimeLeft | null => {
  const difference = +target - +new Date();
  if (difference <= 0) {
    return null; // Countdown finished
  }
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  onComplete,
  expiredText = "Expired",
  ExpiredComponent,
  className = "text-center",
  digitClassName = "text-xl sm:text-2xl font-semibold text-gray-800",
  labelClassName = "text-xs sm:text-sm text-gray-500 uppercase tracking-wider",
}) => {
  const targetTime = useMemo(() => new Date(targetDate), [targetDate]);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(calculateTimeLeft(targetTime));
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = useCallback(() => {
    setIsCompleted(true);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    // Initial check in case targetDate is already in the past
    const initialTimeLeft = calculateTimeLeft(targetTime);
    if (!initialTimeLeft) {
      handleComplete();
      setTimeLeft(null); // Ensure timeLeft is null if completed on mount
      return;
    }
    setTimeLeft(initialTimeLeft);
    setIsCompleted(false); // Reset completion state if targetDate changes to future

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetTime);
      if (newTimeLeft) {
        setTimeLeft(newTimeLeft);
      } else {
        clearInterval(timer);
        handleComplete();
        setTimeLeft(null); // Ensure timeLeft is null after completion
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, handleComplete]);


  if (isCompleted || timeLeft === null) {
    return ExpiredComponent ? <>{ExpiredComponent}</> : <span className={`text-red-500 font-semibold ${className}`}>{expiredText}</span>;
  }

  const timeParts = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  const shouldShowDays = timeLeft.days > 0;
  const shouldShowHours = shouldShowDays || timeLeft.hours > 0;
  // Minutes and Seconds are always shown if not completed

  return (
    <div className={`flex justify-center space-x-2 sm:space-x-4 ${className}`}>
      {shouldShowDays && (
        <div key="Days" className="flex flex-col items-center p-2 bg-gray-100/50 rounded-md shadow-sm">
          <span className={digitClassName}>
            {timeLeft.days.toString().padStart(2, '0')}
          </span>
          <span className={labelClassName}>Days</span>
        </div>
      )}
      {shouldShowHours && (
         <div key="Hours" className="flex flex-col items-center p-2 bg-gray-100/50 rounded-md shadow-sm">
            <span className={digitClassName}>
            {timeLeft.hours.toString().padStart(2, '0')}
            </span>
            <span className={labelClassName}>Hours</span>
        </div>
      )}
      {/* Always show minutes and seconds if not completed */}
      <div key="Minutes" className="flex flex-col items-center p-2 bg-gray-100/50 rounded-md shadow-sm">
        <span className={digitClassName}>
          {timeLeft.minutes.toString().padStart(2, '0')}
        </span>
        <span className={labelClassName}>Minutes</span>
      </div>
      <div key="Seconds" className="flex flex-col items-center p-2 bg-gray-100/50 rounded-md shadow-sm">
        <span className={digitClassName}>
          {timeLeft.seconds.toString().padStart(2, '0')}
        </span>
        <span className={labelClassName}>Seconds</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
