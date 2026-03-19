'use client';

import { Mic, Subtitles, Image as ImageIcon } from 'lucide-react';
import { useLisaWizardStore } from '@/hooks/use-lisa-wizard';
import { LANGUAGE_OPTIONS, VOICE_STYLE_OPTIONS } from '@/lib/lisa/constants';

export function LanguageStep() {
  const contentType = useLisaWizardStore((s) => s.contentType);
  const language = useLisaWizardStore((s) => s.language);
  const setLanguage = useLisaWizardStore((s) => s.setLanguage);

  const isVideo = contentType === 'video';

  // Skip this step for images
  if (!isVideo) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Idioma y audio
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Las opciones de audio solo aplican para videos
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">
            Has seleccionado generar una imagen, por lo que no aplican opciones de audio.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Puedes continuar al siguiente paso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Idioma y audio
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configura voz en off y subtítulos
        </p>
      </div>

      {/* Language selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Idioma principal
        </h3>
        <div className="flex gap-3">
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = language.language === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setLanguage({ language: option.value })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-[#FF8B3D] bg-[#FF8B3D]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                  isSelected ? 'bg-[#FF8B3D] text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {option.code}
                </span>
                <span className={`font-medium ${
                  isSelected ? 'text-[#FF8B3D]' : 'text-gray-700'
                }`}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice over toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg">
            <Mic className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Voz en off</h3>
            <p className="text-sm text-gray-500">
              Genera narración automática para tu video
            </p>
          </div>
        </div>
        <button
          onClick={() => setLanguage({ voiceOver: !language.voiceOver })}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            language.voiceOver ? 'bg-[#FF8B3D]' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
              language.voiceOver ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Voice style (only if voice over is enabled) */}
      {language.voiceOver && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Estilo de voz
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {VOICE_STYLE_OPTIONS.map((option) => {
              const isSelected = language.voiceStyle === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setLanguage({ voiceStyle: option.value })}
                  className={`px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-[#FF8B3D] bg-[#FF8B3D]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
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
      )}

      {/* Subtitles toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg">
            <Subtitles className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Subtítulos</h3>
            <p className="text-sm text-gray-500">
              Añade subtítulos al video
            </p>
          </div>
        </div>
        <button
          onClick={() => setLanguage({ subtitles: !language.subtitles })}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            language.subtitles ? 'bg-[#FF8B3D]' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
              language.subtitles ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
