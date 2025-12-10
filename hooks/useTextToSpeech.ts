'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTTSSettings } from '@/store/useTTSSettings';
import type { OpenAIVoice } from '@/utils/voiceMapping';

interface TTSState {
  isLoading: boolean;
  isPlaying: boolean;
  error: string | null;
}

interface UseTextToSpeechReturn extends TTSState {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  replay: () => Promise<void>;
}

// Global audio cache: Map<cacheKey, ObjectURL>
const audioCache = new Map<string, string>();

// Global currently playing audio reference
let globalAudio: HTMLAudioElement | null = null;
let globalStopCallback: (() => void) | null = null;

/**
 * Generate a cache key based on text content and voice settings
 */
function getCacheKey(text: string, voice: OpenAIVoice): string {
  // Use a hash of the text + voice for the cache key
  const content = `${voice}:${text}`;
  return content;
}

/**
 * Hook for OpenAI Text-to-Speech functionality
 *
 * Features:
 * - AbortController for canceling in-flight requests
 * - In-memory audio cache (keyed by text + voice)
 * - Automatic cleanup of ObjectURLs
 * - Global audio management (stops other playing audio)
 * - Loading, playing, and error states
 */
export function useTextToSpeech(): UseTextToSpeechReturn {
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTextRef = useRef<string>('');
  const lastVoiceRef = useRef<OpenAIVoice | null>(null);

  const getSelectedVoice = useTTSSettings((s) => s.getSelectedVoice);

  // Cleanup function for when component unmounts or audio ends
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }
    if (globalAudio === audioRef.current) {
      globalAudio = null;
      globalStopCallback = null;
    }
  }, []);

  // Stop currently playing audio
  const stop = useCallback(() => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setState((prev) => ({
      ...prev,
      isLoading: false,
      isPlaying: false,
    }));
  }, []);

  // Register this instance's stop callback globally
  const registerGlobalStop = useCallback(() => {
    // Stop any other playing audio first
    if (globalStopCallback && globalStopCallback !== stop) {
      globalStopCallback();
    }
    globalStopCallback = stop;
  }, [stop]);

  /**
   * Main speak function - fetches audio and plays it
   */
  const speak = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim()) return;

      const voice = getSelectedVoice();
      const cacheKey = getCacheKey(text, voice);

      // Store for replay
      lastTextRef.current = text;
      lastVoiceRef.current = voice;

      // Stop any currently playing audio (including from other components)
      registerGlobalStop();
      stop();

      setState({ isLoading: true, isPlaying: false, error: null });

      try {
        let audioUrl: string;

        // Check cache first
        if (audioCache.has(cacheKey)) {
          audioUrl = audioCache.get(cacheKey)!;
        } else {
          // Create abort controller for this request
          abortControllerRef.current = new AbortController();

          // Fetch from OpenAI TTS API
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: text.slice(0, 4096), // OpenAI limit
              voice,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `TTS request failed: ${response.status}`);
          }

          // Convert response to blob
          const audioBlob = await response.blob();
          audioUrl = URL.createObjectURL(audioBlob);

          // Cache the audio URL
          audioCache.set(cacheKey, audioUrl);
        }

        // Create and configure audio element
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        globalAudio = audio;

        // Set up event handlers
        audio.oncanplaythrough = () => {
          setState((prev) => ({ ...prev, isLoading: false }));
        };

        audio.onplay = () => {
          setState((prev) => ({ ...prev, isPlaying: true, isLoading: false }));
        };

        audio.onended = () => {
          setState((prev) => ({ ...prev, isPlaying: false }));
          if (globalAudio === audio) {
            globalAudio = null;
            globalStopCallback = null;
          }
        };

        audio.onerror = () => {
          setState({
            isLoading: false,
            isPlaying: false,
            error: 'Error playing audio',
          });
          // Remove from cache if playback failed
          audioCache.delete(cacheKey);
          if (audioCache.has(cacheKey)) {
            URL.revokeObjectURL(audioCache.get(cacheKey)!);
          }
        };

        audio.onpause = () => {
          if (!audio.ended) {
            setState((prev) => ({ ...prev, isPlaying: false }));
          }
        };

        // Start playback
        await audio.play();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, don't show error
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        setState({
          isLoading: false,
          isPlaying: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    },
    [getSelectedVoice, registerGlobalStop, stop]
  );

  /**
   * Replay the last spoken text
   */
  const replay = useCallback(async (): Promise<void> => {
    if (lastTextRef.current) {
      await speak(lastTextRef.current);
    }
  }, [speak]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      cleanup();
    };
  }, [stop, cleanup]);

  return {
    ...state,
    speak,
    stop,
    replay,
  };
}

/**
 * Clear the entire audio cache and revoke all ObjectURLs
 * Useful for memory management or when settings change
 */
export function clearAudioCache(): void {
  audioCache.forEach((url) => {
    URL.revokeObjectURL(url);
  });
  audioCache.clear();
}

/**
 * Get cache statistics
 */
export function getAudioCacheStats(): { size: number; entries: number } {
  return {
    size: audioCache.size,
    entries: audioCache.size,
  };
}
