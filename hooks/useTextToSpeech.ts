'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTTSSettings } from '@/store/useTTSSettings';

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

// =============================================
// GLOBAL TTS EVENT SYSTEM
// =============================================
type TTSEventType = 'voice-changed' | 'stop-all';
type TTSEventCallback = () => void;

class TTSEventEmitter {
  private listeners = new Map<TTSEventType, Set<TTSEventCallback>>();

  on(event: TTSEventType, callback: TTSEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: TTSEventType, callback: TTSEventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: TTSEventType) {
    this.listeners.get(event)?.forEach(cb => cb());
  }
}

// Global singleton
export const ttsEvents = new TTSEventEmitter();

// Global stop function for external use
export function stopAllTTS() {
  ttsEvents.emit('stop-all');
}

// Global state for managing audio across components
let globalStopFn: (() => void) | null = null;

// Audio cache for repeated plays (cache by text hash)
const audioCache = new Map<string, string>();

// Generate simple hash for cache key
function hashText(text: string, voice: string): string {
  let hash = 0;
  const str = `${voice}:${text}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `tts_${hash}`;
}

// Custom error for rate limits
class TTSRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TTSRateLimitError';
  }
}

// Fetch complete audio for text (no chunking - OpenAI handles up to 4096 chars)
async function fetchAudio(
  text: string,
  voice: string,
  signal?: AbortSignal
): Promise<string> {
  const cacheKey = hashText(text, voice);

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

  // Cache the result
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

  // SPEAK - Start speaking text (complete text, no chunking)
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Stop any global playback
    if (globalStopFn && globalStopFn !== stop) {
      globalStopFn();
    }
    stop();
    globalStopFn = stop;
    isStoppedRef.current = false;

    const voice = getSelectedVoice();

    // Clean text: remove excessive whitespace, limit to 4096 chars (OpenAI limit)
    const cleanText = text
      .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
      .replace(/[ \t]+/g, ' ')     // Single spaces
      .trim()
      .slice(0, 4096);

    if (!cleanText) return;

    setState({ isLoading: true, isPlaying: false, isPaused: false, error: null });
    abortRef.current = new AbortController();

    try {
      // Fetch complete audio (OpenAI handles the full text)
      const audioUrl = await fetchAudio(cleanText, voice, abortRef.current.signal);

      if (isStoppedRef.current) return;

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setState({ isLoading: false, isPlaying: true, isPaused: false, error: null });
      };

      audio.onended = () => {
        setState(s => ({ ...s, isPlaying: false, isPaused: false }));
        audioRef.current = null;
        globalStopFn = null;
      };

      audio.onerror = () => {
        setState({ isLoading: false, isPlaying: false, isPaused: false, error: 'Error de reproducción' });
      };

      await audio.play();

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
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

  // Listen for global TTS events (voice change, stop all)
  useEffect(() => {
    const unsubscribeVoiceChange = ttsEvents.on('voice-changed', () => {
      stop();
    });

    const unsubscribeStopAll = ttsEvents.on('stop-all', () => {
      stop();
    });

    return () => {
      unsubscribeVoiceChange();
      unsubscribeStopAll();
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
