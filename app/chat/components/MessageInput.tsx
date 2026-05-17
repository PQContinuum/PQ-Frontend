'use client';

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent,
  useCallback,
  useRef,
  useState,
  memo,
  useEffect,
} from 'react';
import { ArrowUp, Globe, MapPin, Paperclip, Plus, Check, Loader2, Image, X, ChevronDown, Lock, Mic, Square, Clock, Video, Blend, Wand2, Zap, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VideoImageUpload } from './VideoImageUpload';
import { ImageReferenceUpload } from './ImageReferenceUpload';
import { GalleryOptionsPanel } from './GalleryOptionsPanel';
import type { GalleryOptions } from '@/lib/api-client';
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
  usePendingProjectId,
  useSetPendingProjectId,
  useSetLinkFetch,
  usePendingInput,
  useSetPendingInput,
  usePendingAction,
  useSetPendingAction,
} from '@/app/chat/store';
import { useCreateConversation } from '@/hooks/use-conversations';
import { useQueryClient } from '@tanstack/react-query';
import { conversationKeys } from '@/hooks/use-conversations';
import { useProjects } from '@/hooks/use-projects';
import { chatApi, conversationsApi, imageGenApi, videoGenApi, ApiError } from '@/lib/api-client';
import { usePreciseLocation } from '@/hooks/use-precise-location';
import { LocationPermissionDialog } from './LocationPermissionDialog';
import { LocationMapConfirmDialog } from './LocationMapConfirmDialog';
import type { GeoCulturalAnalysisText } from '@/app/chat/components/MessageBubble';
import type { StructuredAddress } from '@/lib/geolocation/address-types';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import type { ImageGenSize, ImageGenQuality } from '@/lib/memory/plan-limits';
import { IMAGE_STYLE_PRESETS, getAvailablePresets, type ImageStylePreset } from '@/lib/image-gen/style-presets';
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
import { LisaWizardDialog } from './lisa/LisaWizardDialog';
import { useWebSearchStore } from '@/store/useWebSearchStore';
import type { WebSearchResult } from '@/types/websearch';
import type { LinkResolvedResponse } from '@/types/link-resolver';
import { extractFirstUrl, getLinkTypeFromUrl } from '@/lib/link-resolver';

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
  imageGeneration: true,   // Generar imagen - Continuum Canvas via Backend /api/v1/image-gen
  videoGeneration: true,   // Generar video - Minimax Video via Fal.ai
  geoCultural: true,       // GeoCultural mode
  fileUpload: true,        // Subir archivos
  voiceInput: true,        // Dictado por voz
} as const;

