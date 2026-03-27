/**
 * Mapeo de nombres de modelos internos a nombres de marca Continuum.
 * Se usa para ocultar proveedores externos en la interfaz de usuario.
 */

// Mapeo de identificadores de modelo a nombres Continuum
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'gpt-5.2': 'Continuum Ultra',
  'gpt-5-mini': 'Continuum Lite',
  'gpt-4.1': 'Continuum Core',
  'gpt-4.1-mini': 'Continuum Lite',
  'gpt-4.1-nano': 'Continuum Nano',
  'gpt-4o': 'Continuum Core',
  'gpt-4o-mini': 'Continuum Lite',
  'gpt-image-1': 'Continuum Canvas',
  'gpt-4o-transcribe': 'Continuum Listen',
  'tts-1': 'Continuum Voice',
  'tts-1-hd': 'Continuum Voice HD',
  'o3': 'Continuum Reason',
  'o3-mini': 'Continuum Reason Lite',
  'o4-mini': 'Continuum Reason Lite',
};

// Mapeo de términos en texto visible al usuario (orden importa: específicos primero)
const TEXT_REPLACEMENTS: [RegExp, string][] = [
  // Imagen
  [/GPT[- ]?Image(?:\s*\(?gpt-image-1\)?)?/gi, 'Continuum Canvas'],
  [/OpenAI\s+GPT\s+Image/gi, 'Continuum Canvas'],
  [/gpt-image-1/gi, 'Continuum Canvas'],
  [/DALL[·\-\s]?E\s*\d*/gi, 'Continuum Canvas'],
  // Chat — variantes mini/nano antes que las genéricas
  [/GPT[- ]?5[- ]?Mini/gi, 'Continuum Lite'],
  [/GPT[- ]?4\.1[- ]?Mini/gi, 'Continuum Lite'],
  [/GPT[- ]?4\.1[- ]?Nano/gi, 'Continuum Nano'],
  [/GPT[- ]?4o[- ]?Mini/gi, 'Continuum Lite'],
  [/GPT[- ]?5\.2/gi, 'Continuum Ultra'],
  [/GPT[- ]?5/gi, 'Continuum Ultra'],
  [/GPT[- ]?4\.1/gi, 'Continuum Core'],
  [/GPT[- ]?4o/gi, 'Continuum Core'],
  [/GPT[- ]?4/gi, 'Continuum Core'],
  // Razonamiento
  [/o4[- ]?mini/gi, 'Continuum Reason Lite'],
  [/o3[- ]?mini/gi, 'Continuum Reason Lite'],
  [/o3/gi, 'Continuum Reason'],
  // Voz
  [/OpenAI\s+TTS/gi, 'Continuum Voice'],
  [/tts-1(?:-hd)?/gi, 'Continuum Voice'],
  // Genérico (último)
  [/OpenAI/gi, 'Continuum'],
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
