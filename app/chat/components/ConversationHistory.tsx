'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Ellipsis, Loader2 } from 'lucide-react';
import { useChatStore } from '../store';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { useConversations, useDeleteConversation } from '@/hooks/use-conversations';

export function ConversationHistory() {
  const {
    conversationId,
    setConversationId,
    replaceMessages,
  } = useChatStore();

  const { data: conversations = [], isLoading, isError } = useConversations();
  const deleteMutation = useDeleteConversation();

  const handleSelectConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`);

      if (!response.ok) {
        throw new Error('Failed to load conversation');
      }

      const data = await response.json();
      const { conversation } = data;

      replaceMessages(conversation.messages);
      setConversationId(id);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleDeleteConversation = async (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();

    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);

      if (conversationId === id) {
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
    }
  };

  const truncateTitle = (title: string, maxLength: number = 35): string => {
    if (title.length <= maxLength) return title.trim() + '...';
    return title.substring(0, maxLength).trim() + '...';
  };

  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return 'Reciente';

    const date = new Date(dateInput);

    if (isNaN(date.getTime())) {
      console.error('Invalid date received:', dateInput);
      return 'Reciente';
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
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
      {conversations.map((conversation) => (
        <SidebarMenuItem key={conversation.id}>
          <motion.div
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative group"
          >
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

            <motion.button
              onClick={(e) => handleDeleteConversation(e, conversation.id)}
              disabled={deleteMutation.isPending}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-black/5 disabled:opacity-50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {deleteMutation.isPending && deleteMutation.variables === conversation.id ? (
                <Loader2 className="size-4 animate-spin text-[#4c4c4c]" />
              ) : (
                <Ellipsis className="size-4 text-[#4c4c4c]" />
              )}
            </motion.button>
          </motion.div>
        </SidebarMenuItem>
      ))}
    </>
  );
}
