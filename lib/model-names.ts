/**
 * Mapeo de nombres de modelos internos a nombres de marca Continuum.
 * Se usa para ocultar proveedores externos en la interfaz de usuario.
 */

// Mapeo de identificadores de modelo a nombres Continuum
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  // Chat — Kimi (Moonshot AI)
  'kimi-k2.6': 'Continuum Ultra',
  // Imagen — fal.ai / Flux
  'fal-ai/flux/dev': 'Continuum Canvas',
  'fal-ai/flux/schnell': 'Continuum Canvas',
  'fal-ai/flux-pro': 'Continuum Canvas',
  // Voz — fal.ai / MiniMax
  'fal-ai/minimax/speech-02-turbo': 'Continuum Voice',
  'fal-ai/minimax/speech-02-hd': 'Continuum Voice HD',
  // Transcripción — fal.ai / Whisper
  'fal-ai/whisper': 'Continuum Listen',
  // Embeddings
  'embed-v4.0': 'Continuum Embed',
  // Compatibilidad: aliases legacy que el backend puede retornar
  'gpt-4.1': 'Continuum Core',
  'gpt-4o': 'Continuum Core',
  'gpt-4o-mini': 'Continuum Lite',
  'o3': 'Continuum Reason',
  'o3-mini': 'Continuum Reason Lite',
  'o4-mini': 'Continuum Reason Lite',
};

// Mapeo de términos en texto visible al usuario (orden importa: específicos primero)
const TEXT_REPLACEMENTS: [RegExp, string][] = [
  // Imagen — nuevos proveedores
  [/fal[.-]ai\/flux(?:\/(?:dev|schnell|pro))?/gi, 'Continuum Canvas'],
  [/flux[- ]?(?:dev|schnell|pro)/gi, 'Continuum Canvas'],
  // Voz — nuevos proveedores
  [/fal[.-]ai\/minimax\/speech[- ]?(?:02[- ]?(?:turbo|hd))?/gi, 'Continuum Voice'],
  [/minimax.*speech/gi, 'Continuum Voice'],
  // Transcripción — nuevos proveedores
  [/fal[.-]ai\/whisper/gi, 'Continuum Listen'],
  // Chat — Kimi
  [/kimi[- ]?k2(?:\.\d+)?/gi, 'Continuum Ultra'],
  [/moonshot[- ]?ai/gi, 'Continuum'],
  // Embeddings
  [/embed[- ]?v4(?:\.\d+)?/gi, 'Continuum Embed'],
  // Imagen — legacy (respuestas del backend pueden aún mencionar estos)
  [/GPT[- ]?Image(?:\s*\(?gpt-image-1\)?)?/gi, 'Continuum Canvas'],
  [/OpenAI\s+GPT\s+Image/gi, 'Continuum Canvas'],
  [/gpt-image-1(?:\.5)?/gi, 'Continuum Canvas'],
  [/DALL[·\-\s]?E\s*\d*/gi, 'Continuum Canvas'],
  // Chat — legacy GPT (variantes específicas antes que genéricas)
  [/GPT[- ]?5[- ]?Mini/gi, 'Continuum Lite'],
  [/GPT[- ]?4\.1[- ]?Mini/gi, 'Continuum Lite'],
  [/GPT[- ]?4\.1[- ]?Nano/gi, 'Continuum Nano'],
  [/GPT[- ]?4o[- ]?Mini/gi, 'Continuum Lite'],
  [/GPT[- ]?5\.2/gi, 'Continuum Ultra'],
  [/GPT[- ]?5/gi, 'Continuum Ultra'],
  [/GPT[- ]?4\.1/gi, 'Continuum Core'],
  [/GPT[- ]?4o/gi, 'Continuum Core'],
  [/GPT[- ]?4/gi, 'Continuum Core'],
  // Razonamiento — legacy
  [/o4[- ]?mini/gi, 'Continuum Reason Lite'],
  [/o3[- ]?mini/gi, 'Continuum Reason Lite'],
  [/o3/gi, 'Continuum Reason'],
  // Voz — legacy
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
