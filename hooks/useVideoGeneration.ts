'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  VideoGenDuration,
  VideoGenAspectRatio,
  VideoGenMode,
} from '@/lib/memory/plan-limits';

// Re-export types for convenience
export type { VideoGenDuration as VideoDuration } from '@/lib/memory/plan-limits';
export type { VideoGenAspectRatio as VideoAspectRatio } from '@/lib/memory/plan-limits';
export type { VideoGenMode as VideoMode } from '@/lib/memory/plan-limits';

interface VideoGenState {
  isGenerating: boolean;
  error: string | null;
  progress: string | null;
  video: {
    url: string;
    originalUrl?: string;
    duration: VideoGenDuration;
    aspectRatio: VideoGenAspectRatio;
    mode: VideoGenMode;
    generationTimeMs?: number;
  } | null;
}

interface VideoGenUsage {
  todayCount: number;
  monthCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  remainingToday: number;
  remainingMonth: number;
  allowedDurations: VideoGenDuration[];
  allowedAspectRatios: VideoGenAspectRatio[];
  allowedModes: VideoGenMode[];
  audioEnabled: boolean;
  planName: string;
}

interface GenerateOptions {
  mode?: VideoGenMode;
  imageUrl?: string;
  duration?: VideoGenDuration;
  aspectRatio?: VideoGenAspectRatio;
  generateAudio?: boolean;
}

type GenerateResult =
  | { success: true; url: string }
  | { success: false; error: string };

interface UseVideoGenerationReturn extends VideoGenState {
  usage: VideoGenUsage | null;
  generate: (prompt: string, options?: GenerateOptions) => Promise<GenerateResult>;
  fetchUsage: () => Promise<void>;
  reset: () => void;
  canGenerate: boolean;
}

