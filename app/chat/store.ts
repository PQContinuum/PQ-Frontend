'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { NamedSet } from 'zustand/middleware';

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

const TYPING_CYCLE_INTERVAL = 2000;

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
  setConversationId: (id: string | null) => void;
  reset: () => void;
};

const createTypingCycleController = () => {
  let interval: ReturnType<typeof setInterval> | null = null;

  return {
    start: (set: NamedSet<ChatStore>) => {
      if (interval) return;
      interval = setInterval(() => {
        set(
          (state) => ({
            ...state,
            typingStateIndex:
              (state.typingStateIndex + 1) % TYPING_STATES.length,
          }),
          false,
          'typingCycle.tick'
        );
      }, TYPING_CYCLE_INTERVAL);
    },
    stop: (set: NamedSet<ChatStore>) => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
      set(
        (state) => ({
          ...state,
          typingStateIndex: 0,
        }),
        false,
        'typingCycle.reset'
      );
    },
    resetIndex: (set: NamedSet<ChatStore>) => {
      set(
        (state) => ({
          ...state,
          typingStateIndex: 0,
        }),
        false,
        'typingCycle.resetIndex'
      );
    },
  };
};

const typingCycleController = createTypingCycleController();

const createChatStore = create<ChatStore>()(
  devtools(
    (set) => ({
      // Initial state
      messages: [],
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

      setStreaming: (value) => {
        set({ isStreaming: value }, false, 'setStreaming');
        if (value) {
          typingCycleController.resetIndex(set);
          typingCycleController.start(set);
        } else {
          typingCycleController.stop(set);
        }
      },

      setConversationId: (id) =>
        set({ conversationId: id }, false, 'setConversationId'),

      reset: () => {
        typingCycleController.stop(set);
        set(
          {
            messages: [],
            isStreaming: false,
            typingStateIndex: 0,
            conversationId: null,
          },
          false,
          'reset'
        );
      },
    }),
    { name: 'ChatStore' }
  )
);

export const useChatStore = createChatStore;

// Selectores optimizados para evitar re-renders innecesarios
export const useMessages = () => useChatStore((state) => state.messages);
export const useIsStreaming = () => useChatStore((state) => state.isStreaming);
export const useConversationId = () => useChatStore((state) => state.conversationId);
export const useAddMessage = () => useChatStore((state) => state.addMessage);
export const useUpdateMessage = () => useChatStore((state) => state.updateMessage);
export const useReplaceMessages = () => useChatStore((state) => state.replaceMessages);
export const useSetStreaming = () => useChatStore((state) => state.setStreaming);
export const useSetConversationId = () => useChatStore((state) => state.setConversationId);
