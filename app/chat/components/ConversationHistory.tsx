'use client';

import React, { useCallback, memo } from 'react';
import { Loader2 } from 'lucide-react';
import { useConversationId, useSetConversationId, useReplaceMessages, useSetGeoCulturalMode, useSetUserLocation } from '../store';
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
  usePrefetchConversation,
  conversationKeys,
} from '@/hooks/use-conversations';
import type { ConversationWithMessages } from '@/hooks/use-conversations';
import { useQueryClient } from '@tanstack/react-query';

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
  const prefetchConversation = usePrefetchConversation();
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [conversationToDelete, setConversationToDelete] = React.useState<string | null>(null);

  const handleSelectConversation = useCallback(async (id: string) => {
    // Cambio inmediato para UX instantánea
    setConversationId(id);

    // Intentar usar cache primero (instantáneo)
    const cachedConversation = queryClient.getQueryData<ConversationWithMessages>(
      conversationKeys.detail(id)
    );

    if (cachedConversation) {
      // Usar cache inmediatamente
      replaceMessages(cachedConversation.messages);

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
          const response = await fetch(`/api/conversations/${id}`);
          if (!response.ok) throw new Error('Failed to load conversation');
          const data = await response.json();
          return data.conversation as ConversationWithMessages;
        },
        staleTime: 1000 * 60 * 10,
      }).then((freshConversation) => {
        // Actualizar solo si hay cambios
        if (JSON.stringify(freshConversation.messages) !== JSON.stringify(cachedConversation.messages)) {
          replaceMessages(freshConversation.messages);
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
            const response = await fetch(`/api/conversations/${id}`);
            if (!response.ok) throw new Error('Failed to load conversation');
            const data = await response.json();
            return data.conversation as ConversationWithMessages;
          },
          staleTime: 1000 * 60 * 10,
        });

        replaceMessages(conversation.messages);

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
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (!response.ok) throw new Error('Failed to rename conversation');

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
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        />
      ))}
    </>
  );
});
