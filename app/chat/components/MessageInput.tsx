'use client';

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useRef,
  useState,
  memo,
  useEffect,
} from 'react';
import { ArrowUp, MapPin } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

import {
  useMessages,
  useChatStore,
  useIsStreaming,
  useConversationId,
  useGeoCulturalMode,
  useUserLocation,
} from '@/app/chat/store';
import { useCreateConversation } from '@/hooks/use-conversations';
import { useQueryClient } from '@tanstack/react-query';
import { conversationKeys } from '@/hooks/use-conversations';
import { useGeolocation } from '@/hooks/use-geolocation';
import { LocationPermissionDialog } from './LocationPermissionDialog';

type SSEPayload = {
  delta?: string;
  snapshot?: string;
  message?: string;
  response?: { error?: { message?: string } };
  [key: string]: unknown;
};

type SSEvent = {
  event: string;
  data: SSEPayload;
};

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const parseSSEChunk = (chunk: string): SSEvent | null => {
  const trimmed = chunk.trim();
  if (!trimmed) return null;

  const lines = trimmed.split('\n');
  let event = 'message';
  let data = '';

  lines.forEach((line) => {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      data += line.slice(5).trim();
    }
  });

  if (!data) return null;

  try {
    return { event, data: JSON.parse(data) as SSEPayload };
  } catch {
    return null;
  }
};

