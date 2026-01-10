/**
 * CONFIGURACIÓN DE LÍMITES POR PLAN
 * ==================================
 *
 * Este archivo define los límites de todas las funcionalidades
 * según el plan de suscripción del usuario:
 * - TTS (Text-to-Speech)
 * - Generación de Imágenes (DALL-E)
 * - Memoria compartida
 *
 * INSTRUCCIONES PARA AJUSTAR:
 * - Modifica los valores numéricos según tu estrategia de negocio
 * - Reinicia el servidor después de cambiar estos valores
 * - Los valores están en orden: Free < Basic < Professional < Enterprise
 */

export type PlanName = 'Free' | 'Basic' | 'Professional' | 'Enterprise';

// ============================================================================
// TTS (Text-to-Speech) LIMITS
// ============================================================================

export type TTSPlanLimits = {
  // Máximo de reproducciones TTS por día
  maxTTSPerDay: number;
  // Máximo de reproducciones TTS por mes
  maxTTSPerMonth: number;
  // Si tiene acceso a TTS
  ttsEnabled: boolean;
  // Costo estimado máximo USD/mes
  estimatedMaxCostUSD: number;
};

/**
 * LÍMITES DE TTS POR PLAN
 * =======================
 * Basado en análisis financiero:
 * - Costo OpenAI TTS: ~$0.01 USD por reproducción
 * - Objetivo: mantener costo TTS ≤ 25-30% del precio del plan
 */
export const TTS_LIMITS: Record<PlanName, TTSPlanLimits> = {
  Free: {
    maxTTSPerDay: 5,
    maxTTSPerMonth: 150,
    ttsEnabled: true,
    estimatedMaxCostUSD: 1.50,
  },
  Basic: {
    maxTTSPerDay: 20,
    maxTTSPerMonth: 600,
    ttsEnabled: true,
    estimatedMaxCostUSD: 6.00,
  },
  Professional: {
    maxTTSPerDay: 50,
    maxTTSPerMonth: 1500,
    ttsEnabled: true,
    estimatedMaxCostUSD: 15.00,
  },
  Enterprise: {
    maxTTSPerDay: Infinity,
    maxTTSPerMonth: Infinity,
    ttsEnabled: true,
    estimatedMaxCostUSD: -1, // Ilimitado
  },
};

/**
 * Obtiene los límites de TTS del plan
 */
export function getTTSLimits(planName: PlanName | null | undefined): TTSPlanLimits {
  if (!planName || !(planName in TTS_LIMITS)) {
    return TTS_LIMITS.Free;
  }
  return TTS_LIMITS[planName];
}

// ============================================================================
// IMAGE GENERATION (OpenAI GPT Image) LIMITS
// ============================================================================

// GPT Image quality levels: low, medium, high
export type ImageGenQuality = 'low' | 'medium' | 'high';

// GPT Image sizes: 1024x1024, 1024x1536 (portrait), 1536x1024 (landscape)
export type ImageGenSize = '1024x1024' | '1024x1536' | '1536x1024' | 'auto';

// Style presets are managed in lib/image-gen/style-presets.ts
// These are prompt modifiers, not API parameters
export type ImageStylePresetId = 'auto' | 'ghibli' | 'pixar' | 'photo' | 'anime' | 'cinematic' | 'watercolor' | 'oil' | 'minimalist' | 'retro' | 'comic' | 'concept';

// Legacy type for backwards compatibility
export type ImageGenStyle = 'vivid' | 'natural';

export type ImageGenPlanLimits = {
  // Máximo de imágenes por día
  maxImagesPerDay: number;
  // Máximo de imágenes por mes
  maxImagesPerMonth: number;
  // Si tiene acceso a generación de imágenes
  imageGenEnabled: boolean;
  // Modelo usado (OpenAI GPT Image)
  allowedModels: ('gpt-image-1')[];
  // Calidades permitidas (low, medium, high)
  allowedQualities: ImageGenQuality[];
  // Resolución máxima permitida
  maxResolution: ImageGenSize;
  // Presets de estilo premium disponibles
  premiumStyles: boolean;
  // Costo estimado máximo USD/mes
  estimatedMaxCostUSD: number;
};

