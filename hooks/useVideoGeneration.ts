'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { videoGenApi, GalleryOptions } from '@/lib/api-client';
import { useGenerationJob, getJobStatusMessage, type GenerationJob } from './useGenerationJobs';
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
  jobId: string | null;
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
  conversationId?: string;
  messageId?: string;
  // Gallery options for public/private sharing
  galleryOptions?: GalleryOptions;
}

type GenerateResult =
  | { success: true; jobId: string }
  | { success: false; error: string };

interface UseVideoGenerationReturn extends VideoGenState {
  usage: VideoGenUsage | null;
  generate: (prompt: string, options?: GenerateOptions) => Promise<GenerateResult>;
  fetchUsage: () => Promise<void>;
  reset: () => void;
  canGenerate: boolean;
  job: GenerationJob | null;
}

export function useVideoGeneration(): UseVideoGenerationReturn {
  const [state, setState] = useState<VideoGenState>({
    isGenerating: false,
    error: null,
    progress: null,
    jobId: null,
    video: null,
  });
  const [usage, setUsage] = useState<VideoGenUsage | null>(null);
  const lastCompletedJobIdRef = useRef<string | null>(null);

  // Use the job polling hook
  const { data: job } = useGenerationJob(state.jobId);

  // Update state based on job status
  useEffect(() => {
    if (!job) return;

    // Avoid processing the same completed job multiple times
    if (job.status === 'completed' && lastCompletedJobIdRef.current === job.id) {
      return;
    }

    const progress = getJobStatusMessage(job);

    if (job.status === 'completed') {
      lastCompletedJobIdRef.current = job.id;

      // Parse input params to get video metadata
      let inputParams: { mode?: VideoGenMode; duration?: VideoGenDuration; aspectRatio?: VideoGenAspectRatio } = {};
      try {
        inputParams = JSON.parse(job.inputParams);
      } catch {
        // ignore parse error
      }

      setState({
        isGenerating: false,
        error: null,
        progress: null,
        jobId: job.id,
        video: {
          url: job.publicUrl || job.resultUrl || '',
          originalUrl: job.resultUrl || undefined,
          duration: (inputParams.duration || '5') as VideoGenDuration,
          aspectRatio: (inputParams.aspectRatio || '16:9') as VideoGenAspectRatio,
          mode: (inputParams.mode || 'text-to-video') as VideoGenMode,
          generationTimeMs: job.generationTimeMs || undefined,
        },
      });
    } else if (job.status === 'failed' || job.status === 'cancelled') {
      setState({
        isGenerating: false,
        error: job.errorMessage || 'Error al generar video',
        progress: null,
        jobId: job.id,
        video: null,
      });
    } else {
      // Still processing
      setState((s) => ({
        ...s,
        progress,
        isGenerating: true,
      }));
    }
  }, [job]);

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

      // Reset last completed job ref for new generation
      lastCompletedJobIdRef.current = null;

      setState({
        isGenerating: true,
        error: null,
        progress: 'Iniciando generación...',
        jobId: null,
        video: null,
      });

      try {
        const data = await videoGenApi.generate({
          prompt: prompt.trim(),
          mode: options.mode || 'text-to-video',
          imageUrl: options.imageUrl,
          duration: options.duration || '5',
          aspectRatio: options.aspectRatio || '16:9',
          generateAudio: options.generateAudio ?? (usage?.audioEnabled ?? true),
          // Gallery options for public/private sharing
          isPublic: options.galleryOptions?.isPublic,
          title: options.galleryOptions?.title,
          description: options.galleryOptions?.description,
          tags: options.galleryOptions?.tags,
        });

        // Job created successfully - update state with jobId
        // The useEffect above will handle polling and state updates
        setState({
          isGenerating: true,
          error: null,
          progress: data.message || 'Video en proceso de generación...',
          jobId: data.jobId,
          video: null,
        });

        // Update usage if returned
        if (data.usage) {
          setUsage((prev) =>
            prev
              ? {
                  ...prev,
                  remainingToday: prev.dailyLimit - data.usage.dailyCount,
                  remainingMonth: prev.monthlyLimit - data.usage.monthlyCount,
                  todayCount: data.usage.dailyCount,
                  monthCount: data.usage.monthlyCount,
                }
              : null
          );
        }

        return { success: true, jobId: data.jobId };

      } catch (error) {
        console.error('[useVideoGeneration] Error:', error);
        // Network error - but the job might have been created on the server
        // We return a more graceful message that indicates we should check pending jobs
        const errorMsg = error instanceof Error
          ? error.message
          : 'Error de conexión. Tu video puede estar generándose en segundo plano.';
        setState({
          isGenerating: false,
          error: errorMsg,
          progress: null,
          jobId: null, // We don't have jobId because request failed
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
      const data = await videoGenApi.getUsage();
      if (data.usage) {
        setUsage({
          todayCount: data.usage.dailyCount,
          monthCount: data.usage.monthlyCount,
          dailyLimit: data.usage.dailyLimit,
          monthlyLimit: data.usage.monthlyLimit,
          remainingToday: data.usage.dailyLimit - data.usage.dailyCount,
          remainingMonth: data.usage.monthlyLimit - data.usage.monthlyCount,
          allowedDurations: data.usage.allowedDurations as VideoGenDuration[],
          allowedAspectRatios: data.usage.allowedAspectRatios as VideoGenAspectRatio[],
          allowedModes: data.usage.allowedModes as VideoGenMode[],
          audioEnabled: data.usage.audioEnabled,
          planName: data.usage.planName,
        });
      }
    } catch (error) {
      console.error('[useVideoGeneration] Error fetching usage:', error);
    }
  }, []);

  const reset = useCallback(() => {
    lastCompletedJobIdRef.current = null;
    setState({
      isGenerating: false,
      error: null,
      progress: null,
      jobId: null,
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
    job: job || null,
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
