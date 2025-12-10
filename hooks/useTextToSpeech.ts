'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTTSSettings } from '@/store/useTTSSettings';

interface TTSState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
}

interface UseTextToSpeechReturn extends TTSState {
  speak: (text: string) => Promise<void>;
  stop: () => void;
}

// Global audio reference - only one audio plays at a time
let globalAudio: HTMLAudioElement | null = null;
let globalStopFn: (() => void) | null = null;

// Simple in-memory cache for this session
const audioCache = new Map<string, string>();

function getCacheKey(text: string, voice: string): string {
  // Use first 100 chars + length + voice for cache key
  return `${voice}:${text.length}:${text.slice(0, 100)}`;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getSelectedVoice = useTTSSettings((s) => s.getSelectedVoice);

  const stop = useCallback(() => {
    // Abort fetch
    abortRef.current?.abort();
    abortRef.current = null;

    // Stop audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setState(s => ({ ...s, isLoading: false, isPlaying: false }));
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const voice = getSelectedVoice();
    const cacheKey = getCacheKey(text, voice);

    // Stop any currently playing audio globally
    if (globalStopFn && globalStopFn !== stop) {
      globalStopFn();
    }
    stop();
    globalStopFn = stop;

    setState({ isLoading: true, isPlaying: false, error: null });

    try {
      let audioUrl: string;

      // Check cache first
      if (audioCache.has(cacheKey)) {
        audioUrl = audioCache.get(cacheKey)!;
      } else {
        // Fetch with abort controller
        abortRef.current = new AbortController();

        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.slice(0, 4096), voice }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error('TTS request failed');
        }

        // Get blob and create URL
        const blob = await response.blob();
        audioUrl = URL.createObjectURL(blob);

        // Cache it
        audioCache.set(cacheKey, audioUrl);
      }

      // Create audio and play
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      globalAudio = audio;

      audio.oncanplaythrough = () => {
        setState(s => ({ ...s, isLoading: false }));
      };

      audio.onplay = () => {
        setState(s => ({ ...s, isPlaying: true, isLoading: false }));
      };

      audio.onended = () => {
        setState(s => ({ ...s, isPlaying: false }));
        if (globalAudio === audio) {
          globalAudio = null;
          globalStopFn = null;
        }
      };

      audio.onerror = () => {
        setState({ isLoading: false, isPlaying: false, error: 'Playback error' });
        audioCache.delete(cacheKey);
      };

      // Play immediately
      await audio.play();

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState(s => ({ ...s, isLoading: false }));
        return;
      }
      setState({
        isLoading: false,
        isPlaying: false,
        error: error instanceof Error ? error.message : 'TTS error',
      });
    }
  }, [getSelectedVoice, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioRef.current) {
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [stop]);

  return { ...state, speak, stop };
}

// Clear cache (useful when voice settings change)
export function clearTTSCache(): void {
  audioCache.forEach(url => URL.revokeObjectURL(url));
  audioCache.clear();
}
