"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileVerificationWizard } from "./ProfileVerificationWizard";

interface ProfileVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  /** If true, user cannot close the modal until verification is complete */
  required?: boolean;
}

export function ProfileVerificationModal({
  open,
  onOpenChange,
  onComplete,
  required = false,
}: ProfileVerificationModalProps) {
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = () => {
    setIsComplete(true);
    onComplete?.();
    onOpenChange(false);
  };

  // Prevent closing if required
  const handleOpenChange = (newOpen: boolean) => {
    if (required && !isComplete && !newOpen) {
      return; // Don't allow closing
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => {
          if (required && !isComplete) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (required && !isComplete) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Completa tu Perfil
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ProfileVerificationWizard onComplete={handleComplete} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
