'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTTSSettings, onVoiceChange } from '@/store/useTTSSettings';
import { ttsApi, ApiError } from '@/lib/api-client';
import type { Language } from '@/utils/voiceMapping';

interface TTSState {
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  error: string | null;
}

interface UseTextToSpeechReturn extends TTSState {
  speak: (text: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  toggle: (text: string) => void;
}

const stopListeners = new Set<() => void>();
const audioCache = new Map<string, string>();

function getLanguageCode(language: Language): string {
  return language === 'en' ? 'en-US' : 'es-US';
}

function getCacheKey(text: string, voice: string, languageCode: string): string {
  return `${languageCode}:${voice}:${text.slice(0, 100)}:${text.length}`;
}

export function stopAllTTS() {
  stopListeners.forEach((stop) => stop());
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    isPaused: false,
    error: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isStoppedRef = useRef(false);

  const getSelectedVoice = useTTSSettings((s) => s.getSelectedVoice);
  const language = useTTSSettings((s) => s.language);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.onplay = null;
      audio.onended = null;
      audio.onerror = null;
    }
    audioRef.current = null;

    setState({ isLoading: false, isPlaying: false, isPaused: false, error: null });
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (state.isPlaying && audio) {
      audio.pause();
      setState((s) => ({ ...s, isPlaying: false, isPaused: true }));
    }
  }, [state.isPlaying]);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (state.isPaused && audio) {
      audio
        .play()
        .then(() => setState((s) => ({ ...s, isPlaying: true, isPaused: false })))
        .catch((error) => {
          setState({
            isLoading: false,
            isPlaying: false,
            isPaused: false,
            error: error instanceof Error ? error.message : 'No se pudo reproducir el audio',
          });
        });
    }
  }, [state.isPaused]);

  const playUrl = useCallback(async (url: string) => {
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => {
      setState({ isLoading: false, isPlaying: true, isPaused: false, error: null });
    };
    audio.onended = () => {
      setState((s) => ({ ...s, isPlaying: false, isPaused: false }));
      audioRef.current = null;
    };
    audio.onerror = () => {
      setState({
        isLoading: false,
        isPlaying: false,
        isPaused: false,
        error: 'No se pudo reproducir el audio',
      });
      audioRef.current = null;
    };

    await audio.play();
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    stopAllTTS();
    isStoppedRef.current = false;

    const voice = getSelectedVoice();
    const languageCode = getLanguageCode(language);
    const cleanText = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim()
      .slice(0, 4096);

    if (!cleanText) return;

    setState({ isLoading: true, isPlaying: false, isPaused: false, error: null });
    const abortController = new AbortController();
    abortRef.current = abortController;

    const cacheKey = getCacheKey(cleanText, voice, languageCode);
    const cachedUrl = audioCache.get(cacheKey);

    try {
      if (cachedUrl) {
        await playUrl(cachedUrl);
        return;
      }

      const response = await ttsApi.generate(
        {
          text: cleanText,
          voice,
          language: languageCode,
          speakingRate: 1,
          format: 'mp3',
        },
        abortController.signal
      );

      if (isStoppedRef.current) return;

      const audioBlob = await response.blob();
      if (!audioBlob.size) {
        throw new Error('El proveedor no devolvió audio');
      }

      const objectUrl = URL.createObjectURL(audioBlob);
      audioCache.set(cacheKey, objectUrl);
      await playUrl(objectUrl);
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Aborted')) {
        return;
      }

      let errorMessage: string;
      if (error instanceof ApiError && error.statusCode === 429) {
        errorMessage = (error.data as { message?: string })?.message || 'Límite de TTS alcanzado';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Error de TTS';
      }

      setState({
        isLoading: false,
        isPlaying: false,
        isPaused: false,
        error: errorMessage,
      });
    }
  }, [getSelectedVoice, language, playUrl]);

  const toggle = useCallback((text: string) => {
    if (state.isLoading) {
      stop();
    } else if (state.isPlaying) {
      pause();
    } else if (state.isPaused) {
      resume();
    } else {
      speak(text);
    }
  }, [state.isLoading, state.isPlaying, state.isPaused, stop, pause, resume, speak]);

  useEffect(() => {
    const unsubscribeVoiceChange = onVoiceChange(stopAllTTS);
    stopListeners.add(stop);

    return () => {
      unsubscribeVoiceChange();
      stopListeners.delete(stop);
      stop();
    };
  }, [stop]);

  return { ...state, speak, pause, resume, stop, toggle };
}

export function clearTTSCache(): void {
  audioCache.forEach((url) => URL.revokeObjectURL(url));
  audioCache.clear();
}
