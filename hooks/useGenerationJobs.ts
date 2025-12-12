"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

/**
 * Hook para obtener jobs pendientes/activos del usuario
 * Hace polling automático mientras haya jobs activos
 */
export function usePendingJobs() {
  return useQuery({
    queryKey: ["jobs", "pending"],
    queryFn: async () => {
      const statuses = ACTIVE_STATUSES.join(",");
      const response = await fetch(`/api/jobs?status=${statuses}`);
      if (!response.ok) {
        throw new Error("Failed to fetch pending jobs");
      }
      const data = await response.json();
      return data.jobs as GenerationJob[];
    },
    refetchInterval: (query) => {
      // Si hay jobs activos, poll cada 3 segundos
      const data = query.state.data;
      if (data && data.length > 0) {
        return 3000;
      }
      // Si no hay jobs activos, poll cada 30 segundos para detectar nuevos
      return 30000;
    },
    staleTime: 2000, // Considerar stale después de 2 segundos
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
      const response = await fetch(`/api/jobs/${jobId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch job");
      }
      const data = await response.json();
      return data.job as GenerationJob;
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
        return 2000;
      }
      // Poll normal para pending/queued
      return 3000;
    },
    staleTime: 1000,
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
      const ids = jobIds.join(",");
      const response = await fetch(`/api/jobs/poll?ids=${ids}`);
      if (!response.ok) {
        throw new Error("Failed to poll jobs");
      }
      const data = await response.json();
      return data.jobs as Record<string, GenerationJob>;
    },
    enabled: jobIds.length > 0,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;

      // Verificar si algún job está activo
      const hasActiveJobs = Object.values(data).some(
        (job) => !TERMINAL_STATUSES.includes(job.status)
      );

      return hasActiveJobs ? 3000 : false;
    },
    staleTime: 1000,
  });
}

/**
 * Hook para crear un nuevo job
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      conversationId,
      messageId,
      params,
    }: {
      type: JobType;
      conversationId?: string;
      messageId?: string;
      params: Record<string, unknown>;
    }) => {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, conversationId, messageId, params }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create job");
      }

      const data = await response.json();
      return data.job as GenerationJob;
    },
    onSuccess: () => {
      // Invalidar la lista de jobs pendientes
      queryClient.invalidateQueries({ queryKey: ["jobs", "pending"] });
    },
  });
}

/**
 * Hook para cancelar un job
 */
export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel job");
      }

      const data = await response.json();
      return data.job as GenerationJob;
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
      const response = await fetch(`/api/jobs?conversationId=${conversationId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch conversation jobs");
      }
      const data = await response.json();
      return data.jobs as GenerationJob[];
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
