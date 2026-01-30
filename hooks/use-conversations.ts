import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi, type Conversation, type ConversationWithMessages } from '@/lib/api-client';

export type { Conversation, ConversationWithMessages };

// Query keys
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (filters?: unknown) => [...conversationKeys.lists(), { filters }] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
};

// Fetch todas las conversaciones
async function fetchConversations(): Promise<Conversation[]> {
  const data = await conversationsApi.list();
  return data.conversations;
}

// Fetch conversación específica
async function fetchConversation(id: string): Promise<ConversationWithMessages> {
  const data = await conversationsApi.get(id);
  return data.conversation;
}

// Crear conversación
async function createConversation(params: { title: string; geoCulturalContext?: string }) {
  const data = await conversationsApi.create(params);
  return data.conversation;
}

// Eliminar conversación
async function deleteConversation(id: string) {
  await conversationsApi.delete(id);
  return { id };
}

// Eliminar múltiples conversaciones
async function deleteConversations(ids: string[]) {
  const result = await conversationsApi.bulkDelete(ids);
  return { ids, deletedCount: result.deletedCount };
}

// Hook: Obtener todas las conversaciones
export function useConversations() {
  return useQuery({
    queryKey: conversationKeys.lists(),
    queryFn: fetchConversations,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook: Obtener una conversación específica
export function useConversation(id: string | null) {
  return useQuery({
    queryKey: conversationKeys.detail(id!),
    queryFn: () => fetchConversation(id!),
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 1000 * 60 * 10, // 10 minutos - cache más agresivo
  });
}

// Hook: Prefetch de conversación (para hover)
export function usePrefetchConversation() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: conversationKeys.detail(id),
      queryFn: () => fetchConversation(id),
      staleTime: 1000 * 60 * 10, // 10 minutos
    });
  };
}

// Hook: Crear conversación
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      // Actualizar cache optimistamente
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.lists(),
        (old) => {
          if (!old) return [newConversation];
          return [newConversation, ...old];
        }
      );
    },
    onError: () => {
      // En caso de error, invalidar para refetch
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

// Hook: Eliminar conversación
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversation,
    // Optimistic update
    onMutate: async (deletedId) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: conversationKeys.lists() });

      // Snapshot del valor anterior
      const previousConversations = queryClient.getQueryData<Conversation[]>(
        conversationKeys.lists()
      );

      // Actualizar cache optimistamente
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.lists(),
        (old) => old?.filter((conv) => conv.id !== deletedId) ?? []
      );

      return { previousConversations };
    },
    onError: (_err, _deletedId, context) => {
      // Revertir en caso de error
      if (context?.previousConversations) {
        queryClient.setQueryData(
          conversationKeys.lists(),
          context.previousConversations
        );
      }
    },
    onSettled: () => {
      // Siempre invalidar después de mutar
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

// Hook: Eliminar múltiples conversaciones
export function useDeleteConversations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversations,
    // Optimistic update
    onMutate: async (deletedIds) => {
      // Cancelar queries en curso
      await queryClient.cancelQueries({ queryKey: conversationKeys.lists() });

      // Snapshot del valor anterior
      const previousConversations = queryClient.getQueryData<Conversation[]>(
        conversationKeys.lists()
      );

      // Actualizar cache optimistamente - eliminar todas las seleccionadas
      const idsSet = new Set(deletedIds);
      queryClient.setQueryData<Conversation[]>(
        conversationKeys.lists(),
        (old) => old?.filter((conv) => !idsSet.has(conv.id)) ?? []
      );

      return { previousConversations };
    },
    onError: (_err, _deletedIds, context) => {
      // Revertir en caso de error
      if (context?.previousConversations) {
        queryClient.setQueryData(
          conversationKeys.lists(),
          context.previousConversations
        );
      }
    },
    onSettled: () => {
      // Siempre invalidar después de mutar
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}
