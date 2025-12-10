'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTTSSettings, onVoiceChange } from '@/store/useTTSSettings';

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

// Global stop callback for stopping all instances
let globalStopCallback: (() => void) | null = null;

// Global stop function for external use
export function stopAllTTS() {
  globalStopCallback?.();
}

// Audio cache for repeated plays (instant on second play)
const audioCache = new Map<string, string>();

// Simple cache key
function getCacheKey(text: string, voice: string): string {
  return `${voice}:${text.slice(0, 100)}:${text.length}`;
}

// Custom error for rate limits
class TTSRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TTSRateLimitError';
  }
}

// Fetch complete audio - simple and stable
async function fetchAudio(
  text: string,
  voice: string,
  signal?: AbortSignal
): Promise<string> {
  const cacheKey = getCacheKey(text, voice);

  // Cache hit = instant playback
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
    signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      const data = await response.json();
      throw new TTSRateLimitError(data.message || 'Límite de TTS alcanzado');
    }
    throw new Error('TTS failed');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  // Cache for future plays
  audioCache.set(cacheKey, url);

  return url;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    isPaused: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isStoppedRef = useRef<boolean>(false);

  const getSelectedVoice = useTTSSettings((s) => s.getSelectedVoice);

  // STOP - Completely stops and resets
  const stop = useCallback(() => {
    isStoppedRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    setState({ isLoading: false, isPlaying: false, isPaused: false, error: null });
  }, []);

  // PAUSE - Pauses current audio, maintains position
  const pause = useCallback(() => {
    if (audioRef.current && !state.isPaused) {
      audioRef.current.pause();
      setState(s => ({ ...s, isPlaying: false, isPaused: true }));
    }
  }, [state.isPaused]);

  // RESUME - Continues from paused position
  const resume = useCallback(() => {
    if (audioRef.current && state.isPaused) {
      audioRef.current.play().then(() => {
        setState(s => ({ ...s, isPlaying: true, isPaused: false }));
      }).catch(() => {
        setState(s => ({ ...s, error: 'Error al reanudar', isPaused: false }));
      });
    }
  }, [state.isPaused]);

  // SPEAK - Start speaking text
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Stop any other playback first
    stop();
    isStoppedRef.current = false;

    const voice = getSelectedVoice();

    // Clean text: remove excessive whitespace, limit to 4096 chars (OpenAI limit)
    const cleanText = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim()
      .slice(0, 4096);

    if (!cleanText) return;

    setState({ isLoading: true, isPlaying: false, isPaused: false, error: null });
    abortRef.current = new AbortController();

    try {
      // Fetch complete audio (stable, no partial playback issues)
      const audioUrl = await fetchAudio(cleanText, voice, abortRef.current.signal);

      if (isStoppedRef.current) return;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setState({ isLoading: false, isPlaying: true, isPaused: false, error: null });
      };

      audio.onended = () => {
        setState(s => ({ ...s, isPlaying: false, isPaused: false }));
        audioRef.current = null;
      };

      audio.onerror = () => {
        setState({ isLoading: false, isPlaying: false, isPaused: false, error: 'Error de reproducción' });
      };

      await audio.play();

    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Aborted')) {
        return;
      }

      const errorMessage = error instanceof TTSRateLimitError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Error de TTS';

      setState({
        isLoading: false,
        isPlaying: false,
        isPaused: false,
        error: errorMessage,
      });
    }
  }, [getSelectedVoice, stop]);

  // TOGGLE - Smart toggle: play/pause/resume based on current state
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

  // Listen for voice changes from settings
  useEffect(() => {
    // Register for voice change notifications
    const unsubscribe = onVoiceChange(() => {
      // Stop current playback when voice changes
      stop();
    });

    // Register global stop
    globalStopCallback = stop;

    return () => {
      unsubscribe();
      if (globalStopCallback === stop) {
        globalStopCallback = null;
      }
      stop();
    };
  }, [stop]);

  return { ...state, speak, pause, resume, stop, toggle };
}

// Clear cache
export function clearTTSCache(): void {
  audioCache.forEach(url => URL.revokeObjectURL(url));
  audioCache.clear();
}
