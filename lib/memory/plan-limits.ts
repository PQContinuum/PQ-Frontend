/**
 * TIPOS Y CONSTANTES FRONTEND PARA PLANES
 * =========================================
 *
 * IMPORTANTE: La fuente de verdad para límites de plan es el BACKEND.
 * Ver: Continuum-Backend/src/common/constants/plan-limits.constants.ts
 *
 * Este archivo contiene SOLO tipos TypeScript usados por los hooks del frontend.
 * Los valores reales de límites se obtienen de los endpoints:
 * - GET /api/v1/users/me/usage (uso consolidado)
 * - GET /api/v1/billing/plan-features (features por plan)
 * - GET /api/v1/image-gen (uso de imágenes)
 * - GET /api/v1/video-gen (uso de videos)
 *
 * NO modifiques los valores numéricos aquí — cámbialos en el backend.
 */

export type PlanName = 'Basic' | 'Pro' | 'Premium' | 'Enterprise';

// ============================================================================
// TTS (Text-to-Speech) LIMITS
// ============================================================================

export type TTSPlanLimits = {
  maxTTSPerDay: number;
  maxTTSPerMonth: number;
  ttsEnabled: boolean;
  estimatedMaxCostUSD: number;
};

export const TTS_LIMITS: Record<PlanName, TTSPlanLimits> = {
  Basic: {
    maxTTSPerDay: 20,
    maxTTSPerMonth: 600,
    ttsEnabled: true,
    estimatedMaxCostUSD: 6.00,
  },
  Pro: {
    maxTTSPerDay: 50,
    maxTTSPerMonth: 1500,
    ttsEnabled: true,
    estimatedMaxCostUSD: 15.00,
  },
  Premium: {
    maxTTSPerDay: 150,
    maxTTSPerMonth: 4500,
    ttsEnabled: true,
    estimatedMaxCostUSD: 45.00,
  },
  Enterprise: {
    maxTTSPerDay: Infinity,
    maxTTSPerMonth: Infinity,
    ttsEnabled: true,
    estimatedMaxCostUSD: -1,
  },
};

export function getTTSLimits(planName: PlanName | null | undefined): TTSPlanLimits {
  if (!planName || !(planName in TTS_LIMITS)) {
    return TTS_LIMITS.Basic;
  }
  return TTS_LIMITS[planName];
}

// ============================================================================
// IMAGE GENERATION (Continuum Canvas) LIMITS
// ============================================================================

export type ImageGenQuality = 'low' | 'medium' | 'high';
export type ImageGenSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';
export type ImageStylePresetId = 'auto' | 'ghibli' | 'pixar' | 'photo' | 'anime' | 'cinematic' | 'watercolor' | 'oil' | 'minimalist' | 'retro' | 'comic' | 'concept';
export type ImageGenStyle = 'vivid' | 'natural';

export type ImageGenPlanLimits = {
  maxImagesPerDay: number;
  maxImagesPerMonth: number;
  imageGenEnabled: boolean;
  allowedModels: ('continuum-canvas')[];
  allowedQualities: ImageGenQuality[];
  maxResolution: ImageGenSize;
  premiumStyles: boolean;
  estimatedMaxCostUSD: number;
};

export const IMAGE_GEN_LIMITS: Record<PlanName, ImageGenPlanLimits> = {
  Basic: {
    maxImagesPerDay: 15,
    maxImagesPerMonth: 150,
    imageGenEnabled: true,
    allowedModels: ['continuum-canvas'],
    allowedQualities: ['low', 'medium'],
    maxResolution: '1024x1024',
    premiumStyles: false,
    estimatedMaxCostUSD: 4.50,
  },
  Pro: {
    maxImagesPerDay: 35,
    maxImagesPerMonth: 400,
    imageGenEnabled: true,
    allowedModels: ['continuum-canvas'],
    allowedQualities: ['low', 'medium', 'high'],
    maxResolution: '1536x1024',
    premiumStyles: true,
    estimatedMaxCostUSD: 24.00,
  },
  Premium: {
    maxImagesPerDay: 60,
    maxImagesPerMonth: 700,
    imageGenEnabled: true,
    allowedModels: ['continuum-canvas'],
    allowedQualities: ['low', 'medium', 'high'],
    maxResolution: '1536x1024',
    premiumStyles: true,
    estimatedMaxCostUSD: 56.00,
  },
  Enterprise: {
    maxImagesPerDay: 100,
    maxImagesPerMonth: 1500,
    imageGenEnabled: true,
    allowedModels: ['continuum-canvas'],
    allowedQualities: ['low', 'medium', 'high'],
    maxResolution: '1536x1024',
    premiumStyles: true,
    estimatedMaxCostUSD: 100.00,
  },
};

