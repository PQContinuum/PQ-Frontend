"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsApi, type GenerationJob as ApiGenerationJob } from "@/lib/api-client";

// Types
export type JobStatus =
  | "pending"
  | "queued"
  | "processing"
  | "uploading"
  | "completed"
  | "failed"
  | "cancelled";

export type JobType = "video" | "image" | "chat";

export interface GenerationJob {
  id: string;
  userId: string;
  conversationId: string | null;
  messageId: string | null;
  jobType: JobType;
  status: JobStatus;
  inputParams: string;
  provider: string | null;
  providerRequestId: string | null;
  providerStatus: string | null;
  resultUrl: string | null;
  resultContent: string | null;
  storagePath: string | null;
  publicUrl: string | null;
  publicUrlExpiresAt: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  retryCount: number;
  maxRetries: number;
  progressPercent: number | null;
  progressMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  generationTimeMs: number | null;
  costUsd: string | null;
  createdAt: string;
  updatedAt: string;
}

// Estados terminales (no requieren polling)
const TERMINAL_STATUSES: JobStatus[] = ["completed", "failed", "cancelled"];

// Estados activos (requieren polling)
const ACTIVE_STATUSES: JobStatus[] = ["pending", "queued", "processing", "uploading"];

// Helper to convert API job to local format
function mapApiJob(job: ApiGenerationJob): GenerationJob {
  return {
    id: job.id,
    userId: job.userId,
    conversationId: null,
    messageId: null,
    jobType: job.jobType as JobType,
    status: job.status as JobStatus,
    inputParams: job.inputParams,
    provider: null,
    providerRequestId: null,
    providerStatus: null,
    resultUrl: job.resultUrl || null,
    resultContent: null,
    storagePath: null,
    publicUrl: job.publicUrl || null,
    publicUrlExpiresAt: null,
    errorMessage: job.errorMessage || null,
    errorCode: null,
    retryCount: 0,
    maxRetries: 3,
    progressPercent: job.progressPercent || null,
    progressMessage: job.progressMessage || null,
    startedAt: null,
    completedAt: job.completedAt || null,
    generationTimeMs: null,
    costUsd: null,
    createdAt: job.createdAt,
    updatedAt: job.createdAt,
  };
}

/**
 * Hook para obtener jobs pendientes/activos del usuario
 * Hace polling automático mientras haya jobs activos
 */
export function usePendingJobs() {
  return useQuery({
    queryKey: ["jobs", "pending"],
    queryFn: async () => {
      const statuses = ACTIVE_STATUSES.join(",");
      const data = await jobsApi.list({ status: statuses });
      return data.jobs.map(mapApiJob);
    },
    refetchInterval: (query) => {
      // Si hay jobs activos, poll cada 5 segundos
      const data = query.state.data;
      if (data && data.length > 0) {
        return 5000;
      }
      // Si no hay jobs activos, poll cada 60 segundos para detectar nuevos
      return 60000;
    },
    staleTime: 5000, // Considerar stale después de 5 segundos
  });
}

/**
 * Hook para obtener el estado de un job específico
 * Hace polling automático hasta que el job termine
 */
export function useGenerationJob(jobId: string | null) {
  return useQuery({
    queryKey: ["jobs", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const data = await jobsApi.get(jobId);
      return mapApiJob(data.job);
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Si el job terminó, no hacer más polling
      if (data && TERMINAL_STATUSES.includes(data.status)) {
        return false;
      }
      // Poll más frecuente durante processing
      if (data?.status === "processing" || data?.status === "uploading") {
        return 4000;
      }
      // Poll normal para pending/queued
      return 5000;
    },
    staleTime: 3000,
  });
}

/**
 * Hook para obtener múltiples jobs por IDs (polling eficiente)
 */
export function useGenerationJobsByIds(jobIds: string[]) {
  return useQuery({
    queryKey: ["jobs", "poll", jobIds],
    queryFn: async () => {
      if (jobIds.length === 0) return {};
      const data = await jobsApi.poll(jobIds);
      const result: Record<string, GenerationJob> = {};
      for (const [id, job] of Object.entries(data.jobs)) {
        result[id] = mapApiJob(job);
      }
      return result;
    },
    enabled: jobIds.length > 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 5000;

      // Verificar si algún job está activo
      const hasActiveJobs = Object.values(data).some(
        (job) => !TERMINAL_STATUSES.includes(job.status)
      );

      return hasActiveJobs ? 5000 : false;
    },
    staleTime: 3000,
  });
}

/**
 * Hook para cancelar un job
 */
export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      await jobsApi.cancel(jobId);
      // Return a minimal job object with cancelled status
      return { id: jobId, status: "cancelled" as JobStatus } as GenerationJob;
    },
    onSuccess: (_, jobId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "pending"] });
    },
  });
}

/**
 * Hook para obtener jobs de una conversación específica
 */
export function useConversationJobs(conversationId: string | null) {
  return useQuery({
    queryKey: ["jobs", "conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      // Use list with a filter - the backend should support this
      const data = await jobsApi.list({});
      // Filter client-side for now
      return data.jobs.map(mapApiJob);
    },
    enabled: !!conversationId,
    staleTime: 5000,
  });
}

/**
 * Helper para verificar si un job está activo
 */
export function isJobActive(job: GenerationJob): boolean {
  return ACTIVE_STATUSES.includes(job.status);
}

/**
 * Helper para verificar si un job terminó
 */
export function isJobTerminal(job: GenerationJob): boolean {
  return TERMINAL_STATUSES.includes(job.status);
}

/**
 * Helper para obtener mensaje de estado en español
 */
export function getJobStatusMessage(job: GenerationJob): string {
  if (job.progressMessage) {
    return job.progressMessage;
  }

  switch (job.status) {
    case "pending":
      return "En cola...";
    case "queued":
      return "Enviado al servidor...";
    case "processing":
      if (job.jobType === "video") return "Generando video...";
      if (job.jobType === "image") return "Generando imagen...";
      return "Procesando...";
    case "uploading":
      return "Guardando resultado...";
    case "completed":
      return "Completado";
    case "failed":
      return job.errorMessage || "Error al procesar";
    case "cancelled":
      return "Cancelado";
    default:
      return "Procesando...";
  }
}

/**
 * Helper para parsear los parámetros de entrada del job
 */
export function parseJobInputParams(job: GenerationJob): Record<string, unknown> {
  try {
    return JSON.parse(job.inputParams);
  } catch {
    return {};
  }
}
