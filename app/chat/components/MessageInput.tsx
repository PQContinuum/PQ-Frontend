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
import { ArrowUp, MapPin, Paperclip, Plus, Check, Loader2, Image, X, ChevronDown, Lock, Mic, Square, Sparkles, Video } from 'lucide-react';
import { VideoImageUpload } from './VideoImageUpload';
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
import type { ImageGenSize, ImageGenQuality } from '@/lib/memory/plan-limits';
import { IMAGE_STYLE_PRESETS, getAvailablePresets } from '@/lib/image-gen/style-presets';
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput';
import {
  useVideoGeneration,
  VIDEO_ASPECT_RATIOS,
  VIDEO_DURATIONS,
  VIDEO_MODES,
  type VideoAspectRatio,
  type VideoDuration,
  type VideoMode,
} from '@/hooks/useVideoGeneration';

/**
 * FEATURE FLAGS - Control de acceso a funcionalidades
 * ====================================================
 * Cambia a `true` para habilitar, `false` para deshabilitar
 *
 * Cuando una feature está deshabilitada:
 * - Se muestra con overlay semitransparente
 * - Icono de candado
 * - Tooltip "Próximamente"
 * - No es clickeable
 */
const FEATURE_FLAGS = {
  imageGeneration: false,  // Generar imagen - DESHABILITADO
  videoGeneration: true,   // Generar video - Kling V2.6
  geoCultural: true,       // GeoCultural mode
  fileUpload: true,        // Subir archivos
  voiceInput: true,        // Dictado por voz
} as const;

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

// Size options with aspect ratio labels
const SIZE_OPTIONS: { value: ImageGenSize; label: string }[] = [
  { value: '1024x1024', label: '1:1' },
  { value: '1024x1536', label: '2:3' },
  { value: '1536x1024', label: '3:2' },
];

