'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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

// Solo UI state - Server state se maneja con TanStack Query
type ChatStore = {
  // Current conversation UI state
  messages: ChatMessage[];
  isStreaming: boolean;
  typingStateIndex: number;
  conversationId: string | null;

  // Actions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updater: (previous: string) => string) => void;
  replaceMessages: (messages: ChatMessage[]) => void;
  setStreaming: (value: boolean) => void;
  cycleTypingState: () => void;
  setConversationId: (id: string | null) => void;
  reset: () => void;
};

const createInitialMessages = (): ChatMessage[] => [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hola, soy tu asisntente IA personal. Puedo ayudarte a escribir, idear y explicar cualquier tema. ¿Sobre qué quieres hablar hoy?',
  },
];

const createChatStore = create<ChatStore>()(
  devtools(
    (set) => ({
      // Initial state
      messages: createInitialMessages(),
      isStreaming: false,
      typingStateIndex: 0,
      conversationId: null,

      // Actions
      addMessage: (message) =>
        set(
          (state) => ({
            messages: [...state.messages, message],
          }),
          false,
          'addMessage'
        ),

      updateMessage: (id, updater) =>
        set(
          (state) => ({
            messages: state.messages.map((msg) =>
              msg.id === id ? { ...msg, content: updater(msg.content) } : msg
            ),
          }),
          false,
          'updateMessage'
        ),

      replaceMessages: (messages) =>
        set(
          (state) => {
            // Solo actualizar si realmente cambió (evita re-renders innecesarios)
            if (state.messages.length === messages.length) {
              const hasChanges = messages.some(
                (msg, idx) =>
                  !state.messages[idx] ||
                  state.messages[idx].id !== msg.id ||
                  state.messages[idx].content !== msg.content
              );
              if (!hasChanges) return state;
            }
            return { messages };
          },
          false,
          'replaceMessages'
        ),

      setStreaming: (value) =>
        set(
          { isStreaming: value, typingStateIndex: 0 },
          false,
          'setStreaming'
        ),

      cycleTypingState: () =>
        set(
          (state) => ({
            typingStateIndex:
              (state.typingStateIndex + 1) % TYPING_STATES.length,
          }),
          false,
          'cycleTypingState'
        ),

      setConversationId: (id) =>
        set({ conversationId: id }, false, 'setConversationId'),

      reset: () =>
        set(
          {
            messages: createInitialMessages(),
            isStreaming: false,
            typingStateIndex: 0,
            conversationId: null,
          },
          false,
          'reset'
        ),
    }),
    { name: 'ChatStore' }
  )
);

export const useChatStore = createChatStore;
