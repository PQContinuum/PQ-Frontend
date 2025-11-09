'use client';

import { create } from 'zustand';
import type { Conversation } from '@/db/schema';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export const TYPING_STATES = [
  'Pensando',
  'Analizando',
  'Escribiendo',
  'Razonando',
  'Procesando',
  'Componiendo',
] as const;

export type TypingState = (typeof TYPING_STATES)[number];

type ChatStore = {
  // Current conversation state
  messages: ChatMessage[];
  isStreaming: boolean;
  typingStateIndex: number;
  conversationId: string | null;

  // Conversations history
  conversations: Conversation[];
  isLoadingConversations: boolean;

  // Message actions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updater: (previous: string) => string) => void;
  replaceMessages: (messages: ChatMessage[]) => void;
  setStreaming: (value: boolean) => void;
  cycleTypingState: () => void;

  // Conversation actions
  setConversationId: (id: string | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  setLoadingConversations: (loading: boolean) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, conversation: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;

  // Reset
  reset: () => void;
};

const createInitialMessages = (): ChatMessage[] => [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hola, soy ChatGPT. Puedo ayudarte a escribir, idear y explicar cualquier tema. ¿Sobre qué quieres hablar hoy?',
  },
];

export const useChatStore = create<ChatStore>((set) => ({
  // Current conversation state
  messages: createInitialMessages(),
  isStreaming: false,
  typingStateIndex: 0,
  conversationId: null,

  // Conversations history
  conversations: [],
  isLoadingConversations: false,

  // Message actions
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateMessage: (id, updater) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: updater(msg.content) } : msg,
      ),
    })),
  replaceMessages: (messages) =>
    set({
      messages,
    }),
  setStreaming: (value) =>
    set({ isStreaming: value, typingStateIndex: 0 }),
  cycleTypingState: () =>
    set((state) => ({
      typingStateIndex: (state.typingStateIndex + 1) % TYPING_STATES.length,
    })),

  // Conversation actions
  setConversationId: (id) => set({ conversationId: id }),
  setConversations: (conversations) => set({ conversations }),
  setLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, ...updates } : conv,
      ),
    })),
  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv.id !== id),
    })),

  // Reset
  reset: () =>
    set({
      messages: createInitialMessages(),
      isStreaming: false,
      typingStateIndex: 0,
      conversationId: null,
    }),
}));
