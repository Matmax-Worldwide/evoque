// src/app/[locale]/signage/frontend/components/device/DevicePairingDisplay.tsx

import React, { useState, useEffect } from 'react';

// Placeholder for a QR code generation library
// import QRCode from 'qrcode.react';

interface PairingCodeInfo {
  code: string;
  expiresAt: string; // ISO string
  qrCodeValue: string;
}

interface DevicePairingDisplayProps {
  // Function to call to generate a new pairing code
  onGenerateCode: () => Promise<PairingCodeInfo | null>;
}

const DevicePairingDisplay: React.FC<DevicePairingDisplayProps> = ({ onGenerateCode }) => {
  const [pairingInfo, setPairingInfo] = useState<PairingCodeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  const handleGenerateCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await onGenerateCode();
      setPairingInfo(info);
    } catch (err) {
      setError('Failed to generate pairing code.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (pairingInfo?.expiresAt) {
      const intervalId = setInterval(() => {
        const expiryTime = new Date(pairingInfo.expiresAt).getTime();
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        setCountdown(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        if (remaining === 0) {
          setPairingInfo(null); // Clear expired code
        }
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [pairingInfo]);

  return (
    <div>
      <h3>Pair New Device</h3>
      {isLoading && <p>Generating code...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {pairingInfo ? (
        <>
          <p>Scan QR code or enter code on your device:</p>
          <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
            {pairingInfo.code}
          </div>
          <div>
            {/* <QRCode value={pairingInfo.qrCodeValue} size={200} /> */}
            <p>(QR Code Placeholder for: {pairingInfo.qrCodeValue})</p>
          </div>
          <p>Expires in: {countdown}</p>
          <button onClick={() => setPairingInfo(null)}>Cancel</button>
        </>
      ) : (
        <button onClick={handleGenerateCode} disabled={isLoading}>
          Generate Pairing Code
        </button>
      )}
      {/*
        This component would use a GraphQL mutation (e.g., generateDevicePairingCode)
        passed via onGenerateCode prop from a parent page/component.
      */}
    </div>
  );
};

export default DevicePairingDisplay;
