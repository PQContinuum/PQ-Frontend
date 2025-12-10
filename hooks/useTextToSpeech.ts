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

// Audio cache for repeated plays
const audioCache = new Map<string, string>();

// Split text into speakable chunks
function splitIntoChunks(text: string, maxLength: number = 400): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    if (!para.trim()) continue;

    if (para.length <= maxLength) {
      chunks.push(para.trim());
    } else {
      const sentences = para.split(/(?<=[.!?])\s+/);
      let current = '';

      for (const sentence of sentences) {
        if ((current + ' ' + sentence).length <= maxLength) {
          current = current ? current + ' ' + sentence : sentence;
        } else {
          if (current) chunks.push(current.trim());
          current = sentence;
        }
      }
      if (current) chunks.push(current.trim());
    }
  }

  return chunks.filter(c => c.length > 0);
}

// Custom error for rate limits
class TTSRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TTSRateLimitError';
  }
}

// Fetch audio for a single chunk
async function fetchChunkAudio(
  text: string,
  voice: string,
  signal?: AbortSignal
): Promise<string> {
  const cacheKey = `${voice}:${text.slice(0, 50)}:${text.length}`;

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
    // Handle rate limit
    if (response.status === 429) {
      const data = await response.json();
      throw new TTSRateLimitError(data.message || 'Límite de TTS alcanzado');
    }
    throw new Error('TTS failed');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
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
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const currentIndexRef = useRef<number>(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isStoppedRef = useRef<boolean>(false);
  const chunksRef = useRef<string[]>([]);
  const voiceRef = useRef<string>('');

  const getSelectedVoice = useTTSSettings((s) => s.getSelectedVoice);

  // STOP - Completely stops and resets
  const stop = useCallback(() => {
    isStoppedRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;

    // Stop current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    // Clear queue
    audioQueueRef.current.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    audioQueueRef.current = [];
    currentIndexRef.current = 0;
    chunksRef.current = [];

    setState({ isLoading: false, isPlaying: false, isPaused: false, error: null });
  }, []);

  // PAUSE - Pauses current audio, maintains position
  const pause = useCallback(() => {
    if (currentAudioRef.current && !state.isPaused) {
      currentAudioRef.current.pause();
      setState(s => ({ ...s, isPlaying: false, isPaused: true }));
    }
  }, [state.isPaused]);

  // RESUME - Continues from paused position
  const resume = useCallback(() => {
    if (currentAudioRef.current && state.isPaused) {
      currentAudioRef.current.play().then(() => {
        setState(s => ({ ...s, isPlaying: true, isPaused: false }));
      }).catch(() => {
        setState(s => ({ ...s, error: 'Resume failed', isPaused: false }));
      });
    }
  }, [state.isPaused]);

  // Play next chunk in queue
  const playNext = useCallback(() => {
    if (isStoppedRef.current) return;

    currentIndexRef.current++;
    const nextAudio = audioQueueRef.current[currentIndexRef.current];

    if (nextAudio) {
      currentAudioRef.current = nextAudio;
      nextAudio.onended = () => playNext();
      nextAudio.onerror = () => playNext();
      nextAudio.play().catch(() => playNext());
    } else {
      // Check if more chunks are still loading
      if (currentIndexRef.current < chunksRef.current.length) {
        setTimeout(() => playNext(), 150);
      } else {
        // All done
        setState(s => ({ ...s, isPlaying: false, isPaused: false }));
        currentAudioRef.current = null;
        globalStopFn = null;
      }
    }
  }, []);

  // Pre-fetch remaining chunks
  const prefetchRemaining = useCallback(async (remainingChunks: string[], voice: string) => {
    for (let i = 0; i < remainingChunks.length; i++) {
      if (isStoppedRef.current || !abortRef.current) break;

      try {
        const url = await fetchChunkAudio(remainingChunks[i], voice, abortRef.current.signal);
        if (isStoppedRef.current) break;

        const audio = new Audio(url);
        audioQueueRef.current.push(audio);
      } catch {
        break;
      }
    }
  }, []);

  // SPEAK - Start speaking text
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
    voiceRef.current = voice;
    const chunks = splitIntoChunks(text, 400);
    chunksRef.current = chunks;

    if (chunks.length === 0) return;

    setState({ isLoading: true, isPlaying: false, isPaused: false, error: null });
    abortRef.current = new AbortController();

    try {
      // Fetch first chunk immediately
      const firstUrl = await fetchChunkAudio(chunks[0], voice, abortRef.current.signal);

      if (isStoppedRef.current) return;

      // Create and play first chunk
      const firstAudio = new Audio(firstUrl);
      audioQueueRef.current = [firstAudio];
      currentIndexRef.current = 0;
      currentAudioRef.current = firstAudio;

      firstAudio.onplay = () => {
        setState({ isLoading: false, isPlaying: true, isPaused: false, error: null });
      };

      firstAudio.onended = () => {
        playNext();
      };

      firstAudio.onerror = () => {
        setState({ isLoading: false, isPlaying: false, isPaused: false, error: 'Playback error' });
      };

      await firstAudio.play();

      // Pre-fetch remaining chunks
      if (chunks.length > 1) {
        prefetchRemaining(chunks.slice(1), voice);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }

      // Handle rate limit error with user-friendly message
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
  }, [getSelectedVoice, stop, playNext, prefetchRemaining]);

  // TOGGLE - Smart toggle: play/pause/resume based on current state
  const toggle = useCallback((text: string) => {
    if (state.isLoading) {
      // Currently loading - stop
      stop();
    } else if (state.isPlaying) {
      // Currently playing - pause
      pause();
    } else if (state.isPaused) {
      // Currently paused - resume
      resume();
    } else {
      // Not playing - start
      speak(text);
    }
  }, [state.isLoading, state.isPlaying, state.isPaused, stop, pause, resume, speak]);

  // Listen for global TTS events (voice change, stop all)
  useEffect(() => {
    const unsubscribeVoiceChange = ttsEvents.on('voice-changed', () => {
      // Stop current playback when voice settings change
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