// Quality options with colors
const QUALITY_OPTIONS: {
  value: ImageGenQuality;
  label: string;
  description: string;
  color: string;
}[] = [
  { value: 'low', label: 'Rápida', description: 'Generación rápida', color: 'text-emerald-600' },
  { value: 'medium', label: 'Balanceada', description: 'Balance velocidad/calidad', color: 'text-blue-600' },
  { value: 'high', label: 'Alta', description: 'Máxima calidad', color: 'text-amber-600' },
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
  const [imageQuality, setImageQuality] = useState<ImageGenQuality>('low');
  const [imageStylePreset, setImageStylePreset] = useState<string>('auto');
  const [showStylePicker, setShowStylePicker] = useState(false);

  const {
    generate: generateImage,
    generateWithStreaming,
    isGenerating: isGeneratingImage,
    usage: imageUsage,
  } = useImageGeneration();

  // Video mode state
  const [videoMode, setVideoMode] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [videoDuration, setVideoDuration] = useState<VideoDuration>('5');
  const [videoModeType, setVideoModeType] = useState<VideoMode>('text-to-video');
  const [videoImageUrl, setVideoImageUrl] = useState<string>('');

  const {
    generate: generateVideo,
    isGenerating: isGeneratingVideo,
    progress: videoProgress,
    usage: videoUsage,
  } = useVideoGeneration();

  // Ref to track latest video progress for use in intervals
  const videoProgressRef = useRef<string | null>(null);
  useEffect(() => {
    videoProgressRef.current = videoProgress;
  }, [videoProgress]);

  // Voice input hook
  const {
    isRecording,
    isTranscribing,
    error: voiceError,
    duration: recordingDuration,
    toggleRecording,
    cancelRecording,
    isSupported: isVoiceSupported,
  } = useVoiceInput({
    onTranscript: (text) => {
      // Append transcribed text to input
      setInput((prev) => {
        const separator = prev.trim() ? ' ' : '';
        return prev + separator + text;
      });
      // Auto-resize textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
          textareaRef.current.style.height = `${newHeight}px`;
        }
      }, 0);
    },
  });

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

  const { addMessage, updateMessage, updateMessageGenerationState, setStreaming, setConversationId, setGeoCulturalMode, setUserLocation, startGeneration, stopGeneration } = useChatStore(
    useShallow((state) => ({
      addMessage: state.addMessage,
      updateMessage: state.updateMessage,
      updateMessageGenerationState: state.updateMessageGenerationState,
      setStreaming: state.setStreaming,
      setConversationId: state.setConversationId,
      setGeoCulturalMode: state.setGeoCulturalMode,
      setUserLocation: state.setUserLocation,
      startGeneration: state.startGeneration,
      stopGeneration: state.stopGeneration,
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

  // Get available presets based on plan
  const availablePresets = getAvailablePresets(imageUsage?.premiumStyles || false);
  const selectedPreset = IMAGE_STYLE_PRESETS.find(p => p.id === imageStylePreset) || IMAGE_STYLE_PRESETS[0];

  // Handle image generation
  const handleGenerateImage = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isGeneratingImage) return;

    // Add user message showing the prompt
    const userMessageId = createId();
    const assistantMessageId = createId();
    const userContent = `🖼️ ${prompt}`;

    addMessage({
      id: userMessageId,
      role: 'user',
      content: userContent,
    });
    // Crear mensaje con estado de generación para mostrar skeleton
    addMessage({
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      generationState: { type: 'image', status: 'generating' },
    });

    setInput('');
    setStreaming(true);
    startGeneration('image', assistantMessageId);

    // Create conversation if needed
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      try {
        const title = prompt.length > 50 ? `🖼️ ${prompt.substring(0, 47)}...` : `🖼️ ${prompt}`;
        const conversation = await createConversationMutation.mutateAsync({ title });
        currentConversationId = conversation.id;
        setConversationId(conversation.id);
      } catch (error) {
        console.error('Error creating conversation for image:', error);
      }
    }

    // Save user message to database
    if (currentConversationId) {
      try {
        await fetch(`/api/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userMessageId,
            role: 'user',
            content: userContent,
          }),
        });
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // Use streaming if available
    const useStreaming = imageUsage?.streamingEnabled && imageUsage?.partialImages > 0;

    const result = useStreaming
      ? await generateWithStreaming(
          prompt,
          {
            quality: imageQuality,
            size: imageSize,
            stylePreset: imageStylePreset,
          },
          // Handle partial images
          (partialImg) => {
            updateMessage(assistantMessageId, () => `![Generando...](${partialImg})`);
          }
        )
      : await generateImage(prompt, {
          quality: imageQuality,
          size: imageSize,
          stylePreset: imageStylePreset,
        });

    let assistantContent: string;
    if (result.success) {
      assistantContent = `![Imagen generada](${result.url})`;
      updateMessage(assistantMessageId, () => assistantContent);
      // Marcar generación como completada
      updateMessageGenerationState(assistantMessageId, { type: 'image', status: 'completed' });
    } else {
      assistantContent = `❌ ${result.error}`;
      updateMessage(assistantMessageId, () => assistantContent);
      // Marcar generación como error
      updateMessageGenerationState(assistantMessageId, { type: 'image', status: 'error' });
    }

    // Save assistant message to database with metadata
    if (currentConversationId) {
      try {
        await fetch(`/api/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: assistantMessageId,
            role: 'assistant',
            content: assistantContent,
            // Guardar estado de generación en metadata para persistencia
            metadata: {
              generationState: { type: 'image', status: result.success ? 'completed' : 'error' }
            },
          }),
        });
        queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
        queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
    }

    setStreaming(false);
    stopGeneration();
  }, [input, imageSize, imageQuality, imageStylePreset, generateImage, generateWithStreaming, isGeneratingImage, addMessage, updateMessage, updateMessageGenerationState, setStreaming, startGeneration, stopGeneration, imageUsage, conversationId, createConversationMutation, setConversationId, queryClient]);

  // Handle video generation
  const handleGenerateVideo = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || isGeneratingVideo) return;

    // Validate image-to-video mode
    if (videoModeType === 'image-to-video' && !videoImageUrl) {
      return;
    }

    const userMessageId = createId();
    const assistantMessageId = createId();
    const userContent = `${prompt}`;

    addMessage({
      id: userMessageId,
      role: 'user',
      content: userContent,
    });
    // Crear mensaje con estado de generación para mostrar skeleton
    addMessage({
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      generationState: { type: 'video', status: 'generating' },
    });

    setInput('');
    setStreaming(true);
    startGeneration('video', assistantMessageId);

    // Create conversation if needed
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      try {
        const title = prompt.length > 50 ? `🎬 ${prompt.substring(0, 47)}...` : `🎬 ${prompt}`;
        const conversation = await createConversationMutation.mutateAsync({ title });
        currentConversationId = conversation.id;
        setConversationId(conversation.id);
      } catch (error) {
        console.error('Error creating conversation for video:', error);
      }
    }

    // Save user message to database
    if (currentConversationId) {
      try {
        await fetch(`/api/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: userMessageId,
            role: 'user',
            content: userContent,
          }),
        });
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // Update message with progress using ref to get latest value
    const progressInterval = setInterval(() => {
      const currentProgress = videoProgressRef.current;
      if (currentProgress) {
        updateMessage(assistantMessageId, () => `🎬 ${currentProgress}`);
      }
    }, 1000);

    const result = await generateVideo(prompt, {
      mode: videoModeType,
      imageUrl: videoModeType === 'image-to-video' ? videoImageUrl : undefined,
      duration: videoDuration,
      aspectRatio: videoAspectRatio,
      generateAudio: true,
    });

    clearInterval(progressInterval);

    let assistantContent: string;
    if (result.success) {
      // Display video with HTML5 video tag format
      assistantContent = `<video controls src="${result.url}" style="max-width:100%;border-radius:12px;"></video>`;
      updateMessage(assistantMessageId, () => assistantContent);
      // Marcar generación como completada
      updateMessageGenerationState(assistantMessageId, { type: 'video', status: 'completed' });
    } else {
      assistantContent = `❌ ${result.error}`;
      updateMessage(assistantMessageId, () => assistantContent);
      // Marcar generación como error
      updateMessageGenerationState(assistantMessageId, { type: 'video', status: 'error' });
    }

    // Save assistant message to database with metadata
    if (currentConversationId) {
      try {
        await fetch(`/api/conversations/${currentConversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: assistantMessageId,
            role: 'assistant',
            content: assistantContent,
            // Guardar estado de generación en metadata para persistencia
            metadata: {
              generationState: { type: 'video', status: result.success ? 'completed' : 'error' }
            },
          }),
        });
        queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
        queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
    }

    setStreaming(false);
    stopGeneration();
  }, [input, videoModeType, videoImageUrl, videoDuration, videoAspectRatio, generateVideo, isGeneratingVideo, addMessage, updateMessage, updateMessageGenerationState, setStreaming, startGeneration, stopGeneration, conversationId, createConversationMutation, setConversationId, queryClient]);

  const submitMessage = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      // If in video mode, generate video instead
      if (videoMode) {
        handleGenerateVideo();
        return;
      }

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
    setVideoMode(false);
    setShowFileUpload(false);
    setShowStylePicker(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const toggleVideoMode = useCallback(() => {
    setVideoMode((prev) => !prev);
    setImageMode(false);
    setShowFileUpload(false);
    setShowStylePicker(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const isLoading = isStreaming || isGeneratingImage || isGeneratingVideo || isTranscribing;

  // Style preset picker component
  const StylePresetPicker = () => (
    <div className="absolute bottom-full left-0 mb-2 w-[340px] bg-white rounded-2xl border border-gray-100 shadow-xl p-3 z-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">Estilo de imagen</span>
        <button
          onClick={() => setShowStylePicker(false)}
          className="p-1 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="size-4 text-gray-400" />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {availablePresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              setImageStylePreset(preset.id);
              setShowStylePicker(false);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              imageStylePreset === preset.id
                ? `${preset.bgColor} ${preset.borderColor} border-2 shadow-sm`
                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{preset.icon}</span>
            <span className={`text-xs font-medium ${
              imageStylePreset === preset.id ? preset.color : 'text-gray-600'
            }`}>
              {preset.name}
            </span>
          </button>
        ))}
        {/* Show locked presets */}
        {IMAGE_STYLE_PRESETS.filter(p => p.premium && !imageUsage?.premiumStyles).map((preset) => (
          <button
            key={preset.id}
            disabled
            className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50 opacity-50 cursor-not-allowed relative"
          >
            <span className="text-xl grayscale">{preset.icon}</span>
            <span className="text-xs font-medium text-gray-400">{preset.name}</span>
            <Lock className="absolute top-1 right-1 size-3 text-gray-400" />
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-center">
        {imageUsage?.premiumStyles
          ? 'Todos los estilos disponibles'
          : 'Actualiza tu plan para más estilos'}
      </p>
    </div>
  );

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
          className={`rounded-[2rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative transition-all duration-500 ${
            imageMode
              ? 'border-2 border-sky-400/60 image-mode-glow'
              : videoMode
              ? 'border-2 border-violet-400/60 video-mode-glow'
              : 'border border-black/5'
          }`}
        >
          {/* Image mode controls - Beautiful redesign */}
          {imageMode && (
            <div className="px-4 pt-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Style preset selector button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowStylePicker(!showStylePicker)}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                      showStylePicker
                        ? `${selectedPreset.bgColor} ${selectedPreset.borderColor} border`
                        : 'bg-gray-100 hover:bg-gray-200'
                    } disabled:opacity-40`}
                  >
                    <span className="text-base">{selectedPreset.icon}</span>
                    <span className={`text-sm font-medium ${showStylePicker ? selectedPreset.color : 'text-gray-700'}`}>
                      {selectedPreset.name}
                    </span>
                    <ChevronDown className={`size-3.5 transition-transform ${showStylePicker ? 'rotate-180' : ''} ${
                      showStylePicker ? selectedPreset.color : 'text-gray-400'
                    }`} />
                  </button>
                  {showStylePicker && <StylePresetPicker />}
                </div>

                {/* Size selector */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {SIZE_OPTIONS.filter(s => imageUsage?.allowedSizes?.includes(s.value) || s.value === '1024x1024').map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setImageSize(size.value)}
                      disabled={isLoading}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        imageSize === size.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      } disabled:opacity-40`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>

                {/* Quality selector - Same style as size selector with colors */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {QUALITY_OPTIONS.filter(q => imageUsage?.allowedQualities?.includes(q.value) || q.value === 'low').map((q) => {
                    const isSelected = imageQuality === q.value;
                    return (
                      <button
                        key={q.value}
                        type="button"
                        onClick={() => setImageQuality(q.value)}
                        disabled={isLoading}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                          isSelected
                            ? `bg-white shadow-sm ${q.color}`
                            : 'text-gray-500 hover:text-gray-700'
                        } disabled:opacity-40`}
                        title={q.description}
                      >
                        {q.label}
                      </button>
                    );
                  })}
                </div>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setImageMode(false)}
                  className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Streaming indicator */}
              {imageUsage?.streamingEnabled && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span>Vista previa en tiempo real activada</span>
                </div>
              )}
            </div>
          )}

          {/* Video mode controls */}
          {videoMode && (
            <div className="px-4 pt-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Mode selector: Text or Image */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {VIDEO_MODES.map((mode) => {
                    const isAllowed = videoUsage?.allowedModes?.includes(mode.value) || mode.value === 'text-to-video';
                    const isSelected = videoModeType === mode.value;

                    if (!isAllowed) {
                      // Show locked mode
                      return (
                        <div
                          key={mode.value}
                          className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed"
                          title="Actualiza a Professional para desbloquear"
                        >
                          <span className="grayscale opacity-50">{mode.icon}</span>
                          <span>{mode.label}</span>
                          <Lock className="size-3 text-gray-400" />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setVideoModeType(mode.value)}
                        disabled={isLoading}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        } disabled:opacity-40`}
                        title={mode.description}
                      >
                        <span>{mode.icon}</span>
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Image upload for image-to-video mode */}
                {videoModeType === 'image-to-video' && (
                  <VideoImageUpload
                    onImageUploaded={setVideoImageUrl}
                    onImageRemoved={() => setVideoImageUrl('')}
                    currentImageUrl={videoImageUrl}
                    disabled={isLoading}
                  />
                )}

                {/* Aspect ratio selector */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {VIDEO_ASPECT_RATIOS.map((ratio) => {
                    const isAllowed = videoUsage?.allowedAspectRatios?.includes(ratio.value) || ratio.value === '16:9';
                    const isSelected = videoAspectRatio === ratio.value;

                    if (!isAllowed) {
                      return (
                        <div
                          key={ratio.value}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed"
                          title="Actualiza tu plan para desbloquear"
                        >
                          <span>{ratio.value}</span>
                          <Lock className="size-2.5" />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={ratio.value}
                        type="button"
                        onClick={() => setVideoAspectRatio(ratio.value)}
                        disabled={isLoading}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        } disabled:opacity-40`}
                        title={ratio.label}
                      >
                        {ratio.value}
                      </button>
                    );
                  })}
                </div>

                {/* Duration selector */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {VIDEO_DURATIONS.map((dur) => {
                    const isAllowed = videoUsage?.allowedDurations?.includes(dur.value) || dur.value === '5';
                    const isSelected = videoDuration === dur.value;

                    if (!isAllowed) {
                      return (
                        <div
                          key={dur.value}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed"
                          title="Actualiza a Professional para desbloquear"
                        >
                          <span>{dur.label}</span>
                          <Lock className="size-2.5" />
                        </div>
                      );
                    }

                    return (
                      <button
                        key={dur.value}
                        type="button"
                        onClick={() => setVideoDuration(dur.value)}
                        disabled={isLoading}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? 'bg-white text-violet-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        } disabled:opacity-40`}
                        title={dur.description}
                      >
                        {dur.label}
                      </button>
                    );
                  })}
                </div>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setVideoMode(false)}
                  className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Progress indicator */}
              {isGeneratingVideo && videoProgress && (
                <div className="flex items-center gap-2 mt-2 text-xs text-violet-600">
                  <Loader2 className="size-3 animate-spin" />
                  <span>{videoProgress}</span>
                </div>
              )}

              {/* Usage and info */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Video className="size-3" />
                  <span>Continuum V0.1 Pro{videoUsage?.audioEnabled ? ' + Audio' : ''}</span>
                </div>
                {videoUsage && (
                  <span className="text-xs text-gray-400">
                    {videoUsage.remainingToday}/{videoUsage.dailyLimit} hoy
                  </span>
                )}
              </div>
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
                    geoCulturalMode || showFileUpload || attachments.length > 0 || imageMode || videoMode
                      ? 'bg-[#00552b] text-white'
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
              <DropdownMenuContent align="start" className="w-52">
                {/* Generar imagen - Con soporte para bloqueo */}
                <DropdownMenuItem
                  onClick={FEATURE_FLAGS.imageGeneration ? toggleImageMode : undefined}
                  disabled={isLoading || !FEATURE_FLAGS.imageGeneration}
                  className={`relative cursor-pointer ${!FEATURE_FLAGS.imageGeneration ? 'opacity-100' : ''}`}
                >
                  {/* Overlay de bloqueo - cubre todo el ancho */}
                  {!FEATURE_FLAGS.imageGeneration && (
                    <div className="absolute -inset-x-2 -inset-y-1 bg-gradient-to-r from-white/90 via-white/70 to-white/90 backdrop-blur-[1px] rounded-sm flex items-center justify-end pr-2 z-10">
                      <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-medium shadow-sm">
                        <Sparkles className="size-3" />
                        <span>Próximamente</span>
                      </div>
                    </div>
                  )}
                  <Image className="mr-2 size-4" />
                  <span className="flex-1">Generar imagen</span>
                  {imageMode && FEATURE_FLAGS.imageGeneration && <Check className="size-4 text-[#00552b]" />}
                </DropdownMenuItem>

                {/* Generar video - Kling V2.6 */}
                <DropdownMenuItem
                  onClick={FEATURE_FLAGS.videoGeneration ? toggleVideoMode : undefined}
                  disabled={isLoading || !FEATURE_FLAGS.videoGeneration}
                  className={`relative cursor-pointer ${!FEATURE_FLAGS.videoGeneration ? 'opacity-100' : ''}`}
                >
                  {!FEATURE_FLAGS.videoGeneration && (
                    <div className="absolute -inset-x-2 -inset-y-1 bg-gradient-to-r from-white/90 via-white/70 to-white/90 backdrop-blur-[1px] rounded-sm flex items-center justify-end pr-2 z-10">
                      <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-medium shadow-sm">
                        <Sparkles className="size-3" />
                        <span>Próximamente</span>
                      </div>
                    </div>
                  )}
                  <Video className="mr-2 size-4" />
                  <span className="flex-1">Generar video</span>
                  {videoMode && FEATURE_FLAGS.videoGeneration && <Check className="size-4 text-[#00552b]" />}
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
                isRecording
                  ? 'Escuchando...'
                  : isTranscribing
                  ? 'Transcribiendo...'
                  : videoMode
                  ? videoModeType === 'image-to-video'
                    ? 'Describe cómo quieres animar la imagen...'
                    : 'Describe tu video (escena, acción, estilo)...'
                  : imageMode
                  ? `Describe tu imagen en estilo ${selectedPreset.name}...`
                  : geoCulturalMode
                  ? 'Pregunta sobre lugares...'
                  : 'Mensaje...'
              }
              disabled={isLoading || isRecording}
              className="flex-1 min-h-[20px] max-h-[200px] resize-none overflow-y-auto bg-transparent text-base leading-5 text-[#111111] outline-none placeholder:text-[#111111]/40 disabled:opacity-60 scrollbar-thin"
            />

            {/* Voice input button */}
            {isVoiceSupported && (
              <div className="relative flex items-center">
                {/* Recording indicator with waveform */}
                {isRecording && (
                  <div className="flex items-center gap-2 mr-2">
                    {/* Waveform visualization */}
                    <div className="flex items-center gap-0.5 h-5">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="voice-waveform-bar w-0.5 bg-red-500 rounded-full"
                          style={{ height: '100%' }}
                        />
                      ))}
                    </div>
                    {/* Duration */}
                    <span className="text-xs font-medium text-red-500 tabular-nums min-w-[40px]">
                      {formatDuration(recordingDuration)}
                    </span>
                  </div>
                )}

                {/* Transcribing indicator */}
                {isTranscribing && (
                  <div className="flex items-center gap-2 mr-2">
                    <Loader2 className="size-4 animate-spin text-[#00552b]" />
                    <span className="text-xs font-medium text-[#00552b]">Transcribiendo...</span>
                  </div>
                )}

                {/* Microphone button */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={isLoading && !isRecording}
                  className={`relative flex shrink-0 items-center justify-center rounded-full p-2 transition ${
                    isRecording
                      ? 'bg-red-500 text-white voice-recording-btn'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-[#00552b]'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                  title={isRecording ? 'Detener grabación' : 'Dictado por voz'}
                >
                  {/* Animated ring when recording */}
                  {isRecording && (
                    <span className="absolute inset-0 rounded-full bg-red-500/30 voice-recording-ring" />
                  )}
                  {isRecording ? (
                    <Square className="size-4 fill-current" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={(!input.trim() || isLoading) && !isRecording}
              className="flex shrink-0 items-center justify-center rounded-full p-2 text-white transition disabled:cursor-not-allowed bg-[#00552b] hover:bg-[#00552b]/80 disabled:bg-[#00552b]/40"
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