/**
 * LÍMITES DE GENERACIÓN DE IMÁGENES POR PLAN (OpenAI GPT Image)
 * ==============================================================
 * Precios GPT Image (2025):
 * - 1024x1024: low ~$0.02, medium ~$0.04, high ~$0.08
 * - 1024x1536 / 1536x1024: low ~$0.04, medium ~$0.08, high ~$0.16
 * - Soporta image-to-image con referencia
 * - Objetivo: mantener costo imágenes ≤ 25% del precio del plan
 */
export const IMAGE_GEN_LIMITS: Record<PlanName, ImageGenPlanLimits> = {
  Free: {
    maxImagesPerDay: 5,
    maxImagesPerMonth: 25,
    imageGenEnabled: true,
    allowedModels: ['gpt-image-1'],
    allowedQualities: ['low'],              // Solo low quality
    maxResolution: '1024x1024',
    premiumStyles: false,
    estimatedMaxCostUSD: 0.50,              // 25 × $0.02
  },
  Basic: {
    maxImagesPerDay: 15,
    maxImagesPerMonth: 150,
    imageGenEnabled: true,
    allowedModels: ['gpt-image-1'],
    allowedQualities: ['low', 'medium'],    // Low + Medium
    maxResolution: '1024x1024',
    premiumStyles: false,
    estimatedMaxCostUSD: 4.50,              // Mix de low y medium
  },
  Professional: {
    maxImagesPerDay: 35,
    maxImagesPerMonth: 400,
    imageGenEnabled: true,
    allowedModels: ['gpt-image-1'],
    allowedQualities: ['low', 'medium', 'high'], // Todas las calidades
    maxResolution: '1536x1024',
    premiumStyles: true,
    estimatedMaxCostUSD: 24.00,             // Mix de todas las calidades
  },
  Enterprise: {
    maxImagesPerDay: 100,
    maxImagesPerMonth: 1500,
    imageGenEnabled: true,
    allowedModels: ['gpt-image-1'],
    allowedQualities: ['low', 'medium', 'high'],
    maxResolution: '1536x1024',
    premiumStyles: true,
    estimatedMaxCostUSD: 100.00,            // Mix generoso
  },
};

/**
 * Obtiene los límites de generación de imágenes del plan
 */
export function getImageGenLimits(planName: PlanName | null | undefined): ImageGenPlanLimits {
  if (!planName || !(planName in IMAGE_GEN_LIMITS)) {
    return IMAGE_GEN_LIMITS.Free;
  }
  return IMAGE_GEN_LIMITS[planName];
}

/**
 * Calcula el costo de una imagen según sus parámetros (OpenAI GPT Image)
 * Precios estimados basados en la documentación de OpenAI 2025
 */
