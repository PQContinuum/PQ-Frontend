'use client';

import {
  Smartphone,
  Clapperboard,
  Tv,
  GraduationCap,
  Share2,
  UserCircle,
  Mountain,
  Package,
  Palette,
  Check,
} from 'lucide-react';
import { useLisaWizardStore } from '@/hooks/use-lisa-wizard';
import {
  VIDEO_SUBTYPE_OPTIONS,
  IMAGE_SUBTYPE_OPTIONS,
} from '@/lib/lisa/constants';
import type { MediaSubtype } from '@/lib/lisa/types';

const iconMap = {
  Smartphone,
  Clapperboard,
  Tv,
  GraduationCap,
  Share2,
  UserCircle,
  Mountain,
  Package,
  Palette,
};

export function MediaSubtypeStep() {
  const contentType = useLisaWizardStore((s) => s.contentType);
  const mediaSubtype = useLisaWizardStore((s) => s.mediaSubtype);
  const setMediaSubtype = useLisaWizardStore((s) => s.setMediaSubtype);

  const options = contentType === 'video' ? VIDEO_SUBTYPE_OPTIONS : IMAGE_SUBTYPE_OPTIONS;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Elige el formato
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona el tipo de {contentType === 'video' ? 'video' : 'imagen'} que deseas crear
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => {
          const isSelected = mediaSubtype === option.value;
          const IconComponent = iconMap[option.icon as keyof typeof iconMap];

          return (
            <button
              key={option.value}
              onClick={() => setMediaSubtype(option.value as MediaSubtype)}
              className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-[#934f2c] bg-[#934f2c]/5'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-4 h-4 bg-[#934f2c] rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}

              {/* Icon */}
              <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-[#934f2c]/10' : 'bg-gray-100'}`}>
                {IconComponent && (
                  <IconComponent className={`w-6 h-6 ${isSelected ? 'text-[#934f2c]' : 'text-gray-600'}`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold ${
                  isSelected ? 'text-[#934f2c]' : 'text-gray-900'
                }`}>
                  {option.label}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {option.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {option.aspectRatio}
                  </span>
                  {option.duration && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {option.duration}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
