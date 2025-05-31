// src/app/[locale]/signage/frontend/components/device/DevicePairingDisplay.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import QRCode from 'qrcode.react'; // Actual QR code library
import { Button } from '@/components/ui/button'; // Assuming shadcn Button
import { Input } from '@/components/ui/input'; // Assuming shadcn Input for display
import { CopyIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PairingCodeInfo {
  code: string;
  expiresAt: string; // ISO string
  qrCodeValue: string;
}

interface DevicePairingDisplayProps {
  onGenerateCode: () => Promise<PairingCodeInfo | null>;
}

const DevicePairingDisplay: React.FC<DevicePairingDisplayProps> = ({ onGenerateCode }) => {
  const [pairingInfo, setPairingInfo] = useState<PairingCodeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  const handleGenerateCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setPairingInfo(null); // Clear previous code
    setCountdown('');
    try {
      const info = await onGenerateCode();
      if (info) {
        setPairingInfo(info);
      } else {
        setError('Failed to retrieve pairing code. Please try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to generate pairing code: ${message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [onGenerateCode]);

  // Auto-generate code on component mount
  useEffect(() => {
    handleGenerateCode();
  }, [handleGenerateCode]);

  useEffect(() => {
    if (pairingInfo?.expiresAt) {
      const intervalId = setInterval(() => {
        const expiryTime = new Date(pairingInfo.expiresAt).getTime();
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        setCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        if (remaining === 0) {
          setError('Pairing code has expired. Please generate a new one.');
          setPairingInfo(null); // Clear expired code
        }
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [pairingInfo]);

  const handleCopyCode = () => {
    if (pairingInfo?.code) {
      navigator.clipboard.writeText(pairingInfo.code)
        .then(() => toast.success("Pairing code copied to clipboard!"))
        .catch(err => toast.error("Failed to copy code."));
    }
  };

  return (
    <div className="space-y-4 p-2">
      {isLoading && !pairingInfo && (
        <div className="text-center py-8">
          <RefreshCwIcon className="mx-auto h-8 w-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Generating pairing code...</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 rounded-md text-sm">
          <p>{error}</p>
        </div>
      )}

      {pairingInfo && !error && (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Enter the following code on your signage device or scan the QR code.
          </p>

          <div className="flex items-center space-x-2 w-full max-w-xs">
            <Input
              readOnly
              value={pairingInfo.code}
              className="text-2xl font-mono tracking-widest text-center h-12 flex-grow dark:bg-gray-800 dark:text-white"
            />
            <Button variant="outline" size="icon" onClick={handleCopyCode} aria-label="Copy code">
              <CopyIcon className="h-5 w-5" />
            </Button>
          </div>

          <div className="bg-white p-2 border rounded-md">
            {/* <QRCode value={pairingInfo.qrCodeValue} size={160} level="M" /> */}
            <div className="w-40 h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              (QR Code Placeholder for: {pairingInfo.qrCodeValue})
            </div>
          </div>

          <div className="text-sm text-gray-700 dark:text-gray-300">
            Code expires in: <span className="font-semibold text-orange-600 dark:text-orange-400">{countdown}</span>
          </div>
        </div>
      )}

      <Button
        onClick={handleGenerateCode}
        disabled={isLoading}
        variant="outline"
        className="w-full"
      >
        <RefreshCwIcon className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Generating...' : 'Regenerate Code'}
      </Button>
      {/* This component uses a GraphQL mutation (e.g., generateDevicePairingCode)
          passed via onGenerateCode prop from a parent page/component.
      */}
    </div>
  );
};

export default DevicePairingDisplay;