export function useVideoGeneration(): UseVideoGenerationReturn {
  const [state, setState] = useState<VideoGenState>({
    isGenerating: false,
    error: null,
    progress: null,
    video: null,
  });
  const [usage, setUsage] = useState<VideoGenUsage | null>(null);

  const generate = useCallback(
    async (prompt: string, options: GenerateOptions = {}): Promise<GenerateResult> => {
      if (!prompt.trim()) {
        const errorMsg = 'El prompt es requerido';
        setState((s) => ({ ...s, error: errorMsg }));
        return { success: false, error: errorMsg };
      }

      // Validate image-to-video mode
      if (options.mode === 'image-to-video' && !options.imageUrl) {
        const errorMsg = 'Se requiere una imagen para este modo';
        setState((s) => ({ ...s, error: errorMsg }));
        return { success: false, error: errorMsg };
      }

      // Check if mode is allowed by plan
      if (usage && options.mode && !usage.allowedModes.includes(options.mode)) {
        const errorMsg = 'Tu plan no incluye este modo de generación';
        setState((s) => ({ ...s, error: errorMsg }));
        return { success: false, error: errorMsg };
      }

      // Check if duration is allowed by plan
      if (usage && options.duration && !usage.allowedDurations.includes(options.duration)) {
        const errorMsg = 'Tu plan no permite esta duración';
        setState((s) => ({ ...s, error: errorMsg }));
        return { success: false, error: errorMsg };
      }

      setState({
        isGenerating: true,
        error: null,
        progress: 'Iniciando generación...',
        video: null,
      });

      try {
        // Update progress
        setState((s) => ({ ...s, progress: 'Enviando solicitud a Kling V2.6...' }));

        const response = await fetch('/api/video-gen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt.trim(),
            mode: options.mode || 'text-to-video',
            imageUrl: options.imageUrl,
            duration: options.duration || '5',
            aspectRatio: options.aspectRatio || '16:9',
            generateAudio: options.generateAudio ?? (usage?.audioEnabled ?? true),
          }),
        });

        // Update progress during generation
        setState((s) => ({ ...s, progress: 'Generando video (puede tomar 1-3 minutos)...' }));

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.error || data.message || 'Error al generar video';
          setState({
            isGenerating: false,
            error: errorMsg,
            progress: null,
            video: null,
          });

          // Update usage if returned
          if (data.usage) {
            setUsage((prev) =>
              prev
                ? {
                    ...prev,
                    todayCount: data.usage.todayCount ?? prev.todayCount,
                    monthCount: data.usage.monthCount ?? prev.monthCount,
                    remainingToday: Math.max(0, prev.dailyLimit - (data.usage.todayCount ?? prev.todayCount)),
                    remainingMonth: Math.max(0, prev.monthlyLimit - (data.usage.monthCount ?? prev.monthCount)),
                  }
                : null
            );
          }

          return { success: false, error: errorMsg };
        }

        const videoResult = {
          url: data.video.url,
          originalUrl: data.video.originalUrl,
          duration: data.video.duration as VideoGenDuration,
          aspectRatio: data.video.aspectRatio as VideoGenAspectRatio,
          mode: data.video.mode as VideoGenMode,
          generationTimeMs: data.video.generationTimeMs,
        };

        setState({
          isGenerating: false,
          error: null,
          progress: null,
          video: videoResult,
        });

        // Update usage if returned
        if (data.usage) {
          setUsage((prev) =>
            prev
              ? {
                  ...prev,
                  remainingToday: data.usage.remainingToday,
                  remainingMonth: data.usage.remainingMonth,
                  todayCount: prev.dailyLimit - data.usage.remainingToday,
                  monthCount: prev.monthlyLimit - data.usage.remainingMonth,
                }
              : null
          );
        }

        return { success: true, url: videoResult.url };

      } catch (error) {
        console.error('[useVideoGeneration] Error:', error);
        const errorMsg = 'Error de conexión';
        setState({
          isGenerating: false,
          error: errorMsg,
          progress: null,
          video: null,
        });
        return { success: false, error: errorMsg };
      }
    },
    [usage]
  );

  // Fetch usage statistics
  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/video-gen');
      if (response.ok) {
        const data = await response.json();
        if (data.usage) {
          setUsage(data.usage);
        }
      }
    } catch (error) {
      console.error('[useVideoGeneration] Error fetching usage:', error);
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      error: null,
      progress: null,
      video: null,
    });
  }, []);

  // Fetch usage on mount
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Calculate if user can generate
  const canGenerate = usage ? usage.remainingToday > 0 && usage.remainingMonth > 0 : true;

  return {
    ...state,
    usage,
    generate,
    fetchUsage,
    reset,
    canGenerate,
  };
}

/**
 * Format usage for display
 */
export function formatVideoGenUsage(usage: VideoGenUsage | null): string {
  if (!usage) return 'Cargando...';
  return `${usage.todayCount}/${usage.dailyLimit} hoy | ${usage.monthCount}/${usage.monthlyLimit} este mes`;
}

/**
 * Video aspect ratio options with labels
 */
export const VIDEO_ASPECT_RATIOS: { value: VideoGenAspectRatio; label: string; icon: string }[] = [
  { value: '16:9', label: 'Horizontal', icon: '▬' },
  { value: '9:16', label: 'Vertical', icon: '▮' },
  { value: '1:1', label: 'Cuadrado', icon: '■' },
];

/**
 * Video duration options
 */
export const VIDEO_DURATIONS: { value: VideoGenDuration; label: string; description: string }[] = [
  { value: '5', label: '5s', description: 'Clip corto' },
  { value: '10', label: '10s', description: 'Clip largo' },
];

/**
 * Video mode options
 */
export const VIDEO_MODES: { value: VideoGenMode; label: string; description: string; icon: string }[] = [
  { value: 'text-to-video', label: 'Texto', description: 'Genera desde una descripción', icon: '✍️' },
  { value: 'image-to-video', label: 'Imagen', description: 'Anima una imagen', icon: '🖼️' },
];
