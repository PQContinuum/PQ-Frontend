/**
 * QUERIES PARA USER CONTEXT
 * ==========================
 *
 * Funciones para interactuar con la tabla user_context en la base de datos.
 * Maneja la memoria compartida del usuario entre conversaciones.
 */

import { eq, and, desc, sql, lt, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { userContext } from '@/db/schema';
import type { UserContext, NewUserContext } from '@/db/schema';

/**
 * Obtener todos los contextos de un usuario
 */
export async function getUserContext(userId: string): Promise<UserContext[]> {
  return await db
    .select()
    .from(userContext)
    .where(eq(userContext.userId, userId))
    .orderBy(desc(userContext.lastMentioned));
}

/**
 * Obtener contextos por categoría
 */
export async function getUserContextByCategory(
  userId: string,
  category: string
): Promise<UserContext[]> {
  return await db
    .select()
    .from(userContext)
    .where(
      and(
        eq(userContext.userId, userId),
        eq(userContext.category, category as any)
      )
    )
    .orderBy(desc(userContext.lastMentioned));
}

/**
 * Obtener contexto con límite
 */
export async function getUserContextLimited(
  userId: string,
  limit: number
): Promise<UserContext[]> {
  return await db
    .select()
    .from(userContext)
    .where(eq(userContext.userId, userId))
    .orderBy(desc(userContext.lastMentioned))
    .limit(limit);
}

/**
 * Buscar contextos relevantes por keywords
 */
export async function searchRelevantContext(
  userId: string,
  keywords: string[],
  limit: number = 10
): Promise<UserContext[]> {
  if (keywords.length === 0) {
    return getUserContextLimited(userId, limit);
  }

  // Buscar contextos que contengan alguna de las keywords
  const conditions = keywords.map(keyword =>
    sql`${userContext.value} ILIKE ${'%' + keyword + '%'}`
  );

  return await db
    .select()
    .from(userContext)
    .where(
      and(
        eq(userContext.userId, userId),
        sql`(${sql.join(conditions, sql` OR `)})`
      )
    )
    .orderBy(desc(userContext.lastMentioned))
    .limit(limit);
}

/**
 * Obtener un contexto específico por key
 */
export async function getContextByKey(
  userId: string,
  key: string
): Promise<UserContext | undefined> {
  const result = await db
    .select()
    .from(userContext)
    .where(
      and(eq(userContext.userId, userId), eq(userContext.key, key))
    )
    .limit(1);

  return result[0];
}

/**
 * Crear o actualizar un contexto (upsert)
 */
export async function upsertUserContext(
  userId: string,
  key: string,
  value: string,
  category: 'personal' | 'technical' | 'preferences' | 'project' | 'decisions' | 'summary',
  confidence: number = 100,
  sourceConversationId?: string
): Promise<UserContext> {
  // Verificar si ya existe
  const existing = await getContextByKey(userId, key);

  if (existing) {
    // Actualizar existente
    const result = await db
      .update(userContext)
      .set({
        value,
        category,
        confidence,
        sourceConversationId,
        lastMentioned: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userContext.id, existing.id))
      .returning();

    return result[0];
  } else {
    // Insertar nuevo
    const result = await db
      .insert(userContext)
      .values({
        userId,
        key,
        value,
        category,
        confidence,
        sourceConversationId,
      })
      .returning();

    return result[0];
  }
}

/**
 * Guardar múltiples contextos
 */
export async function saveMultipleContexts(
  userId: string,
  contexts: Array<{
    key: string;
    value: string;
    category: 'personal' | 'technical' | 'preferences' | 'project' | 'decisions' | 'summary';
    confidence: number;
    sourceConversationId?: string;
  }>
): Promise<UserContext[]> {
  const results: UserContext[] = [];

  for (const context of contexts) {
    const result = await upsertUserContext(
      userId,
      context.key,
      context.value,
      context.category,
      context.confidence,
      context.sourceConversationId
    );
    results.push(result);
  }

  return results;
}

/**
 * Eliminar un contexto específico
 */
export async function deleteUserContext(
  userId: string,
  contextId: string
): Promise<boolean> {
  const result = await db
    .delete(userContext)
    .where(
      and(eq(userContext.id, contextId), eq(userContext.userId, userId))
    )
    .returning();

  return result.length > 0;
}

/**
 * Contar contextos del usuario
 */
export async function countUserContext(userId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(userContext)
    .where(eq(userContext.userId, userId));

  return result[0]?.count || 0;
}

/**
 * Eliminar contextos más viejos para mantener bajo el límite
 */
export async function pruneOldestContext(
  userId: string,
  keepCount: number
): Promise<number> {
  // Obtener todos los contextos ordenados por última mención
  const allContexts = await db
    .select()
    .from(userContext)
    .where(eq(userContext.userId, userId))
    .orderBy(desc(userContext.lastMentioned));

  // Si está bajo el límite, no hacer nada
  if (allContexts.length <= keepCount) {
    return 0;
  }

  // Obtener IDs de los contextos a eliminar
  const toDelete = allContexts.slice(keepCount).map(c => c.id);

  if (toDelete.length === 0) {
    return 0;
  }

  // Eliminar contextos viejos
  const result = await db
    .delete(userContext)
    .where(
      and(
        eq(userContext.userId, userId),
        inArray(userContext.id, toDelete)
      )
    )
    .returning();

  return result.length;
}

/**
 * Obtener contextos viejos (no mencionados en X días)
 */
export async function getOldContext(
  userId: string,
  daysOld: number
): Promise<UserContext[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await db
    .select()
    .from(userContext)
    .where(
      and(
        eq(userContext.userId, userId),
        lt(userContext.lastMentioned, cutoffDate)
      )
    )
    .orderBy(userContext.lastMentioned);
}

/**
 * Actualizar timestamp de lastMentioned (para marcar como relevante)
 */
export async function touchContext(contextId: string): Promise<void> {
  await db
    .update(userContext)
    .set({ lastMentioned: new Date() })
    .where(eq(userContext.id, contextId));
}
