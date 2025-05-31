// src/components/loyaltyprogram/settings/WalletConnector.tsx
'use client';

import React from 'react';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Optional structure
import { WalletIcon, LogOutIcon, Loader2Icon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';

const WalletConnector: React.FC = () => {
  const {
    walletStatus,
    connectedWalletAddress,
    walletError,
    connectWallet,
    disconnectWallet,
    clearWalletError,
  } = useLoyaltyContext();

  const truncateAddress = (address: string | null): string => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center">
            <WalletIcon className="h-6 w-6 mr-3 text-blue-600" />
            <div>
                <CardTitle>Wallet Connection</CardTitle>
                <CardDescription>Connect your Web3 wallet to manage Killa tokens and NFTs.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {walletStatus === 'connected' && connectedWalletAddress && (
          <div className="p-4 border rounded-lg bg-green-50">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-green-700">Wallet Connected</p>
                    <p className="text-lg font-semibold text-green-800" title={connectedWalletAddress}>
                        {truncateAddress(connectedWalletAddress)}
                    </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <Button onClick={disconnectWallet} variant="outline" size="sm" className="mt-4 w-full sm:w-auto">
              <LogOutIcon className="mr-2 h-4 w-4" /> Disconnect
            </Button>
          </div>
        )}

        {(walletStatus === 'idle' || walletStatus === 'disconnected' || walletStatus === 'error') && (
          <div>
            {walletStatus === 'disconnected' && (
                <p className="text-sm text-gray-600 mb-3 p-3 bg-gray-100 rounded-md border">You have successfully disconnected your wallet.</p>
            )}
            <Button
              onClick={connectWallet}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              // Disable connect button if an error is present and not yet cleared
              disabled={walletStatus === 'error' && !!walletError}
            >
              <WalletIcon className="mr-2 h-4 w-4" /> Connect Wallet
            </Button>
          </div>
        )}

        {walletStatus === 'connecting' && (
          <Button disabled className="w-full sm:w-auto">
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </Button>
        )}

        {walletStatus === 'error' && walletError && (
          <div className="mt-3 space-y-2">
            <div className="flex items-start text-sm text-red-600 p-3 bg-red-50 rounded-md border border-red-200">
              <AlertTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Connection Failed:</p>
                <p>{walletError}</p>
              </div>
            </div>
            <div className="flex space-x-2">
                <Button onClick={() => { clearWalletError(); connectWallet();}} variant="outline" size="sm">
                Try Again
                </Button>
                <Button onClick={clearWalletError} variant="link" size="sm" className="text-xs text-gray-600">
                Dismiss
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletConnector;
