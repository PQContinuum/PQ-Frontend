import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { generationJobs } from "@/db/schema";
import type { GenerationJob, NewGenerationJob } from "@/db/schema";

// Tipos de estado para filtros
export type JobStatus = "pending" | "queued" | "processing" | "uploading" | "completed" | "failed" | "cancelled";
export type JobType = "video" | "image" | "chat";

// Estados activos (no terminales)
export const ACTIVE_STATUSES: JobStatus[] = ["pending", "queued", "processing", "uploading"];
// Estados terminales
export const TERMINAL_STATUSES: JobStatus[] = ["completed", "failed", "cancelled"];

/**
 * Crear un nuevo job de generación
 */
export async function createGenerationJob(
  data: NewGenerationJob
): Promise<GenerationJob> {
  const result = await db
    .insert(generationJobs)
    .values(data)
    .returning();

  return result[0];
}

/**
 * Obtener un job por ID
 */
export async function getGenerationJobById(
  jobId: string,
  userId: string
): Promise<GenerationJob | undefined> {
  const result = await db
    .select()
    .from(generationJobs)
    .where(
      and(
        eq(generationJobs.id, jobId),
        eq(generationJobs.userId, userId)
      )
    )
    .limit(1);

  return result[0];
}

/**
 * Obtener un job por provider request ID (para webhooks)
 */
export async function getGenerationJobByProviderRequestId(
  providerRequestId: string
): Promise<GenerationJob | undefined> {
  const result = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.providerRequestId, providerRequestId))
    .limit(1);

  return result[0];
}

/**
 * Obtener jobs del usuario con filtros
 */
export async function getUserGenerationJobs(
  userId: string,
  options?: {
    statuses?: JobStatus[];
    types?: JobType[];
    conversationId?: string;
    limit?: number;
  }
): Promise<GenerationJob[]> {
  let query = db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.userId, userId))
    .orderBy(desc(generationJobs.createdAt));

  // Build conditions
  const conditions = [eq(generationJobs.userId, userId)];

  if (options?.statuses && options.statuses.length > 0) {
    conditions.push(inArray(generationJobs.status, options.statuses));
  }

  if (options?.types && options.types.length > 0) {
    conditions.push(inArray(generationJobs.jobType, options.types));
  }

  if (options?.conversationId) {
    conditions.push(eq(generationJobs.conversationId, options.conversationId));
  }

  const result = await db
    .select()
    .from(generationJobs)
    .where(and(...conditions))
    .orderBy(desc(generationJobs.createdAt))
    .limit(options?.limit || 50);

  return result;
}

/**
 * Obtener jobs activos (pendientes/procesando) del usuario
 */
export async function getActiveGenerationJobs(userId: string): Promise<GenerationJob[]> {
  return getUserGenerationJobs(userId, { statuses: ACTIVE_STATUSES });
}

/**
 * Obtener múltiples jobs por IDs (para polling eficiente)
 */
export async function getGenerationJobsByIds(
  jobIds: string[],
  userId: string
): Promise<GenerationJob[]> {
  if (jobIds.length === 0) return [];

  const result = await db
    .select()
    .from(generationJobs)
    .where(
      and(
        inArray(generationJobs.id, jobIds),
        eq(generationJobs.userId, userId)
      )
    );

  return result;
}

/**
 * Actualizar un job
 */
export async function updateGenerationJob(
  jobId: string,
  userId: string,
  data: Partial<Omit<GenerationJob, "id" | "userId" | "createdAt">>
): Promise<GenerationJob | undefined> {
  const result = await db
    .update(generationJobs)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(generationJobs.id, jobId),
        eq(generationJobs.userId, userId)
      )
    )
    .returning();

  return result[0];
}

/**
 * Actualizar un job por provider request ID (para webhooks, sin verificar userId)
 */
export async function updateGenerationJobByProviderRequestId(
  providerRequestId: string,
  data: Partial<Omit<GenerationJob, "id" | "userId" | "createdAt">>
): Promise<GenerationJob | undefined> {
  const result = await db
    .update(generationJobs)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(generationJobs.providerRequestId, providerRequestId))
    .returning();

  return result[0];
}

/**
 * Cancelar un job (solo si está en estado activo)
 */
export async function cancelGenerationJob(
  jobId: string,
  userId: string
): Promise<GenerationJob | undefined> {
  const result = await db
    .update(generationJobs)
    .set({
      status: "cancelled",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(generationJobs.id, jobId),
        eq(generationJobs.userId, userId),
        inArray(generationJobs.status, ACTIVE_STATUSES)
      )
    )
    .returning();

  return result[0];
}

/**
 * Obtener jobs antiguos que podrían estar stuck (para cleanup)
 */
export async function getStuckJobs(olderThanMinutes: number = 30): Promise<GenerationJob[]> {
  const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);

  const result = await db
    .select()
    .from(generationJobs)
    .where(
      and(
        inArray(generationJobs.status, ["processing", "queued"]),
        sql`${generationJobs.updatedAt} < ${cutoffTime}`
      )
    );

  return result;
}

/**
 * Contar jobs activos del usuario (para límites)
 */
export async function countActiveJobs(userId: string, jobType?: JobType): Promise<number> {
  const conditions = [
    eq(generationJobs.userId, userId),
    inArray(generationJobs.status, ACTIVE_STATUSES)
  ];

  if (jobType) {
    conditions.push(eq(generationJobs.jobType, jobType));
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(generationJobs)
    .where(and(...conditions));

  return Number(result[0]?.count || 0);
}
