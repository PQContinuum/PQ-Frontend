'use client';

import { Lightbulb, Check } from 'lucide-react';
import { useLisaWizardStore } from '@/hooks/use-lisa-wizard';

export function DescriptionStep() {
  const contentType = useLisaWizardStore((s) => s.contentType);
  const description = useLisaWizardStore((s) => s.description);
  const setDescription = useLisaWizardStore((s) => s.setDescription);

  const isVideo = contentType === 'video';
  const placeholder = isVideo
    ? 'Describe la escena de tu video: qué sucede, qué elementos aparecen, qué acción ocurre...\n\nEjemplo: "Un dron volando sobre montañas nevadas al atardecer, con nubes doradas reflejando la luz del sol"'
    : 'Describe lo que quieres ver en tu imagen: sujeto, ambiente, composición...\n\nEjemplo: "Retrato de una mujer joven en un jardín japonés durante la primavera, pétalos de cerezo cayendo"';

  const charCount = description.length;
  const minChars = 10;
  const isValid = charCount >= minChars;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Describe tu {isVideo ? 'escena' : 'imagen'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Sé lo más detallado posible para mejores resultados
        </p>
      </div>

      <div className="space-y-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={placeholder}
          rows={6}
          className={`w-full px-4 py-3 rounded-xl border-2 resize-none transition-colors ${
            description && !isValid
              ? 'border-amber-300 focus:border-amber-500'
              : 'border-gray-200 focus:border-[#934f2c]'
          } focus:outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400`}
        />

        <div className="flex items-center justify-between text-sm">
          <span className={`flex items-center gap-1 ${charCount < minChars ? 'text-amber-600' : 'text-[#934f2c]'}`}>
            {charCount >= minChars ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Descripción válida
              </>
            ) : (
              `Mínimo ${minChars - charCount} caracteres más`
            )}
          </span>
          <span className="text-gray-400">
            {charCount} caracteres
          </span>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Tips para mejores resultados
        </h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            Describe colores, iluminación y atmósfera
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            Menciona el ángulo de cámara (primer plano, vista aérea, etc.)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gray-400">•</span>
            Incluye detalles del ambiente y contexto
          </li>
          {isVideo && (
            <li className="flex items-start gap-2">
              <span className="text-gray-400">•</span>
              Describe el movimiento o acción que sucede
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
