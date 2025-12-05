/**
 * SISTEMA DE CONTEXTO DE USUARIO
 * ===============================
 *
 * Orquesta la memoria compartida del usuario entre conversaciones.
 * Combina cache, base de datos, y límites por plan.
 */

import type { PlanName } from './plan-limits';
import { getPlanLimits, truncateContextToLimit } from './plan-limits';
import {
  getCachedContext,
  setCachedContext,
  invalidateUserContext as invalidateCache,
} from './context-cache';
import {
  getUserContextByCategory,
  getUserContextLimited,
  searchRelevantContext,
  countUserContext,
  pruneOldestContext,
} from '@/db/queries/user-context';
import type { UserContext } from '@/db/schema';

/**
 * Extrae keywords técnicas simples de un mensaje
 */
function extractKeywords(message: string): string[] {
  const techKeywords = [
    'next', 'react', 'vue', 'angular', 'svelte',
    'node', 'express', 'fastify',
    'typescript', 'javascript', 'python', 'go', 'rust',
    'stripe', 'supabase', 'firebase', 'mongodb', 'postgres',
    'tailwind', 'css', 'sass',
    'api', 'rest', 'graphql',
    'auth', 'authentication',
    'payment', 'checkout',
    'database', 'db',
    'docker', 'kubernetes',
  ];

  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/);

  return words.filter(
    word => word.length > 3 && techKeywords.some(tk => word.includes(tk))
  );
}

/**
 * Formatea contexto del usuario para inyectar en el prompt
 */
function formatContextForPrompt(contexts: UserContext[]): string {
  if (contexts.length === 0) {
    return '';
  }

  // Agrupar por categoría
  const grouped: Record<string, UserContext[]> = {};

  for (const context of contexts) {
    if (!grouped[context.category]) {
      grouped[context.category] = [];
    }
    grouped[context.category].push(context);
  }

  const sections: string[] = [];

  // Sección: Datos Personales
  if (grouped.personal?.length) {
    const items = grouped.personal.map(c => `- ${c.value}`).join('\n');
    sections.push(`DATOS PERSONALES:\n${items}`);
  }

  // Sección: Contexto Técnico
  if (grouped.technical?.length) {
    const items = grouped.technical.map(c => `- ${c.value}`).join('\n');
    sections.push(`CONTEXTO TÉCNICO:\n${items}`);
  }

  // Sección: Preferencias
  if (grouped.preferences?.length) {
    const items = grouped.preferences.map(c => `- ${c.value}`).join('\n');
    sections.push(`PREFERENCIAS DE INTERACCIÓN:\n${items}`);
  }

  // Sección: Proyecto Actual
  if (grouped.project?.length) {
    const items = grouped.project.map(c => `- ${c.value}`).join('\n');
    sections.push(`PROYECTO ACTUAL:\n${items}`);
  }

  // Sección: Decisiones Previas
  if (grouped.decisions?.length) {
    const items = grouped.decisions.map(c => `- ${c.value}`).join('\n');
    sections.push(`DECISIONES TÉCNICAS PREVIAS:\n${items}`);
  }

  // Sección: Resumen Histórico
  if (grouped.summary?.length) {
    const items = grouped.summary.map(c => c.value).join('\n');
    sections.push(`CONTEXTO HISTÓRICO:\n${items}`);
  }

  const contextBody = sections.join('\n\n');

  return `
═══════════════════════════════════════════════════════════════════════

XIV. CONTEXTO PERSONAL DEL USUARIO (INFORMACIÓN DE CONVERSACIONES PREVIAS)
--------------------------------------------------------------------------
El usuario ha compartido la siguiente información en conversaciones pasadas.
Utilízala de forma natural y empática en tus respuestas, manteniendo siempre
tu identidad como Continuum AI y todos tus principios operativos.

${contextBody}

IMPORTANTE: Este contexto complementa tus instrucciones base sin anularlas.
Tu identidad, restricciones y protocolos siempre tienen prioridad máxima.
`.trim();
}

/**
 * Tipo de nivel de contexto
 */
export type ContextLevel = 'minimal' | 'standard' | 'full';

/**
 * Obtiene contexto del usuario con nivel minimal
 * Solo información personal y preferencias básicas
 */
async function getMinimalContext(userId: string): Promise<string> {
  const personalData = await getUserContextByCategory(userId, 'personal');
  const preferences = await getUserContextByCategory(userId, 'preferences');

  const limited = [...personalData.slice(0, 3), ...preferences.slice(0, 2)];

  return formatContextForPrompt(limited);
}

