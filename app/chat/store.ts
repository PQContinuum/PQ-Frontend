'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { NamedSet } from 'zustand/middleware';

export type ChatRole = 'user' | 'assistant';

// Modos de generación disponibles
export type GenerationMode = 'none' | 'image' | 'video' | 'geocultural';

// Estado de generación que se persiste en el mensaje
export type MessageGenerationState = {
  type: 'image' | 'video' | 'geocultural';
  status: 'generating' | 'completed' | 'error';
  jobId?: string; // ID del job de generación para recuperación
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    mimeType?: string;
  }>;
  // Estado de generación persistido - se usa para mostrar skeleton y sincronizar entre dispositivos
  generationState?: MessageGenerationState | null;
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

export type UserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
  address?: {
    formattedAddress?: string;
    shortAddress?: string;
    street?: string | null;
    streetNumber?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
  };
};

// Solo UI state - Server state se maneja con TanStack Query
type ChatStore = {
  // Current conversation UI state
  messages: ChatMessage[];
  isStreaming: boolean;
  typingStateIndex: number;
  conversationId: string | null;
  pendingProjectId: string | null; // Project to associate when creating new conversation
  geoCulturalMode: boolean;
  userLocation: UserLocation | null;

  // Generation state - qué tipo de contenido se está generando
  generationMode: GenerationMode;
  isGenerating: boolean;
  generatingMessageId: string | null; // ID del mensaje que se está generando

  // Actions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updater: (previous: string) => string) => void;
  updateMessageGenerationState: (id: string, state: MessageGenerationState | null) => void;
  replaceMessages: (messages: ChatMessage[]) => void;
  setStreaming: (value: boolean) => void;
  setConversationId: (id: string | null) => void;
  setPendingProjectId: (id: string | null) => void;
  setGeoCulturalMode: (value: boolean) => void;
  setUserLocation: (location: UserLocation | null) => void;
  startGeneration: (mode: GenerationMode, messageId: string) => void;
  stopGeneration: () => void;
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
      pendingProjectId: null,
      geoCulturalMode: false,
      userLocation: null,

      // Generation state
      generationMode: 'none',
      isGenerating: false,
      generatingMessageId: null,

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

      updateMessageGenerationState: (id, generationState) =>
        set(
          (state) => ({
            messages: state.messages.map((msg) =>
              msg.id === id ? { ...msg, generationState } : msg
            ),
          }),
          false,
          'updateMessageGenerationState'
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

      setPendingProjectId: (id) =>
        set({ pendingProjectId: id }, false, 'setPendingProjectId'),

      setGeoCulturalMode: (value) =>
        set({ geoCulturalMode: value }, false, 'setGeoCulturalMode'),

      setUserLocation: (location) =>
        set({ userLocation: location }, false, 'setUserLocation'),

      startGeneration: (mode, messageId) =>
        set(
          {
            generationMode: mode,
            isGenerating: true,
            generatingMessageId: messageId,
          },
          false,
          'startGeneration'
        ),

      stopGeneration: () =>
        set(
          {
            generationMode: 'none',
            isGenerating: false,
            generatingMessageId: null,
          },
          false,
          'stopGeneration'
        ),

      reset: () => {
        typingCycleController.stop(set);
        set(
          {
            messages: [],
            isStreaming: false,
            typingStateIndex: 0,
            conversationId: null,
            pendingProjectId: null,
            geoCulturalMode: false,
            userLocation: null,
            generationMode: 'none',
            isGenerating: false,
            generatingMessageId: null,
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
export const useGeoCulturalMode = () => useChatStore((state) => state.geoCulturalMode);
export const useUserLocation = () => useChatStore((state) => state.userLocation);
export const useAddMessage = () => useChatStore((state) => state.addMessage);
export const useUpdateMessage = () => useChatStore((state) => state.updateMessage);
export const useUpdateMessageGenerationState = () => useChatStore((state) => state.updateMessageGenerationState);
export const useReplaceMessages = () => useChatStore((state) => state.replaceMessages);
export const useSetStreaming = () => useChatStore((state) => state.setStreaming);
export const useSetConversationId = () => useChatStore((state) => state.setConversationId);
export const usePendingProjectId = () => useChatStore((state) => state.pendingProjectId);
export const useSetPendingProjectId = () => useChatStore((state) => state.setPendingProjectId);
export const useSetGeoCulturalMode = () => useChatStore((state) => state.setGeoCulturalMode);
export const useSetUserLocation = () => useChatStore((state) => state.setUserLocation);

// Generation state selectors
export const useGenerationMode = () => useChatStore((state) => state.generationMode);
export const useIsGenerating = () => useChatStore((state) => state.isGenerating);
export const useGeneratingMessageId = () => useChatStore((state) => state.generatingMessageId);
export const useStartGeneration = () => useChatStore((state) => state.startGeneration);
export const useStopGeneration = () => useChatStore((state) => state.stopGeneration);
