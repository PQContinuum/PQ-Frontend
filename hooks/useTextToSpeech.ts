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

export function stopAllTTS() {
  stopListeners.forEach((stop) => stop());
}

// Audio cache for previously synthesized audio
const audioCache = new Map<string, string>();

function getLanguageCode(language: Language): string {
  return language === 'en' ? 'en-US' : 'es-US';
}

function getCacheKey(text: string, voice: string, languageCode: string): string {
  return `${languageCode}:${voice}:${text.slice(0, 100)}:${text.length}`;
}

// ============================================================
// PCM STREAMING AUDIO PLAYER
// Uses Web Audio API with buffering for smooth, low-latency playback
// ============================================================
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

  // PCM format: 24 kHz, 16-bit signed, mono, little-endian
  private readonly SAMPLE_RATE = 24000;
  // Accumulate ~100 ms before starting playback
  private readonly MIN_BUFFER_SAMPLES = 2400;
  // Process in ~200 ms chunks
  private readonly CHUNK_SIZE_SAMPLES = 4800;

  private accumulatedBuffer: Int16Array = new Int16Array(0);
  private totalSamplesScheduled = 0;
  // Leftover byte across chunk boundaries (PCM is 2 bytes/sample)
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
  }

  private appendToBuffer(pcmData: ArrayBuffer) {
    let bytes = new Uint8Array(pcmData);

    if (this.leftoverByte !== null) {
      const combined = new Uint8Array(bytes.length + 1);
      combined[0] = this.leftoverByte;
      combined.set(bytes, 1);
      bytes = combined;
      this.leftoverByte = null;
    }

    if (bytes.length % 2 !== 0) {
      this.leftoverByte = bytes[bytes.length - 1];
      bytes = bytes.slice(0, -1);
    }

    if (bytes.length === 0) return;

    const newData = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
    const merged = new Int16Array(this.accumulatedBuffer.length + newData.length);
    merged.set(this.accumulatedBuffer);
    merged.set(newData, this.accumulatedBuffer.length);
    this.accumulatedBuffer = merged;
  }

  private pcmToFloat32(int16: Int16Array): Float32Array {
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    return float32;
  }

  private scheduleAudioChunk(float32: Float32Array) {
    if (!this.audioContext || !this.gainNode || !this.isPlaying) return;

    const audioBuffer = this.audioContext.createBuffer(1, float32.length, this.SAMPLE_RATE);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    const startTime = Math.max(this.scheduledTime, this.audioContext.currentTime + 0.01);
    source.start(startTime);
    this.scheduledTime = startTime + audioBuffer.duration;
    this.totalSamplesScheduled += float32.length;
    this.sourceNodes.push(source);

    if (!this.hasStarted) {
      this.hasStarted = true;
      this.onStartCallback?.();
    }

    source.onended = () => {
      const idx = this.sourceNodes.indexOf(source);
      if (idx > -1) this.sourceNodes.splice(idx, 1);
      if (this.streamEnded && this.sourceNodes.length === 0 && !this.isPaused) {
        this.onEndCallback?.();
      }
    };
  }

  private processBuffer(forceFlush = false) {
    if (this.isProcessing || !this.audioContext || !this.gainNode || !this.isPlaying || this.isPaused) return;
    this.isProcessing = true;

    const minSamples = forceFlush ? 1 : (this.hasStarted ? this.CHUNK_SIZE_SAMPLES / 2 : this.MIN_BUFFER_SAMPLES);

    while (this.accumulatedBuffer.length >= minSamples) {
      const chunkSize = Math.min(this.CHUNK_SIZE_SAMPLES, this.accumulatedBuffer.length);
      const chunk = this.accumulatedBuffer.slice(0, chunkSize);
      this.accumulatedBuffer = this.accumulatedBuffer.slice(chunkSize);
      this.scheduleAudioChunk(this.pcmToFloat32(chunk));
    }

    if (forceFlush && this.accumulatedBuffer.length > 0) {
      this.scheduleAudioChunk(this.pcmToFloat32(this.accumulatedBuffer));
      this.accumulatedBuffer = new Int16Array(0);
    }

    this.isProcessing = false;
  }

  async addChunk(pcmData: ArrayBuffer) {
    if (!this.isPlaying || pcmData.byteLength === 0) return;
    this.appendToBuffer(pcmData);
    this.processBuffer();
  }

  async play(onStart?: () => void, onEnd?: () => void) {
    await this.init();
    this.isPlaying = true;
    this.isPaused = false;
    this.onStartCallback = onStart ?? null;
    this.onEndCallback = onEnd ?? null;
  }

  finish() {
    this.streamEnded = true;
    this.processBuffer(true);
    if (this.totalSamplesScheduled === 0) {
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
    this.sourceNodes.forEach((node) => { try { node.stop(); } catch {} });
    this.sourceNodes = [];
    this.hasStarted = false;
    this.totalSamplesScheduled = 0;
  }

  get playing() { return this.isPlaying && !this.isPaused; }
  get paused() { return this.isPaused; }
}

