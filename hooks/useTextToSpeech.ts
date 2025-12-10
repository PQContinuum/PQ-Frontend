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

// Audio cache for MP3 fallback
const audioCache = new Map<string, string>();

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

// =============================================
// PCM STREAMING AUDIO PLAYER
// Uses Web Audio API with buffering for smooth playback
// =============================================
class PCMStreamPlayer {
  private audioContext: AudioContext | null = null;
  private isPlaying = false;
  private isPaused = false;
  private scheduledTime = 0;
  private sourceNodes: AudioBufferSourceNode[] = [];
  private gainNode: GainNode | null = null;
  private onEndCallback: (() => void) | null = null;
  private onStartCallback: (() => void) | null = null;
  private hasStarted = false;
  private isProcessing = false;
  private streamEnded = false;

  // PCM format: 24kHz, 16-bit signed, mono, little-endian
  private readonly SAMPLE_RATE = 24000;

  // Buffer settings for smooth playback
  // Accumulate ~100ms (2400 samples) before starting playback
  private readonly MIN_BUFFER_SAMPLES = 2400;
  // Process in chunks of ~200ms (4800 samples) for efficiency
  private readonly CHUNK_SIZE_SAMPLES = 4800;

  // Accumulation buffer for incoming PCM data
  private accumulatedBuffer: Int16Array = new Int16Array(0);
  private totalSamplesScheduled = 0;
  // Leftover byte from previous chunk (PCM is 16-bit = 2 bytes per sample)
  private leftoverByte: number | null = null;

  async init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.scheduledTime = this.audioContext.currentTime;
    this.hasStarted = false;
    this.streamEnded = false;
    this.isProcessing = false;
    this.accumulatedBuffer = new Int16Array(0);
    this.leftoverByte = null;
    this.totalSamplesScheduled = 0;
    console.log('[PCM] init() complete, audioContext state:', this.audioContext.state);
  }

  // Append new PCM data to accumulated buffer
  private appendToBuffer(pcmData: ArrayBuffer) {
    let bytes = new Uint8Array(pcmData);

    // If we have a leftover byte from previous chunk, prepend it
    if (this.leftoverByte !== null) {
      const newBytes = new Uint8Array(bytes.length + 1);
      newBytes[0] = this.leftoverByte;
      newBytes.set(bytes, 1);
      bytes = newBytes;
      this.leftoverByte = null;
    }

    // If odd number of bytes, save the last one for next chunk
    if (bytes.length % 2 !== 0) {
      this.leftoverByte = bytes[bytes.length - 1];
      bytes = bytes.slice(0, -1);
    }

    if (bytes.length === 0) return;

    // Convert to Int16Array (requires even byte count)
    const newData = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
    const combined = new Int16Array(this.accumulatedBuffer.length + newData.length);
    combined.set(this.accumulatedBuffer);
    combined.set(newData, this.accumulatedBuffer.length);
    this.accumulatedBuffer = combined;
  }

  // Convert 16-bit PCM to Float32
  private pcmToFloat32(int16: Int16Array): Float32Array {
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    return float32;
  }

  private scheduleAudioChunk(float32: Float32Array) {
    console.log('[PCM] scheduleAudioChunk called, samples:', float32.length);
    if (!this.audioContext || !this.gainNode || !this.isPlaying) return;

    const audioBuffer = this.audioContext.createBuffer(1, float32.length, this.SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    // Schedule playback with small overlap prevention
    const startTime = Math.max(this.scheduledTime, this.audioContext.currentTime + 0.01);
    source.start(startTime);
    this.scheduledTime = startTime + audioBuffer.duration;
    this.totalSamplesScheduled += float32.length;

    this.sourceNodes.push(source);

    // Trigger start callback on first chunk
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.onStartCallback?.();
    }

    // Clean up finished nodes
    source.onended = () => {
      const index = this.sourceNodes.indexOf(source);
      if (index > -1) this.sourceNodes.splice(index, 1);

      // Check if all audio has finished and stream has ended
      if (this.streamEnded && this.sourceNodes.length === 0 && !this.isPaused) {
        this.onEndCallback?.();
      }
    };
  }

  private processBuffer(forceFlush = false) {
    console.log('[PCM] processBuffer called, forceFlush:', forceFlush, 'isProcessing:', this.isProcessing, 'isPlaying:', this.isPlaying, 'bufferLen:', this.accumulatedBuffer.length);
    if (this.isProcessing || !this.audioContext || !this.gainNode || !this.isPlaying || this.isPaused) {
      console.log('[PCM] processBuffer early return - isProcessing:', this.isProcessing, 'audioContext:', !!this.audioContext, 'gainNode:', !!this.gainNode, 'isPlaying:', this.isPlaying, 'isPaused:', this.isPaused);
      return;
    }
    this.isProcessing = true;

    // Wait for minimum buffer before starting (unless flushing at end)
    const minSamples = forceFlush ? 1 : (this.hasStarted ? this.CHUNK_SIZE_SAMPLES / 2 : this.MIN_BUFFER_SAMPLES);
    console.log('[PCM] minSamples needed:', minSamples, 'hasStarted:', this.hasStarted, 'bufferLen:', this.accumulatedBuffer.length);

    while (this.accumulatedBuffer.length >= minSamples) {
      // Take a chunk from the buffer
      const chunkSize = Math.min(this.CHUNK_SIZE_SAMPLES, this.accumulatedBuffer.length);
      const chunk = this.accumulatedBuffer.slice(0, chunkSize);
      this.accumulatedBuffer = this.accumulatedBuffer.slice(chunkSize);

      const float32 = this.pcmToFloat32(chunk);
      this.scheduleAudioChunk(float32);
    }

    // Flush remaining samples at the end
    if (forceFlush && this.accumulatedBuffer.length > 0) {
      const float32 = this.pcmToFloat32(this.accumulatedBuffer);
      this.scheduleAudioChunk(float32);
      this.accumulatedBuffer = new Int16Array(0);
    }

    this.isProcessing = false;
  }

  async addChunk(pcmData: ArrayBuffer) {
    console.log('[PCM] addChunk called, bytes:', pcmData.byteLength, 'isPlaying:', this.isPlaying);
    if (!this.isPlaying || pcmData.byteLength === 0) return;

    this.appendToBuffer(pcmData);
    console.log('[PCM] Buffer size after append:', this.accumulatedBuffer.length, 'samples');
    this.processBuffer();
  }

  async play(onStart?: () => void, onEnd?: () => void) {
    await this.init();
    this.isPlaying = true;
    this.isPaused = false;
    this.onStartCallback = onStart || null;
    this.onEndCallback = onEnd || null;
  }

  finish() {
    console.log('[PCM] finish() called, totalSamplesScheduled:', this.totalSamplesScheduled, 'bufferLen:', this.accumulatedBuffer.length);
    this.streamEnded = true;
    // Flush any remaining buffered audio
    this.processBuffer(true);

    // If no audio was scheduled at all, call end callback
    if (this.totalSamplesScheduled === 0) {
      console.log('[PCM] No samples scheduled, calling end callback');
      this.onEndCallback?.();
    }
  }

  pause() {
    this.isPaused = true;
    this.audioContext?.suspend();
  }

  resume() {
    this.isPaused = false;
    this.audioContext?.resume();
    this.processBuffer();
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.streamEnded = false;
    this.isProcessing = false;
    this.accumulatedBuffer = new Int16Array(0);
    this.leftoverByte = null;
    this.sourceNodes.forEach(node => {
      try { node.stop(); } catch {}
    });
    this.sourceNodes = [];
    this.hasStarted = false;
    this.totalSamplesScheduled = 0;
  }

  get playing() { return this.isPlaying && !this.isPaused; }
  get paused() { return this.isPaused; }
}

