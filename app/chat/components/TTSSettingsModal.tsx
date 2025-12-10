'use client';

import { memo, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  useLanguage,
  useGender,
  useSetLanguage,
  useSetGender,
} from '@/store/useTTSSettings';
import {
  type Language,
  type Gender,
  LANGUAGE_OPTIONS,
  GENDER_OPTIONS,
  getVoiceConfig,
} from '@/utils/voiceMapping';
import { clearAudioCache } from '@/hooks/useTextToSpeech';

interface TTSSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TTSSettingsModalComponent({ open, onOpenChange }: TTSSettingsModalProps) {
  const language = useLanguage();
  const gender = useGender();
  const setLanguage = useSetLanguage();
  const setGender = useSetGender();

  const handleLanguageChange = useCallback(
    (newLanguage: Language) => {
      if (newLanguage !== language) {
        setLanguage(newLanguage);
        // Clear audio cache when language changes since cached audio won't match new settings
        clearAudioCache();
      }
    },
    [language, setLanguage]
  );

  const handleGenderChange = useCallback(
    (newGender: Gender) => {
      if (newGender !== gender) {
        setGender(newGender);
        // Clear audio cache when gender changes
        clearAudioCache();
      }
    },
    [gender, setGender]
  );

  // Get current voice info
  const currentVoice = getVoiceConfig(language, gender);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#111111]">
            <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-[#00552b]/10 to-[#00aa56]/10">
              <Volume2 className="size-4 text-[#00552b]" />
            </div>
            Configuración de Voz
          </DialogTitle>
          <DialogDescription className="text-[#4c4c4c]">
            Personaliza cómo suena el asistente al reproducir mensajes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Language Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#111111]">
              Idioma
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(LANGUAGE_OPTIONS) as [Language, { label: string; flag: string }][]).map(
                ([langKey, langData]) => (
                  <button
                    key={langKey}
                    type="button"
                    onClick={() => handleLanguageChange(langKey)}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                      text-sm font-medium transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-[#00552b]/30 focus:ring-offset-2
                      ${
                        language === langKey
                          ? 'bg-[#00552b] text-white shadow-md'
                          : 'bg-[#f6f6f6] text-[#4c4c4c] hover:bg-[#eeeeee] border border-black/5'
                      }
                    `}
                    aria-pressed={language === langKey}
                  >
                    <span className="text-lg">{langData.flag}</span>
                    <span>{langData.label}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Gender Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#111111]">
              Tipo de Voz
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(GENDER_OPTIONS) as [Gender, { labelEs: string; labelEn: string }][]).map(
                ([genderKey, genderData]) => (
                  <button
                    key={genderKey}
                    type="button"
                    onClick={() => handleGenderChange(genderKey)}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                      text-sm font-medium transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-[#00552b]/30 focus:ring-offset-2
                      ${
                        gender === genderKey
                          ? 'bg-[#00552b] text-white shadow-md'
                          : 'bg-[#f6f6f6] text-[#4c4c4c] hover:bg-[#eeeeee] border border-black/5'
                      }
                    `}
                    aria-pressed={gender === genderKey}
                  >
                    <span className="text-lg">
                      {genderKey === 'female' ? '👩' : '👨'}
                    </span>
                    <span>
                      {language === 'es' ? genderData.labelEs : genderData.labelEn}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Current Voice Info */}
          <div className="bg-gradient-to-br from-[#00552b]/5 to-[#00aa56]/5 rounded-xl p-4 border border-[#00552b]/10">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-10 rounded-full bg-[#00552b]/10 flex-shrink-0">
                <Volume2 className="size-5 text-[#00552b]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#00552b] uppercase tracking-wide mb-1">
                  Voz Actual
                </p>
                <p className="text-sm font-bold text-[#111111]">
                  {currentVoice.label}
                </p>
                <p className="text-xs text-[#4c4c4c] mt-0.5">
                  {currentVoice.description}
                </p>
              </div>
            </div>
          </div>

          {/* Auto-save notice */}
          <p className="text-xs text-center text-[#4c4c4c]">
            Los cambios se guardan automáticamente
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const TTSSettingsModal = memo(TTSSettingsModalComponent);