/**
 * Obtiene contexto del usuario con nivel standard
 * Core + contexto relevante al mensaje actual
 */
async function getStandardContext(
  userId: string,
  currentMessage?: string
): Promise<string> {
  // Core: Personal + Preferencias (siempre incluir)
  const personalData = await getUserContextByCategory(userId, 'personal');
  const preferences = await getUserContextByCategory(userId, 'preferences');

  const coreContexts = [...personalData.slice(0, 3), ...preferences.slice(0, 2)];

  // Relevante: Si hay mensaje actual, buscar contexto relevante
  let relevantContexts: UserContext[] = [];

  if (currentMessage) {
    const keywords = extractKeywords(currentMessage);
    if (keywords.length > 0) {
      relevantContexts = await searchRelevantContext(userId, keywords, 7);
    }
  }

  // Si no hay contexto relevante, obtener los más recientes
  if (relevantContexts.length === 0) {
    const technical = await getUserContextByCategory(userId, 'technical');
    const project = await getUserContextByCategory(userId, 'project');
    relevantContexts = [...technical.slice(0, 3), ...project.slice(0, 2)];
  }

  // Combinar sin duplicados
  const seen = new Set<string>();
  const combined: UserContext[] = [];

  for (const context of [...coreContexts, ...relevantContexts]) {
    if (!seen.has(context.id)) {
      seen.add(context.id);
      combined.push(context);
    }
  }

  return formatContextForPrompt(combined);
}

/**
 * Obtiene contexto del usuario con nivel full
 * Todo el contexto disponible (limitado por plan)
 */
async function getFullContext(userId: string, planName: PlanName): Promise<string> {
  const limits = getPlanLimits(planName);
  const allContext = await getUserContextLimited(userId, limits.maxContextItems);

  return formatContextForPrompt(allContext);
}

/**
 * Determina el nivel de contexto apropiado según el mensaje
 */
function determineContextLevel(message: string): ContextLevel {
  const wordCount = message.split(/\s+/).length;

  // Mensajes muy cortos: minimal
  if (wordCount < 5) {
    return 'minimal';
  }

  // Mensajes largos o complejos: full
  if (wordCount > 50) {
    return 'full';
  }

  // Por defecto: standard
  return 'standard';
}

/**
 * Obtiene el contexto del usuario para inyectar en el prompt
 *
 * @param userId - ID del usuario
 * @param planName - Plan del usuario (Free, Basic, Professional, Enterprise)
 * @param currentMessage - Mensaje actual (opcional, para búsqueda relevante)
 * @param forceLevel - Nivel forzado de contexto (opcional)
 * @returns Contexto formateado para el prompt
 */
export async function getUserContextForPrompt(
  userId: string,
  planName: PlanName | null | undefined,
  currentMessage?: string,
  forceLevel?: ContextLevel
): Promise<string> {
  try {
    // 1. Verificar cache primero
    const cached = getCachedContext(userId);
    if (cached) {
      return cached;
    }

    // 2. Obtener límites del plan
    const limits = getPlanLimits(planName);

    // 3. Determinar nivel de contexto
    const level =
      forceLevel ||
      (currentMessage ? determineContextLevel(currentMessage) : limits.defaultContextLevel);

    // 4. Obtener contexto según nivel
    let contextText = '';

    switch (level) {
      case 'minimal':
        contextText = await getMinimalContext(userId);
        break;

      case 'standard':
        contextText = await getStandardContext(userId, currentMessage);
        break;

      case 'full':
        contextText = await getFullContext(userId, planName || 'Free');
        break;
    }

    // 5. Truncar según límites del plan
    const truncated = truncateContextToLimit(contextText, planName);

    // 6. Guardar en cache
    setCachedContext(userId, truncated);

    return truncated;
  } catch (error) {
    console.error('Error getting user context:', error);
    return '';
  }
}

/**
 * Verifica y limpia el contexto del usuario según límites del plan
 */
export async function enforceContextLimits(
  userId: string,
  planName: PlanName | null | undefined
): Promise<void> {
  const limits = getPlanLimits(planName);
  const currentCount = await countUserContext(userId);

  if (currentCount > limits.maxContextItems) {
    const deleted = await pruneOldestContext(userId, limits.maxContextItems);
    console.log(`Pruned ${deleted} old context items for user ${userId}`);

    // Invalidar cache
    invalidateCache(userId);
  }
}

/**
 * Invalida el cache del contexto de un usuario
 * Útil después de actualizar el contexto
 */
export function invalidateUserContext(userId: string): void {
  invalidateCache(userId);
}
