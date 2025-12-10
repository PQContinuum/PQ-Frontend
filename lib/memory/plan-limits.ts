/**
 * CONFIGURACIÓN DE LÍMITES DE MEMORIA POR PLAN
 * ============================================
 *
 * Este archivo define los límites de la funcionalidad de memoria compartida
 * según el plan de suscripción del usuario.
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
    maxTTSPerDay: 200,
    maxTTSPerMonth: 6000,
    ttsEnabled: true,
    estimatedMaxCostUSD: 60.00,
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
