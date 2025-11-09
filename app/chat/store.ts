'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type ChatStore = {
  messages: ChatMessage[];
  isStreaming: boolean;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updater: (previous: string) => string) => void;
  replaceMessages: (messages: ChatMessage[]) => void;
  setStreaming: (value: boolean) => void;
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

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: createInitialMessages(),
      isStreaming: false,
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
      replaceMessages: (messages) => set({ messages }),
      setStreaming: (value) => set({ isStreaming: value }),
      reset: () =>
        set({
          messages: createInitialMessages(),
          isStreaming: false,
        }),
    }),
    {
      name: 'pq-chat-history',
      storage: clientStorage ?? fallbackStorage,
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
);