export function getImageGenLimits(planName: PlanName | null | undefined): ImageGenPlanLimits {
  if (!planName || !(planName in IMAGE_GEN_LIMITS)) {
    return IMAGE_GEN_LIMITS.Basic;
  }
  return IMAGE_GEN_LIMITS[planName];
}

export function calculateImageCost(
  quality: ImageGenQuality,
  size: ImageGenSize
): number {
  const isSquare = size === '1024x1024' || size === 'auto';

  const COSTS_SQUARE: Record<ImageGenQuality, number> = {
    'low': 0.02,
    'medium': 0.04,
    'high': 0.08,
  };

  const COSTS_RECTANGLE: Record<ImageGenQuality, number> = {
    'low': 0.04,
    'medium': 0.08,
    'high': 0.16,
  };

  return isSquare ? COSTS_SQUARE[quality] : COSTS_RECTANGLE[quality];
}

export function getAllowedSizes(maxResolution: ImageGenSize): ImageGenSize[] {
  if (maxResolution === '1536x1024' || maxResolution === '1024x1536') {
    return ['1024x1024', '1024x1536', '1536x1024'];
  }
  if (maxResolution === 'auto') {
    return ['1024x1024', '1024x1536', '1536x1024', 'auto'];
  }
  return ['1024x1024'];
}

export function getQualityLabel(quality: ImageGenQuality): string {
  switch (quality) {
    case 'low': return 'Rápida';
    case 'medium': return 'Balanceada';
    case 'high': return 'Alta Calidad';
    default: return quality;
  }
}

export function getQualityDescription(quality: ImageGenQuality): string {
  switch (quality) {
    case 'low': return 'Generación rápida, ideal para borradores';
    case 'medium': return 'Balance entre velocidad y calidad';
    case 'high': return 'Máxima calidad y detalle';
    default: return '';
  }
}

// ============================================================================
// VIDEO GENERATION LIMITS
// ============================================================================

export type VideoGenDuration = '5' | '10';
export type VideoGenAspectRatio = '16:9' | '9:16' | '1:1';
export type VideoGenMode = 'text-to-video' | 'image-to-video';

export type VideoGenPlanLimits = {
  maxVideosPerDay: number;
  maxVideosPerMonth: number;
  videoGenEnabled: boolean;
  allowedDurations: VideoGenDuration[];
  allowedAspectRatios: VideoGenAspectRatio[];
  allowedModes: VideoGenMode[];
  audioEnabled: boolean;
  estimatedMaxCostUSD: number;
};

export const VIDEO_GEN_LIMITS: Record<PlanName, VideoGenPlanLimits> = {
  Basic: {
    maxVideosPerDay: 2,
    maxVideosPerMonth: 10,
    videoGenEnabled: true,
    allowedDurations: ['5'],
    allowedAspectRatios: ['16:9', '9:16', '1:1'],
    allowedModes: ['text-to-video', 'image-to-video'],
    audioEnabled: true,
    estimatedMaxCostUSD: 4.00,
  },
  Pro: {
    maxVideosPerDay: 5,
    maxVideosPerMonth: 30,
    videoGenEnabled: true,
    allowedDurations: ['5', '10'],
    allowedAspectRatios: ['16:9', '9:16', '1:1'],
    allowedModes: ['text-to-video', 'image-to-video'],
    audioEnabled: true,
    estimatedMaxCostUSD: 24.00,
  },
  Premium: {
    maxVideosPerDay: 15,
    maxVideosPerMonth: 100,
    videoGenEnabled: true,
    allowedDurations: ['5', '10'],
    allowedAspectRatios: ['16:9', '9:16', '1:1'],
    allowedModes: ['text-to-video', 'image-to-video'],
    audioEnabled: true,
    estimatedMaxCostUSD: 80.00,
  },
  Enterprise: {
    maxVideosPerDay: 25,
    maxVideosPerMonth: 200,
    videoGenEnabled: true,
    allowedDurations: ['5', '10'],
    allowedAspectRatios: ['16:9', '9:16', '1:1'],
    allowedModes: ['text-to-video', 'image-to-video'],
    audioEnabled: true,
    estimatedMaxCostUSD: 160.00,
  },
};

