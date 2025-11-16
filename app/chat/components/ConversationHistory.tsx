'use client';

import React from 'react';
import { MessageSquare, Ellipsis, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useChatStore } from '../store';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export function ConversationHistory() {
  const {
    conversationId,
    setConversationId,
    replaceMessages,
  } = useChatStore();

  const queryClient = useQueryClient();
  const { data: conversations = [], isLoading, isError } = useConversations();
  const deleteMutation = useDeleteConversation();
  const prefetchConversation = usePrefetchConversation();
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [conversationToDelete, setConversationToDelete] = React.useState<string | null>(null);

  const handleSelectConversation = async (id: string) => {
    // 1. Cambiar conversación activa inmediatamente (optimistic)
    setConversationId(id);

    // 2. Intentar obtener datos del cache primero (instantáneo)
    const cachedConversation = queryClient.getQueryData<ConversationWithMessages>(
      conversationKeys.detail(id)
    );

    if (cachedConversation) {
      // Si hay cache, actualizar mensajes inmediatamente
      replaceMessages(cachedConversation.messages);
    }

    // 3. Fetch en background para actualizar/validar datos
    try {
      const conversation = await queryClient.fetchQuery<ConversationWithMessages>({
        queryKey: conversationKeys.detail(id),
        queryFn: async () => {
          const response = await fetch(`/api/conversations/${id}`);
          if (!response.ok) throw new Error('Failed to load conversation');
          const data = await response.json();
          return data.conversation as ConversationWithMessages;
        },
        staleTime: 1000 * 60 * 10, // 10 minutos
      });

      // Actualizar con datos frescos (solo si cambió)
      replaceMessages(conversation.messages);
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Si falla y no hay cache, revertir
      if (!cachedConversation) {
        setConversationId(null);
      }
    }
  };

  // Prefetch cuando pasa el mouse (hover)
  const handleMouseEnter = (id: string) => {
    prefetchConversation(id);
  };

  const handleDeleteConversation = (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      await deleteMutation.mutateAsync(conversationToDelete);

      if (conversationId === conversationToDelete) {
        setConversationId(null);
        replaceMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content:
              'Hola, soy tu asistente IA. Estoy listo para ayudarte con cualquier idea. ¿Sobre qué quieres conversar hoy?',
          },
        ]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleStartRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setNewTitle(currentTitle);
  };

  const handleRenameConversation = async (id: string) => {
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
  };

  const handleCancelRename = () => {
    setRenamingId(null);
    setNewTitle('');
  };

  const truncateTitle = (title: string, maxLength: number = 35): string => {
    if (title.length <= maxLength) return title.trim() + '...';
    return title.substring(0, maxLength).trim() + '...';
  };

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
    return (
      <SidebarMenuItem>
        <div className="px-4 py-8 text-center text-sm text-[#4c4c4c]">
          No hay conversaciones recientes
        </div>
      </SidebarMenuItem>
    );
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
        <SidebarMenuItem key={conversation.id}>
          <div
            className="relative group"
            onMouseEnter={() => handleMouseEnter(conversation.id)}
          >
            {renamingId === conversation.id ? (
              <div className="flex items-center gap-2 px-2 py-2">
                <MessageSquare className="size-4 flex-shrink-0 text-[#4c4c4c]" />
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameConversation(conversation.id);
                    } else if (e.key === 'Escape') {
                      handleCancelRename();
                    }
                  }}
                  onBlur={() => handleRenameConversation(conversation.id)}
                  autoFocus
                  className="flex-1 text-sm font-medium bg-white border border-[#00552b] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#00552b]/20"
                />
              </div>
            ) : (
              <>
                <SidebarMenuButton
                  onClick={() => handleSelectConversation(conversation.id)}
                  isActive={conversationId === conversation.id}
                  className="data-[active=true]:bg-[#00552b]/10 data-[active=true]:text-[#00552b] hover:bg-[#00552b]/5 transition-colors pr-10"
                >
                  <MessageSquare className="size-4 flex-shrink-0" />
                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className="text-sm font-medium whitespace-nowrap overflow-hidden">
                      {truncateTitle(conversation.title)}
                    </div>
                  </div>
                </SidebarMenuButton>

                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded hover:bg-black/5 transition-colors"
                      >
                        {deleteMutation.isPending && deleteMutation.variables === conversation.id ? (
                          <Loader2 className="size-4 animate-spin text-[#4c4c4c]" />
                        ) : (
                          <Ellipsis className="size-4 text-[#4c4c4c]" />
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(conversation.id, conversation.title);
                        }}
                      >
                        <Pencil className="size-4" />
                        <span>Renombrar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      >
                        <Trash2 className="size-4" />
                        <span>Eliminar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
        </SidebarMenuItem>
      ))}
    </>
  );
}
