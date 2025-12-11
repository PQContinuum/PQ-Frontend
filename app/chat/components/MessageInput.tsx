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
import { ArrowUp, MapPin, Paperclip, Plus, Check, Loader2, Image, X } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { FileUpload } from './FileUpload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
import { useImageGeneration } from '@/hooks/useImageGeneration';
import type { ImageGenSize, ImageGenStyle } from '@/lib/memory/plan-limits';

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

// Image size options - minimal labels
const IMAGE_SIZES: { value: ImageGenSize; label: string }[] = [
  { value: '1024x1024', label: '1:1' },
  { value: '1024x1792', label: '9:16' },
  { value: '1792x1024', label: '16:9' },
];

export const MessageInput = memo(function MessageInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ id: string; fileName: string; fileType: string; fileSize: number; url: string; thumbnailUrl?: string; mimeType?: string }>>([]);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const queryClient = useQueryClient();

  // Image mode state
  const [imageMode, setImageMode] = useState(false);
  const [imageSize, setImageSize] = useState<ImageGenSize>('1024x1024');

  const { generate: generateImage, isGenerating: isGeneratingImage, usage: imageUsage } = useImageGeneration();

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

  // Handle image generation
  const handleGenerateImage = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isGeneratingImage) return;

    // Add user message showing the prompt
    const userMessageId = createId();
    const assistantMessageId = createId();

    addMessage({
      id: userMessageId,
      role: 'user',
      content: `🎨 Generar imagen: "${prompt}"`,
    });
    addMessage({
      id: assistantMessageId,
      role: 'assistant',
      content: '🖼️ Generando imagen...',
    });

    setInput('');
    setStreaming(true);

    try {
      const result = await generateImage(prompt, {
        quality: 'standard',
        size: imageSize,
        style: 'vivid',
      });

      if (result) {
        // Update assistant message with the generated image
        updateMessage(assistantMessageId, () =>
          `![Imagen generada](${result.url})\n\n${result.revisedPrompt ? `*${result.revisedPrompt}*` : ''}`
        );
      } else {
        updateMessage(assistantMessageId, () =>
          '❌ No se pudo generar la imagen. Intenta con otro prompt.'
        );
      }
    } catch (error) {
      console.error('Error generating image:', error);
      updateMessage(assistantMessageId, () =>
        '❌ Error al generar la imagen. Por favor intenta de nuevo.'
      );
    } finally {
      setStreaming(false);
    }
  }, [input, imageSize, generateImage, isGeneratingImage, addMessage, updateMessage, setStreaming]);

  const submitMessage = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      // If in image mode, generate image instead
      if (imageMode) {
        handleGenerateImage();
        return;
      }

      const value = input.trim();
      if (isStreaming) return;

      if (attachments.length > 0 && !value) {
        alert('Por favor escribe un mensaje para enviar junto con los archivos adjuntos');
        return;
      }

      if (!value) return;

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

      addMessage({
        id: userMessageId,
        role: 'user',
        content: value,
        attachments: attachments.length > 0 ? attachments : undefined
      });
      addMessage({ id: assistantMessageId, role: 'assistant', content: '' });
      setInput('');
      setStreaming(true);

      let currentConversationId = conversationId;
      let assistantContent = '';
      let geoCulturalContent: (GeoCulturalAnalysisText & Record<string, unknown>) | null = null;

      try {
        if (!currentConversationId) {
          try {
            const title =
              value.length > 50 ? value.substring(0, 50).trim() + '...' : value;

            const conversation = await createConversationMutation.mutateAsync({
              title,
            });

            currentConversationId = conversation.id;
            setConversationId(conversation.id);
          } catch (error) {
            console.error('Error creating conversation:', error);
          }
        }

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
              if (attachments.length > 0) {
                try {
                  await fetch(`/api/conversations/${currentConversationId}/attachments/link`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      attachmentIds: attachments.map(a => a.id),
                      messageId: userMessageId,
                    }),
                  });
                } catch (linkError) {
                  console.error('Error linking attachments to message:', linkError);
                }
              }

              queryClient.invalidateQueries({
                queryKey: conversationKeys.detail(currentConversationId),
              });
              queryClient.invalidateQueries({
                queryKey: conversationKeys.lists(),
              });
            }
          } catch (error) {
            console.error('Error saving user message:', error);
          }
        }

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
            attachmentIds: attachments.map(a => a.id),
          }),
        });

        setAttachments([]);
        setShowFileUpload(false);

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
                    assistantContent = newContent;
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
          console.warn('[Stream] Connection interrupted, preserving partial content:', streamError);

          if (buffer) {
            try {
              buffer += decoder.decode();
              processBuffer();
            } catch (e) {
              console.warn('[Stream] Error processing final buffer:', e);
            }
          }

          if (assistantContent) {
            console.log('[Stream] Preserved partial content:', assistantContent.substring(0, 100));
          } else {
            throw streamError;
          }
        }

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

            queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
            queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
            fetch(`/api/conversations/${currentConversationId}/extract-facts`, { method: 'POST' })
              .catch(err => console.debug('Background fact extraction:', err.message));

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

        if (assistantContent && assistantContent.length > 0) {
          console.log('[Chat] Keeping partial content despite error');

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
      attachments,
      setAttachments,
      setShowFileUpload,
      imageMode,
      handleGenerateImage,
    ],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  const toggleImageMode = useCallback(() => {
    setImageMode((prev) => !prev);
    setShowFileUpload(false);
    // Focus textarea when toggling
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const isLoading = isStreaming || isGeneratingImage;

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

        {showFileUpload && (
          <div
            className="bg-white rounded-3xl border border-black/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-sm"
            style={{
              animation: 'slideInFromLeft 0.3s ease-out forwards',
            }}
          >
            {conversationId ? (
              <FileUpload
                conversationId={conversationId}
                onAttachmentsChange={setAttachments}
              />
            ) : (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-[#00552b]/20 rounded-full blur-xl animate-pulse"></div>
                  <Loader2 className="relative w-8 h-8 text-[#00552b] animate-spin" />
                </div>
                <p className="text-sm text-gray-600 mt-4 font-medium">Preparando espacio para tus archivos...</p>
              </div>
            )}
          </div>
        )}

        <form
          onSubmit={submitMessage}
          className="rounded-[2rem] border border-black/5 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
        >
          {/* Image mode bar - minimal design */}
          {imageMode && (
            <div className="flex items-center gap-2 px-4 pt-3 pb-1">
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
                <Image className="size-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">Imagen</span>
              </div>
              <div className="flex items-center gap-1">
                {(imageUsage?.allowedSizes || ['1024x1024']).map((size) => {
                  const sizeOption = IMAGE_SIZES.find(s => s.value === size);
                  if (!sizeOption) return null;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setImageSize(size)}
                      disabled={isLoading}
                      className={`px-2 py-1 rounded text-xs transition ${
                        imageSize === size
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-400 hover:text-gray-600'
                      } disabled:opacity-40`}
                    >
                      {sizeOption.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setImageMode(false)}
                className="ml-auto p-1 text-gray-400 hover:text-gray-600 rounded transition"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Main input row */}
          <div className="flex flex-row items-center gap-3 px-4 py-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isLoading}
                  className={`relative flex shrink-0 items-center justify-center rounded-full p-2 transition ${
                    geoCulturalMode || showFileUpload || attachments.length > 0 || imageMode
                      ? imageMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#00552b] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Plus className="size-5" />
                  {attachments.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {attachments.length}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem
                  onClick={toggleImageMode}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  <Image className="mr-2 size-4" />
                  <span className="flex-1">Generar imagen</span>
                  {imageMode && <Check className="size-4 text-blue-600" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLocationToggle}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  <MapPin className="mr-2 size-4" />
                  <span className="flex-1">GeoCultural</span>
                  {geoCulturalMode && <Check className="size-4 text-[#00552b]" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    if (!conversationId && !isCreatingConversation) {
                      setIsCreatingConversation(true);
                      try {
                        const conversation = await createConversationMutation.mutateAsync({
                          title: 'Nueva conversación',
                        });
                        setConversationId(conversation.id);
                        setShowFileUpload(true);
                      } catch (error) {
                        console.error('Error creating conversation:', error);
                      } finally {
                        setIsCreatingConversation(false);
                      }
                    } else if (conversationId) {
                      setShowFileUpload(!showFileUpload);
                    }
                  }}
                  disabled={isLoading || isCreatingConversation}
                  className="cursor-pointer"
                >
                  <Paperclip className="mr-2 size-4" />
                  <span className="flex-1">Archivos</span>
                  {attachments.length > 0 && (
                    <span className="text-xs text-gray-400">{attachments.length}</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <textarea
              ref={textareaRef}
              autoFocus
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                imageMode
                  ? 'Describe la imagen...'
                  : geoCulturalMode
                  ? 'Pregunta sobre lugares...'
                  : 'Mensaje...'
              }
              disabled={isLoading}
              className="flex-1 min-h-[20px] max-h-[200px] resize-none overflow-y-auto bg-transparent text-base leading-5 text-[#111111] outline-none placeholder:text-[#111111]/40 disabled:opacity-60 scrollbar-thin"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`flex shrink-0 items-center justify-center rounded-full p-2 text-white transition disabled:cursor-not-allowed ${
                imageMode
                  ? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
                  : 'bg-[#00552b] hover:bg-[#00552b]/80 disabled:bg-[#00552b]/40'
              }`}
            >
              {isGeneratingImage ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ArrowUp className="size-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
});
