'use client';

import React, { useCallback, memo, useState } from 'react';
import { Loader2, CheckSquare, X, Trash2 } from 'lucide-react';
import { useConversationId, useSetConversationId, useReplaceMessages, useSetGeoCulturalMode, useSetUserLocation } from '../store';
import type { ChatMessage, MessageGenerationState } from '../store';
import { SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { ConversationItem } from './ConversationItem';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useConversations,
  useDeleteConversation,
  useDeleteConversations,
  usePrefetchConversation,
  conversationKeys,
} from '@/hooks/use-conversations';
import type { ConversationWithMessages } from '@/hooks/use-conversations';
import { useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from '@/lib/api-client';

// Helper para transformar mensajes de API a ChatMessage con generationState
function mapApiMessagesToChatMessages(
  messages: ConversationWithMessages['messages']
): ChatMessage[] {
  return messages.map((msg) => {
    let generationState: MessageGenerationState | undefined = undefined;

    // Parsear metadata si existe
    if (msg.metadata) {
      try {
        const metadata = typeof msg.metadata === 'string'
          ? JSON.parse(msg.metadata)
          : msg.metadata;
        if (metadata?.generationState) {
          generationState = metadata.generationState as MessageGenerationState;
        }
      } catch {
        // Ignore parse errors
      }
    }

    return {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      attachments: msg.attachments,
      generationState,
    };
  });
}

export const ConversationHistory = memo(function ConversationHistory() {
  const conversationId = useConversationId();
  const setConversationId = useSetConversationId();
  const replaceMessages = useReplaceMessages();
  const setGeoCulturalMode = useSetGeoCulturalMode();
  const setUserLocation = useSetUserLocation();

  const { state } = useSidebar();
  const queryClient = useQueryClient();
  const { data: conversations = [], isLoading, isError } = useConversations();
  const deleteMutation = useDeleteConversation();
  const bulkDeleteMutation = useDeleteConversations();
  const prefetchConversation = usePrefetchConversation();
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [conversationToDelete, setConversationToDelete] = React.useState<string | null>(null);

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const handleSelectConversation = useCallback(async (id: string) => {
    // Cambio inmediato para UX instantánea
    setConversationId(id);

    // Intentar usar cache primero (instantáneo)
    const cachedConversation = queryClient.getQueryData<ConversationWithMessages>(
      conversationKeys.detail(id)
    );

    if (cachedConversation) {
      // Usar cache inmediatamente - mapear metadata a generationState
      replaceMessages(mapApiMessagesToChatMessages(cachedConversation.messages));

      // Restaurar contexto geocultural si existe
      if (cachedConversation.geoCulturalContext) {
        try {
          const geoCulturalData = JSON.parse(cachedConversation.geoCulturalContext);
          setGeoCulturalMode(true);
          setUserLocation(geoCulturalData);
          console.log('[GeoCultural] Restored context from cached conversation:', geoCulturalData);
        } catch (error) {
          console.error('[GeoCultural] Error parsing cached geocultural context:', error);
        }
      } else {
        // Limpiar contexto si la conversación no lo tiene
        setGeoCulturalMode(false);
        setUserLocation(null);
      }

      // Revalidar en background sin bloquear UI
      queryClient.fetchQuery<ConversationWithMessages>({
        queryKey: conversationKeys.detail(id),
        queryFn: async () => {
          const data = await conversationsApi.get(id);
          return data.conversation as ConversationWithMessages;
        },
        staleTime: 1000 * 60 * 10,
      }).then((freshConversation) => {
        // Actualizar solo si hay cambios
        if (JSON.stringify(freshConversation.messages) !== JSON.stringify(cachedConversation.messages)) {
          replaceMessages(mapApiMessagesToChatMessages(freshConversation.messages));
        }

        // Actualizar contexto geocultural si cambió
        if (freshConversation.geoCulturalContext !== cachedConversation.geoCulturalContext) {
          if (freshConversation.geoCulturalContext) {
            try {
              const geoCulturalData = JSON.parse(freshConversation.geoCulturalContext);
              setGeoCulturalMode(true);
              setUserLocation(geoCulturalData);
            } catch (error) {
              console.error('[GeoCultural] Error parsing fresh geocultural context:', error);
            }
          } else {
            setGeoCulturalMode(false);
            setUserLocation(null);
          }
        }
      }).catch((error) => {
        console.error('Background revalidation error:', error);
      });
    } else {
      // Sin cache, fetch normal
      try {
        const conversation = await queryClient.fetchQuery<ConversationWithMessages>({
          queryKey: conversationKeys.detail(id),
          queryFn: async () => {
            const data = await conversationsApi.get(id);
            return data.conversation as ConversationWithMessages;
          },
          staleTime: 1000 * 60 * 10,
        });

        // Mapear metadata a generationState
        replaceMessages(mapApiMessagesToChatMessages(conversation.messages));

        // Restaurar contexto geocultural si existe
        if (conversation.geoCulturalContext) {
          try {
            const geoCulturalData = JSON.parse(conversation.geoCulturalContext);
            setGeoCulturalMode(true);
            setUserLocation(geoCulturalData);
            console.log('[GeoCultural] Restored context from fetched conversation:', geoCulturalData);
          } catch (error) {
            console.error('[GeoCultural] Error parsing geocultural context:', error);
          }
        } else {
          // Limpiar contexto si la conversación no lo tiene
          setGeoCulturalMode(false);
          setUserLocation(null);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        setConversationId(null);
      }
    }
  }, [setConversationId, replaceMessages, setGeoCulturalMode, setUserLocation, queryClient]);

  const handleMouseEnter = useCallback((id: string) => {
    prefetchConversation(id);
  }, [prefetchConversation]);

  const handleDeleteConversation = useCallback((
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!conversationToDelete) return;

    try {
      await deleteMutation.mutateAsync(conversationToDelete);

      if (conversationId === conversationToDelete) {
        setConversationId(null);
        replaceMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  }, [conversationToDelete, conversationId, deleteMutation, setConversationId, replaceMessages]);

  const handleStartRename = useCallback((id: string, currentTitle: string) => {
    setRenamingId(id);
    setNewTitle(currentTitle);
  }, []);

  const handleRenameConversation = useCallback(async (id: string) => {
    if (!newTitle.trim()) {
      setRenamingId(null);
      return;
    }

    try {
      await conversationsApi.update(id, { title: newTitle.trim() });

      // Invalidar cache para refrescar
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      setRenamingId(null);
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  }, [newTitle, queryClient]);

  const handleCancelRename = useCallback(() => {
    setRenamingId(null);
    setNewTitle('');
  }, []);

  // Selection mode handlers
  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    setSelectedConversations(new Set());
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedConversations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedConversations.size === 0) return;
    setBulkDeleteDialogOpen(true);
  }, [selectedConversations.size]);

  const confirmBulkDelete = useCallback(async () => {
    if (selectedConversations.size === 0) return;

    try {
      const idsToDelete = Array.from(selectedConversations);
      await bulkDeleteMutation.mutateAsync(idsToDelete);

      // Si la conversación activa está entre las eliminadas, limpiar el chat
      if (conversationId && selectedConversations.has(conversationId)) {
        setConversationId(null);
        replaceMessages([]);
      }

      // Salir del modo de selección
      setIsSelectionMode(false);
      setSelectedConversations(new Set());
    } catch (error) {
      console.error('Error bulk deleting conversations:', error);
    } finally {
      setBulkDeleteDialogOpen(false);
    }
  }, [selectedConversations, conversationId, bulkDeleteMutation, setConversationId, replaceMessages]);

  const handleCancelSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedConversations(new Set());
  }, []);

  if (isLoading) {
    return (
      <SidebarMenuItem>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-[#00552b]" />
        </div>
      </SidebarMenuItem>
    );
  }

  if (isError) {
    return (
      <SidebarMenuItem>
        <div className="px-4 py-8 text-center text-sm text-red-600">
          Error al cargar conversaciones
        </div>
      </SidebarMenuItem>
    );
  }

  if (conversations.length === 0) {
    return state === 'expanded' ? (
      <SidebarMenuItem>
        <div className="px-4 py-8 text-center text-sm text-[#4c4c4c]">
          No hay conversaciones recientes
        </div>
      </SidebarMenuItem>
    ) : null;
  }

  return (
    <>
      {/* Single delete dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar conversación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta conversación? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar conversaciones</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar {selectedConversations.size} conversación{selectedConversations.size !== 1 ? 'es' : ''}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                `Eliminar ${selectedConversations.size}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Selection mode header */}
      {state === 'expanded' && (
        <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100">
          {isSelectionMode ? (
            <>
              <button
                onClick={handleCancelSelectionMode}
                className="flex items-center gap-1.5 text-sm text-[#4c4c4c] hover:text-[#00552b] transition-colors"
              >
                <X className="size-4" />
                <span>Cancelar</span>
              </button>
              <button
                onClick={handleBulkDeleteClick}
                disabled={selectedConversations.size === 0}
                className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="size-4" />
                <span>Eliminar ({selectedConversations.size})</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleToggleSelectionMode}
              className="flex items-center gap-1.5 text-sm text-[#4c4c4c] hover:text-[#00552b] transition-colors ml-auto"
            >
              <CheckSquare className="size-4" />
              <span>Seleccionar</span>
            </button>
          )}
        </div>
      )}

      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversationId === conversation.id}
          isRenaming={renamingId === conversation.id}
          isDeleting={deleteMutation.isPending && deleteMutation.variables === conversation.id}
          newTitle={newTitle}
          onSelect={handleSelectConversation}
          onMouseEnter={handleMouseEnter}
          onDelete={handleDeleteConversation}
          onStartRename={handleStartRename}
          onRename={handleRenameConversation}
          onCancelRename={handleCancelRename}
          onTitleChange={setNewTitle}
          isSelectionMode={isSelectionMode}
          isSelected={selectedConversations.has(conversation.id)}
          onToggleSelect={handleToggleSelect}
        />
      ))}
    </>
  );
});