export function calculateImageCost(
  quality: ImageGenQuality,
  size: ImageGenSize
): number {
  // GPT Image pricing (estimated USD per image)
  // 1024x1024: low ~$0.02, medium ~$0.04, high ~$0.08
  // 1024x1536 / 1536x1024: low ~$0.04, medium ~$0.08, high ~$0.16

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

/**
 * Obtiene los tamaños permitidos según la resolución máxima del plan
 */
export function getAllowedSizes(maxResolution: ImageGenSize): ImageGenSize[] {
  if (maxResolution === '1536x1024' || maxResolution === '1024x1536') {
    return ['1024x1024', '1024x1536', '1536x1024'];
  }
  if (maxResolution === 'auto') {
    return ['1024x1024', '1024x1536', '1536x1024', 'auto'];
  }
  return ['1024x1024'];
}

/**
 * Obtiene la etiqueta de calidad en español
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
 * Obtiene la descripción de calidad
 */
export function getQualityDescription(quality: ImageGenQuality): string {
  switch (quality) {
    case 'low': return 'Generación rápida, ideal para borradores';
    case 'medium': return 'Balance entre velocidad y calidad';
    case 'high': return 'Máxima calidad y detalle';
    default: return '';
  }
}

// ============================================================================
// VIDEO GENERATION (Google Veo 3 via Fal.ai) LIMITS
// Supports audio with dialogue in Spanish Latino (based on prompt language)
// ============================================================================

// Veo 3 durations: 5s or 8s (mapped from user selection)
export type VideoGenDuration = '5' | '10'; // '10' gets mapped to '8' for Veo 3

// Veo 3 aspect ratios (1:1 gets mapped to 16:9)
export type VideoGenAspectRatio = '16:9' | '9:16' | '1:1';

// Video generation modes
export type VideoGenMode = 'text-to-video' | 'image-to-video';

export type VideoGenPlanLimits = {
  // Máximo de videos por día
  maxVideosPerDay: number;
  // Máximo de videos por mes
  maxVideosPerMonth: number;
  // Si tiene acceso a generación de video
  videoGenEnabled: boolean;
  // Duraciones permitidas
  allowedDurations: VideoGenDuration[];
  // Aspect ratios permitidos
  allowedAspectRatios: VideoGenAspectRatio[];
  // Modos permitidos (text-to-video, image-to-video)
  allowedModes: VideoGenMode[];
  // Si tiene acceso a audio generado
  audioEnabled: boolean;
  // Costo estimado máximo USD/mes
  estimatedMaxCostUSD: number;
};

/**
 * LÍMITES DE GENERACIÓN DE VIDEO POR PLAN (Google Veo 3 via Fal.ai)
 * ==================================================================
 * Costos Veo 3:
 * - ~$0.50/segundo de video generado
 * - 5s = ~$2.50, 8s = ~$4.00
 *
 * IMPORTANTE: Veo 3 es premium pero genera audio con diálogo en español
 * El audio incluye: diálogo, efectos de sonido, ambiente, sincronización de labios
 * Para español: escribir el prompt en español
 */
export const VIDEO_GEN_LIMITS: Record<PlanName, VideoGenPlanLimits> = {
  Free: {
    maxVideosPerDay: 1,
    maxVideosPerMonth: 2,
    videoGenEnabled: true,
    allowedDurations: ['5'],           // Solo 5 segundos
    allowedAspectRatios: ['16:9'],     // Solo horizontal
    allowedModes: ['text-to-video', 'image-to-video'], // Ambos modos
    audioEnabled: true,                // Audio con diálogo en español
    estimatedMaxCostUSD: 5.00,         // 2 × $2.50 (5s con audio)
  },
  Basic: {
    maxVideosPerDay: 2,
    maxVideosPerMonth: 10,
    videoGenEnabled: true,
    allowedDurations: ['5'],           // Solo 5 segundos
    allowedAspectRatios: ['16:9', '9:16', '1:1'],
    allowedModes: ['text-to-video', 'image-to-video'], // Ambos modos
    audioEnabled: true,                // Audio con diálogo en español
    estimatedMaxCostUSD: 25.00,        // 10 × $2.50 (5s con audio)
  },
  Professional: {
    maxVideosPerDay: 5,
    maxVideosPerMonth: 30,
    videoGenEnabled: true,
    allowedDurations: ['5', '10'],     // Ambas duraciones (10 → 8s en Veo 3)
    allowedAspectRatios: ['16:9', '9:16', '1:1'],
    allowedModes: ['text-to-video', 'image-to-video'],
    audioEnabled: true,                // Audio con diálogo en español
    estimatedMaxCostUSD: 90.00,        // Mix: 20×$2.50 + 10×$4.00
  },
  Enterprise: {
    maxVideosPerDay: 15,
    maxVideosPerMonth: 100,
    videoGenEnabled: true,
    allowedDurations: ['5', '10'],
    allowedAspectRatios: ['16:9', '9:16', '1:1'],
    allowedModes: ['text-to-video', 'image-to-video'],
    audioEnabled: true,                // Audio con diálogo en español
    estimatedMaxCostUSD: 300.00,       // Mix generoso
  },
};

/**
 * Obtiene los límites de generación de video del plan
 */
export function getVideoGenLimits(planName: PlanName | null | undefined): VideoGenPlanLimits {
  if (!planName || !(planName in VIDEO_GEN_LIMITS)) {
    return VIDEO_GEN_LIMITS.Free;
  }
  return VIDEO_GEN_LIMITS[planName];
}

/**
 * Calcula el costo de un video según sus parámetros (Google Veo 3)
 */
export function calculateVideoCost(
  duration: VideoGenDuration,
  _audioEnabled: boolean
): number {
  // Veo 3 pricing: ~$0.50/second
  // Duration '5' → 6s, '10' → 8s for Veo 3
  const seconds = duration === '10' ? 8 : 6;
  const costPerSecond = 0.50;
  return seconds * costPerSecond;
}

/**
 * Obtiene la etiqueta de duración en español
 */
export function getDurationLabel(duration: VideoGenDuration): string {
  return duration === '5' ? '5 segundos' : '10 segundos';
}

/**
 * Obtiene la etiqueta del aspect ratio
 */
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
  // Máximo de hechos/contextos que puede guardar el usuario
  maxContextItems: number;

  // Máximo de tokens del contexto que se inyecta en cada request
  maxContextTokens: number;

  // Cada cuántos mensajes se extrae contexto automáticamente
  extractionInterval: number;

  // Si tiene acceso a extracción automática de hechos
  autoExtraction: boolean;

  // Si tiene acceso a búsqueda semántica de contexto relevante
  smartRetrieval: boolean;

  // Nivel de contexto por defecto: 'minimal' | 'standard' | 'full'
  defaultContextLevel: 'minimal' | 'standard' | 'full';

  // Días que se mantiene el contexto sin mencionar antes de archivar
  contextRetentionDays: number;

  // Si tiene acceso a compresión automática de contexto viejo
  autoCompression: boolean;
};

