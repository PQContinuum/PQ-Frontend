/**
 * Continuum Voice Mapping
 * Maps language + gender combinations to optimal Continuum voices
 *
 * Available voices for Continuum Voice:
 * alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer
 *
 * Voice characteristics:
 * - nova: Warm, confident, feminine - excellent for Spanish
 * - shimmer: Light, optimistic, feminine
 * - coral: Warm, engaging, feminine
 * - alloy: Neutral, versatile
 * - echo: Clear, deep, masculine
 * - onyx: Deep, authoritative, masculine
 * - fable: Narrative, expressive (British accent)
 * - sage: Calm, measured
 */

export type Language = 'es' | 'en';
export type Gender = 'female' | 'male';
export type ContinuumVoice = 'alloy' | 'ash' | 'coral' | 'echo' | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer';

export interface VoiceConfig {
  voice: ContinuumVoice;
  label: string;
  description: string;
}

/**
 * Voice mapping matrix
 * Optimized for natural-sounding speech in each language/gender combination
 */
export const VOICE_MAP: Record<Language, Record<Gender, VoiceConfig>> = {
  es: {
    female: {
      voice: 'nova',
      label: 'Lisa',
      description: 'Voz femenina cálida y natural - Español Latino',
    },
    male: {
      voice: 'onyx',
      label: 'Onyx',
      description: 'Voz masculina profunda y clara - Español Latino',
    },
  },
  en: {
    female: {
      voice: 'shimmer',
      label: 'Lisa',
      description: 'Warm, optimistic female voice for English',
    },
    male: {
      voice: 'echo',
      label: 'Echo',
      description: 'Clear, confident male voice for English',
    },
  },
};

/**
 * Get the Continuum voice name for a given language and gender
 */
export function getVoice(language: Language, gender: Gender): ContinuumVoice {
  return VOICE_MAP[language][gender].voice;
}

/**
 * Get full voice configuration
 */
export function getVoiceConfig(language: Language, gender: Gender): VoiceConfig {
  return VOICE_MAP[language][gender];
}

/**
 * Language display names
 */
export const LANGUAGE_OPTIONS: Record<Language, { label: string; flag: string }> = {
  es: { label: 'Español (MX)', flag: '🇲🇽' },
  en: { label: 'English', flag: '🇺🇸' },
};

/**
 * Gender display names (localized)
 */
export const GENDER_OPTIONS: Record<Gender, { labelEs: string; labelEn: string }> = {
  female: { labelEs: 'Femenina', labelEn: 'Female' },
  male: { labelEs: 'Masculina', labelEn: 'Male' },
};

/**
 * Default TTS settings - Spanish Female
 */
export const DEFAULT_TTS_SETTINGS = {
  language: 'es' as Language,
  gender: 'female' as Gender,
} as const;