export const MessageInput = memo(function MessageInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const queryClient = useQueryClient();

  const messages = useMessages();
  const geoCulturalMode = useGeoCulturalMode();
  const userLocation = useUserLocation();

  const {
    coords,
    isLoading: isLocationLoading,
    error: locationError,
    requestLocation,
    permissionState,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000,
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInput(textarea.value);

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, []);

  const { addMessage, updateMessage, setStreaming, setConversationId, setGeoCulturalMode, setUserLocation } = useChatStore(
    useShallow((state) => ({
      addMessage: state.addMessage,
      updateMessage: state.updateMessage,
      setStreaming: state.setStreaming,
      setConversationId: state.setConversationId,
      setGeoCulturalMode: state.setGeoCulturalMode,
      setUserLocation: state.setUserLocation,
    }))
  );
  const isStreaming = useIsStreaming();
  const conversationId = useConversationId();

  const createConversationMutation = useCreateConversation();

  const handleLocationToggle = useCallback(() => {
    if (geoCulturalMode) {
      setGeoCulturalMode(false);
      setUserLocation(null);
    } else {
      if (permissionState === 'granted' && coords) {
        setGeoCulturalMode(true);
        setUserLocation({
          lat: coords.lat,
          lng: coords.lng,
        });
      } else {
        setShowLocationDialog(true);
      }
    }
  }, [geoCulturalMode, setGeoCulturalMode, setUserLocation, permissionState, coords]);

  const handleAllowLocation = useCallback(async () => {
    await requestLocation();
  }, [requestLocation]);

  const handleCloseDialog = useCallback(() => {
    setShowLocationDialog(false);
  }, []);

  // Update store when coords change
  const prevCoordsRef = useRef(coords);
  useEffect(() => {
    if (coords && coords !== prevCoordsRef.current && geoCulturalMode) {
      setUserLocation({
        lat: coords.lat,
        lng: coords.lng,
      });
      prevCoordsRef.current = coords;
      setShowLocationDialog(false);
    }
  }, [coords, geoCulturalMode, setUserLocation]);

  // Auto-enable GeoCultural Mode when location is granted
  useEffect(() => {
    if (coords && showLocationDialog && !geoCulturalMode) {
      setGeoCulturalMode(true);
      setShowLocationDialog(false);
    }
  }, [coords, showLocationDialog, geoCulturalMode, setGeoCulturalMode]);

  const submitMessage = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const value = input.trim();
      if (!value || isStreaming) return;

        const userMessageId = createId();
        const assistantMessageId = createId();
        const payloadMessages = [
          ...messages.filter((msg) => msg.content.trim().length > 0),
          { role: 'user', content: value } as const,
        ];

      addMessage({ id: userMessageId, role: 'user', content: value });
      addMessage({ id: assistantMessageId, role: 'assistant', content: '' });
      setInput('');
      setStreaming(true);

      let currentConversationId = conversationId;

      try {
        // Si no hay conversación activa, crear una nueva
        if (!currentConversationId) {
          try {
            const title =
              value.length > 50 ? value.substring(0, 50).trim() + '...' : value;

            // Usar TanStack Query mutation
            const conversation = await createConversationMutation.mutateAsync({
              title,
            });

            currentConversationId = conversation.id;
            setConversationId(conversation.id);
          } catch (error) {
            console.error('Error creating conversation:', error);
          }
        }

        // ✅ FIX: Guardar mensaje del usuario en Supabase Y esperar confirmación
        if (currentConversationId) {
          try {
            const response = await fetch(`/api/conversations/${currentConversationId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: userMessageId,
                role: 'user',
                content: value,
              }),
            });

            if (response.ok) {
              // ✅ Invalidar cache para que TanStack Query recargue datos frescos
              queryClient.invalidateQueries({
                queryKey: conversationKeys.detail(currentConversationId),
              });
              // También invalidar la lista de conversaciones (para actualizar timestamp)
              queryClient.invalidateQueries({
                queryKey: conversationKeys.lists(),
              });
            }
          } catch (error) {
            console.error('Error saving user message:', error);
          }
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: value,
            messages: payloadMessages,
            geoCulturalContext: geoCulturalMode ? userLocation : null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'No se pudo contactar con el asistente.');
        }

        let assistantContent = '';

        // BUG FIX: Handle both JSON and streaming responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // Handle non-streaming JSON response for GeoCultural mode
          const data = await response.json();
          assistantContent = JSON.stringify(data);
          updateMessage(assistantMessageId, () => assistantContent);

        } else {
          // Handle streaming response for normal chat
          if (!response.body) throw new Error('Response body is missing.');
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const processBuffer = () => {
            let boundary = buffer.indexOf('\n\n');
            while (boundary !== -1) {
              const chunk = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              const event = parseSSEChunk(chunk);
              if (event) {
                if (event.event === 'response.output_text.delta') {
                  const delta = event.data?.delta ?? '';
                  updateMessage(assistantMessageId, (prev) => {
                    const newContent = prev + delta;
                    assistantContent = newContent; // Update final content
                    return newContent;
                  });
                }
              }
              boundary = buffer.indexOf('\n\n');
            }
          };

          while (true) {
            const { value: chunk, done } = await reader.read();
            if (chunk) {
              buffer += decoder.decode(chunk, { stream: !done });
              processBuffer();
            }
            if (done) break;
          }

          buffer += decoder.decode();
          processBuffer();
        }

        // ✅ FIX: Guardar mensaje del asistente en Supabase Y confirmar
        if (currentConversationId && assistantContent) {
          try {
            await fetch(`/api/conversations/${currentConversationId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: assistantMessageId,
                role: 'assistant',
                content: assistantContent,
              }),
            });

            // ✅ Invalidar cache y extraer hechos
            queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
            queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
            fetch(`/api/conversations/${currentConversationId}/extract-facts`, { method: 'POST' })
              .catch(err => console.debug('Background fact extraction:', err.message));

          } catch (error) {
            console.error('Error saving assistant message:', error);
          }
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Ocurrió un problema al contactar con el asistente.';
        updateMessage(assistantMessageId, () => message);
      } finally {
        setStreaming(false);
      }
    },
    [
      addMessage,
      input,
      isStreaming,
      messages,
      setStreaming,
      updateMessage,
      conversationId,
      setConversationId,
      createConversationMutation,
      queryClient,
      geoCulturalMode,
      userLocation,
    ],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  return (
    <>
      <LocationPermissionDialog
        isOpen={showLocationDialog}
        onClose={handleCloseDialog}
        onAllow={handleAllowLocation}
        error={locationError}
        isLoading={isLocationLoading}
      />

      <div className="space-y-3">
        {geoCulturalMode && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-r from-[#00552b]/10 to-[#00aa56]/10 rounded-2xl border border-[#00552b]/20">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-[#00552b]" />
              <span className="text-sm font-medium text-[#00552b]">
                {userLocation ? 'GeoCultural Mode activo' : 'Obteniendo ubicación...'}
              </span>
            </div>
            {coords && coords.accuracy && (
              <span className="text-xs text-[#00552b]/70 font-medium">
                Precisión: {Math.round(coords.accuracy)}m
              </span>
            )}
          </div>
        )}
        <form
          onSubmit={submitMessage}
          className="flex flex-row items-center justify-between gap-3 rounded-[2rem] border border-black/5 bg-white px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
        >
          <button
            type="button"
            onClick={handleLocationToggle}
            disabled={isStreaming}
            className={`flex shrink-0 items-center justify-center rounded-full p-2 transition ${
              geoCulturalMode
                ? 'bg-[#00552b] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <MapPin className="size-5" />
          </button>
          <textarea
            ref={textareaRef}
            autoFocus
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={geoCulturalMode ? "Pregunta sobre lugares culturales..." : "Empieza con una idea..."}
            disabled={isStreaming}
            className="w-full min-h-[20px] max-h-[200px] resize-none overflow-y-auto bg-transparent text-base leading-5 text-[#111111] outline-none placeholder:text-[#111111]/40 disabled:opacity-60 scrollbar-thin"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex shrink-0 items-center justify-center rounded-full bg-[#00552b] p-2 text-white transition hover:bg-[#00552b]/80 disabled:cursor-not-allowed disabled:bg-[#00552b]/40"
          >
            <ArrowUp className="size-5" />
          </button>
        </form>
      </div>
    </>
  );
});
