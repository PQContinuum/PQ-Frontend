'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

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
  messages: ChatMessage[];
  isStreaming: boolean;
  typingStateIndex: number;
  conversationId: string;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updater: (previous: string) => string) => void;
  replaceMessages: (messages: ChatMessage[]) => void;
  setStreaming: (value: boolean) => void;
  cycleTypingState: () => void;
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

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

type PersistedChatState = Pick<ChatStore, 'messages'>;

const createPersistStorage = (storage: StateStorage) =>
  createJSONStorage<PersistedChatState>(() => storage);

const clientStorage =
  typeof window !== 'undefined'
    ? createPersistStorage(window.localStorage as StateStorage)
    : null;

const fallbackStorage = createPersistStorage(noopStorage);

const generateConversationId = () => crypto.randomUUID();

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: createInitialMessages(),
      isStreaming: false,
      typingStateIndex: 0,
      conversationId: generateConversationId(),
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
          conversationId: generateConversationId(),
        }),
      setStreaming: (value) =>
        set({ isStreaming: value, typingStateIndex: 0 }),
      cycleTypingState: () =>
        set((state) => ({
          typingStateIndex: (state.typingStateIndex + 1) % TYPING_STATES.length,
        })),
      reset: () =>
        set({
          messages: createInitialMessages(),
          isStreaming: false,
          typingStateIndex: 0,
          conversationId: generateConversationId(),
        }),
    }),
    {
      name: 'pq-chat-history',
      storage: clientStorage ?? fallbackStorage,
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
);
