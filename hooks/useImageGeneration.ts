'use client';

import { useState, useCallback, useEffect } from 'react';
import { imageGenApi, GalleryOptions, ApiError } from '@/lib/api-client';
import type { ImageGenQuality, ImageGenSize } from '@/lib/memory/plan-limits';

interface ImageGenState {
  isGenerating: boolean;
  error: string | null;
  image: {
    url: string;
    revisedPrompt?: string;
    size: string;
    quality: string;
    stylePreset?: string;
  } | null;
  // Streaming state
  partialImage: string | null;
  partialIndex: number;
}

interface ImageGenUsage {
  todayCount: number;
  monthCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  remainingToday: number;
  remainingMonth: number;
  allowedQualities: ImageGenQuality[];
  allowedSizes: ImageGenSize[];
  maxResolution: string;
  planName: string;
  // Continuum Canvas specific
  streamingEnabled: boolean;
  partialImages: number;
  premiumStyles: boolean;
}

interface GenerateOptions {
  quality?: ImageGenQuality;
  size?: ImageGenSize;
  stylePreset?: string;
  stream?: boolean;
  referenceImageUrl?: string;
  imageStrength?: number;
  // Gallery options for public/private sharing
  galleryOptions?: GalleryOptions;
}

type GenerateResult =
  | { success: true; url: string; revisedPrompt?: string }
  | { success: false; error: string };

interface UseImageGenerationReturn extends ImageGenState {
  usage: ImageGenUsage | null;
  generate: (prompt: string, options?: GenerateOptions) => Promise<GenerateResult>;
  generateWithStreaming: (
    prompt: string,
    options?: GenerateOptions,
    onPartialImage?: (image: string, index: number) => void
  ) => Promise<GenerateResult>;
  fetchUsage: () => Promise<void>;
  reset: () => void;
  canGenerate: boolean;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [state, setState] = useState<ImageGenState>({
    isGenerating: false,
    error: null,
    image: null,
    partialImage: null,
    partialIndex: -1,
  });
  const [usage, setUsage] = useState<ImageGenUsage | null>(null);

