'use client';

import { memo, useCallback, useState } from 'react';
import { Volume2, Play, Square, Loader2 } from 'lucide-react';
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
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

// Voice preview samples by language and gender
const VOICE_SAMPLES: Record<Language, Record<Gender, string>> = {
  es: {
    female: 'Hola, soy Lisa, tu asistente de Continuum AI. Estoy aquí para ayudarte en lo que necesites.',
    male: 'Hola, soy tu asistente de Continuum AI. Estoy aquí para ayudarte en lo que necesites.',
  },
  en: {
    female: "Hello, I'm Lisa, your Continuum AI assistant. I'm here to help you with whatever you need.",
    male: "Hello, I'm your Continuum AI assistant. I'm here to help you with whatever you need.",
  },
};

interface TTSSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TTSSettingsModalComponent({ open, onOpenChange }: TTSSettingsModalProps) {
  const language = useLanguage();
  const gender = useGender();
  const setLanguage = useSetLanguage();
  const setGender = useSetGender();

  // Get current voice info
  const currentVoice = getVoiceConfig(language, gender);

  // TTS for voice preview
  const { speak, stop, isLoading, isPlaying } = useTextToSpeech();
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Handle voice preview
  const handlePlayPreview = useCallback(async () => {
    if (isPreviewPlaying || isPlaying) {
      stop();
      setIsPreviewPlaying(false);
      return;
    }

    setIsPreviewPlaying(true);
    try {
      await speak(VOICE_SAMPLES[language][gender]);
    } catch (error) {
      console.error('Error playing voice preview:', error);
    } finally {
      setIsPreviewPlaying(false);
    }
  }, [language, gender, speak, stop, isPreviewPlaying, isPlaying]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#111111]">
            <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-[#934f2c]/10 to-[#d9753e]/10">
              <Volume2 className="size-4 text-[#934f2c]" />
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
                    onClick={() => setLanguage(langKey)}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                      text-sm font-medium transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-[#934f2c]/30 focus:ring-offset-2
                      ${
                        language === langKey
                          ? 'bg-[#934f2c] text-white shadow-md'
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
                    onClick={() => setGender(genderKey)}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                      text-sm font-medium transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-[#934f2c]/30 focus:ring-offset-2
                      ${
                        gender === genderKey
                          ? 'bg-[#934f2c] text-white shadow-md'
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

          {/* Current Voice Info with Preview */}
          <div className="bg-gradient-to-br from-[#934f2c]/5 to-[#d9753e]/5 rounded-xl p-4 border border-[#934f2c]/10">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center size-10 rounded-full bg-[#934f2c]/10 flex-shrink-0">
                <Volume2 className="size-5 text-[#934f2c]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#934f2c] uppercase tracking-wide mb-1">
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

            {/* Voice Preview Button */}
            <button
              type="button"
              onClick={handlePlayPreview}
              disabled={isLoading}
              className={`
                w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                text-sm font-semibold transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-[#934f2c]/30 focus:ring-offset-2
                ${
                  isPreviewPlaying || isPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-[#934f2c] hover:bg-[#00442a] text-white'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Cargando...</span>
                </>
              ) : isPreviewPlaying || isPlaying ? (
                <>
                  <Square className="size-4 fill-current" />
                  <span>Detener</span>
                </>
              ) : (
                <>
                  <Play className="size-4 fill-current" />
                  <span>Escuchar voz</span>
                </>
              )}
            </button>
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
