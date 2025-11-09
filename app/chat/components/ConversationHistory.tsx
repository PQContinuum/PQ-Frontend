'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { useChatStore } from '../store';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export function ConversationHistory() {
  const {
    conversations,
    conversationId,
    isLoadingConversations,
    setConversations,
    setLoadingConversations,
    removeConversation,
    replaceMessages,
    setConversationId,
  } = useChatStore();

  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Cargar conversaciones al montar
  React.useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await fetch('/api/conversations');

      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated');
          return;
        }
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

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
      setDeletingId(id);
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      removeConversation(id);

      // Si estamos viendo la conversación eliminada, resetear
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
      alert('Error al eliminar la conversación');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Hoy';
    } else if (days === 1) {
      return 'Ayer';
    } else if (days < 7) {
      return `Hace ${days} días`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  if (isLoadingConversations) {
    return (
      <SidebarMenuItem>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-[#00552b]" />
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
              className="data-[active=true]:bg-[#00552b]/10 data-[active=true]:text-[#00552b] hover:bg-[#00552b]/5 transition-colors"
            >
              <MessageSquare className="size-4" />
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-medium">
                  {conversation.title}
                </div>
                <div className="truncate text-xs text-[#4c4c4c]">
                  {formatDate(conversation.updated_at)}
                </div>
              </div>
            </SidebarMenuButton>

            <motion.button
              onClick={(e) => handleDeleteConversation(e, conversation.id)}
              disabled={deletingId === conversation.id}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 disabled:opacity-50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {deletingId === conversation.id ? (
                <Loader2 className="size-4 animate-spin text-red-600" />
              ) : (
                <Trash2 className="size-4 text-red-600" />
              )}
            </motion.button>
          </motion.div>
        </SidebarMenuItem>
      ))}
    </>
  );
}
