// src/components/loyaltyprogram/modals/RedemptionModal.tsx
'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button'; // For the trigger, if used directly
import { Reward } from '@/types/loyalty';
import { ZapIcon, RefreshCwIcon } from 'lucide-react'; // Killa icon, Loading icon

interface RedemptionModalProps {
  reward: Reward | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRedemption: (rewardId: string) => void;
  isRedeeming?: boolean; // To show loading state on confirm button
}

const RedemptionModal: React.FC<RedemptionModalProps> = ({
  reward,
  isOpen,
  onClose,
  onConfirmRedemption,
  isRedeeming = false,
}) => {
  if (!isOpen || !reward) {
    return null;
  }

  const handleConfirm = () => {
    if (reward && !isRedeeming) {
      onConfirmRedemption(reward.id);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Reward Redemption</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to redeem the following reward. This action may not be reversible.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-3 border p-4 rounded-md bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">{reward.name}</h3>
          {reward.description && (
            <p className="text-sm text-gray-600">{reward.description}</p>
          )}
          <div className="flex items-center text-md font-medium text-blue-700">
            <ZapIcon className="h-5 w-5 mr-1.5 text-yellow-500" />
            Cost: {reward.killaRequired.toLocaleString()} KLA
          </div>
          {/* You could add current Killa balance here if available from a context */}
          {/* <p className="text-sm text-gray-500">Your current balance: X KLA</p> */}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isRedeeming}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isRedeeming}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRedeeming ? (
              <>
                <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm Redemption'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RedemptionModal;
