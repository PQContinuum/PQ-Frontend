'use client';

import { useState, useCallback, useEffect } from 'react';
import { imageGenApi, apiPostStream, API_BASE_URL, getAuthHeaders } from '@/lib/api-client';
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
  // gpt-image-1 specific
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

  // Generate an image (non-streaming)
  const generate = useCallback(
    async (prompt: string, options: GenerateOptions = {}): Promise<GenerateResult> => {
      if (!prompt.trim()) {
        const errorMsg = 'El prompt es requerido';
        setState((s) => ({ ...s, error: errorMsg }));
        return { success: false, error: errorMsg };
      }

      setState({ isGenerating: true, error: null, image: null, partialImage: null, partialIndex: -1 });

      try {
        const data = await imageGenApi.generate({
          prompt: prompt.trim(),
          quality: options.quality || 'low',
          size: options.size || '1024x1024',
          stylePreset: options.stylePreset || 'auto',
          referenceImageUrl: options.referenceImageUrl,
          imageStrength: options.imageStrength,
        });

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
        console.error('[useImageGeneration] Error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Error al generar imagen';
        setState({
          isGenerating: false,
          error: errorMsg,
          image: null,
          partialImage: null,
          partialIndex: -1,
        });
        return { success: false, error: errorMsg };
      }
    },
    []
  );

  // Generate with streaming (partial images)
  const generateWithStreaming = useCallback(
    async (
      prompt: string,
      options: GenerateOptions = {},
      onPartialImage?: (image: string, index: number) => void
    ): Promise<GenerateResult> => {
      if (!prompt.trim()) {
        const errorMsg = 'El prompt es requerido';
        setState((s) => ({ ...s, error: errorMsg }));
        return { success: false, error: errorMsg };
      }

      setState({ isGenerating: true, error: null, image: null, partialImage: null, partialIndex: -1 });

      try {
        const response = await apiPostStream('/image-gen/stream', {
          prompt: prompt.trim(),
          quality: options.quality || 'low',
          size: options.size || '1024x1024',
          stylePreset: options.stylePreset || 'auto',
          referenceImageUrl: options.referenceImageUrl,
          imageStrength: options.imageStrength,
        });

        // Check if it's a streaming response
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('text/event-stream')) {
          // Non-streaming fallback (plan doesn't support streaming)
          const data = await response.json();
          const imageResult = {
            url: data.image?.url || data.imageUrl,
            revisedPrompt: data.image?.revisedPrompt || data.revisedPrompt,
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

          return { success: true, url: imageResult.url, revisedPrompt: imageResult.revisedPrompt };
        }

        // Process streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let finalResult: GenerateResult | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);

                if (parsed.event === 'partial' && parsed.image) {
                  // Update partial image state
                  setState((s) => ({
                    ...s,
                    partialImage: parsed.image,
                    partialIndex: parsed.index,
                  }));
                  // Callback for external handling
                  onPartialImage?.(parsed.image, parsed.index);
                }

                if (parsed.event === 'complete' && parsed.image) {
                  const imageResult = {
                    url: parsed.image.url,
                    revisedPrompt: parsed.image.revisedPrompt,
                    size: parsed.image.size,
                    quality: parsed.image.quality,
                    stylePreset: parsed.image.stylePreset,
                  };

                  setState({
                    isGenerating: false,
                    error: null,
                    image: imageResult,
                    partialImage: null,
                    partialIndex: -1,
                  });

                  if (parsed.usage) {
                    setUsage((prev) =>
                      prev
                        ? {
                            ...prev,
                            remainingToday: parsed.usage.remainingToday,
                            remainingMonth: parsed.usage.remainingMonth,
                            todayCount: prev.dailyLimit - parsed.usage.remainingToday,
                            monthCount: prev.monthlyLimit - parsed.usage.remainingMonth,
                          }
                        : null
                    );
                  }

                  finalResult = { success: true, url: imageResult.url, revisedPrompt: imageResult.revisedPrompt };
                }

                if (parsed.event === 'error') {
                  const errorMsg = parsed.error || 'Error al generar imagen';
                  setState({
                    isGenerating: false,
                    error: errorMsg,
                    image: null,
                    partialImage: null,
                    partialIndex: -1,
                  });
                  finalResult = { success: false, error: errorMsg };
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        return finalResult || { success: false, error: 'No se recibió respuesta' };
      } catch (error) {
        console.error('[useImageGeneration] Streaming error:', error);
        const errorMsg = error instanceof Error ? error.message : 'Error de conexión';
        setState({
          isGenerating: false,
          error: errorMsg,
          image: null,
          partialImage: null,
          partialIndex: -1,
        });
        return { success: false, error: errorMsg };
      }
    },
    []
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
          premiumStyles: false,
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
