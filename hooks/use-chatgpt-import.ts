import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api-client';
import { conversationKeys } from '@/hooks/use-conversations';
import type {
  ChatGPTExportConversation,
  ChatGPTImportResult,
  ImportFileMetadata,
  ImportHistoryResponse,
  MediaMappingEntry,
} from '@/types/chatgpt-export.types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const importKeys = {
  all: ['chatgpt-import'] as const,
  history: () => [...importKeys.all, 'history'] as const,
};

// ============================================================================
// IMPORT MUTATION
// ============================================================================

interface ImportChatGPTParams {
  conversations: ChatGPTExportConversation[];
  skipDuplicates?: boolean;
  preserveTimestamps?: boolean;
  fileMetadata?: ImportFileMetadata;
  mediaMapping?: MediaMappingEntry[];
}

/**
 * Hook for importing ChatGPT conversations
 * Handles the mutation and cache invalidation
 */
export function useChatGPTImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ImportChatGPTParams): Promise<ChatGPTImportResult> => {
      const result = await apiPost<ChatGPTImportResult>('/conversations/import/chatgpt', {
        conversations: params.conversations,
        skipDuplicates: params.skipDuplicates ?? true,
        preserveTimestamps: params.preserveTimestamps ?? true,
        fileMetadata: params.fileMetadata,
        mediaMapping: params.mediaMapping,
      });
      return result;
    },
    onSuccess: () => {
      // Invalidate conversations cache to refresh the sidebar
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      // Invalidate import history cache
      queryClient.invalidateQueries({ queryKey: importKeys.history() });
    },
    onError: (error) => {
      console.error('[ChatGPT Import] Error:', error);
    },
  });
}

// ============================================================================
// IMPORT HISTORY QUERY
// ============================================================================

/**
 * Hook for fetching import history
 */
export function useImportHistory() {
  return useQuery({
    queryKey: importKeys.history(),
    queryFn: async (): Promise<ImportHistoryResponse> => {
      try {
        const result = await apiGet<ImportHistoryResponse>('/conversations/import/history');
        return result;
      } catch (error) {
        // If endpoint doesn't exist yet, return empty history
        console.warn('[ChatGPT Import] History endpoint not available:', error);
        return {
          imports: [],
          totals: {
            totalImports: 0,
            totalConversationsImported: 0,
            totalMessagesImported: 0,
            totalFactsExtracted: 0,
          },
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate SHA-256 hash of a file
 * Used to detect duplicate file uploads
 */
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Get reason text in Spanish for skipped conversations
 */
export function getSkipReasonText(reason: string): string {
  const reasons: Record<string, string> = {
    'empty': 'Conversación vacía',
    'only_system_messages': 'Solo mensajes del sistema',
    'only_tool_calls': 'Solo llamadas a herramientas',
    'no_user_or_assistant': 'Sin mensajes de usuario o asistente',
    'parse_error': 'Error al procesar',
    'duplicate_by_title_and_date': 'Ya existe (mismo título y fecha)',
  };
  return reasons[reason] || reason;
}

export type { ImportChatGPTParams };
