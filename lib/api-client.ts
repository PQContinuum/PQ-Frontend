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

/**
 * Translates API error messages into user-friendly Spanish messages
 */
function getUserFriendlyErrorMessage(
  statusCode: number,
  originalMessage: string
): string {
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
    const lowerMessage = originalMessage.toLowerCase();
    if (planKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      return 'Esta función no está disponible en tu plan actual. Actualiza tu suscripción para acceder a todas las funciones.';
    }
    return 'No tienes permisos para realizar esta acción.';
  }

  // Validation errors (400)
  if (statusCode === 400) {
    const lowerMessage = originalMessage.toLowerCase();
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
  return originalMessage;
}

export class ApiError extends Error {
  public userMessage: string;

  constructor(
    public statusCode: number,
    public statusText: string,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.userMessage = getUserFriendlyErrorMessage(statusCode, message);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = response.statusText;
    let errorData: unknown;

    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || response.statusText;
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
  body?: unknown
): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response);
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
    let errorMessage = response.statusText;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || response.statusText;
    } catch {
      // Response body is not JSON
    }
    throw new ApiError(response.status, response.statusText, errorMessage);
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
  title: string;
  geoCulturalContext: string | null;
  createdAt: string;
  updatedAt: string;
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
  create: (data: { title: string; geoCulturalContext?: string }) =>
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
// CHAT API
// ============================================================================

export interface ChatRequest {
  message: string;
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

export const chatApi = {
  /**
   * Send a chat message and get streaming response (NDJSON format)
   */
  stream: (request: ChatRequest) => apiPostStream("/chat", request),

  /**
   * Send a chat message and get non-streaming response
   */
  sync: (request: ChatRequest) =>
    apiPost<{ content: string; role: "assistant" }>("/chat/sync", request),
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
   * Generate an image
   */
  generate: (request: ImageGenRequest) =>
    apiPost<ImageGenResponse>("/image-gen", request),

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
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiPostFormData<{ imageUrl: string; storagePath: string }>(
      "/video-gen/upload-image",
      formData
    );
  },
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
    formData.append("file", audioFile);
    if (language) {
      formData.append("language", language);
    }
    return apiPostFormData<{ text: string; language: string }>(
      "/transcribe",
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
};

export const billingApi = {
  /**
   * Get available subscription plans
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

export const attachmentsApi = {
  /**
   * Upload an attachment
   */
  upload: (conversationId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conversationId);
    return apiPostFormData<{
      id: string;
      fileName: string;
      fileType: string;
      storagePath: string;
      signedUrl: string;
    }>("/attachments", formData);
  },

  /**
   * Get attachments for a conversation
   */
  list: (conversationId: string) =>
    apiGet<{ attachments: unknown[] }>(`/attachments`, {
      params: { conversationId },
    }),
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
// GALLERY API
// ============================================================================

export interface GalleryItem {
  id: string;
  mediaType: "video" | "image";
  title: string;
  description: string | null;
  prompt: string;
  tags: string[];
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
   * Get video by ID
   */
  getVideo: async (videoId: string) => {
    const url = `${API_BASE_URL}/gallery/video/${videoId}`;
    const response = await fetch(url);
    return handleResponse<GalleryItem>(response);
  },

  /**
   * Get image by ID
   */
  getImage: async (imageId: string) => {
    const url = `${API_BASE_URL}/gallery/image/${imageId}`;
    const response = await fetch(url);
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
};
