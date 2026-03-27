/**
 * Mapeo de nombres de modelos internos a nombres de marca Continuum.
 * Se usa para ocultar proveedores externos en la interfaz de usuario.
 */

// Mapeo de identificadores de modelo a nombres Continuum
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'gpt-5.2': 'Continuum Ultra',
  'gpt-4.1': 'Continuum Core',
  'gpt-4o': 'Continuum Core',
  'gpt-image-1': 'Continuum Canvas',
  'gpt-4o-transcribe': 'Continuum Listen',
  'tts-1': 'Continuum Voice',
  'tts-1-hd': 'Continuum Voice HD',
};

// Mapeo de términos en texto visible al usuario (orden importa: específicos primero)
const TEXT_REPLACEMENTS: [RegExp, string][] = [
  [/GPT[- ]?Image(?:\s*\(?gpt-image-1\)?)?/gi, 'Continuum Canvas'],
  [/GPT[- ]?5\.2/gi, 'Continuum Ultra'],
  [/GPT[- ]?4\.1/gi, 'Continuum Core'],
  [/GPT[- ]?4o/gi, 'Continuum Core'],
  [/OpenAI\s+TTS/gi, 'Continuum Voice'],
  [/OpenAI\s+GPT\s+Image/gi, 'Continuum Canvas'],
  [/gpt-image-1/gi, 'Continuum Canvas'],
  [/gpt-5\.2/gi, 'Continuum Ultra'],
  [/gpt-4\.1/gi, 'Continuum Core'],
  [/tts-1(?:-hd)?/gi, 'Continuum Voice'],
];

/**
 * Reemplaza nombres de modelos externos con nombres Continuum en texto visible al usuario.
 */
export function mapModelName(text: string): string {
  let result = text;
  for (const [pattern, replacement] of TEXT_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Obtiene el nombre Continuum para un identificador de modelo.
 */
export function getModelDisplayName(modelId: string): string {
  return MODEL_DISPLAY_NAMES[modelId] ?? modelId;
}
