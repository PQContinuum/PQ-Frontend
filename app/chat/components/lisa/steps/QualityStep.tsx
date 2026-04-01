'use client';

import { useEffect } from 'react';
import { Lock, RectangleHorizontal, RectangleVertical, Square } from 'lucide-react';
import { useLisaWizardStore } from '@/hooks/use-lisa-wizard';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { useUserPlan } from '@/hooks/use-user-plan';
import {
  RESOLUTION_OPTIONS,
  FPS_OPTIONS,
  DURATION_OPTIONS,
  ASPECT_RATIO_OPTIONS,
} from '@/lib/lisa/constants';

const aspectIconMap = {
  RectangleHorizontal,
  RectangleVertical,
  Square,
};

const PREMIUM_PLANS = ['Pro', 'Premium', 'Enterprise'];

export function QualityStep() {
  const contentType = useLisaWizardStore((s) => s.contentType);
  const quality = useLisaWizardStore((s) => s.quality);
  const setQuality = useLisaWizardStore((s) => s.setQuality);
  const { data: userPlan } = useUserPlan();
  const { usage: videoUsage, fetchUsage } = useVideoGeneration();

  const hasPremiumAccess = PREMIUM_PLANS.includes(userPlan?.planName ?? '');
  const isVideo = contentType === 'video';

  // Fetch fresh usage data from backend when step mounts
  useEffect(() => {
    if (isVideo) fetchUsage();
  }, [isVideo, fetchUsage]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Configuración de calidad
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Ajusta la resolución y formato
        </p>
      </div>

      {/* Aspect Ratio */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Proporción de aspecto
        </h3>
        <div className="flex gap-2">
          {ASPECT_RATIO_OPTIONS.map((option) => {
            const isSelected = quality.aspectRatio === option.value;
            const IconComponent = aspectIconMap[option.icon as keyof typeof aspectIconMap];

            return (
              <button
                key={option.value}
                onClick={() => setQuality({ aspectRatio: option.value })}
                className={`flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-[#FF8B3D] bg-[#FF8B3D]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {IconComponent && (
                  <IconComponent className={`w-5 h-5 ${isSelected ? 'text-[#FF8B3D]' : 'text-gray-500'}`} />
                )}
                <span className={`text-sm font-medium ${
                  isSelected ? 'text-[#FF8B3D]' : 'text-gray-700'
                }`}>
                  {option.label}
                </span>
                <span className="text-xs text-gray-500">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resolution */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Resolución
        </h3>
        <div className="flex gap-2">
          {RESOLUTION_OPTIONS.map((option) => {
            const isSelected = quality.resolution === option.value;
            const isLocked = option.premium && !hasPremiumAccess;
            return (
              <button
                key={option.value}
                onClick={() => !isLocked && setQuality({ resolution: option.value })}
                disabled={isLocked}
                className={`flex-1 relative px-4 py-3 rounded-xl border-2 transition-all ${
                  isLocked
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : isSelected
                    ? 'border-[#FF8B3D] bg-[#FF8B3D]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {isLocked && (
                  <Lock className="absolute top-2 right-2 w-3 h-3 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${
                  isSelected ? 'text-[#FF8B3D]' : 'text-gray-700'
                }`}>
                  {option.label}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video-specific options */}
      {isVideo && (
        <>
          {/* FPS */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Cuadros por segundo (FPS)
            </h3>
            <div className="flex gap-2">
              {FPS_OPTIONS.map((option) => {
                const isSelected = quality.fps === option.value;
                const isLocked = option.premium && !hasPremiumAccess;
                return (
                  <button
                    key={option.value}
                    onClick={() => !isLocked && setQuality({ fps: option.value })}
                    disabled={isLocked}
                    className={`flex-1 relative px-4 py-3 rounded-xl border-2 transition-all ${
                      isLocked
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'border-[#FF8B3D] bg-[#FF8B3D]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isLocked && (
                      <Lock className="absolute top-2 right-2 w-3 h-3 text-gray-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-[#FF8B3D]' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration — uses backend allowedDurations as source of truth */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Duración
            </h3>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((option) => {
                const isSelected = quality.duration === option.value;
                // Use backend data if available, fallback to premium flag
                const isLocked = videoUsage
                  ? !videoUsage.allowedDurations.includes(option.value)
                  : (option.premium && !hasPremiumAccess);
                return (
                  <button
                    key={option.value}
                    onClick={() => !isLocked && setQuality({ duration: option.value })}
                    disabled={isLocked}
                    className={`flex-1 relative px-4 py-3 rounded-xl border-2 transition-all ${
                      isLocked
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'border-[#FF8B3D] bg-[#FF8B3D]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {isLocked && (
                      <Lock className="absolute top-2 right-2 w-3 h-3 text-gray-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-[#FF8B3D]' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Premium hint — only show for users without premium access */}
      {!hasPremiumAccess && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Lock className="w-3 h-3" />
          Opciones premium disponibles con plan Pro o superior
        </p>
      )}
    </div>
  );
}