export function getVideoGenLimits(planName: PlanName | null | undefined): VideoGenPlanLimits {
  if (!planName || !(planName in VIDEO_GEN_LIMITS)) {
    return VIDEO_GEN_LIMITS.Basic;
  }
  return VIDEO_GEN_LIMITS[planName];
}

export function calculateVideoCost(duration: VideoGenDuration): number {
  return duration === '10' ? 1.20 : 0.40;
}

export function getDurationLabel(duration: VideoGenDuration): string {
  return duration === '5' ? '5 segundos' : '10 segundos';
}

export function getAspectRatioLabel(aspectRatio: VideoGenAspectRatio): string {
  switch (aspectRatio) {
    case '16:9': return 'Horizontal';
    case '9:16': return 'Vertical';
    case '1:1': return 'Cuadrado';
    default: return aspectRatio;
  }
}

// ============================================================================
// MEMORY LIMITS
// ============================================================================

export type MemoryPlanLimits = {
  maxContextItems: number;
  maxContextTokens: number;
  extractionInterval: number;
  autoExtraction: boolean;
  smartRetrieval: boolean;
  defaultContextLevel: 'minimal' | 'standard' | 'full';
  contextRetentionDays: number;
  autoCompression: boolean;
};

export const PLAN_LIMITS: Record<PlanName, MemoryPlanLimits> = {
  Basic: {
    maxContextItems: 30,
    maxContextTokens: 300,
    extractionInterval: 7,
    autoExtraction: true,
    smartRetrieval: false,
    defaultContextLevel: 'standard',
    contextRetentionDays: 60,
    autoCompression: false,
  },
  Pro: {
    maxContextItems: 100,
    maxContextTokens: 500,
    extractionInterval: 5,
    autoExtraction: true,
    smartRetrieval: true,
    defaultContextLevel: 'standard',
    contextRetentionDays: 90,
    autoCompression: true,
  },
  Premium: {
    maxContextItems: 300,
    maxContextTokens: 750,
    extractionInterval: 4,
    autoExtraction: true,
    smartRetrieval: true,
    defaultContextLevel: 'full',
    contextRetentionDays: 180,
    autoCompression: true,
  },
  Enterprise: {
    maxContextItems: 500,
    maxContextTokens: 1000,
    extractionInterval: 3,
    autoExtraction: true,
    smartRetrieval: true,
    defaultContextLevel: 'full',
    contextRetentionDays: 365,
    autoCompression: true,
  },
};

export function getPlanLimits(planName: PlanName | null | undefined): MemoryPlanLimits {
  if (!planName || !(planName in PLAN_LIMITS)) {
    return PLAN_LIMITS.Basic;
  }
  return PLAN_LIMITS[planName];
}

export function canAddMoreContext(
  currentItemCount: number,
  planName: PlanName | null | undefined
): boolean {
  const limits = getPlanLimits(planName);
  return currentItemCount < limits.maxContextItems;
}

export function getItemsToRemove(
  currentItemCount: number,
  planName: PlanName | null | undefined
): number {
  const limits = getPlanLimits(planName);
  const excess = currentItemCount - limits.maxContextItems;
  return Math.max(0, excess);
}

export function shouldExtractNow(
  messageCount: number,
  planName: PlanName | null | undefined
): boolean {
  const limits = getPlanLimits(planName);
  if (!limits.autoExtraction) {
    return false;
  }
  return messageCount > 0 && messageCount % limits.extractionInterval === 0;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateContextToLimit(
  contextText: string,
  planName: PlanName | null | undefined
): string {
  const limits = getPlanLimits(planName);
  const estimatedTokens = estimateTokens(contextText);
  if (estimatedTokens <= limits.maxContextTokens) {
    return contextText;
  }
  const maxChars = limits.maxContextTokens * 4;
  return contextText.slice(0, maxChars) + '\n\n[Contexto truncado por límites del plan]';
}
