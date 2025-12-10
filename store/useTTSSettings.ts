'use client';

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import {
  type Language,
  type Gender,
  type OpenAIVoice,
  getVoice,
  DEFAULT_TTS_SETTINGS,
} from '@/utils/voiceMapping';

// Import TTS events to notify voice changes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ttsEvents: any = null;

// Lazy load to avoid circular dependency
function emitVoiceChanged() {
  if (!ttsEvents) {
    // Dynamic import to avoid SSR issues
    import('@/hooks/useTextToSpeech').then(module => {
      ttsEvents = module.ttsEvents;
      ttsEvents?.emit('voice-changed');
    });
  } else {
    ttsEvents.emit('voice-changed');
  }
}

interface TTSSettingsState {
  // Settings
  language: Language;
  gender: Gender;

  // Actions
  setLanguage: (language: Language) => void;
  setGender: (gender: Gender) => void;
  getSelectedVoice: () => OpenAIVoice;
  reset: () => void;
}

export const useTTSSettings = create<TTSSettingsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Default values - Spanish Female
        language: DEFAULT_TTS_SETTINGS.language,
        gender: DEFAULT_TTS_SETTINGS.gender,

        // Actions
        setLanguage: (language: Language) => {
          const current = get().language;
          if (current !== language) {
            set({ language }, false, 'setLanguage');
            emitVoiceChanged();
          }
        },

        setGender: (gender: Gender) => {
          const current = get().gender;
          if (current !== gender) {
            set({ gender }, false, 'setGender');
            emitVoiceChanged();
          }
        },

        getSelectedVoice: (): OpenAIVoice => {
          const { language, gender } = get();
          return getVoice(language, gender);
        },

        reset: () => {
          set(
            {
              language: DEFAULT_TTS_SETTINGS.language,
              gender: DEFAULT_TTS_SETTINGS.gender,
            },
            false,
            'reset'
          );
          emitVoiceChanged();
        },
      }),
      {
        name: 'tts-settings',
        // Only persist language and gender, not the actions
        partialize: (state) => ({
          language: state.language,
          gender: state.gender,
        }),
      }
    ),
    { name: 'TTSSettingsStore' }
  )
);

// Optimized selectors to prevent unnecessary re-renders
export const useLanguage = () => useTTSSettings((state) => state.language);
export const useGender = () => useTTSSettings((state) => state.gender);
export const useSetLanguage = () => useTTSSettings((state) => state.setLanguage);
export const useSetGender = () => useTTSSettings((state) => state.setGender);
export const useGetSelectedVoice = () => useTTSSettings((state) => state.getSelectedVoice);