// Global PCM player instance (reused across calls)
let pcmPlayer: PCMStreamPlayer | null = null;

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    isPaused: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const isStoppedRef = useRef<boolean>(false);

  const getSelectedVoice = useTTSSettings((s) => s.getSelectedVoice);

  // STOP - Completely stops and resets
  const stop = useCallback(() => {
    isStoppedRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    pcmPlayer?.stop();

    setState({ isLoading: false, isPlaying: false, isPaused: false, error: null });
  }, []);

  // PAUSE
  const pause = useCallback(() => {
    if (state.isPlaying && pcmPlayer) {
      pcmPlayer.pause();
      setState(s => ({ ...s, isPlaying: false, isPaused: true }));
    }
  }, [state.isPlaying]);

  // RESUME
  const resume = useCallback(() => {
    if (state.isPaused && pcmPlayer) {
      pcmPlayer.resume();
      setState(s => ({ ...s, isPlaying: true, isPaused: false }));
    }
  }, [state.isPaused]);

  // SPEAK - Stream PCM audio for instant playback
  const speak = useCallback(async (text: string) => {
    if (!text.trim()) return;

    stop();
    isStoppedRef.current = false;

    const voice = getSelectedVoice();
    const cleanText = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .trim()
      .slice(0, 4096);

    if (!cleanText) return;

    setState({ isLoading: true, isPlaying: false, isPaused: false, error: null });
    abortRef.current = new AbortController();

    // Check cache first for MP3 (instant playback)
    const cacheKey = getCacheKey(cleanText, voice);
    if (audioCache.has(cacheKey)) {
      try {
        const audio = new Audio(audioCache.get(cacheKey)!);
        audio.onplay = () => setState({ isLoading: false, isPlaying: true, isPaused: false, error: null });
        audio.onended = () => setState(s => ({ ...s, isPlaying: false, isPaused: false }));
        await audio.play();
        return;
      } catch {}
    }

    try {
      // Request PCM format for streaming
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice, format: 'pcm' }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          throw new TTSRateLimitError(data.message || 'Límite de TTS alcanzado');
        }
        throw new Error('TTS failed');
      }

      if (isStoppedRef.current) return;

      // Initialize PCM player
      if (!pcmPlayer) pcmPlayer = new PCMStreamPlayer();

      await pcmPlayer.play(
        () => setState({ isLoading: false, isPlaying: true, isPaused: false, error: null }),
        () => setState(s => ({ ...s, isPlaying: false, isPaused: false }))
      );

      // Stream PCM chunks to player
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      while (true) {
        const { done, value } = await reader.read();

        if (isStoppedRef.current) {
          reader.cancel();
          break;
        }

        if (done) {
          pcmPlayer.finish();
          break;
        }

        if (value && value.byteLength > 0) {
          console.log('[TTS] Received chunk, byteLength:', value.byteLength);
          // Create a proper copy of the chunk data
          const chunkBuffer = new ArrayBuffer(value.byteLength);
          new Uint8Array(chunkBuffer).set(value);
          await pcmPlayer.addChunk(chunkBuffer);
        }
      }

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

  // TOGGLE
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
