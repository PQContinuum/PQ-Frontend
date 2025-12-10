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

// Minimum bytes to buffer before starting playback (faster start)
const MIN_BUFFER_SIZE = 32000; // ~32KB = ~2 seconds of audio

// Fetch audio with early playback (starts playing while downloading)
async function fetchAudioWithEarlyPlayback(
  text: string,
  voice: string,
  signal?: AbortSignal
): Promise<{ audio: HTMLAudioElement; blobPromise: Promise<string> }> {
  const cacheKey = hashText(text, voice);

  // Check cache first - instant playback
  if (audioCache.has(cacheKey)) {
    return {
      audio: new Audio(audioCache.get(cacheKey)!),
      blobPromise: Promise.resolve(audioCache.get(cacheKey)!),
    };
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

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader');

  const chunks: ArrayBuffer[] = [];
  let totalSize = 0;
  let earlyBlobUrl: string | null = null;

  // Read chunks until we have enough to start playing
  while (totalSize < MIN_BUFFER_SIZE) {
    const { done, value } = await reader.read();
    if (done) break;
    if (signal?.aborted) throw new Error('Aborted');
    chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
    totalSize += value.length;
  }

  // Create early blob for immediate playback
  const earlyBlob = new Blob(chunks, { type: 'audio/mpeg' });
  earlyBlobUrl = URL.createObjectURL(earlyBlob);
  const audio = new Audio(earlyBlobUrl);

  // Continue downloading rest in background
  const blobPromise = (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (signal?.aborted) return earlyBlobUrl!;
        chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
      }

      // Create final complete blob
      const finalBlob = new Blob(chunks, { type: 'audio/mpeg' });
      const finalUrl = URL.createObjectURL(finalBlob);

      // Cache the complete audio
      audioCache.set(cacheKey, finalUrl);

      // Clean up early blob
      if (earlyBlobUrl) {
        URL.revokeObjectURL(earlyBlobUrl);
      }

      return finalUrl;
    } catch {
      return earlyBlobUrl!;
    }
  })();

  return { audio, blobPromise };
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

  // SPEAK - Start speaking text with streaming
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
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim()
      .slice(0, 4096);

    if (!cleanText) return;

    setState({ isLoading: true, isPlaying: false, isPaused: false, error: null });
    abortRef.current = new AbortController();

    try {
      // Fetch with early playback - starts playing as soon as we have minimum buffer
      const { audio } = await fetchAudioWithEarlyPlayback(
        cleanText,
        voice,
        abortRef.current.signal
      );

      if (isStoppedRef.current) return;

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
