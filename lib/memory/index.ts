/**
 * SISTEMA DE MEMORIA COMPARTIDA
 * ==============================
 *
 * Exports principales del sistema de memoria entre conversaciones
 */

// Contexto del usuario
export {
  getUserContextForPrompt,
  enforceContextLimits,
  invalidateUserContext,
  type ContextLevel,
} from './user-context';

// Límites por plan
export {
  getPlanLimits,
  canAddMoreContext,
  getItemsToRemove,
  shouldExtractNow,
  truncateContextToLimit,
  estimateTokens,
  type PlanName,
  type MemoryPlanLimits,
  PLAN_LIMITS,
} from './plan-limits';

// Extracción de hechos
export {
  extractFactsFromMessages,
  hasImportantInformation,
  shouldExtractFacts,
  validateExtractedFacts,
  generateFactKey,
  isValidFact,
  type ExtractedFact,
} from './fact-extractor';

// Cache
export {
  getCachedContext,
  setCachedContext,
  invalidateUserContext as invalidateCachedContext,
  clearAllCache,
  getCacheStats,
} from './context-cache';
