'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ImageGenQuality, ImageGenSize, ImageGenStyle } from '@/lib/memory/plan-limits';

interface ImageGenState {
  isGenerating: boolean;
  error: string | null;
  image: {
    url: string;
    revisedPrompt?: string;
    size: string;
    quality: string;
  } | null;
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
}

interface GenerateOptions {
  quality?: ImageGenQuality;
  size?: ImageGenSize;
  style?: ImageGenStyle;
}

interface UseImageGenerationReturn extends ImageGenState {
  usage: ImageGenUsage | null;
  generate: (prompt: string, options?: GenerateOptions) => Promise<{ url: string; revisedPrompt?: string } | null>;
  fetchUsage: () => Promise<void>;
  reset: () => void;
  canGenerate: boolean;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [state, setState] = useState<ImageGenState>({
    isGenerating: false,
    error: null,
    image: null,
  });
  const [usage, setUsage] = useState<ImageGenUsage | null>(null);

  // Generate an image
  const generate = useCallback(
    async (prompt: string, options: GenerateOptions = {}) => {
      if (!prompt.trim()) {
        setState((s) => ({ ...s, error: 'El prompt es requerido' }));
        return null;
      }

      setState({ isGenerating: true, error: null, image: null });

      try {
        const response = await fetch('/api/image-gen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt.trim(),
            quality: options.quality || 'standard',
            size: options.size || '1024x1024',
            style: options.style || 'vivid',
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setState({
            isGenerating: false,
            error: data.message || data.error || 'Error al generar imagen',
            image: null,
          });

          // Update usage if provided in error response
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

          return null;
        }

        const imageResult = {
          url: data.image.url,
          revisedPrompt: data.image.revisedPrompt,
          size: data.image.size,
          quality: data.image.quality,
        };

        setState({
          isGenerating: false,
          error: null,
          image: imageResult,
        });

        // Update usage from response
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

        return imageResult;
      } catch (error) {
        console.error('[useImageGeneration] Error:', error);
        setState({
          isGenerating: false,
          error: 'Error de conexión',
          image: null,
        });
        return null;
      }
    },
    []
  );

  // Fetch usage statistics
  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/image-gen');
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('[useImageGeneration] Error fetching usage:', error);
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({ isGenerating: false, error: null, image: null });
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
export function formatImageGenUsage(usage: ImageGenUsage | null): string {
  if (!usage) return 'Cargando...';
  return `${usage.todayCount}/${usage.dailyLimit} hoy | ${usage.monthCount}/${usage.monthlyLimit} este mes`;
}

/**
 * Get quality label in Spanish
 */
export function getQualityLabel(quality: ImageGenQuality): string {
  return quality === 'hd' ? 'Alta Definición' : 'Estándar';
}

/**
 * Get size label
 */
export function getSizeLabel(size: ImageGenSize): string {
  switch (size) {
    case '1024x1024':
      return 'Cuadrada (1024×1024)';
    case '1024x1792':
      return 'Vertical (1024×1792)';
    case '1792x1024':
      return 'Horizontal (1792×1024)';
    default:
      return size;
  }
}

/**
 * Get style label in Spanish
 */
export function getStyleLabel(style: ImageGenStyle): string {
  return style === 'vivid' ? 'Vívido' : 'Natural';
}
