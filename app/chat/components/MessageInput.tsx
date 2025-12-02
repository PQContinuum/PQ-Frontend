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
import { usePreciseLocation } from '@/hooks/use-precise-location';
import { LocationPermissionDialog } from './LocationPermissionDialog';
import { LocationMapConfirmDialog } from './LocationMapConfirmDialog';
import type { GeoCulturalAnalysisText } from '@/app/chat/components/MessageBubble';
import { shouldAutoEnableGeoCultural } from '@/lib/geocultural/auto-mode';
import type { StructuredAddress } from '@/lib/geolocation/address-types';

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
  const [showMapDialog, setShowMapDialog] = useState(false);
  const queryClient = useQueryClient();

  const messages = useMessages();
  const geoCulturalMode = useGeoCulturalMode();
  const userLocation = useUserLocation();

  const {
    address,
    coords,
    isLoading: isLocationLoading,
    error: locationError,
    requestLocation,
    quality,
    warnings,
  } = usePreciseLocation();

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
      if (coords && address) {
        setGeoCulturalMode(true);
        setUserLocation({
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
          timestamp: Date.now(),
          address: {
            formattedAddress: address.formattedAddress,
            shortAddress: address.shortAddress,
            street: address.street,
            streetNumber: address.streetNumber,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
          },
        });
      } else {
        setShowLocationDialog(true);
      }
    }
  }, [geoCulturalMode, setGeoCulturalMode, setUserLocation, coords, address]);

  const handleAllowLocation = useCallback(async () => {
    await requestLocation();
  }, [requestLocation]);

  const handleCloseDialog = useCallback(() => {
    setShowLocationDialog(false);
    setShowMapDialog(false);
  }, []);

  const handleConfirmMapLocation = useCallback(
    (location: { lat: number; lng: number; accuracy: number; address: StructuredAddress }) => {
      // Update store with confirmed location INCLUDING address
      setUserLocation({
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy,
        timestamp: Date.now(),
        address: {
          formattedAddress: location.address.formattedAddress,
          shortAddress: location.address.shortAddress,
          street: location.address.street,
          streetNumber: location.address.streetNumber,
          neighborhood: location.address.neighborhood,
          city: location.address.city,
          state: location.address.state,
          country: location.address.country,
          postalCode: location.address.postalCode,
        },
      });
      setGeoCulturalMode(true);
      setShowMapDialog(false);
      setShowLocationDialog(false);
    },
    [setUserLocation, setGeoCulturalMode]
  );

  const handleCloseMapDialog = useCallback(() => {
    setShowMapDialog(false);
  }, []);

  const ensureGeoCulturalIfNeeded = useCallback(
    async (value: string) => {
      if (!shouldAutoEnableGeoCultural(value)) {
        return true;
      }

      if (!geoCulturalMode) {
        setGeoCulturalMode(true);
      }

      if (userLocation) {
        return true;
      }

      if (coords && address) {
        setUserLocation({
          lat: coords.lat,
          lng: coords.lng,
          accuracy: coords.accuracy,
          timestamp: Date.now(),
          address: {
            formattedAddress: address.formattedAddress,
            shortAddress: address.shortAddress,
            street: address.street,
            streetNumber: address.streetNumber,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
          },
        });
        return true;
      }

      setShowLocationDialog(true);
      return false;
    },
    [coords, address, geoCulturalMode, setGeoCulturalMode, setUserLocation, userLocation]
  );

  // When location is obtained, automatically open the map dialog
  const prevTimestampRef = useRef<number | null>(null);
  useEffect(() => {
    if (coords && address && showLocationDialog && coords.timestamp !== prevTimestampRef.current) {
      prevTimestampRef.current = coords.timestamp;
      // Automatically open map dialog when location is obtained
      setShowLocationDialog(false);
      setShowMapDialog(true);
    }
  }, [coords, address, showLocationDialog]);

  const prevConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevConversationIdRef.current && prevConversationIdRef.current !== conversationId) {
      setGeoCulturalMode(false);
      setUserLocation(null);
      setShowLocationDialog(false);
    }
    if (!conversationId) {
      setGeoCulturalMode(false);
      setUserLocation(null);
    }
    prevConversationIdRef.current = conversationId ?? null;
  }, [conversationId, setGeoCulturalMode, setUserLocation, setShowLocationDialog]);

  const submitMessage = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const value = input.trim();
      if (!value || isStreaming) return;

      const canProceed = await ensureGeoCulturalIfNeeded(value);
      if (!canProceed) {
        return;
      }

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
      let assistantContent = '';
      let geoCulturalContent: (GeoCulturalAnalysisText & Record<string, unknown>) | null = null;

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

        // Update timestamp to current time for each message (keep coords/address same)
        const freshGeoCulturalContext = geoCulturalMode && userLocation
          ? { ...userLocation, timestamp: Date.now() }
          : null;

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: value,
            messages: payloadMessages,
            geoCulturalContext: freshGeoCulturalContext,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'No se pudo contactar con el asistente.');
        }

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
              if (geoCulturalMode) {
                if (event.event === 'geocultural.start') {
                  geoCulturalContent = { ...(event.data as object), reply: '' } as GeoCulturalAnalysisText & Record<string, unknown>;
                  assistantContent = JSON.stringify(geoCulturalContent);
                  updateMessage(assistantMessageId, () => assistantContent);
                } else if (event.event === 'geocultural.delta') {
                  const delta = (event.data as { delta?: string })?.delta ?? '';
                  if (geoCulturalContent) {
                    geoCulturalContent.reply += delta;
                    assistantContent = JSON.stringify(geoCulturalContent);
                    updateMessage(assistantMessageId, () => assistantContent);
                  }
                } else if (event.event === 'error') {
                  const error = (event.data as { error?: { message?: string } })?.error?.message ?? 'Error en el stream.';
                  updateMessage(assistantMessageId, (prev) => prev + `\n\nError: ${error}`);
                  assistantContent += `\n\nError: ${error}`;
                }
              } else {
                if (event.event === 'response.output_text.delta') {
                  const delta = event.data?.delta ?? '';
                  updateMessage(assistantMessageId, (prev) => {
                    const newContent = prev + delta;
                    assistantContent = newContent; // Update final content
                    return newContent;
                  });
                }
              }
            }
            boundary = buffer.indexOf('\n\n');
          }
        };

        try {
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
        } catch (streamError) {
          // Handle stream interruption (e.g., when app goes to background on mobile)
          console.warn('[Stream] Connection interrupted, preserving partial content:', streamError);

          // Process any remaining buffer before handling error
          if (buffer) {
            try {
              buffer += decoder.decode();
              processBuffer();
            } catch (e) {
              console.warn('[Stream] Error processing final buffer:', e);
            }
          }

          // If we have partial content, keep it and add a note about interruption
          if (assistantContent) {
            console.log('[Stream] Preserved partial content:', assistantContent.substring(0, 100));
            // Don't throw - we want to save the partial content
          } else {
            // Only throw if we have no content at all
            throw streamError;
          }
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

            // ✅ Guardar contexto geocultural en la conversación (persiste para futuras sesiones)
            if (freshGeoCulturalContext) {
              fetch(`/api/conversations/${currentConversationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  geoCulturalContext: JSON.stringify(freshGeoCulturalContext),
                }),
              }).catch(err => console.debug('Background geocultural context save:', err.message));
            }

          } catch (error) {
            console.error('Error saving assistant message:', error);
          }
        }
      } catch (err) {
        console.error('[Chat] Error during message submission:', err);

        // Check if we already have partial content from streaming
        if (assistantContent && assistantContent.length > 0) {
          // We have partial content - keep it and don't overwrite with error
          console.log('[Chat] Keeping partial content despite error');
          // The content is already in the message, just end streaming

          // Try to save partial content to database
          if (currentConversationId) {
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

              queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
              queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
              console.log('[Chat] Partial content saved successfully');
            } catch (saveError) {
              console.error('[Chat] Error saving partial content:', saveError);
            }
          }
        } else {
          // No content received, show error message
          const message =
            err instanceof Error
              ? err.message
              : 'Ocurrió un problema al contactar con el asistente.';
          updateMessage(assistantMessageId, () => message);
        }
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
      ensureGeoCulturalIfNeeded,
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
        address={address}
        quality={quality}
        warnings={warnings}
      />

      {address && coords && (
        <LocationMapConfirmDialog
          isOpen={showMapDialog}
          onClose={handleCloseMapDialog}
          onConfirm={handleConfirmMapLocation}
          initialLocation={{
            lat: coords.lat,
            lng: coords.lng,
            accuracy: coords.accuracy,
          }}
          initialAddress={address}
        />
      )}

      <div className="space-y-3">
        {geoCulturalMode && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-r from-[#00552b]/10 to-[#00aa56]/10 rounded-2xl border border-[#00552b]/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin className="size-4 text-[#00552b] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-[#00552b]">
                  {!userLocation && isLocationLoading
                    ? 'Obteniendo ubicación precisa...'
                    : userLocation && address
                    ? 'GeoCultural Mode activo ✓'
                    : userLocation
                    ? 'GeoCultural Mode activo'
                    : 'Obteniendo ubicación...'}
                </span>
                {address && address.neighborhood && (
                  <span className="text-xs text-[#00552b]/70 truncate">
                    {[address.neighborhood, address.city].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
            {coords && coords.accuracy && quality && (
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium ${
                  quality === 'excellent' ? 'text-green-600' :
                  quality === 'good' ? 'text-blue-600' :
                  quality === 'fair' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {quality === 'excellent' ? '📍 Excelente' :
                   quality === 'good' ? '📍 Buena' :
                   quality === 'fair' ? '📍 Regular' :
                   '📍 Baja'}
                </span>
                <span className="text-xs text-[#00552b]/70 font-medium">
                  (±{Math.round(coords.accuracy)}m)
                </span>
              </div>
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
            className={`flex shrink-0 items-center justify-center rounded-full p-2 transition ${geoCulturalMode
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
