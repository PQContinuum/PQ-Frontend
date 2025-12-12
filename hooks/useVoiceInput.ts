'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceInputOptions {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
  maxDuration?: number; // Maximum recording duration in seconds
}

interface UseVoiceInputReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  error: string | null;
  duration: number; // Current recording duration in seconds
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  toggleRecording: () => Promise<void>;
  cancelRecording: () => void;
  isSupported: boolean;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    onTranscript,
    onError,
    language = 'es',
    maxDuration = 120, // 2 minutes max
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if browser supports MediaRecorder
  useEffect(() => {
    const supported = typeof window !== 'undefined' &&
      'MediaRecorder' in window &&
      'mediaDevices' in navigator;
    setIsSupported(supported);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = 'Tu navegador no soporta grabación de audio';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      setError(null);
      setDuration(0);
      audioChunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Determine the best supported format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onerror = () => {
        const errorMsg = 'Error durante la grabación';
        setError(errorMsg);
        onError?.(errorMsg);
        setIsRecording(false);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Set max duration timeout
      maxDurationTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, maxDuration * 1000);

    } catch (err) {
      console.error('[useVoiceInput] Error starting recording:', err);
      let errorMsg = 'No se pudo acceder al micrófono';

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          errorMsg = 'Permiso de micrófono denegado. Habilita el acceso en la configuración de tu navegador.';
        } else if (err.name === 'NotFoundError') {
          errorMsg = 'No se encontró ningún micrófono conectado';
        } else if (err.name === 'NotReadableError') {
          errorMsg = 'El micrófono está siendo usado por otra aplicación';
        }
      }

      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [isSupported, maxDuration, onError]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    // Clear timers
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      setIsRecording(false);
      return null;
    }

    return new Promise((resolve) => {
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        setIsRecording(false);

        // Check if we have audio data
        if (audioChunksRef.current.length === 0) {
          setError('No se capturó audio');
          resolve(null);
          return;
        }

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        // Check minimum size (at least 1KB for meaningful audio)
        if (audioBlob.size < 1024) {
          setError('Grabación muy corta');
          resolve(null);
          return;
        }

        // Send to transcription API
        setIsTranscribing(true);
        setError(null);

        try {
          const formData = new FormData();

          // Determine file extension based on mime type
          const extension = mediaRecorder.mimeType.includes('webm') ? 'webm'
            : mediaRecorder.mimeType.includes('mp4') ? 'm4a'
            : 'wav';

          formData.append('audio', audioBlob, `recording.${extension}`);
          formData.append('language', 'es');

          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error al transcribir');
          }

          const data = await response.json();
          const transcript = data.text?.trim();

          if (transcript) {
            onTranscript?.(transcript);
            resolve(transcript);
          } else {
            setError('No se detectó habla');
            resolve(null);
          }
        } catch (err) {
          console.error('[useVoiceInput] Transcription error:', err);
          const errorMsg = err instanceof Error ? err.message : 'Error al transcribir el audio';
          setError(errorMsg);
          onError?.(errorMsg);
          resolve(null);
        } finally {
          setIsTranscribing(false);
        }
      };

      // Stop recording
      mediaRecorder.stop();
    });
  }, [onTranscript, onError]);

  const cancelRecording = useCallback(() => {
    // Clear timers
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear audio chunks
    audioChunksRef.current = [];

    setIsRecording(false);
    setDuration(0);
    setError(null);
  }, []);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    error,
    duration,
    startRecording,
    stopRecording,
    toggleRecording,
    cancelRecording,
    isSupported,
  };
}

/**
 * Format duration in MM:SS format
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
