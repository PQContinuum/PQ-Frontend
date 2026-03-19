'use client';

import { Video, Image, Check } from 'lucide-react';
import { useLisaWizardStore } from '@/hooks/use-lisa-wizard';
import { CONTENT_TYPE_OPTIONS } from '@/lib/lisa/constants';
import type { ContentType } from '@/lib/lisa/types';

const iconMap = {
  Video: Video,
  Image: Image,
};

export function ContentTypeStep() {
  const contentType = useLisaWizardStore((s) => s.contentType);
  const setContentType = useLisaWizardStore((s) => s.setContentType);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          ¿Qué quieres crear?
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Elige el tipo de contenido que deseas generar
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CONTENT_TYPE_OPTIONS.map((option) => {
          const isSelected = contentType === option.value;
          const IconComponent = iconMap[option.icon as keyof typeof iconMap];

          return (
            <button
              key={option.value}
              onClick={() => setContentType(option.value as ContentType)}
              className={`relative flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-[#934f2c] bg-[#934f2c]/5 shadow-lg shadow-[#934f2c]/10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-[#934f2c] rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Icon */}
              <div className={`p-4 rounded-2xl ${isSelected ? 'bg-[#934f2c]/10' : 'bg-gray-100'}`}>
                {IconComponent && (
                  <IconComponent className={`w-10 h-10 ${isSelected ? 'text-[#934f2c]' : 'text-gray-600'}`} />
                )}
              </div>

              {/* Label */}
              <div className="text-center">
                <h3 className={`text-lg font-semibold ${
                  isSelected ? 'text-[#934f2c]' : 'text-gray-900'
                }`}>
                  {option.label}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
