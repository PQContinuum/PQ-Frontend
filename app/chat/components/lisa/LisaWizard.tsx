'use client';

import {
  ChevronLeft,
  ChevronRight,
  Play,
  Loader2,
  Target,
  LayoutGrid,
  PenLine,
  User,
  Palette,
  Settings,
  Languages,
  Eye,
  Check,
} from 'lucide-react';
import { useLisaWizardStore } from '@/hooks/use-lisa-wizard';
import { WIZARD_STEPS } from '@/lib/lisa/types';

// Import step components
import { ContentTypeStep } from './steps/ContentTypeStep';
import { MediaSubtypeStep } from './steps/MediaSubtypeStep';
import { DescriptionStep } from './steps/DescriptionStep';
import { CharacterStep } from './steps/CharacterStep';
import { VisualStyleStep } from './steps/VisualStyleStep';
import { QualityStep } from './steps/QualityStep';
import { LanguageStep } from './steps/LanguageStep';
import { PreviewStep } from './steps/PreviewStep';

// Icon map for step indicators
const stepIconMap = {
  Target,
  LayoutGrid,
  PenLine,
  User,
  Palette,
  Settings,
  Languages,
  Eye,
};

interface LisaWizardProps {
  onGenerate: () => void;
  onClose: () => void;
  isGenerating?: boolean;
}

export function LisaWizard({ onGenerate, onClose, isGenerating }: LisaWizardProps) {
  const currentStep = useLisaWizardStore((s) => s.currentStep);
  const nextStep = useLisaWizardStore((s) => s.nextStep);
  const prevStep = useLisaWizardStore((s) => s.prevStep);
  const goToStep = useLisaWizardStore((s) => s.goToStep);
  const canProceed = useLisaWizardStore((s) => s.canProceed);
  const getProgress = useLisaWizardStore((s) => s.getProgress);

  const progress = getProgress();
  const isLastStep = currentStep === 8;
  const isFirstStep = currentStep === 1;

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ContentTypeStep />;
      case 2:
        return <MediaSubtypeStep />;
      case 3:
        return <DescriptionStep />;
      case 4:
        return <CharacterStep />;
      case 5:
        return <VisualStyleStep />;
      case 6:
        return <QualityStep />;
      case 7:
        return <LanguageStep />;
      case 8:
        return <PreviewStep />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with progress */}
      <div className="px-6 py-4 border-b border-gray-100">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00552b] to-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-500">
            {currentStep}/8
          </span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isClickable = step.id <= currentStep;
            const IconComponent = stepIconMap[step.icon as keyof typeof stepIconMap];

            return (
              <button
                key={step.id}
                onClick={() => isClickable && goToStep(step.id)}
                disabled={!isClickable}
                className={`flex flex-col items-center gap-1 transition-all ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-[#00552b] text-white shadow-lg shadow-[#00552b]/30'
                      : isCompleted
                      ? 'bg-[#00552b]/20 text-[#00552b]'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : IconComponent ? (
                    <IconComponent className="w-4 h-4" />
                  ) : null}
                </div>
                <span
                  className={`text-[10px] font-medium hidden sm:block ${
                    isActive
                      ? 'text-[#00552b]'
                      : isCompleted
                      ? 'text-gray-600'
                      : 'text-gray-400'
                  }`}
                >
                  {step.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {renderStep()}
      </div>

      {/* Footer with navigation */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          {/* Back button */}
          <button
            onClick={isFirstStep ? onClose : prevStep}
            className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
            {isFirstStep ? 'Cancelar' : 'Atrás'}
          </button>

          {/* Next/Generate button */}
          {isLastStep ? (
            <button
              onClick={onGenerate}
              disabled={!canProceed() || isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#00552b] to-emerald-600 text-white rounded-xl font-medium shadow-lg shadow-[#00552b]/25 hover:shadow-xl hover:shadow-[#00552b]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Generar
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-1 px-5 py-2.5 bg-[#00552b] text-white rounded-xl font-medium hover:bg-[#00552b]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
