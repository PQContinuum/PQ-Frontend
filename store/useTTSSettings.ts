'use client';

import { create } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';
import {
  type Language,
  type Gender,
  type ContinuumVoice,
  getVoice,
  DEFAULT_TTS_SETTINGS,
} from '@/utils/voiceMapping';

// =============================================
// VOICE CHANGE EVENT SYSTEM (synchronous)
// =============================================
type VoiceChangeCallback = () => void;
const voiceChangeListeners = new Set<VoiceChangeCallback>();

export function onVoiceChange(callback: VoiceChangeCallback): () => void {
  voiceChangeListeners.add(callback);
  return () => voiceChangeListeners.delete(callback);
}

function emitVoiceChanged() {
  // Emit synchronously to all listeners
  voiceChangeListeners.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error('[TTS] Voice change callback error:', e);
    }
  });
}

// =============================================
// STORE DEFINITION
// =============================================
interface TTSSettingsState {
  // Settings
  language: Language;
  gender: Gender;

  // Hydration flag
  _hasHydrated: boolean;

  // Actions
  setLanguage: (language: Language) => void;
  setGender: (gender: Gender) => void;
  getSelectedVoice: () => ContinuumVoice;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useTTSSettings = create<TTSSettingsState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Default values - Spanish Female
          language: DEFAULT_TTS_SETTINGS.language,
          gender: DEFAULT_TTS_SETTINGS.gender,
          _hasHydrated: false,

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

          getSelectedVoice: (): ContinuumVoice => {
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

          setHasHydrated: (state: boolean) => {
            set({ _hasHydrated: state }, false, 'setHasHydrated');
          },
        }),
        {
          name: 'tts-settings-v2', // Changed key to force fresh storage
          partialize: (state) => ({
            language: state.language,
            gender: state.gender,
          }),
          onRehydrateStorage: () => (state) => {
            state?.setHasHydrated(true);
          },
        }
      )
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
