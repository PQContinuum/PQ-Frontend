'use client';

import {
  Camera,
  Clapperboard,
  Zap,
  Box,
  Smile,
  Droplets,
  Brush,
  Pencil,
  Grid3x3,
  Minus,
  Check,
  Palette,
} from 'lucide-react';
import { useLisaWizardStore } from '@/hooks/use-lisa-wizard';
import { VISUAL_STYLE_OPTIONS } from '@/lib/lisa/constants';
import type { VisualStyle } from '@/lib/lisa/types';

const iconMap = {
  Camera,
  Clapperboard,
  Zap,
  Box,
  Smile,
  Droplets,
  Brush,
  Pencil,
  Grid3x3,
  Minus,
};

export function VisualStyleStep() {
  const visualStyle = useLisaWizardStore((s) => s.visualStyle);
  const setVisualStyle = useLisaWizardStore((s) => s.setVisualStyle);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Estilo visual
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Define la estética de tu creación
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {VISUAL_STYLE_OPTIONS.map((option) => {
          const isSelected = visualStyle === option.value;
          const IconComponent = iconMap[option.icon as keyof typeof iconMap];

          return (
            <button
              key={option.value}
              onClick={() => setVisualStyle(option.value as VisualStyle)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? `border-[#934f2c] ${option.bgColor} shadow-md`
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-[#934f2c] rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}

              {/* Icon */}
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/50' : 'bg-gray-100'}`}>
                {IconComponent && (
                  <IconComponent className={`w-6 h-6 ${isSelected ? option.color : 'text-gray-600'}`} />
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <h3 className={`text-sm font-semibold ${
                  isSelected ? option.color : 'text-gray-900'
                }`}>
                  {option.label}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected style preview */}
      {visualStyle && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Palette className="w-4 h-4" />
            Estilo seleccionado
          </h4>
          <p className="text-sm text-gray-600">
            {VISUAL_STYLE_OPTIONS.find((o) => o.value === visualStyle)?.promptSuffix}
          </p>
        </div>
      )}
    </div>
  );
}
