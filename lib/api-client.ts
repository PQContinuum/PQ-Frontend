/**
 * Centralized API Client for Continuum Backend
 *
 * This module provides a type-safe, centralized way to communicate with
 * the NestJS backend at api.continuumai.llc
 */

import { getSupabaseBrowserClient } from "./supabase/client";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Backend API base URL
 * In production: https://api.continuumai.llc/api/v1
 * For local development: http://localhost:3001/api/v1
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.continuumai.llc/api/v1";

// ============================================================================
// AUTH HELPERS
// ============================================================================

/**
 * Get authentication headers with Supabase JWT token
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No active session. Please log in.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Get authentication headers for multipart/form-data (file uploads)
 * Note: Don't set Content-Type for FormData - browser sets it automatically with boundary
 */
export async function getAuthHeadersForUpload(): Promise<HeadersInit> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No active session. Please log in.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

function normalizeErrorMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => normalizeErrorMessage(v))
      .filter((v) => v.trim().length > 0)
      .join("; ");
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    // Common NestJS error shape: { message: string|string[], error: string, statusCode: number }
    if ("message" in record) return normalizeErrorMessage(record.message);
    if ("error" in record) return normalizeErrorMessage(record.error);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return "";
}

/**
 * Translates API error messages into user-friendly Spanish messages
 */
function getUserFriendlyErrorMessage(
  statusCode: number,
  originalMessage: unknown
): string {
  const message = normalizeErrorMessage(originalMessage) || "Unknown error";
  // Payment/Plan related errors (403)
  if (statusCode === 403) {
    const planKeywords = [
      'plan',
      'suscripción',
      'subscription',
      'pago',
      'payment',
      'premium',
      'upgrade',
      'requiere',
      'requires',
    ];
    const lowerMessage = message.toLowerCase();
    if (planKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      return 'Esta función no está disponible en tu plan actual. Actualiza tu suscripción para acceder a todas las funciones.';
    }
    return 'No tienes permisos para realizar esta acción.';
  }

  // Validation errors (400)
  if (statusCode === 400) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return 'Los datos enviados no son válidos. Por favor, revisa el formulario e intenta de nuevo.';
    }
    if (lowerMessage.includes('messages')) {
      return 'Error al procesar el mensaje. Por favor, intenta de nuevo.';
    }
    return 'Solicitud inválida. Por favor, verifica los datos e intenta de nuevo.';
  }

  // Authentication errors (401)
  if (statusCode === 401) {
    return 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
  }

  // Not found (404)
  if (statusCode === 404) {
    return 'El recurso solicitado no existe o fue eliminado.';
  }

  // Rate limiting (429)
  if (statusCode === 429) {
    return 'Has realizado demasiadas solicitudes. Por favor, espera un momento antes de intentar de nuevo.';
  }

  // Server errors (500+)
  if (statusCode >= 500) {
    return 'Error del servidor. Por favor, intenta de nuevo más tarde.';
  }

  // Return original message if no specific translation
  return message;
}

export class ApiError extends Error {
  public userMessage: string;

  constructor(
    public statusCode: number,
    public statusText: string,
    message: unknown,
    public data?: unknown
  ) {
    const normalized = normalizeErrorMessage(message) || statusText || "Unknown error";
    super(normalized);
    this.name = "ApiError";
    this.userMessage = getUserFriendlyErrorMessage(statusCode, normalized);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage: unknown = response.statusText;
    let errorData: unknown;

    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.message ?? errorBody?.error ?? response.statusText;
      errorData = errorBody;
    } catch {
      // Response body is not JSON
    }