/**
 * LÍMITES POR PLAN
 * ================
 *
 * 📝 AJUSTA ESTOS VALORES SEGÚN TU ESTRATEGIA:
 */
export const PLAN_LIMITS: Record<PlanName, MemoryPlanLimits> = {
  /**
   * PLAN FREE
   * ---------
   * Acceso básico a memoria compartida con límites restrictivos
   *
   * TODO: Ajustar estos valores según tu estrategia
   */
  Free: {
    maxContextItems: 10,              // ← AJUSTAR: Máximo 10 hechos guardados
    maxContextTokens: 150,            // ← AJUSTAR: ~150 tokens de contexto (~600 caracteres)
    extractionInterval: 10,           // ← AJUSTAR: Extraer cada 10 mensajes
    autoExtraction: false,            // ← AJUSTAR: Sin extracción automática (debe ser manual)
    smartRetrieval: false,            // ← AJUSTAR: Sin búsqueda inteligente (solo datos básicos)
    defaultContextLevel: 'minimal',   // Solo nombre y preferencias básicas
    contextRetentionDays: 30,         // ← AJUSTAR: Se archiva después de 30 días
    autoCompression: false,           // Sin compresión automática
  },

  /**
   * PLAN BASIC
   * ----------
   * Memoria compartida con más capacidad y algunas funciones automáticas
   *
   * TODO: Ajustar estos valores según tu estrategia
   */
  Basic: {
    maxContextItems: 30,              // ← AJUSTAR: Máximo 30 hechos
    maxContextTokens: 300,            // ← AJUSTAR: ~300 tokens (~1200 caracteres)
    extractionInterval: 7,            // ← AJUSTAR: Extraer cada 7 mensajes
    autoExtraction: true,             // ✅ Extracción automática habilitada
    smartRetrieval: false,            // Todavía sin búsqueda inteligente
    defaultContextLevel: 'standard',  // Contexto estándar (core + algo relevante)
    contextRetentionDays: 60,         // ← AJUSTAR: Se archiva después de 60 días
    autoCompression: false,           // Sin compresión automática
  },

  /**
   * PLAN PROFESSIONAL
   * -----------------
   * Memoria compartida avanzada con búsqueda inteligente y compresión
   *
   * TODO: Ajustar estos valores según tu estrategia
   */
  Professional: {
    maxContextItems: 100,             // ← AJUSTAR: Máximo 100 hechos
    maxContextTokens: 500,            // ← AJUSTAR: ~500 tokens (~2000 caracteres)
    extractionInterval: 5,            // ← AJUSTAR: Extraer cada 5 mensajes
    autoExtraction: true,             // ✅ Extracción automática
    smartRetrieval: true,             // ✅ Búsqueda semántica inteligente
    defaultContextLevel: 'standard',  // Contexto estándar optimizado
    contextRetentionDays: 90,         // ← AJUSTAR: Se archiva después de 90 días
    autoCompression: true,            // ✅ Compresión automática de contexto viejo
  },

  /**
   * PLAN ENTERPRISE
   * ---------------
   * Memoria compartida sin restricciones con todas las funciones premium
   *
   * TODO: Ajustar estos valores según tu estrategia
   */
  Enterprise: {
    maxContextItems: 500,             // ← AJUSTAR: Máximo 500 hechos (casi ilimitado)
    maxContextTokens: 1000,           // ← AJUSTAR: ~1000 tokens (~4000 caracteres)
    extractionInterval: 3,            // ← AJUSTAR: Extraer cada 3 mensajes (muy frecuente)
    autoExtraction: true,             // ✅ Extracción automática
    smartRetrieval: true,             // ✅ Búsqueda semántica inteligente
    defaultContextLevel: 'full',      // Contexto completo disponible
    contextRetentionDays: 365,        // ← AJUSTAR: Se archiva después de 1 año
    autoCompression: true,            // ✅ Compresión automática
  },
};