type SSEPayload = {
  delta?: string;
  snapshot?: string;
  message?: string;
  response?: { error?: { message?: string } };
  linkInfo?: LinkResolvedResponse | null;
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

/**
 * Detects if a prompt needs enhancement (contextual references or too short)
 * Returns { needsEnhancement: true } if it should be enhanced
 * Returns { needsEnhancement: false, error: string } if it's a question (not suitable for generation)
 * Returns { needsEnhancement: false } if the prompt is already good
 */
const checkPromptNeedsEnhancement = (prompt: string, type: 'image' | 'video'): {
  needsEnhancement: boolean;
  error?: string;
} => {
  const trimmed = prompt.trim().toLowerCase();

  // Check if prompt is just a question - these can't be enhanced
  const questionPatterns = [
    /^\?/,
    /^(qué|que|cómo|como|por qué|porque|cuál|cual|dónde|donde|cuándo|cuando)\s/i,
    /^(what|how|why|which|where|when|can you|could you)\s/i,
  ];

  for (const pattern of questionPatterns) {
    if (pattern.test(trimmed)) {
      return {
        needsEnhancement: false,
        error: `Para generar ${type === 'image' ? 'una imagen' : 'un video'}, describe visualmente lo que quieres crear en lugar de hacer una pregunta.`,
      };
    }
  }

  // Check for very short prompts - need enhancement
  if (trimmed.length < 15) {
    return { needsEnhancement: true };
  }

  // Contextual reference patterns (Spanish & English) - need enhancement
  const contextualPatterns = [
    /\b(lo|la|el|los|las)\s+(anterior|mismo|misma|de antes)\b/i,
    /\b(eso|esto|ese|esta|esos|estas|aquel|aquella)\b/i,
    /\b(igual|lo mismo|como antes|otra vez)\b/i,
    /\b(haz|hazme|genera|crea|dame)\s+(lo mismo|eso|esto|otro)\b/i,
    /\b(the same|this|that|it|another one)\b/i,
    /de (lo|la) (anterior|que (dije|pedí|mencioné))/i,
    /como (el|la) (anterior|último|última)/i,
    /(del|de el|sobre el|sobre la) (tema|cosa|lo) (anterior|pasado)/i,
    /^(si|sí|ok|okay|dale|va|bien|perfecto)$/i,
  ];

  for (const pattern of contextualPatterns) {
    if (pattern.test(trimmed)) {
      return { needsEnhancement: true };
    }
  }

  // Prompt is good as-is
  return { needsEnhancement: false };
};

const parseSSEChunk = (chunk: string): SSEvent | null => {
  const trimmed = chunk.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/\r?\n/);
  let event = 'message';
  let data = '';

  lines.forEach((line) => {
    if (line.startsWith(':')) return;
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

// Componente memoizado para el picker de estilos de imagen
const StylePresetPicker = memo(function StylePresetPicker({
  availablePresets,
  lockedPresets,
  selectedId,
  hasPremiumStyles,
  onSelect,
  onClose,
}: {
  availablePresets: ImageStylePreset[];
  lockedPresets: ImageStylePreset[];
  selectedId: string;
  hasPremiumStyles: boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-0 mb-2 w-[340px] bg-white rounded-2xl border border-gray-100 shadow-xl p-3 z-50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700">Estilo de imagen</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="size-4 text-gray-400" />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {availablePresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              selectedId === preset.id
                ? `${preset.bgColor} ${preset.borderColor} border-2 shadow-sm`
                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{preset.icon}</span>
            <span className={`text-xs font-medium ${
              selectedId === preset.id ? preset.color : 'text-gray-600'
            }`}>
              {preset.name}
            </span>
          </button>
        ))}
        {lockedPresets.map((preset) => (
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
        {hasPremiumStyles
          ? 'Todos los estilos disponibles'
          : 'Actualiza tu plan para más estilos'}
      </p>
    </div>
  );
});

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
  const [imageReferenceUrl, setImageReferenceUrl] = useState<string>('');
  const [imageStrength, setImageStrength] = useState<number>(0.75);
  const [imageGalleryOptions, setImageGalleryOptions] = useState<GalleryOptions>({ isPublic: false });

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
  const [videoGalleryOptions, setVideoGalleryOptions] = useState<GalleryOptions>({ isPublic: false });

  // LISA Wizard state
  const [showLisaWizard, setShowLisaWizard] = useState(false);
  const [isLisaGenerating, setIsLisaGenerating] = useState(false);

  // Plan upgrade banner state
  const [planUpgradeMessage, setPlanUpgradeMessage] = useState<string | null>(null);
  const router = useRouter();

  const {
    generate: generateVideo,
    isGenerating: isGeneratingVideo,
    progress: videoProgress,
    usage: videoUsage,
  } = useVideoGeneration();

  // Synchronous lock to prevent double-click triggering multiple generations
  // React state updates are async, so useRef is needed for immediate guard
  const generationLockRef = useRef(false);

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

  // Pending input from suggestion chips
  const pendingInput = usePendingInput();
  const setPendingInput = useSetPendingInput();
  useEffect(() => {
    if (pendingInput) {
      setInput(pendingInput);
      setPendingInput(null);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [pendingInput, setPendingInput]);

  const messages = useMessages();
  const geoCulturalMode = useGeoCulturalMode();
  const userLocation = useUserLocation();

  // Web Search (global toggle + UI state)
  const enableWebSearch = useWebSearchStore((s) => s.enableWebSearch);
  const setEnableWebSearch = useWebSearchStore((s) => s.setEnableWebSearch);
  const isWebSearching = useWebSearchStore((s) => s.isSearching);
  const setIsSearching = useWebSearchStore((s) => s.setIsSearching);
  const setLastResults = useWebSearchStore((s) => s.setLastResults);
  const setLastError = useWebSearchStore((s) => s.setLastError);

  // Pending action from suggestion chips (activate tool modes)
  // Deactivates all other modes before activating the selected one
  const pendingAction = usePendingAction();
  const setPendingAction = useSetPendingAction();
  useEffect(() => {
    if (!pendingAction) return;
    setPendingAction(null);

    // Reset ALL modes first to ensure exclusivity
    setImageMode(false);
    setVideoMode(false);
    setEnableWebSearch(false);
    setShowFileUpload(false);
    setShowStylePicker(false);
    setGeoCulturalMode(false);

    switch (pendingAction) {
      case 'image':
        setImageMode(true);
        break;
      case 'video':
        setVideoMode(true);
        break;
      case 'lisa':
        setShowLisaWizard(true);
        break;
      case 'web-search':
        setEnableWebSearch(true);
        break;
      case 'geocultural':
        setShowLocationDialog(true);
        break;
      case 'files':
        setShowFileUpload(true);
        break;
    }
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [pendingAction, setPendingAction, setEnableWebSearch]);

  const {
    address,
    coords,
    isLoading: isLocationLoading,
    error: locationError,
    requestLocation,
    quality,
    warnings,
    stage: locationStage,
  } = usePreciseLocation();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setInput(textarea.value);

    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${newHeight}px`;
  }, []);

  const { addMessage, updateMessage, updateMessageCitations, updateMessageWebSearchError, updateMessageLinkInfo, updateMessageGenerationState, setStreaming, setConversationId, setGeoCulturalMode, setUserLocation, startGeneration, stopGeneration } = useChatStore(
    useShallow((state) => ({
      addMessage: state.addMessage,
      updateMessage: state.updateMessage,
      updateMessageCitations: state.updateMessageCitations,
      updateMessageWebSearchError: state.updateMessageWebSearchError,
      updateMessageLinkInfo: state.updateMessageLinkInfo,
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
  const pendingProjectId = usePendingProjectId();
  const setPendingProjectId = useSetPendingProjectId();
  const setLinkFetch = useSetLinkFetch();

  const createConversationMutation = useCreateConversation();
  const { data: projects = [] } = useProjects();

  // Get pending project info for visual feedback
  const pendingProject = pendingProjectId
    ? projects.find(p => p.id === pendingProjectId)
    : null;

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

  // When location is obtained (with or without address), automatically open the map dialog
  // This allows users to confirm/adjust their position even if geocoding failed
  const prevTimestampRef = useRef<number | null>(null);
  useEffect(() => {
    if (coords && showLocationDialog && coords.timestamp !== prevTimestampRef.current) {
      prevTimestampRef.current = coords.timestamp;
      setShowLocationDialog(false);
      setShowMapDialog(true);
    }
  }, [coords, showLocationDialog]);

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
    let prompt = input.trim();
    if (!prompt || isGeneratingImage || generationLockRef.current) return;
    generationLockRef.current = true;
    const hasImageReference = Boolean(imageReferenceUrl);

    // Check if prompt needs enhancement
    const promptCheck = checkPromptNeedsEnhancement(prompt, 'image');

    // If it's a question (not suitable for generation), show error
    if (promptCheck.error) {
      addMessage({
        id: createId(),
        role: 'user',
        content: prompt,
      });
      addMessage({
        id: createId(),
        role: 'assistant',
        content: `⚠️ ${promptCheck.error}`,
      });
      generationLockRef.current = false;
      return;
    }

    // If prompt needs enhancement and we have conversation history, enhance it
    if (promptCheck.needsEnhancement && messages.length > 0) {
      try {
        const enhanceResult = await chatApi.enhancePrompt({
          prompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          type: 'image',
        });

        if (enhanceResult.wasEnhanced) {
          prompt = enhanceResult.enhancedPrompt;
        }
      } catch (error) {
        console.error('Error enhancing prompt:', error);
        // If enhancement fails but there's no context, show a helpful message
        if (messages.length === 0) {
          addMessage({
            id: createId(),
            role: 'user',
            content: prompt,
          });
          addMessage({
            id: createId(),
            role: 'assistant',
            content: `⚠️ No hay contexto de conversación para entender tu solicitud. Por favor, describe específicamente lo que quieres ver en la imagen.`,
          });
          generationLockRef.current = false;
          return;
        }
        // Otherwise continue with original prompt
      }
    } else if (promptCheck.needsEnhancement && messages.length === 0 && !hasImageReference) {
      // No context available to enhance
      addMessage({
        id: createId(),
        role: 'user',
        content: prompt,
      });
      addMessage({
        id: createId(),
        role: 'assistant',
        content: `⚠️ Por favor, describe con más detalle lo que quieres ver en la imagen. Por ejemplo: "Un atardecer en la playa con palmeras y olas suaves"`,
      });
      generationLockRef.current = false;
      return;
    }

    // Add user message showing the prompt (and reference image if using image-to-image)
    const userMessageId = createId();
    const assistantMessageId = createId();
    const userContent = imageReferenceUrl
      ? `${prompt}\n\n![Imagen de referencia](${imageReferenceUrl})`
      : prompt;

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

    try {
    // Create conversation if needed
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      try {
        const title = prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt;
        const conversation = await createConversationMutation.mutateAsync({
          title,
          projectId: pendingProjectId || undefined,
        });
        currentConversationId = conversation.id;
        setConversationId(conversation.id);
        if (pendingProjectId) setPendingProjectId(null);
      } catch (error) {
        console.error('Error creating conversation for image:', error);
      }
    }

    // Save user message to database
    let savedAssistantMessageId: string | null = null;
    if (currentConversationId) {
      try {
        await conversationsApi.createMessage(currentConversationId, {
          role: 'user',
          content: userContent,
        });
      } catch (error) {
        console.error('Error saving user message:', error);
      }

      // Save generating placeholder to DB so it persists on reload
      try {
        const res = await conversationsApi.createMessage(currentConversationId, {
          role: 'assistant',
          content: '⏳',
          metadata: JSON.stringify({
            generationState: { type: 'image', status: 'generating' }
          }),
        });
        savedAssistantMessageId = res.message?.id || null;
      } catch (error) {
        console.error('Error saving generating placeholder:', error);
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
            referenceImageUrl: imageReferenceUrl || undefined,
            imageStrength: imageReferenceUrl ? imageStrength : undefined,
            galleryOptions: imageGalleryOptions,
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
          referenceImageUrl: imageReferenceUrl || undefined,
          imageStrength: imageReferenceUrl ? imageStrength : undefined,
          galleryOptions: imageGalleryOptions,
        });

    let assistantContent: string;
    if (result.success) {
      assistantContent = `![Imagen generada](${result.url})`;
      updateMessage(assistantMessageId, () => assistantContent);
      updateMessageGenerationState(assistantMessageId, { type: 'image', status: 'completed' });
    } else {
      assistantContent = `❌ ${result.error}`;
      updateMessage(assistantMessageId, () => assistantContent);
      updateMessageGenerationState(assistantMessageId, { type: 'image', status: 'error' });
    }

    // Update the saved message in DB with final content (instead of creating a second one)
    if (currentConversationId && savedAssistantMessageId) {
      try {
        await conversationsApi.updateMessage(currentConversationId, {
          messageId: savedAssistantMessageId,
          content: assistantContent,
          metadata: JSON.stringify({
            generationState: { type: 'image', status: result.success ? 'completed' : 'error' }
          }),
        });
        queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
        queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      } catch (error) {
        console.error('Error updating assistant message:', error);
      }
    } else if (currentConversationId) {
      // Fallback: create if update wasn't possible
      try {
        await conversationsApi.createMessage(currentConversationId, {
          role: 'assistant',
          content: assistantContent,
          metadata: JSON.stringify({
            generationState: { type: 'image', status: result.success ? 'completed' : 'error' }
          }),
        });
        queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
        queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
    }
    } finally {
      setStreaming(false);
      stopGeneration();
      generationLockRef.current = false;
    }
  }, [input, imageSize, imageQuality, imageStylePreset, imageReferenceUrl, imageStrength, imageGalleryOptions, generateImage, generateWithStreaming, isGeneratingImage, addMessage, updateMessage, updateMessageGenerationState, setStreaming, startGeneration, stopGeneration, imageUsage, conversationId, createConversationMutation, setConversationId, queryClient, pendingProjectId, setPendingProjectId, messages]);

  // Handle video generation
  const handleGenerateVideo = useCallback(async () => {
    let prompt = input.trim();
    if (!prompt) return;
    if (isGeneratingVideo || generationLockRef.current) return;
    generationLockRef.current = true;
    const hasVideoReference = videoModeType === 'image-to-video' && Boolean(videoImageUrl);

    // Validate image-to-video mode
    if (videoModeType === 'image-to-video' && !videoImageUrl) {
      addMessage({
        id: createId(),
        role: 'assistant',
        content: '⚠️ Sube una imagen primero para el modo imagen a video.',
      });
      generationLockRef.current = false;
      return;
    }

    // Pre-check plan limitations before adding messages to chat
    if (videoUsage) {
      let planError: string | null = null;
      if (videoModeType && !videoUsage.allowedModes.includes(videoModeType)) {
        planError = 'Tu plan actual no incluye este modo de generación.';
      } else if (videoDuration && !videoUsage.allowedDurations.includes(videoDuration)) {
        planError = 'Tu plan actual no permite esta duración de video.';
      } else if (videoUsage.remainingToday <= 0) {
        planError = 'Has alcanzado el límite diario de generación de videos.';
      } else if (videoUsage.remainingMonth <= 0) {
        planError = 'Has alcanzado el límite mensual de generación de videos.';
      }
      if (planError) {
        setPlanUpgradeMessage(planError);
        generationLockRef.current = false;
        return;
      }
    }

    // Check if prompt needs enhancement
    const promptCheck = checkPromptNeedsEnhancement(prompt, 'video');

    // If it's a question (not suitable for generation), show error
    if (promptCheck.error) {
      addMessage({
        id: createId(),
        role: 'user',
        content: prompt,
      });
      addMessage({
        id: createId(),
        role: 'assistant',
        content: `⚠️ ${promptCheck.error}`,
      });
      generationLockRef.current = false;
      return;
    }

    // If prompt needs enhancement and we have conversation history, enhance it
    if (promptCheck.needsEnhancement && messages.length > 0) {
      try {
        const enhanceResult = await chatApi.enhancePrompt({
          prompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          type: 'video',
        });

        if (enhanceResult.wasEnhanced) {
          prompt = enhanceResult.enhancedPrompt;
        }
      } catch (error) {
        console.error('Error enhancing prompt:', error);
        // If enhancement fails but there's no context, show a helpful message
        if (messages.length === 0) {
          addMessage({
            id: createId(),
            role: 'user',
            content: prompt,
          });
          addMessage({
            id: createId(),
            role: 'assistant',
            content: `⚠️ No hay contexto de conversación para entender tu solicitud. Por favor, describe específicamente lo que quieres ver en el video.`,
          });
          generationLockRef.current = false;
          return;
        }
        // Otherwise continue with original prompt
      }
    } else if (promptCheck.needsEnhancement && messages.length === 0 && !hasVideoReference) {
      // No context available to enhance
      addMessage({
        id: createId(),
        role: 'user',
        content: prompt,
      });
      addMessage({
        id: createId(),
        role: 'assistant',
        content: `⚠️ Por favor, describe con más detalle lo que quieres ver en el video. Por ejemplo: "Un dron volando sobre montañas nevadas al atardecer"`,
      });
      generationLockRef.current = false;
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

    let progressInterval: ReturnType<typeof setInterval> | null = null;
    try {
    // Create conversation if needed
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      try {
        const title = prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt;
        const conversation = await createConversationMutation.mutateAsync({
          title,
          projectId: pendingProjectId || undefined,
        });
        currentConversationId = conversation.id;
        setConversationId(conversation.id);
        if (pendingProjectId) setPendingProjectId(null);
      } catch (error) {
        console.error('Error creating conversation for video:', error);
      }
    }

    // Save user message to database
    if (currentConversationId) {
      try {
        await conversationsApi.createMessage(currentConversationId, {
          role: 'user',
          content: userContent,
        });
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // Update message with progress using ref to get latest value
    progressInterval = setInterval(() => {
      const currentProgress = videoProgressRef.current;
      if (currentProgress) {
        updateMessage(assistantMessageId, () => currentProgress);
      }
    }, 1000);

    const result = await generateVideo(prompt, {
      mode: videoModeType,
      imageUrl: videoModeType === 'image-to-video' ? videoImageUrl : undefined,
      duration: videoDuration,
      aspectRatio: videoAspectRatio,
      generateAudio: true,
      conversationId: currentConversationId || undefined,
      galleryOptions: videoGalleryOptions,
    });

    clearInterval(progressInterval);
    progressInterval = null;

    let assistantContent: string = '';
    let skipSave = false;
    if (result.success) {
      assistantContent = `Video en proceso de generación. Puedes cerrar esta ventana y regresar más tarde.`;
      updateMessage(assistantMessageId, () => assistantContent);
      updateMessageGenerationState(assistantMessageId, {
        type: 'video',
        status: 'generating',
        jobId: result.jobId,
      });
    } else {
      // Check if error is plan-related → show upgrade banner instead of inline error
      const isPlanError = result.error && (
        result.error.includes('plan') ||
        result.error.includes('límite') ||
        result.error.includes('duración') ||
        result.error.includes('modo de generación')
      );
      if (isPlanError) {
        updateMessage(assistantMessageId, () => '');
        updateMessageGenerationState(assistantMessageId, { type: 'video', status: 'error' });
        setPlanUpgradeMessage(result.error || 'Tu plan actual no permite esta acción.');
        skipSave = true;
      } else {
        assistantContent = `❌ ${result.error}`;
        updateMessage(assistantMessageId, () => assistantContent);
        updateMessageGenerationState(assistantMessageId, { type: 'video', status: 'error' });
      }
    }

    // Save assistant message to database with metadata including jobId
    if (currentConversationId && !skipSave) {
      try {
        await conversationsApi.createMessage(currentConversationId, {
          role: 'assistant',
          content: assistantContent,
          metadata: JSON.stringify({
            generationState: {
              type: 'video',
              status: result.success ? 'generating' : 'error',
              jobId: result.success ? result.jobId : undefined,
            }
          }),
        });
        queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
        queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
    }
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setStreaming(false);
      stopGeneration();
      generationLockRef.current = false;
    }
  }, [input, videoModeType, videoImageUrl, videoDuration, videoAspectRatio, videoGalleryOptions, generateVideo, isGeneratingVideo, addMessage, updateMessage, updateMessageGenerationState, setStreaming, startGeneration, stopGeneration, conversationId, createConversationMutation, setConversationId, queryClient, pendingProjectId, setPendingProjectId, messages, videoUsage, router]);

  const submitMessage = useCallback(
    async (event?: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>) => {
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
      if (isStreaming || generationLockRef.current) return;

      if (attachments.length > 0 && !value) {
        alert('Por favor escribe un mensaje para enviar junto con los archivos adjuntos');
        return;
      }

      if (!value) return;

      generationLockRef.current = true;

      const userMessageId = createId();
      const assistantMessageId = createId();
      // IMPORTANT: Only send {role, content} to the backend. The UI store messages include
      // extra fields (attachments, generationState, citations, etc.) that the backend DTO rejects.
      const payloadMessages = messages
        .filter((msg) => msg.content.trim().length > 0)
        .map((msg) => ({ role: msg.role, content: msg.content } as const));

      addMessage({
        id: userMessageId,
        role: 'user',
        content: value,
        attachments: attachments.length > 0 ? attachments : undefined
      });
      addMessage({ id: assistantMessageId, role: 'assistant', content: '' });
      // Clear per-message web search state for the new assistant message.
      updateMessageCitations(assistantMessageId, null);
      updateMessageWebSearchError(assistantMessageId, null);
      updateMessageLinkInfo(assistantMessageId, null);
      setInput('');
      setStreaming(true);

      const detectedUrl = extractFirstUrl(value);
      if (detectedUrl) {
        setLinkFetch({
          url: detectedUrl,
          type: getLinkTypeFromUrl(detectedUrl),
          status: 'fetching',
        });
      } else {
        setLinkFetch(null);
      }

      let currentConversationId = conversationId;
      let assistantContent = '';
      let geoCulturalContent: (GeoCulturalAnalysisText & Record<string, unknown>) | null = null;
      let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

      try {
        // Web Search UI state (shows spinner on the toggle)
        setLastError(null);
        setLastResults(null);
        setIsSearching(enableWebSearch);

        if (!currentConversationId) {
          try {
            const title =
              value.length > 50 ? value.substring(0, 50).trim() + '...' : value;

            const conversation = await createConversationMutation.mutateAsync({
              title,
              projectId: pendingProjectId || undefined,
            });

            currentConversationId = conversation.id;
            setConversationId(conversation.id);
            if (pendingProjectId) setPendingProjectId(null);
          } catch (error) {
            console.error('Error creating conversation:', error);
          }
        }

        const freshGeoCulturalContext = geoCulturalMode && userLocation
          ? { ...userLocation, timestamp: Date.now() }
          : null;

        const response = await chatApi.stream({
          message: value,
          enableWebSearch,
          webSearchMaxResults: enableWebSearch ? 5 : undefined,
          messages: payloadMessages,
          conversationId: currentConversationId || undefined,
          geoCulturalContext: freshGeoCulturalContext || undefined,
          attachmentIds: attachments.map(a => a.id),
        });

        setAttachments([]);
        setShowFileUpload(false);

        if (!response.body) throw new Error('Response body is missing.');
        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const processBuffer = () => {
          let boundaryMatch = buffer.match(/\r?\n\r?\n/);
          let boundary = boundaryMatch?.index ?? -1;
          while (boundary !== -1) {
            const chunk = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + (boundaryMatch?.[0].length ?? 2));
            const event = parseSSEChunk(chunk);
            if (event) {
              if (event.event === 'response.start' || event.event === 'geocultural.start') {
                const linkInfo = (event.data as { linkInfo?: LinkResolvedResponse | null })?.linkInfo;
                if (linkInfo) {
                  if (detectedUrl) {
                    updateMessageLinkInfo(assistantMessageId, {
                      type: linkInfo.linkType,
                      url: detectedUrl,
                    });
                  }
                  setLinkFetch({
                    url: detectedUrl || '',
                    type: linkInfo.linkType,
                    status: 'resolved',
                    info: linkInfo,
                  });
                } else {
                  updateMessageLinkInfo(assistantMessageId, null);
                  setLinkFetch(null);
                }
              }

              if (event.event === 'websearch.results') {
                const results = (event.data as { results?: unknown })?.results;
                if (Array.isArray(results)) {
                  updateMessageCitations(assistantMessageId, results as WebSearchResult[]);
                  setLastResults(results as WebSearchResult[]);
                }
                setIsSearching(false);
              } else if (event.event === 'websearch.error') {
                const message = (event.data as { message?: unknown })?.message;
                const errorText = typeof message === 'string' ? message : 'Web search unavailable';
                updateMessageWebSearchError(assistantMessageId, errorText);
                setLastError(errorText);
                setIsSearching(false);
              } else if (geoCulturalMode) {
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
            boundaryMatch = buffer.match(/\r?\n\r?\n/);
            boundary = boundaryMatch?.index ?? -1;
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

        // Invalidate queries to refresh sidebar and conversation details
        // (Messages are saved by the backend in /api/v1/chat endpoint)
        if (currentConversationId) {
          queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
          queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });

          // Background fact extraction
          conversationsApi.extractFacts(currentConversationId)
            .catch(err => console.debug('Background fact extraction:', err instanceof Error ? err.message : 'error'));

          // Save geocultural context
          if (freshGeoCulturalContext) {
            conversationsApi.update(currentConversationId, {
              geoCulturalContext: JSON.stringify(freshGeoCulturalContext),
            }).catch(err => console.debug('Background geocultural context save:', err instanceof Error ? err.message : 'error'));
          }
        }
        } catch (err) {
          console.error('[Chat] Error during message submission:', err);

        // Keep partial content if we received any during streaming
        if (assistantContent && assistantContent.length > 0) {
          console.log('[Chat] Keeping partial content despite error');
          // Invalidate to sync with whatever the backend saved
          if (currentConversationId) {
            queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
            queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
          }
        } else {
          // Use userMessage from ApiError for user-friendly error messages
          const message = err instanceof ApiError
            ? err.userMessage
            : err instanceof Error
              ? err.message
              : 'Ocurrió un problema al contactar con el asistente.';
          updateMessage(assistantMessageId, () => message);
        }
      } finally {
        // Cerrar el stream reader para liberar recursos
        if (reader) {
          reader.cancel().catch(() => {});
        }
        setStreaming(false);
        setIsSearching(false);
        setLinkFetch(null);
        generationLockRef.current = false;
      }
    },
    [
      addMessage,
      input,
      isStreaming,
      messages,
      setStreaming,
      updateMessage,
      updateMessageCitations,
      updateMessageWebSearchError,
      updateMessageLinkInfo,
      conversationId,
      setConversationId,
      createConversationMutation,
      queryClient,
      geoCulturalMode,
      userLocation,
      attachments,
      setAttachments,
      setShowFileUpload,
      imageMode,
      handleGenerateImage,
      videoMode,
      handleGenerateVideo,
      pendingProjectId,
      setPendingProjectId,
      enableWebSearch,
      setIsSearching,
      setLastError,
      setLastResults,
      setLinkFetch,
    ],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter envía el mensaje, Enter solo hace nueva línea
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
    // Enter sin Shift = comportamiento normal (nueva línea)
  };

  // Handle paste for images - allows pasting images as reference
  const [isPastingImage, setIsPastingImage] = useState(false);
  const handlePaste = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || isPastingImage) return;

    // Find image item in clipboard
    let imageFile: File | null = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        imageFile = items[i].getAsFile();
        break;
      }
    }

    if (!imageFile) return; // No image found, let default paste behavior happen

    e.preventDefault(); // Prevent default paste behavior for images
    setIsPastingImage(true);

    try {
      // Upload based on current mode
      if (videoMode && videoModeType === 'image-to-video') {
        // Upload for video generation
        const data = await videoGenApi.uploadImage(imageFile);
        setVideoImageUrl(data.imageUrl);
      } else {
        // Upload as image reference (for image mode or to activate it)
        const data = await imageGenApi.uploadReference(imageFile);

        if (!imageMode) {
          // Activate image mode if not already active
          setImageMode(true);
          setVideoMode(false);
          setShowFileUpload(false);
          setShowStylePicker(false);
        }
        setImageReferenceUrl(data.imageUrl);
      }
    } catch (error) {
      console.error('Error uploading pasted image:', error);
    } finally {
      setIsPastingImage(false);
    }
  }, [imageMode, videoMode, videoModeType, isPastingImage]);

  const toggleImageMode = useCallback(() => {
    setImageMode((prev) => !prev);
    setVideoMode(false);
    setShowFileUpload(false);
    setShowStylePicker(false);
    setEnableWebSearch(false);
    setGeoCulturalMode(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [setEnableWebSearch, setGeoCulturalMode]);

  const toggleVideoMode = useCallback(() => {
    setVideoMode((prev) => !prev);
    setImageMode(false);
    setShowFileUpload(false);
    setShowStylePicker(false);
    setEnableWebSearch(false);
    setGeoCulturalMode(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [setEnableWebSearch, setGeoCulturalMode]);

  const openLisaWizard = useCallback(() => {
    setShowLisaWizard(true);
    setImageMode(false);
    setVideoMode(false);
    setShowFileUpload(false);
    setShowStylePicker(false);
    setEnableWebSearch(false);
    setGeoCulturalMode(false);
  }, [setEnableWebSearch, setGeoCulturalMode]);

  // Handle LISA wizard generation
  const handleLisaGenerate = useCallback(async (data: {
    prompt: string;
    contentType: 'video' | 'image';
    aspectRatio: '16:9' | '9:16' | '1:1';
    duration?: '5' | '10';
    visualStyle?: string;
  }) => {
    if (generationLockRef.current) return;
    generationLockRef.current = true;
    setIsLisaGenerating(true);
    setShowLisaWizard(false);

    const userMessageId = createId();
    const assistantMessageId = createId();
    const isVideo = data.contentType === 'video';
    const userContent = data.prompt;

    // Add user message to UI immediately
    addMessage({
      id: userMessageId,
      role: 'user',
      content: userContent,
    });

    // Add assistant message with generation state
    addMessage({
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      generationState: { type: data.contentType, status: 'generating' },
    });

    setStreaming(true);
    startGeneration(data.contentType, assistantMessageId);

    // Create conversation if needed
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      try {
        const title = data.prompt.length > 50
          ? `${data.prompt.substring(0, 50)}...`
          : data.prompt;
        const conversation = await createConversationMutation.mutateAsync({
          title,
          projectId: pendingProjectId || undefined,
        });
        currentConversationId = conversation.id;
        setConversationId(conversation.id);
        if (pendingProjectId) setPendingProjectId(null);
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }

    // Save user message to backend
    if (currentConversationId) {
      try {
        await conversationsApi.createMessage(currentConversationId, {
          role: 'user',
          content: userContent,
        });
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }

    // Helper to save assistant message with generation state
    const saveAssistantMessage = async (content: string, generationState: { type: 'video' | 'image'; status: 'generating' | 'completed' | 'error'; jobId?: string }) => {
      if (!currentConversationId) return;
      try {
        await conversationsApi.createMessage(currentConversationId, {
          role: 'assistant',
          content,
          metadata: JSON.stringify({ generationState }),
        });
        // Invalidate to sync with backend
        queryClient.invalidateQueries({ queryKey: conversationKeys.detail(currentConversationId) });
        queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      } catch (error) {
        console.error('Error saving assistant message:', error);
      }
    };

    try {
      if (isVideo) {
        // Generate video
        const result = await generateVideo(data.prompt, {
          mode: 'text-to-video',
          duration: data.duration || '5',
          aspectRatio: data.aspectRatio,
          generateAudio: true,
        });

        if (result.success) {
          const generatingContent = 'Video en proceso de generación. Puedes cerrar esta ventana y regresar más tarde.';
          const generationState = {
            type: 'video' as const,
            status: 'generating' as const,
            jobId: result.jobId,
          };

          // Update UI
          updateMessage(assistantMessageId, () => generatingContent);
          updateMessageGenerationState(assistantMessageId, generationState);

          // CRITICAL: Save to backend with jobId so polling resumes on page reload
          await saveAssistantMessage(generatingContent, generationState);
        } else {
          const isPlanError = result.error && (
            result.error.includes('plan') ||
            result.error.includes('límite') ||
            result.error.includes('duración') ||
            result.error.includes('modo de generación')
          );
          if (isPlanError) {
            updateMessage(assistantMessageId, () => '');
            updateMessageGenerationState(assistantMessageId, { type: 'video', status: 'error' });
            setPlanUpgradeMessage(result.error || 'Tu plan actual no permite esta acción.');
          } else {
            const errorContent = `❌ ${result.error}`;
            const errorState = { type: 'video' as const, status: 'error' as const };
            updateMessage(assistantMessageId, () => errorContent);
            updateMessageGenerationState(assistantMessageId, errorState);
            await saveAssistantMessage(errorContent, errorState);
          }
        }
      } else {
        // Generate image
        const result = await generateImage(data.prompt, {
          quality: 'medium',
          size: data.aspectRatio === '1:1' ? '1024x1024' : data.aspectRatio === '9:16' ? '1024x1536' : '1536x1024',
          stylePreset: data.visualStyle || 'auto',
        });

        if (result.success) {
          const successContent = `![Imagen generada](${result.url})`;
          const successState = { type: 'image' as const, status: 'completed' as const };
          updateMessage(assistantMessageId, () => successContent);
          updateMessageGenerationState(assistantMessageId, successState);
          await saveAssistantMessage(successContent, successState);
        } else {
          const errorContent = `❌ ${result.error}`;
          const errorState = { type: 'image' as const, status: 'error' as const };
          updateMessage(assistantMessageId, () => errorContent);
          updateMessageGenerationState(assistantMessageId, errorState);
          await saveAssistantMessage(errorContent, errorState);
        }
      }
    } catch (error) {
      console.error('LISA generation error:', error);
      const errorContent = '❌ Error al generar contenido';
      const errorState = { type: data.contentType, status: 'error' as const };
      updateMessage(assistantMessageId, () => errorContent);
      updateMessageGenerationState(assistantMessageId, errorState);
      if (currentConversationId) {
        await saveAssistantMessage(errorContent, errorState);
      }
    } finally {
      setIsLisaGenerating(false);
      setStreaming(false);
      stopGeneration();
      generationLockRef.current = false;
    }
  }, [
    conversationId,
    createConversationMutation,
    setConversationId,
    pendingProjectId,
    setPendingProjectId,
    addMessage,
    updateMessage,
    updateMessageGenerationState,
    setStreaming,
    startGeneration,
    stopGeneration,
    generateVideo,
    generateImage,
    queryClient,
  ]);

  const isLoading = isStreaming || isGeneratingImage || isGeneratingVideo || isTranscribing || isLisaGenerating || isPastingImage;

  return (
    <>
      {/* LISA Wizard Dialog */}
      <LisaWizardDialog
        isOpen={showLisaWizard}
        onClose={() => setShowLisaWizard(false)}
        onGenerate={handleLisaGenerate}
        isGenerating={isLisaGenerating}
      />

      <LocationPermissionDialog
        isOpen={showLocationDialog}
        onClose={handleCloseDialog}
        onAllow={handleAllowLocation}
        error={locationError}
        isLoading={isLocationLoading}
        address={address}
        quality={quality}
        warnings={warnings}
        stage={locationStage}
      />

      {coords && (
        <LocationMapConfirmDialog
          isOpen={showMapDialog}
          onClose={handleCloseMapDialog}
          onConfirm={handleConfirmMapLocation}
          initialLocation={{
            lat: coords.lat,
            lng: coords.lng,
            accuracy: coords.accuracy,
          }}
          initialAddress={address || {
            // Placeholder address when geocoding failed
            // The map will geocode when user confirms/moves marker
            lat: coords.lat,
            lng: coords.lng,
            accuracy: coords.accuracy,
            timestamp: coords.timestamp,
            formattedAddress: 'Ubicación aproximada - ajusta el marcador',
            shortAddress: 'Ajusta tu ubicación',
            street: null,
            streetNumber: null,
            neighborhood: null,
            city: null,
            state: null,
            country: null,
            countryCode: null,
            postalCode: null,
            placeId: null,
            sublocalityLevel1: null,
            sublocalityLevel2: null,
            administrativeAreaLevel2: null,
            locationType: null,
            quality: coords.accuracy <= 100 ? 'fair' : 'poor',
            warnings: ['Precisión baja. Por favor, ajusta el marcador a tu ubicación exacta.'],
            note: 'Geocodificación pendiente',
          }}
        />
      )}

      <div className="space-y-3">
        {/* Pending Project Indicator - Elegant minimal design */}
        {pendingProject && (
          <div className="flex items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: `${pendingProject.color}08`,
                border: `1px solid ${pendingProject.color}20`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: pendingProject.color || '#FF8B3D' }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: pendingProject.color || '#FF8B3D' }}
              >
                {pendingProject.name}
              </span>
              <button
                onClick={() => setPendingProjectId(null)}
                className="ml-0.5 p-0.5 rounded-full hover:bg-black/5 transition-colors"
                title="Cancelar"
              >
                <X className="size-3 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {geoCulturalMode && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-r from-[#FF8B3D]/10 to-[#d9753e]/10 rounded-2xl border border-[#FF8B3D]/20">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <MapPin className="size-4 text-[#FF8B3D] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-[#FF8B3D]">
                  {!userLocation && isLocationLoading
                    ? 'Obteniendo ubicación precisa...'
                    : userLocation && address
                    ? 'GeoCultural Mode activo ✓'
                    : userLocation
                    ? 'GeoCultural Mode activo'
                    : 'Obteniendo ubicación...'}
                </span>
                {address && address.neighborhood && (
                  <span className="text-xs text-[#FF8B3D]/70 truncate">
                    {[address.neighborhood, address.city].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>
            {coords && coords.accuracy && quality && (
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium ${
                  quality === 'excellent' ? 'text-[#FF8B3D]' :
                  quality === 'good' ? 'text-blue-600' :
                  quality === 'fair' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {quality === 'excellent' ? '📍 Excelente' :
                   quality === 'good' ? '📍 Buena' :
                   quality === 'fair' ? '📍 Regular' :
                   '📍 Baja'}
                </span>
                <span className="text-xs text-[#FF8B3D]/70 font-medium">
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
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 className="size-5 text-[#FF8B3D] animate-spin" />
                <p className="text-sm text-[#999]">Preparando...</p>
              </div>
            )}
          </div>
        )}

        {/* Plan Upgrade Banner */}
        {planUpgradeMessage && (
          <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 mx-auto max-w-lg">
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 shadow-sm">
              <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-[#FF8B3D] to-[#e67a2e] shrink-0">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {planUpgradeMessage}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Desbloquea más funciones mejorando tu plan
                </p>
              </div>
              <button
                onClick={() => {
                  setPlanUpgradeMessage(null);
                  router.push('/payment');
                }}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#FF8B3D] to-[#e67a2e] rounded-full hover:opacity-90 transition-opacity"
              >
                Mejorar plan
              </button>
              <button
                onClick={() => setPlanUpgradeMessage(null)}
                className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="size-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={submitMessage}
          className={`rounded-[2rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative transition-all duration-500 ${
            imageMode
              ? 'border-0 image-mode-glow'
              : videoMode
              ? 'border-0 video-mode-glow'
              : enableWebSearch
              ? 'border-0 web-search-glow'
              : 'border border-black/5'
          }`}
        >
          {/* Web Search indicator - mirrors "mode active" styling (like image/video) */}
          {enableWebSearch && (
            <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-2xl border border-sky-200/60 bg-gradient-to-r from-sky-50 to-emerald-50">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isWebSearching ? (
                    <Loader2 className="size-4 animate-spin text-sky-700 shrink-0" />
                  ) : (
                    <Globe className="size-4 text-sky-700 shrink-0" />
                  )}

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-sky-900">
                      {isWebSearching ? 'Buscando en la web...' : 'Web Search activo ✓'}
                    </span>
                    <span className="text-xs text-sky-900/60 truncate">
                      La respuesta incluirá citas como [1], [2], [3]
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEnableWebSearch(false)}
                  className="shrink-0 p-1.5 rounded-full hover:bg-black/5 transition-colors"
                  title="Desactivar Web Search"
                >
                  <X className="size-4 text-sky-700/70 hover:text-sky-900" />
                </button>
              </div>
            </div>
          )}

          {/* Image mode controls - Beautiful redesign */}
          {imageMode && (
            <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-gray-100">
              {/* First row: Reference upload + Style + Close */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Reference image upload - always visible */}
                <div className="flex-shrink-0">
                  <ImageReferenceUpload
                    onImageUploaded={setImageReferenceUrl}
                    onImageRemoved={() => setImageReferenceUrl('')}
                    currentImageUrl={imageReferenceUrl}
                    disabled={isLoading}
                  />
                </div>

                {/* Style preset selector button */}
                <div className="relative flex-shrink-0 min-w-0">
                  <button
                    type="button"
                    onClick={() => setShowStylePicker(!showStylePicker)}
                    disabled={isLoading}
                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl transition-all ${
                      showStylePicker
                        ? `${selectedPreset.bgColor} ${selectedPreset.borderColor} border`
                        : 'bg-gray-100 hover:bg-gray-200'
                    } disabled:opacity-40`}
                  >
                    <span className="text-sm sm:text-base">{selectedPreset.icon}</span>
                    <span className={`text-[10px] sm:text-sm font-medium truncate max-w-[50px] sm:max-w-none ${showStylePicker ? selectedPreset.color : 'text-gray-700'}`}>
                      {selectedPreset.name}
                    </span>
                    <ChevronDown className={`size-3 transition-transform ${showStylePicker ? 'rotate-180' : ''} ${
                      showStylePicker ? selectedPreset.color : 'text-gray-400'
                    }`} />
                  </button>
                  {showStylePicker && (
                    <StylePresetPicker
                      availablePresets={availablePresets}
                      lockedPresets={IMAGE_STYLE_PRESETS.filter(p => p.premium && !imageUsage?.premiumStyles)}
                      selectedId={imageStylePreset}
                      hasPremiumStyles={!!imageUsage?.premiumStyles}
                      onSelect={(id) => {
                        setImageStylePreset(id);
                        setShowStylePicker(false);
                      }}
                      onClose={() => setShowStylePicker(false)}
                    />
                  )}
                </div>

                {/* Strength slider - only shown when reference image is uploaded */}
                {imageReferenceUrl && (
                  <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-xl px-2 py-1.5 flex-shrink-0">
                    <Blend className="size-3 text-gray-500 hidden sm:block" />
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={imageStrength}
                      onChange={(e) => setImageStrength(parseFloat(e.target.value))}
                      disabled={isLoading}
                      className="w-10 sm:w-16 h-1 accent-[#FF8B3D]"
                    />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-600">
                      {Math.round(imageStrength * 100)}%
                    </span>
                  </div>
                )}

                {/* Close button - always at end */}
                <button
                  type="button"
                  onClick={() => setImageMode(false)}
                  className="ml-auto p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Second row: Size + Quality */}
              <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                {/* Size selector - hidden when using reference image */}
                {!imageReferenceUrl && (
                  <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5 sm:p-1">
                    {SIZE_OPTIONS.filter(s => imageUsage?.allowedSizes?.includes(s.value) || s.value === '1024x1024').map((size) => (
                      <button
                        key={size.value}
                        type="button"
                        onClick={() => setImageSize(size.value)}
                        disabled={isLoading}
                        className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium transition ${
                          imageSize === size.value
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        } disabled:opacity-40`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Quality selector */}
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-0.5 sm:p-1">
                  {QUALITY_OPTIONS.filter(q => imageUsage?.allowedQualities?.includes(q.value) || q.value === 'low').map((q) => {
                    const isSelected = imageQuality === q.value;
                    return (
                      <button
                        key={q.value}
                        type="button"
                        onClick={() => setImageQuality(q.value)}
                        disabled={isLoading}
                        className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-150 ${
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

                {/* Info indicator inline */}
                {imageReferenceUrl && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#FF8B3D]">
                    <Blend className="size-3" />
                    <span>Img a img</span>
                  </div>
                )}
                {imageUsage?.streamingEnabled && !imageReferenceUrl && (
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 bg-[#FF8B3D] rounded-full animate-pulse" />
                    <span className="hidden sm:inline">Vista previa</span>
                  </div>
                )}
              </div>

              {/* Usage and info */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Image className="size-3" />
                  <span>Continuum Image</span>
                </div>
                {imageUsage && (
                  <span className="text-xs text-gray-400">
                    {imageUsage.remainingToday}/{imageUsage.dailyLimit} hoy
                  </span>
                )}
              </div>

              {/* Gallery Options */}
              <div className="mt-3">
                <GalleryOptionsPanel
                  options={imageGalleryOptions}
                  onChange={setImageGalleryOptions}
                  mediaType="image"
                  disabled={isLoading}
                  compact
                />
              </div>
            </div>
          )}

          {/* Video mode controls */}
          {videoMode && (
            <div className="px-4 pt-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Mode selector: Text or Image */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {VIDEO_MODES.map((mode) => {
                    const isAllowed = videoUsage?.allowedModes?.includes(mode.value) ?? true;
                    const isSelected = videoModeType === mode.value;

                    if (!isAllowed) {
                      // Show locked mode
                      return (
                        <div
                          key={mode.value}
                          className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed"
                          title="Actualiza tu plan para desbloquear"
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
                    onImageUploaded={(url) => setVideoImageUrl(url)}
                    onImageRemoved={() => setVideoImageUrl('')}
                    currentImageUrl={videoImageUrl}
                    disabled={isLoading}
                  />
                )}

                {/* Aspect ratio selector */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                  {VIDEO_ASPECT_RATIOS.map((ratio) => {
                    const isAllowed = videoUsage?.allowedAspectRatios?.includes(ratio.value) ?? true;
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
                    const isAllowed = videoUsage?.allowedDurations?.includes(dur.value) ?? true;
                    const isSelected = videoDuration === dur.value;

                    if (!isAllowed) {
                      return (
                        <div
                          key={dur.value}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 cursor-not-allowed"
                          title="Actualiza tu plan para desbloquear"
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
                            ? 'bg-white text-[#FF8B3D] shadow-sm'
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
                <div className="flex items-center gap-2 mt-2 text-xs text-[#FF8B3D]">
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

              {/* Gallery Options */}
              <div className="mt-3">
                <GalleryOptionsPanel
                  options={videoGalleryOptions}
                  onChange={setVideoGalleryOptions}
                  mediaType="video"
                  disabled={isLoading}
                  compact
                />
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
                    enableWebSearch || geoCulturalMode || showFileUpload || attachments.length > 0 || imageMode || videoMode
                      ? 'bg-[#FF8B3D] text-white'
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
                        <Clock className="size-3" />
                        <span>Próximamente</span>
                      </div>
                    </div>
                  )}
                  <Image className="mr-2 size-4" />
                  <span className="flex-1">Generar imagen</span>
                  {imageMode && FEATURE_FLAGS.imageGeneration && <Check className="size-4 text-[#FF8B3D]" />}
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
                        <Clock className="size-3" />
                        <span>Próximamente</span>
                      </div>
                    </div>
                  )}
                  <Video className="mr-2 size-4" />
                  <span className="flex-1">Generar video</span>
                  {videoMode && FEATURE_FLAGS.videoGeneration && <Check className="size-4 text-[#FF8B3D]" />}
                </DropdownMenuItem>

                {/* LISA - Editor Guiado */}
                <DropdownMenuItem
                  onClick={openLisaWizard}
                  disabled={isLoading}
                  className="cursor-pointer bg-gradient-to-r from-[#FF8B3D]/5 to-emerald-500/5"
                >
                  <Wand2 className="mr-2 size-4 text-[#FF8B3D]" />
                  <span className="flex-1 font-medium text-[#FF8B3D]">LISA - Editor Guiado</span>
                  <Zap className="size-3 text-emerald-500" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setEnableWebSearch(!enableWebSearch)}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  <Globe className="mr-2 size-4" />
                  <span className="flex-1">Web Search</span>
                  {enableWebSearch && <Check className="size-4 text-[#FF8B3D]" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLocationToggle}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  <MapPin className="mr-2 size-4" />
                  <span className="flex-1">GeoCultural</span>
                  {geoCulturalMode && <Check className="size-4 text-[#FF8B3D]" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    if (!conversationId && !isCreatingConversation) {
                      setIsCreatingConversation(true);
                      try {
                        const conversation = await createConversationMutation.mutateAsync({
                          title: 'Nueva conversación',
                          projectId: pendingProjectId || undefined,
                        });
                        setConversationId(conversation.id);
                        if (pendingProjectId) setPendingProjectId(null);
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
              onPaste={handlePaste}
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
                    <Loader2 className="size-4 animate-spin text-[#FF8B3D]" />
                    <span className="text-xs font-medium text-[#FF8B3D]">Transcribiendo...</span>
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
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-[#FF8B3D]'
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
              type="button"
              aria-label="Enviar prompt"
              onClick={(e) => {
                e.preventDefault();
                if (videoMode) {
                  handleGenerateVideo();
                } else if (imageMode) {
                  handleGenerateImage();
                } else {
                  submitMessage(e);
                }
              }}
              disabled={(!input.trim() || isLoading) && !isRecording}
              className="relative flex shrink-0 items-center justify-center rounded-full p-2.5 text-white transition disabled:cursor-not-allowed bg-[#FF8B3D] hover:bg-[#FF8B3D]/80 disabled:bg-[#FF8B3D]/40 touch-manipulation"
            >
              {(isGeneratingImage || isGeneratingVideo) ? (
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