    throw new ApiError(
      response.status,
      response.statusText,
      errorMessage,
      errorData
    );
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// API CLIENT METHODS
// ============================================================================

/**
 * Generic GET request
 */
export async function apiGet<T>(
  endpoint: string,
  options: { params?: Record<string, string> } = {}
): Promise<T> {
  const headers = await getAuthHeaders();

  let url = `${API_BASE_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  return handleResponse<T>(response);
}

/**
 * Generic POST request
 */
export async function apiPost<T>(
  endpoint: string,
  body?: unknown,
  options?: { timeoutMs?: number; signal?: AbortSignal }
): Promise<T> {
  const headers = await getAuthHeaders();

  let signal = options?.signal;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  // If a timeout is specified and no external signal, create an AbortController
  if (options?.timeoutMs && !signal) {
    const controller = new AbortController();
    signal = controller.signal;
    timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    return handleResponse<T>(response);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Generic PATCH request
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: unknown
): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response);
}

/**
 * Generic DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers,
  });

  return handleResponse<T>(response);
}

/**
 * POST request with FormData (for file uploads)
 */
export async function apiPostFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const headers = await getAuthHeadersForUpload();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: formData,
  });

  return handleResponse<T>(response);
}

/**
 * POST request that returns a streaming response (for chat, TTS, etc.)
 * Returns the raw Response object for streaming handling
 */
export async function apiPostStream(
  endpoint: string,
  body?: unknown
): Promise<Response> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage: unknown = response.statusText;
    let errorData: unknown;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.message ?? errorBody?.error ?? response.statusText;
      errorData = errorBody;
    } catch {
      // Response body is not JSON
    }
    throw new ApiError(response.status, response.statusText, errorMessage, errorData);
  }

  return response;
}

// ============================================================================
// TYPED API ENDPOINTS
// ============================================================================

// Types for API responses
export interface Conversation {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  geoCulturalContext: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  category: 'general' | 'work' | 'personal' | 'school' | 'investments' | 'writing' | 'travel' | 'research' | 'coding';
  customInstructions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithConversations extends Project {
  conversations: Conversation[];
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  metadata?: string;
  createdAt: string;
  attachments?: MessageAttachment[];
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface GenerationJob {
  id: string;
  userId: string;
  jobType: "video" | "image" | "chat";
  status:
    | "pending"
    | "queued"
    | "processing"
    | "uploading"
    | "completed"
    | "failed"
    | "cancelled";
  inputParams: string;
  resultUrl?: string;
  publicUrl?: string;
  errorMessage?: string;
  progressPercent?: number;
  progressMessage?: string;
  createdAt: string;
  completedAt?: string;
  // Optimized preview fields for fast loading
  thumbnailUrl?: string;
  previewUrl?: string;
}

export interface UserPlan {
  planName: "Free" | "Basic" | "Professional" | "Enterprise";
  status?: string;
  currentPeriodEnd?: string;
}

// ============================================================================
// CONVERSATIONS API
// ============================================================================

export const conversationsApi = {
  /**
   * Get all conversations for current user
   */
  list: () =>
    apiGet<{ conversations: Conversation[] }>("/conversations"),

  /**
   * Get a single conversation with messages
   */
  get: (id: string) =>
    apiGet<{ conversation: ConversationWithMessages }>(`/conversations/${id}`),

  /**
   * Create a new conversation
   */
  create: (data: { title: string; geoCulturalContext?: string; projectId?: string }) =>
    apiPost<{ conversation: Conversation }>("/conversations", data),

  /**
   * Update a conversation
   */
  update: (id: string, data: { title?: string; geoCulturalContext?: string }) =>
    apiPatch<{ conversation: Conversation }>(`/conversations/${id}`, data),

  /**
   * Delete a conversation
   */
  delete: (id: string) =>
    apiDelete<{ success: boolean }>(`/conversations/${id}`),

  /**
   * Bulk delete multiple conversations
   */
  bulkDelete: (ids: string[]) =>
    apiPost<{ success: boolean; deletedCount: number }>('/conversations/bulk-delete', { ids }),

  /**
   * Get messages for a conversation
   */
  getMessages: (conversationId: string) =>
    apiGet<{ messages: Message[] }>(`/conversations/${conversationId}/messages`),

  /**
   * Create a message in a conversation
   */
  createMessage: (
    conversationId: string,
    data: { role: "user" | "assistant"; content: string; metadata?: string }
  ) =>
    apiPost<{ message: Message }>(
      `/conversations/${conversationId}/messages`,
      data
    ),

  /**
   * Extract facts from a conversation (requires paid plan)
   */
  extractFacts: (conversationId: string) =>
    apiPost<{ facts: unknown[]; extracted: number }>(
      `/conversations/${conversationId}/extract-facts`
    ),

  /**
   * Import conversations from ChatGPT export
   */
  importFromChatGPT: (data: {
    conversations: unknown[];
    skipDuplicates?: boolean;
    preserveTimestamps?: boolean;
  }) =>
    apiPost<{
      success: boolean;
      conversationsImported: number;
      conversationsSkipped: number;
      totalMessagesImported: number;
      errors: Array<{
        conversationTitle: string;
        error: string;
        conversationId?: string;
      }>;
    }>('/conversations/import/chatgpt', data),
};

// ============================================================================
// PROJECTS API
// ============================================================================

export const projectsApi = {
  /**
   * Get all projects for current user
   */
  list: () =>
    apiGet<{ projects: Project[] }>("/projects"),

  /**
   * Get a single project with its conversations
   */
  get: (id: string) =>
    apiGet<{ project: ProjectWithConversations }>(`/projects/${id}`),

  /**
   * Create a new project
   */
  create: (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    category?: Project['category'];
    customInstructions?: string;
  }) =>
    apiPost<{ project: Project }>("/projects", data),

  /**
   * Update a project
   */
  update: (id: string, data: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    category?: Project['category'];
    customInstructions?: string;
  }) =>
    apiPatch<{ project: Project }>(`/projects/${id}`, data),

  /**
   * Delete a project (conversations are unlinked but not deleted)
   */
  delete: (id: string) =>
    apiDelete<{ success: boolean }>(`/projects/${id}`),

  /**
   * Delete a project AND all its conversations (including messages and attachments)
   */
  deleteWithConversations: (id: string) =>
    apiDelete<{ success: boolean; deletedConversations: number }>(
      `/projects/${id}?deleteConversations=true`
    ),

  /**
   * Add a conversation to a project
   */
  addConversation: (projectId: string, conversationId: string) =>
    apiPost<{ success: boolean }>(`/projects/${projectId}/conversations`, { conversationId }),

  /**
   * Remove a conversation from a project
   */
  removeConversation: (projectId: string, conversationId: string) =>
    apiDelete<{ success: boolean }>(`/projects/${projectId}/conversations/${conversationId}`),

  /**
   * Get conversations without a project
   */
  getUnorganized: () =>
    apiGet<{ conversations: Conversation[] }>("/projects/unorganized"),
};

// ============================================================================
// CHAT API
// ============================================================================

export interface ChatRequest {
  message: string;
  enableWebSearch?: boolean;
  webSearchMaxResults?: number;
  conversationId?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
  geoCulturalContext?: {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp?: number;
    address?: string | {
      formattedAddress?: string;
      shortAddress?: string;
      street?: string | null;
      streetNumber?: string | null;
      neighborhood?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
      postalCode?: string | null;
    };
    nearbyPlaces?: unknown[];
  };
  attachmentIds?: string[];
}

export interface EnhancePromptRequest {
  prompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  type: 'image' | 'video';
}

export interface EnhancePromptResponse {
  enhancedPrompt: string;
  wasEnhanced: boolean;
  reason?: string;
}

export const chatApi = {
  /**
   * Send a chat message and get streaming response (NDJSON format)
   */
  stream: (request: ChatRequest) => apiPostStream("/chat", request),

  /**
   * Send a chat message and get non-streaming response
   */
  sync: (request: ChatRequest) =>
    apiPost<{ content: string; role: "assistant"; citations?: { title: string; url: string; snippet: string }[]; webSearchError?: string }>("/chat/sync", request),

  /**
   * Enhance a prompt for image/video generation using conversation context
   * This helps resolve contextual references like "lo anterior", "eso", etc.
   */
  enhancePrompt: (request: EnhancePromptRequest) =>
    apiPost<EnhancePromptResponse>("/chat/enhance-prompt", request),
};

// ============================================================================
// JOBS API (Generation Jobs)
// ============================================================================

export const jobsApi = {
  /**
   * Get all jobs for current user
   */
  list: (params?: { status?: string; type?: string; limit?: number }) =>
    apiGet<{ jobs: GenerationJob[] }>("/jobs", {
      params: params as Record<string, string>,
    }),

  /**
   * Get a specific job
   */
  get: (jobId: string) =>
    apiGet<{ job: GenerationJob }>(`/jobs/${jobId}`),

  /**
   * Poll multiple jobs at once (GET with comma-separated IDs)
   */
  poll: (jobIds: string[]) =>
    apiGet<{ jobs: Record<string, GenerationJob> }>("/jobs/poll", {
      params: { ids: jobIds.join(",") },
    }),

  /**
   * Cancel a job
   */
  cancel: (jobId: string) =>
    apiDelete<{ job: GenerationJob; message: string }>(`/jobs/${jobId}`),

  /**
   * Get queue status
   */
  getQueueStatus: () =>
    apiGet<{
      status: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
      };
    }>("/jobs/status"),
};

// ============================================================================
// IMAGE GENERATION API
// ============================================================================

// Gallery options for public/private media
export interface GalleryOptions {
  isPublic?: boolean;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface ImageGenRequest {
  prompt: string;
  quality?: "low" | "medium" | "high";
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  stylePreset?: string;
  referenceImageUrl?: string;
  imageStrength?: number;
  // Gallery options for public/private
  isPublic?: boolean;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface ImageGenResponse {
  imageUrl: string;
  revisedPrompt?: string;
  storagePath?: string;
  usage: {
    dailyCount: number;
    monthlyCount: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
}

export interface ImageGenUsage {
  dailyCount: number;
  monthlyCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  remainingToday: number;
  remainingMonth: number;
  allowedQualities: string[];
  allowedSizes: string[];
  premiumStyles: boolean;
  planName: string;
}

export const imageGenApi = {
  /**
   * Generate an image (3 min timeout for long prompts / mobile stability)
   */
  generate: (request: ImageGenRequest) =>
    apiPost<ImageGenResponse>("/image-gen", request, { timeoutMs: 180_000 }),

  /**
   * Get usage statistics
   */
  getUsage: () => apiGet<{ usage: ImageGenUsage }>("/image-gen"),

  /**
   * Upload a reference image for image-to-image
   */
  uploadReference: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiPostFormData<{ imageUrl: string; storagePath: string }>(
      "/image-gen/upload-reference",
      formData
    );
  },
};

// ============================================================================
// VIDEO GENERATION API
// ============================================================================

export interface VideoGenRequest {
  prompt: string;
  mode?: "text-to-video" | "image-to-video";
  duration?: "5" | "10";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  generateAudio?: boolean;
  imageUrl?: string;
  // Gallery options for public/private
  isPublic?: boolean;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface VideoGenResponse {
  jobId: string;
  status: string;
  message: string;
  queuePosition?: number;
  usage: {
    dailyCount: number;
    monthlyCount: number;
    dailyLimit: number;
    monthlyLimit: number;
  };
}

export interface VideoGenUsage {
  dailyCount: number;
  monthlyCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  allowedModes: string[];
  allowedDurations: string[];
  allowedAspectRatios: string[];
  audioEnabled: boolean;
  planName: string;
}

export const videoGenApi = {
  /**
   * Generate a video (returns job ID for polling)
   */
  generate: (request: VideoGenRequest) =>
    apiPost<VideoGenResponse>("/video-gen", request),

  /**
   * Get usage statistics
   */
  getUsage: () => apiGet<{ usage: VideoGenUsage }>("/video-gen"),

  /**
   * Upload an image for image-to-video mode
   */
  uploadImage: async (file: File): Promise<{ imageUrl: string; storagePath: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const data = await apiPostFormData<{ url: string; imageUrl?: string; storagePath?: string }>(
      "/video-gen/upload-image",
      formData
    );
    return {
      imageUrl: data.imageUrl || data.url,
      storagePath: data.storagePath || '',
    };
  },
};

// ============================================================================
// CLOUDFLARE API
// ============================================================================

export const cloudflareApi = {
  /**
   * Generate MP4 download for a Cloudflare Stream video
   */
  createVideoDownload: (uid: string, wait: boolean = true) =>
    apiPost<{ status: string; url: string | null; percentComplete?: number | null }>(
      `/cloudflare/videos/${uid}/download${wait ? "?wait=true" : ""}`,
      {}
    ),
};

// ============================================================================
// TTS API
// ============================================================================

export interface TtsRequest {
  text: string;
  voice?:
    | "alloy"
    | "ash"
    | "ballad"
    | "coral"
    | "echo"
    | "fable"
    | "nova"
    | "onyx"
    | "sage"
    | "shimmer"
    | "verse";
  format?: "pcm" | "mp3";
}

export const ttsApi = {
  /**
   * Generate speech from text (returns audio stream)
   */
  generate: (request: TtsRequest) => apiPostStream("/tts", request),
};

// ============================================================================
// TRANSCRIPTION API
// ============================================================================

export const transcribeApi = {
  /**
   * Transcribe audio to text
   */
  transcribe: (audioFile: File, language?: string) => {
    const formData = new FormData();
    formData.append("audio", audioFile);
    const queryParams = language ? `?language=${encodeURIComponent(language)}` : "";
    return apiPostFormData<{ text: string; language: string }>(
      `/transcribe${queryParams}`,
      formData
    );
  },
};

// ============================================================================
// USER & BILLING API
// ============================================================================

export const userApi = {
  /**
   * Get current user's profile
   */
  getProfile: () => apiGet<{ user: unknown; profile: unknown }>("/users/me"),

  /**
   * Get current user's plan from backend
   * The backend now returns planName directly from the subscriptions table
   */
  getPlan: async () => {
    const data = await apiGet<{
      user: unknown;
      profile: unknown;
      hasActiveSubscription: boolean;
      planName: "Free" | "Basic" | "Professional" | "Enterprise";
    }>("/users/me");

    return {
      planName: data.planName || "Free",
      status: data.hasActiveSubscription ? "active" : "inactive",
    } as UserPlan;
  },

  /**
   * Get account statistics for settings dialog
   */
  getStats: () =>
    apiGet<{
      conversationCount: number;
      messageCount: number;
      createdAt: string;
      emailVerified: boolean;
      subscription: {
        planName: string;
        status: string;
        currentPeriodStart: string | null;
        currentPeriodEnd: string | null;
        cancelAtPeriodEnd: boolean;
      } | null;
    }>("/users/me/stats"),

  /**
   * Get consolidated usage stats (images, video, TTS, chat)
   */
  getUsage: () =>
    apiGet<ConsolidatedUsage>("/users/me/usage"),
};

// Plan feature config from GET /billing/plan-features
export interface PlanFeatureConfig {
  name: string;
  display: {
    name: string;
    label: string;
    description: string;
    popular: boolean;
    features: string[];
  };
  chat: {
    requestsPerMinute: number;
    tokensPerDay: number;
    model: { model: string; label: string; maxTokens: number };
  };
  imageGen: {
    daily: number;
    monthly: number;
    qualities: string[];
    sizes: string[];
    premiumStyles: boolean;
  };
  videoGen: {
    daily: number;
    monthly: number;
    durations: string[];
    aspectRatios: string[];
    modes: string[];
    audioEnabled: boolean;
  };
  tts: { dailyCharacters: number; monthlyCharacters: number };
  context: { maxContextItems: number; autoExtraction: boolean; contextTokens: number };
}

// Consolidated usage type from backend
export interface ConsolidatedUsage {
  planName: string;
  planConfig: {
    display: {
      name: string;
      label: string;
      description: string;
      popular: boolean;
      features: string[];
    };
    chat: {
      requestsPerMinute: number;
      tokensPerDay: number;
      model: { model: string; label: string; maxTokens: number };
    };
    imageGen: {
      daily: number;
      monthly: number;
      qualities: string[];
      sizes: string[];
      premiumStyles: boolean;
    };
    videoGen: {
      daily: number;
      monthly: number;
      durations: string[];
      aspectRatios: string[];
      modes: string[];
      audioEnabled: boolean;
    };
    tts: { dailyCharacters: number; monthlyCharacters: number };
    context: { maxContextItems: number; autoExtraction: boolean; contextTokens: number };
  };
  imageGen: {
    todayCount: number;
    monthCount: number;
    dailyLimit: number;
    monthlyLimit: number;
    remainingToday: number;
    remainingMonth: number;
    monthCostUsd: number;
    percentUsed: number;
  };
  videoGen: {
    todayCount: number;
    monthCount: number;
    dailyLimit: number;
    monthlyLimit: number;
    remainingToday: number;
    remainingMonth: number;
    monthCostUsd: number;
    percentUsed: number;
  };
  tts: {
    todayCharacters: number;
    monthCharacters: number;
    dailyLimit: number;
    monthlyLimit: number;
    remainingToday: number;
    remainingMonth: number;
    monthCostUsd: number;
    percentUsed: number;
  };
  chat: {
    tokensPerDay: number;
    requestsPerMinute: number;
    model: { model: string; label: string; maxTokens: number };
  };
  totalMonthCostUsd: number;
}

export const billingApi = {
  /**
   * Get all plan configurations with limits, features, and pricing.
   * Single source of truth from backend.
   */
  getPlanFeatures: () =>
    apiGet<{ plans: PlanFeatureConfig[] }>("/billing/plan-features"),

  /**
   * Get available subscription plans (Stripe products + prices)
   */
  getPlans: () => apiGet<unknown[]>("/billing/plans"),

  /**
   * Get current subscription
   */
  getSubscription: () =>
    apiGet<{ hasSubscription: boolean; subscription: unknown }>(
      "/billing/subscription"
    ),

  /**
   * Create checkout session
   */
  createCheckoutSession: (data: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }) =>
    apiPost<{ sessionId: string; url: string }>("/billing/checkout", data),

  /**
   * Create billing portal session
   */
  createPortalSession: (data: { returnUrl: string }) =>
    apiPost<{ url: string }>("/billing/portal", data),

  /**
   * Get checkout session status
   */
  getSessionStatus: (sessionId: string) =>
    apiGet<{
      status: string;
      paymentStatus: string;
      customerEmail?: string;
      subscriptionId?: string;
    }>("/billing/session-status", { params: { session_id: sessionId } }),

  /**
   * Cancel subscription
   */
  cancelSubscription: (immediate?: boolean) =>
    apiDelete<{ status: string; cancelAtPeriodEnd: boolean }>(
      `/billing/subscription${immediate ? "?immediate=true" : ""}`
    ),
};

// ============================================================================
// ATTACHMENTS API
// ============================================================================

export interface ExtractedTextResponse {
  attachmentId: string;
  fileName: string;
  mimeType: string;
  extractedText: string | null;
  message?: string;
  canExtract: boolean;
  charCount?: number;
}

export const attachmentsApi = {
  /**
   * Upload an attachment to a conversation
   */
  upload: (conversationId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiPostFormData<{
      success: boolean;
      attachment: {
        id: string;
        fileName: string;
        fileType: string;
        storagePath: string;
        signedUrl: string;
      };
    }>(`/conversations/${conversationId}/attachments`, formData);
  },

  /**
   * Get attachments for a conversation
   */
  list: (conversationId: string) =>
    apiGet<{ attachments: unknown[] }>(`/conversations/${conversationId}/attachments`),

  /**
   * Extract text content from a document attachment
   * Supports: PDF, Word (.docx), Excel (.xlsx), and text-based files
   */
  extractText: (conversationId: string, attachmentId: string) =>
    apiGet<ExtractedTextResponse>(`/conversations/${conversationId}/attachments/${attachmentId}/extract-text`),
};

// ============================================================================
// FEEDBACK API
// ============================================================================

export const feedbackApi = {
  /**
   * Submit feedback
   */
  submit: (data: {
    category: string;
    sentiment: string;
    message: string;
    pageUrl?: string;
    conversationId?: string;
    metadata?: Record<string, unknown>;
  }) => apiPost<{ id: string }>("/feedback", data),

  /**
   * Get user's feedback history
   */
  list: (limit?: number) =>
    apiGet<{ feedback: unknown[] }>("/feedback", {
      params: limit ? { limit: limit.toString() } : undefined,
    }),
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthApi = {
  /**
   * Check backend health (public endpoint)
   */
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },
};

// ============================================================================
// CHARACTERS API
// ============================================================================

import type {
  Character,
  CreateCharacterInput,
  UpdateCharacterVisibilityInput,
  PublicCharactersParams,
  PublicCharactersResponse,
} from "./lisa/types";

export const charactersApi = {
  // ============================================================================
  // USER'S OWN CHARACTERS (authenticated)
  // ============================================================================

  /**
   * Get all characters for current user
   */
  list: () => apiGet<{ characters: Character[] }>("/characters"),

  /**
   * Get a specific character by ID
   */
  get: (id: string) => apiGet<{ character: Character }>(`/characters/${id}`),

  /**
   * Create a new character
   */
  create: (data: CreateCharacterInput) =>
    apiPost<{ character: Character }>("/characters", data),

  /**
   * Update a character
   */
  update: (id: string, data: Partial<CreateCharacterInput>) =>
    apiPatch<{ character: Character }>(`/characters/${id}`, data),

  /**
   * Delete a character
   */
  delete: (id: string) => apiDelete<{ success: boolean }>(`/characters/${id}`),

  /**
   * Upload reference image for a character
   */
  uploadReference: (characterId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiPostFormData<{
      character: Character;
      imageUrl: string;
      storagePath: string;
    }>(`/characters/${characterId}/upload-reference`, formData);
  },

  // ============================================================================
  // VISIBILITY & SHARING (authenticated)
  // ============================================================================

  /**
   * Update character visibility (public/private)
   */
  updateVisibility: (id: string, data: UpdateCharacterVisibilityInput) =>
    apiPatch<{ character: Character }>(`/characters/${id}/visibility`, data),

  /**
   * Clone a public character
   */
  clone: (id: string) =>
    apiPost<{ character: Character }>(`/characters/${id}/clone`),

  /**
   * Create a new version of a character
   */
  createVersion: (id: string, data: Partial<CreateCharacterInput>) =>
    apiPost<{ character: Character }>(`/characters/${id}/version`, data),

  /**
   * Like a public character
   */
  like: (id: string) => apiPost<{ success: boolean }>(`/characters/${id}/like`),

  /**
   * Unlike a public character
   */
  unlike: (id: string) =>
    apiDelete<{ success: boolean }>(`/characters/${id}/like`),

  /**
   * Track character share
   */
  share: (id: string) =>
    apiPost<{ success: boolean }>(`/characters/${id}/share`),

  // ============================================================================
  // PUBLIC GALLERY (no auth required)
  // ============================================================================

  /**
   * Get public characters with pagination and filters
   */
  getPublicCharacters: async (
    params?: PublicCharactersParams
  ): Promise<PublicCharactersResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
    }
    const url = `${API_BASE_URL}/characters/public${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url);
    return handleResponse<PublicCharactersResponse>(response);
  },