/**
 * Obtiene los límites del plan del usuario
 */
export function getPlanLimits(planName: PlanName | null | undefined): MemoryPlanLimits {
  // Si no hay plan o es inválido, usar límites de Free
  if (!planName || !(planName in PLAN_LIMITS)) {
    return PLAN_LIMITS.Free;
  }

  return PLAN_LIMITS[planName];
}

/**
 * Verifica si el usuario puede guardar más contexto
 */
export function canAddMoreContext(
  currentItemCount: number,
  planName: PlanName | null | undefined
): boolean {
  const limits = getPlanLimits(planName);
  return currentItemCount < limits.maxContextItems;
}

/**
 * Calcula cuántos items de contexto deben eliminarse para estar bajo el límite
 */
export function getItemsToRemove(
  currentItemCount: number,
  planName: PlanName | null | undefined
): number {
  const limits = getPlanLimits(planName);
  const excess = currentItemCount - limits.maxContextItems;
  return Math.max(0, excess);
}

/**
 * Verifica si debe ejecutarse la extracción de hechos
 */
export function shouldExtractNow(
  messageCount: number,
  planName: PlanName | null | undefined
): boolean {
  const limits = getPlanLimits(planName);

  // Si no tiene extracción automática, nunca extraer
  if (!limits.autoExtraction) {
    return false;
  }

  // Extraer cada N mensajes según el plan
  return messageCount > 0 && messageCount % limits.extractionInterval === 0;
}

/**
 * Estimación simple de tokens (4 caracteres ≈ 1 token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Trunca el contexto para ajustarse al límite de tokens del plan
 */
export function truncateContextToLimit(
  contextText: string,
  planName: PlanName | null | undefined
): string {
  const limits = getPlanLimits(planName);
  const estimatedTokens = estimateTokens(contextText);

  // Si está bajo el límite, retornar completo
  if (estimatedTokens <= limits.maxContextTokens) {
    return contextText;
  }

  // Truncar al límite de tokens del plan
  const maxChars = limits.maxContextTokens * 4; // Aproximación
  return contextText.slice(0, maxChars) + '\n\n[Contexto truncado por límites del plan]';
}
