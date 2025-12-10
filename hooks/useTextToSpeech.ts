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

// Global state for managing audio across components
let globalStopFn: (() => void) | null = null;

// Audio cache for repeated plays
const audioCache = new Map<string, string>();

// Split text into speakable chunks (by paragraphs/sentences)
function splitIntoChunks(text: string, maxLength: number = 500): string[] {
  const chunks: string[] = [];

  // First split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    if (!para.trim()) continue;

    if (para.length <= maxLength) {
      chunks.push(para.trim());
    } else {
      // Split long paragraphs by sentences
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

  if (!response.ok) throw new Error('TTS failed');

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  audioCache.set(cacheKey, url);

  return url;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const currentIndexRef = useRef<number>(0);
  const isStoppedRef = useRef<boolean>(false);

  const getSelectedVoice = useTTSSettings((s) => s.getSelectedVoice);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;

    // Stop all queued audio
    audioQueueRef.current.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    audioQueueRef.current = [];
    currentIndexRef.current = 0;

    setState({ isLoading: false, isPlaying: false, error: null });
  }, []);

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
    const chunks = splitIntoChunks(text, 400); // Smaller chunks = faster first audio

    if (chunks.length === 0) return;

    setState({ isLoading: true, isPlaying: false, error: null });
    abortRef.current = new AbortController();

    try {
      // Fetch first chunk immediately
      const firstUrl = await fetchChunkAudio(chunks[0], voice, abortRef.current.signal);

      if (isStoppedRef.current) return;

      // Start playing first chunk immediately
      const firstAudio = new Audio(firstUrl);
      audioQueueRef.current = [firstAudio];
      currentIndexRef.current = 0;

      // Play first chunk
      firstAudio.onplay = () => {
        setState({ isLoading: false, isPlaying: true, error: null });
      };

      firstAudio.onended = () => {
        playNext();
      };

      firstAudio.onerror = () => {
        setState({ isLoading: false, isPlaying: false, error: 'Playback error' });
      };

      await firstAudio.play();

      // Pre-fetch remaining chunks in parallel (don't wait)
      if (chunks.length > 1) {
        prefetchRemaining(chunks.slice(1), voice);
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setState({
        isLoading: false,
        isPlaying: false,
        error: error instanceof Error ? error.message : 'TTS error',
      });
    }

    // Helper to play next chunk in queue
    function playNext() {
      if (isStoppedRef.current) return;

      currentIndexRef.current++;
      const nextAudio = audioQueueRef.current[currentIndexRef.current];

      if (nextAudio) {
        nextAudio.onended = () => playNext();
        nextAudio.play().catch(() => {
          // If play fails, try next
          playNext();
        });
      } else {
        // Check if more chunks are still loading
        if (currentIndexRef.current < chunks.length) {
          // Wait a bit and retry
          setTimeout(() => playNext(), 100);
        } else {
          // All done
          setState(s => ({ ...s, isPlaying: false }));
          globalStopFn = null;
        }
      }
    }

    // Pre-fetch remaining chunks
    async function prefetchRemaining(remainingChunks: string[], v: string) {
      for (let i = 0; i < remainingChunks.length; i++) {
        if (isStoppedRef.current || !abortRef.current) break;

        try {
          const url = await fetchChunkAudio(remainingChunks[i], v, abortRef.current.signal);
          if (isStoppedRef.current) break;

          const audio = new Audio(url);
          audioQueueRef.current.push(audio);
        } catch {
          // Ignore errors for prefetch
          break;
        }
      }
    }

  }, [getSelectedVoice, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { ...state, speak, stop };
}

// Clear cache
export function clearTTSCache(): void {
  audioCache.forEach(url => URL.revokeObjectURL(url));
  audioCache.clear();
}