// Singleton PCM player reused across calls
let pcmPlayer: PCMStreamPlayer | null = null;

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [state, setState] = useState<TTSState>({
    isLoading: false,
    isPlaying: false,
    isPaused: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const isStoppedRef = useRef(false);

  const getSelectedVoice = useTTSSettings((s) => s.getSelectedVoice);
  const language = useTTSSettings((s) => s.language);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    pcmPlayer?.stop();
    setState({ isLoading: false, isPlaying: false, isPaused: false, error: null });
  }, []);

  const pause = useCallback(() => {
    if (state.isPlaying && pcmPlayer) {
      pcmPlayer.pause();
      setState((s) => ({ ...s, isPlaying: false, isPaused: true }));
    }
  }, [state.isPlaying]);

  const resume = useCallback(() => {
    if (state.isPaused && pcmPlayer) {
      pcmPlayer.resume();
      setState((s) => ({ ...s, isPlaying: true, isPaused: false }));
    }
  }, [state.isPaused]);

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
    abortRef.current = new AbortController();

    // Serve from cache when available
    const cacheKey = getCacheKey(cleanText, voice, languageCode);
    const cachedUrl = audioCache.get(cacheKey);

    try {
      if (cachedUrl) {
        const audio = new Audio(cachedUrl);
        audio.onplay = () => setState({ isLoading: false, isPlaying: true, isPaused: false, error: null });
        audio.onended = () => setState((s) => ({ ...s, isPlaying: false, isPaused: false }));
        await audio.play();
        return;
      }

      // Request PCM format for low-latency streaming
      const response = await ttsApi.generate(
        {
          text: cleanText,
          voice,
          language: languageCode,
          speakingRate: 1.15,
          format: 'pcm',
        },
        abortRef.current.signal,
      );

      if (isStoppedRef.current) return;

      if (!pcmPlayer) pcmPlayer = new PCMStreamPlayer();

      await pcmPlayer.play(
        () => setState({ isLoading: false, isPlaying: true, isPaused: false, error: null }),
        () => setState((s) => ({ ...s, isPlaying: false, isPaused: false })),
      );

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No audio stream available');

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
          const chunkBuffer = new ArrayBuffer(value.byteLength);
          new Uint8Array(chunkBuffer).set(value);
          await pcmPlayer.addChunk(chunkBuffer);
        }
      }
    } catch (error) {
      if (error instanceof Error && (error.name === 'AbortError' || error.message === 'Aborted')) {
        return;
      }

      let errorMessage: string;
      if (error instanceof ApiError) {
        const rawMessage = (error.data as { message?: string })?.message || error.message || '';
        const lowerMsg = rawMessage.toLowerCase();
        if (
          lowerMsg.includes('insufficient_quota') ||
          lowerMsg.includes('quota') ||
          lowerMsg.includes('credit') ||
          lowerMsg.includes('billing') ||
          lowerMsg.includes('limit reached') ||
          lowerMsg.includes('exceeded') ||
          lowerMsg.includes('fondos') ||
          lowerMsg.includes('balance') ||
          lowerMsg.includes('payment')
        ) {
          errorMessage = 'El servicio de voz no está disponible por falta de créditos. Por favor, contacta al administrador.';
        } else if (error.statusCode === 429) {
          errorMessage = 'Límite de solicitudes alcanzado. Espera un momento e intenta de nuevo.';
        } else if (error.statusCode >= 500) {
          errorMessage = 'Error del servidor de voz. Intenta de nuevo más tarde.';
        } else {
          errorMessage = rawMessage || 'Error al generar el audio';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Error de TTS';
      }

      setState({ isLoading: false, isPlaying: false, isPaused: false, error: errorMessage });
    }
  }, [getSelectedVoice, language]);

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
