'use client';

import {
  Edit2,
  RotateCcw,
  Copy,
  Check,
  Video,
  Image,
  Palette,
  RectangleHorizontal,
  Monitor,
  Clock,
  Film,
  Mic,
  Subtitles,
  User,
  ArrowRight,
} from 'lucide-react';
import { useState } from 'react';
import { useLisaWizardStore } from '@/hooks/use-lisa-wizard';
import { VISUAL_STYLE_OPTIONS } from '@/lib/lisa/constants';

export function PreviewStep() {
  const [copied, setCopied] = useState(false);

  const contentType = useLisaWizardStore((s) => s.contentType);
  const selectedCharacter = useLisaWizardStore((s) => s.selectedCharacter);
  const visualStyle = useLisaWizardStore((s) => s.visualStyle);
  const quality = useLisaWizardStore((s) => s.quality);
  const language = useLisaWizardStore((s) => s.language);
  const compiledPrompt = useLisaWizardStore((s) => s.compiledPrompt);
  const isEditing = useLisaWizardStore((s) => s.isEditing);
  const setCompiledPrompt = useLisaWizardStore((s) => s.setCompiledPrompt);
  const toggleEditing = useLisaWizardStore((s) => s.toggleEditing);
  const compilePrompt = useLisaWizardStore((s) => s.compilePrompt);

  const isVideo = contentType === 'video';
  const styleOption = VISUAL_STYLE_OPTIONS.find((o) => o.value === visualStyle);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    compilePrompt();
    if (isEditing) toggleEditing();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Vista previa
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Revisa y ajusta tu prompt antes de generar
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1">
            {isVideo ? (
              <Video className="w-5 h-5 text-gray-600" />
            ) : (
              <Image className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <p className="text-xs text-gray-500">Tipo</p>
          <p className="text-sm font-medium text-gray-700 capitalize">{contentType}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1">
            <Palette className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-xs text-gray-500">Estilo</p>
          <p className="text-sm font-medium text-gray-700">{styleOption?.label || '-'}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1">
            <RectangleHorizontal className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-xs text-gray-500">Aspecto</p>
          <p className="text-sm font-medium text-gray-700">{quality.aspectRatio}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="flex justify-center mb-1">
            <Monitor className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-xs text-gray-500">Calidad</p>
          <p className="text-sm font-medium text-gray-700">{quality.resolution}</p>
        </div>
      </div>

      {/* Character info */}
      {selectedCharacter && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">
              Personaje: {selectedCharacter.name}
            </p>
            {selectedCharacter.description && (
              <p className="text-xs text-blue-700 truncate">
                {selectedCharacter.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Video-specific info */}
      {isVideo && (
        <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">{quality.duration}s</span>
          </div>
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">{quality.fps}fps</span>
          </div>
          {language.voiceOver && (
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700">Voz en off</span>
            </div>
          )}
          {language.subtitles && (
            <div className="flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700">Subtítulos</span>
            </div>
          )}
        </div>
      )}

      {/* Compiled prompt */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">
            Prompt generado
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
            <button
              onClick={toggleEditing}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition ${
                isEditing
                  ? 'text-[#00552b] bg-[#00552b]/10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Edit2 className="w-3 h-3" />
              {isEditing ? 'Editando' : 'Editar'}
            </button>
            {isEditing && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:bg-amber-50 rounded transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={compiledPrompt}
            onChange={(e) => setCompiledPrompt(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 rounded-xl border-2 border-[#00552b] bg-[#00552b]/5 focus:outline-none resize-none text-sm text-gray-700 font-mono"
          />
        ) : (
          <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
            {compiledPrompt || 'Prompt vacío'}
          </div>
        )}
      </div>

      {/* Generation hint */}
      <div className="text-center p-4 bg-gradient-to-r from-[#00552b]/5 to-emerald-500/5 rounded-xl border border-[#00552b]/10">
        <p className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <ArrowRight className="w-4 h-4 text-[#00552b]" />
          Al presionar <strong>Generar</strong>, se creará {isVideo ? 'tu video' : 'tu imagen'} con estas especificaciones
        </p>
      </div>
    </div>
  );
}
