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
        setLanguage: (language: Language) =>
          set({ language }, false, 'setLanguage'),

        setGender: (gender: Gender) =>
          set({ gender }, false, 'setGender'),

        getSelectedVoice: (): OpenAIVoice => {
          const { language, gender } = get();
          return getVoice(language, gender);
        },

        reset: () =>
          set(
            {
              language: DEFAULT_TTS_SETTINGS.language,
              gender: DEFAULT_TTS_SETTINGS.gender,
            },
            false,
            'reset'
          ),
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
