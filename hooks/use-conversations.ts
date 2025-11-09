import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Conversation } from '@/db/schema';

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
  const response = await fetch('/api/conversations');

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    throw new Error('Failed to fetch conversations');
  }

  const data = await response.json();
  return data.conversations;
}

// Fetch conversación específica
async function fetchConversation(id: string) {
  const response = await fetch(`/api/conversations/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch conversation');
  }

  const data = await response.json();
  return data.conversation;
}

// Crear conversación
async function createConversation(params: { title: string }) {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }

  const data = await response.json();
  return data.conversation;
}

// Eliminar conversación
async function deleteConversation(id: string) {
  const response = await fetch(`/api/conversations/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete conversation');
  }

  return { id };
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
  });
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
    onError: (err, deletedId, context) => {
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