  // Generate an image (non-streaming) with retry for mobile network errors
  const generate = useCallback(
    async (prompt: string, options: GenerateOptions = {}): Promise<GenerateResult> => {
      if (!prompt.trim()) {
        const errorMsg = 'El prompt es requerido';
        setState((s) => ({ ...s, error: errorMsg }));
        return { success: false, error: errorMsg };
      }

      setState({ isGenerating: true, error: null, image: null, partialImage: null, partialIndex: -1 });

      const request = {
        prompt: prompt.trim(),
        quality: options.quality || 'low',
        size: options.size || '1024x1024',
        stylePreset: options.stylePreset || 'auto',
        referenceImageUrl: options.referenceImageUrl,
        imageStrength: options.imageStrength,
        isPublic: options.galleryOptions?.isPublic,
        title: options.galleryOptions?.title,
        description: options.galleryOptions?.description,
        tags: options.galleryOptions?.tags,
      };

      // Retry logic: 1 retry for network errors (TypeError: Load failed on Safari/mobile)
      const MAX_RETRIES = 1;
      let lastError: unknown;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const data = await imageGenApi.generate(request);

          const imageResult = {
            url: data.imageUrl,
            revisedPrompt: data.revisedPrompt,
            size: options.size || '1024x1024',
            quality: options.quality || 'low',
            stylePreset: options.stylePreset,
          };

          setState({
            isGenerating: false,
            error: null,
            image: imageResult,
            partialImage: null,
            partialIndex: -1,
          });

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

          return { success: true, url: imageResult.url, revisedPrompt: imageResult.revisedPrompt };
        } catch (error) {
          lastError = error;

          // Only retry on network errors (TypeError: Load failed / Failed to fetch)
          // These are transient errors common on mobile Safari when the app goes to background
          const isNetworkError = error instanceof TypeError &&
            (error.message === 'Load failed' || error.message === 'Failed to fetch' || error.message === 'NetworkError when attempting to fetch resource.');

          if (isNetworkError && attempt < MAX_RETRIES) {
            console.warn(`[useImageGeneration] Network error on attempt ${attempt + 1}, retrying...`, error.message);
            // Brief delay before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }

          break;
        }
      }

      console.error('[useImageGeneration] Error:', lastError);

      // Determine user-friendly error message
      let errorMsg: string;
      if (lastError instanceof ApiError) {
        errorMsg = lastError.userMessage;
      } else if (lastError instanceof TypeError &&
        (lastError.message === 'Load failed' || lastError.message === 'Failed to fetch' || lastError.message === 'NetworkError when attempting to fetch resource.')) {
        // Mobile-specific network error: Safari kills fetch when app goes to background
        errorMsg = 'Error de conexión. Asegúrate de mantener la app abierta mientras se genera la imagen e intenta de nuevo.';
      } else if (lastError instanceof Error) {
        errorMsg = lastError.message;
      } else {
        errorMsg = 'Error al generar imagen';
      }

      setState({
        isGenerating: false,
        error: errorMsg,
        image: null,
        partialImage: null,
        partialIndex: -1,
      });
      return { success: false, error: errorMsg };
    },
    []
  );

  // Generate with streaming (falls back to regular generation since Continuum Canvas doesn't support partial images)
  const generateWithStreaming = useCallback(
    async (
      prompt: string,
      options: GenerateOptions = {},
      _onPartialImage?: (image: string, index: number) => void
    ): Promise<GenerateResult> => {
      // Continuum Canvas doesn't support partial image streaming, so we use regular generation
      return generate(prompt, options);
    },
    [generate]
  );

  // Fetch usage statistics
  const fetchUsage = useCallback(async () => {
    try {
      const data = await imageGenApi.getUsage();
      if (data.usage) {
        setUsage({
          todayCount: data.usage.dailyCount,
          monthCount: data.usage.monthlyCount,
          dailyLimit: data.usage.dailyLimit,
          monthlyLimit: data.usage.monthlyLimit,
          remainingToday: data.usage.dailyLimit - data.usage.dailyCount,
          remainingMonth: data.usage.monthlyLimit - data.usage.monthlyCount,
          allowedQualities: data.usage.allowedQualities as ImageGenQuality[],
          allowedSizes: data.usage.allowedSizes as ImageGenSize[],
          maxResolution: '1536x1024',
          planName: data.usage.planName,
          streamingEnabled: false,
          partialImages: 0,
          premiumStyles: data.usage.premiumStyles ?? false,
        });
      }
    } catch (error) {
      console.error('[useImageGeneration] Error fetching usage:', error);
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({ isGenerating: false, error: null, image: null, partialImage: null, partialIndex: -1 });
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
    generateWithStreaming,
    fetchUsage,
    reset,
    canGenerate,
  };
}

/**
 * Format usage for display
 */
export function formatImageGenUsage(usage: ImageGenUsage | null): string {
  if (!usage) return 'Cargando...';
  return `${usage.todayCount}/${usage.dailyLimit} hoy | ${usage.monthCount}/${usage.monthlyLimit} este mes`;
}

/**
 * Get quality label in Spanish
 */
export function getQualityLabel(quality: ImageGenQuality): string {
  switch (quality) {
    case 'low': return 'Rápida';
    case 'medium': return 'Balanceada';
    case 'high': return 'Alta Calidad';
    default: return quality;
  }
}

/**
 * Get size label
 */
export function getSizeLabel(size: ImageGenSize): string {
  switch (size) {
    case '1024x1024':
      return 'Cuadrada (1:1)';
    case '1024x1536':
      return 'Vertical (2:3)';
    case '1536x1024':
      return 'Horizontal (3:2)';
    case 'auto':
      return 'Automático';
    default:
      return size;
  }
}
