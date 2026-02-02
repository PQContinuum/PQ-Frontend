'use client';

import { useCallback, useEffect } from 'react';
import { X, Wand2 } from 'lucide-react';
import { useLisaWizardStore } from '@/hooks/use-lisa-wizard';
import { LisaWizard } from './LisaWizard';
import { extractSceneDescription, validateWizardState } from '@/lib/lisa/prompt-builder';

interface LisaWizardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: {
    prompt: string;
    contentType: 'video' | 'image';
    aspectRatio: '16:9' | '9:16' | '1:1';
    duration?: '5' | '10';
    visualStyle?: string;
  }) => void;
  isGenerating?: boolean;
}

export function LisaWizardDialog({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: LisaWizardDialogProps) {
  const reset = useLisaWizardStore((s) => s.reset);
  const state = useLisaWizardStore();

  // Reset wizard when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay to allow close animation
      const timer = setTimeout(reset, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, reset]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleGenerate = useCallback(() => {
    // Validate state
    const validation = validateWizardState(state);
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return;
    }

    // Extract the scene description for generation
    const prompt = extractSceneDescription(state);

    onGenerate({
      prompt,
      contentType: state.contentType!,
      aspectRatio: state.quality.aspectRatio,
      duration: state.quality.duration,
      visualStyle: state.visualStyle || undefined,
    });
  }, [state, onGenerate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#00552b]/5 to-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00552b] to-emerald-600 flex items-center justify-center shadow-lg shadow-[#00552b]/25">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                LISA - Editor Guiado
              </h2>
              <p className="text-xs text-gray-500">
                Crea contenido paso a paso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Wizard content */}
        <div className="h-[calc(90vh-80px)]">
          <LisaWizard
            onGenerate={handleGenerate}
            onClose={onClose}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
}