  /**
   * Get a public character by ID
   */
  getPublicCharacter: async (id: string): Promise<{ character: Character }> => {
    const url = `${API_BASE_URL}/characters/public/${id}`;
    const response = await fetch(url);
    return handleResponse<{ character: Character }>(response);
  },

  /**
   * Get featured characters
   */
  getFeatured: async (limit?: number): Promise<{ characters: Character[] }> => {
    const url = `${API_BASE_URL}/characters/public/featured${limit ? `?limit=${limit}` : ""}`;
    const response = await fetch(url);
    return handleResponse<{ characters: Character[] }>(response);
  },

  /**
   * Get trending characters
   */
  getTrending: async (limit?: number): Promise<{ characters: Character[] }> => {
    const url = `${API_BASE_URL}/characters/public/trending${limit ? `?limit=${limit}` : ""}`;
    const response = await fetch(url);
    return handleResponse<{ characters: Character[] }>(response);
  },

  /**
   * Get characters by creator
   */
  getCreatorCharacters: async (
    creatorId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PublicCharactersResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
    }
    const url = `${API_BASE_URL}/characters/creator/${creatorId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url);
    return handleResponse<PublicCharactersResponse>(response);
  },
};

// ============================================================================
// GALLERY API
// ============================================================================

export interface GalleryItem {
  id: string;
  mediaType: "video" | "image";
  title: string;
  description: string | null;
  prompt: string;
  tags: string[];
  isPublic?: boolean;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  isFeatured: boolean;
  createdAt: string;
  creator: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  hasLiked?: boolean;
  // Video specific
  videoUrl?: string;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  aspectRatio?: string;
  duration?: string;
  // Image specific
  imageUrl?: string;
  size?: string;
  quality?: string;
  stylePreset?: string | null;
}

export interface GalleryPaginatedResponse {
  items: GalleryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface GalleryStats {
  totalVideos: number;
  totalImages: number;
  totalCreators: number;
  totalViews: number;
  totalLikes: number;
}

export interface CreatorProfile {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  totalVideos: number;
  totalImages: number;
  totalLikes: number;
  totalViews: number;
  memberSince: string;
}

export interface GalleryQueryParams {
  page?: number;
  limit?: number;
  sortBy?: "recent" | "popular" | "trending" | "likes";
  aspectRatio?: "16:9" | "9:16" | "1:1" | "all";
  tags?: string;
  search?: string;
  mediaType?: "video" | "image" | "all";
}

export interface UpdateMediaVisibilityRequest {
  isPublic: boolean;
  title?: string;
  description?: string;
  tags?: string[];
}

export const galleryApi = {
  /**
   * Browse public gallery (videos and images)
   */
  browse: async (params?: GalleryQueryParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
    }
    const url = `${API_BASE_URL}/gallery${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url);
    return handleResponse<GalleryPaginatedResponse>(response);
  },

  /**
   * Browse public gallery (authenticated - includes hasLiked)
   */
  browseAuth: (params?: GalleryQueryParams) =>
    apiGet<GalleryPaginatedResponse>("/gallery/me", {
      params: params as Record<string, string>,
    }),

  /**
   * Get videos only
   */
  getVideos: async (params?: GalleryQueryParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
    }
    const url = `${API_BASE_URL}/gallery/videos${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url);
    return handleResponse<GalleryPaginatedResponse>(response);
  },

  /**
   * Get images only
   */
  getImages: async (params?: GalleryQueryParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
    }
    const url = `${API_BASE_URL}/gallery/images${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url);
    return handleResponse<GalleryPaginatedResponse>(response);
  },

  /**
   * Get featured media
   */
  getFeatured: async (limit?: number) => {
    const url = `${API_BASE_URL}/gallery/featured${limit ? `?limit=${limit}` : ""}`;
    const response = await fetch(url);
    return handleResponse<GalleryItem[]>(response);
  },

  /**
   * Get trending media
   */
  getTrending: async (limit?: number) => {
    const url = `${API_BASE_URL}/gallery/trending${limit ? `?limit=${limit}` : ""}`;
    const response = await fetch(url);
    return handleResponse<GalleryItem[]>(response);
  },

  /**
   * Get gallery statistics
   */
  getStats: async () => {
    const url = `${API_BASE_URL}/gallery/stats`;
    const response = await fetch(url);
    return handleResponse<GalleryStats>(response);
  },

  /**
   * Get popular tags
   */
  getPopularTags: async (limit?: number) => {
    const url = `${API_BASE_URL}/gallery/tags${limit ? `?limit=${limit}` : ""}`;
    const response = await fetch(url);
    return handleResponse<{ tag: string; count: number }[]>(response);
  },

  /**
   * Get video by ID (tries with auth if available, falls back to public)
   */
  getVideo: async (videoId: string) => {
    const url = `${API_BASE_URL}/gallery/video/${videoId}`;
    let headers: HeadersInit = { "Content-Type": "application/json" };
    try {
      headers = await getAuthHeaders();
    } catch {
      // No session — proceed without auth
    }
    const response = await fetch(url, { headers });
    return handleResponse<GalleryItem>(response);
  },

  /**
   * Get image by ID (tries with auth if available, falls back to public)
   */
  getImage: async (imageId: string) => {
    const url = `${API_BASE_URL}/gallery/image/${imageId}`;
    let headers: HeadersInit = { "Content-Type": "application/json" };
    try {
      headers = await getAuthHeaders();
    } catch {
      // No session — proceed without auth
    }
    const response = await fetch(url, { headers });
    return handleResponse<GalleryItem>(response);
  },

  /**
   * Get creator profile
   */
  getCreatorProfile: async (userId: string) => {
    const url = `${API_BASE_URL}/gallery/creator/${userId}`;
    const response = await fetch(url);
    return handleResponse<CreatorProfile>(response);
  },

  /**
   * Get creator's media
   */
  getCreatorMedia: async (userId: string, params?: GalleryQueryParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.set(key, String(value));
        }
      });
    }
    const url = `${API_BASE_URL}/gallery/creator/${userId}/media${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    const response = await fetch(url);
    return handleResponse<GalleryPaginatedResponse>(response);
  },

  /**
   * Get my media (authenticated - includes private)
   */
  getMyMedia: (params?: GalleryQueryParams) =>
    apiGet<GalleryPaginatedResponse>("/gallery/me/media", {
      params: params as Record<string, string>,
    }),

  /**
   * Get my videos
   */
  getMyVideos: (params?: GalleryQueryParams) =>
    apiGet<GalleryPaginatedResponse>("/gallery/me/videos", {
      params: params as Record<string, string>,
    }),

  /**
   * Get my images
   */
  getMyImages: (params?: GalleryQueryParams) =>
    apiGet<GalleryPaginatedResponse>("/gallery/me/images", {
      params: params as Record<string, string>,
    }),

  /**
   * Like/unlike a video (toggle)
   */
  likeVideo: (videoId: string) =>
    apiPost<{ liked: boolean }>(`/gallery/video/${videoId}/like`),

  /**
   * Like/unlike an image (toggle)
   */
  likeImage: (imageId: string) =>
    apiPost<{ liked: boolean }>(`/gallery/image/${imageId}/like`),

  /**
   * Track video share
   */
  shareVideo: async (videoId: string) => {
    const url = `${API_BASE_URL}/gallery/video/${videoId}/share`;
    const response = await fetch(url, { method: "POST" });
    return handleResponse<{ success: boolean }>(response);
  },

  /**
   * Track image share
   */
  shareImage: async (imageId: string) => {
    const url = `${API_BASE_URL}/gallery/image/${imageId}/share`;
    const response = await fetch(url, { method: "POST" });
    return handleResponse<{ success: boolean }>(response);
  },

  /**
   * Update video visibility (make public/private)
   */
  updateVideoVisibility: (videoId: string, data: UpdateMediaVisibilityRequest) =>
    apiPatch<GalleryItem>(`/gallery/video/${videoId}/visibility`, data),

  /**
   * Update image visibility (make public/private)
   */
  updateImageVisibility: (imageId: string, data: UpdateMediaVisibilityRequest) =>
    apiPatch<GalleryItem>(`/gallery/image/${imageId}/visibility`, data),

  /**
   * Delete a video
   */
  deleteVideo: (videoId: string) =>
    apiDelete<{ success: boolean }>(`/gallery/video/${videoId}`),

  /**
   * Delete an image
   */
  deleteImage: (imageId: string) =>
    apiDelete<{ success: boolean }>(`/gallery/image/${imageId}`),

  /**
   * Batch delete videos
   */
  batchDeleteVideos: (ids: string[]) =>
    apiPost<{ success: boolean }>('/gallery/me/videos', { ids }),

  /**
   * Batch delete images
   */
  batchDeleteImages: (ids: string[]) =>
    apiPost<{ success: boolean }>('/gallery/me/images', { ids }),
};

// ============================================================================
// VERIFICATION API (2FA & Profile Completion)
// ============================================================================

export type OccupationType =
  | "professional"
  | "student"
  | "scientist"
  | "academic"
  | "entrepreneur"
  | "startup"
  | "government"
  | "content_creator"
  | "other";

export interface VerificationStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  profileCompleted: boolean;
  email: string | null;
  phone: string | null;
  fullName: string | null;
  country: string | null;
  occupation: OccupationType[] | null;
}

export interface SendCodeResponse {
  success: boolean;
  message: string;
  expiresAt: string;
  canResendAt: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  verified: boolean;
}

export interface CompleteProfileResponse {
  success: boolean;
  message: string;
  profile: {
    fullName: string;
    country: string;
    occupation: OccupationType[];
    emailVerified: boolean;
    phoneVerified: boolean;
    profileCompleted: boolean;
  };
}

export interface SendEmailVerificationRequest {
  email: string;
}

export interface SendSmsVerificationRequest {
  phone: string;
}

export interface VerifyCodeRequest {
  type: "email" | "sms";
  code: string;
  target: string;
}

export interface CompleteProfileRequest {
  fullName: string;
  country: string;
  occupation: OccupationType[];
}

export const verificationApi = {
  /**
   * Get current verification status
   */
  getStatus: () =>
    apiGet<VerificationStatus>("/verification/status"),

  /**
   * Send email verification code
   */
  sendEmailCode: (data: SendEmailVerificationRequest) =>
    apiPost<SendCodeResponse>("/verification/email/send", data),

  /**
   * Send SMS verification code
   */
  sendSmsCode: (data: SendSmsVerificationRequest) =>
    apiPost<SendCodeResponse>("/verification/sms/send", data),

  /**
   * Verify a code (email or SMS)
   */
  verifyCode: (data: VerifyCodeRequest) =>
    apiPost<VerifyCodeResponse>("/verification/verify", data),

  /**
   * Complete user profile after verification
   */
  completeProfile: (data: CompleteProfileRequest) =>
    apiPost<CompleteProfileResponse>("/verification/complete-profile", data),
};
