'use client';

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useRef,
  useState,
  memo,
} from 'react';
import { ArrowUp } from 'lucide-react';

import {
  useMessages,
  useAddMessage,
  useUpdateMessage,
  useIsStreaming,
  useSetStreaming,
  useConversationId,
  useSetConversationId,
} from '@/app/chat/store';
import { useCreateConversation } from '@/hooks/use-conversations';

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

  const messages = useMessages();
  const addMessage = useAddMessage();
  const updateMessage = useUpdateMessage();
  const isStreaming = useIsStreaming();
  const setStreaming = useSetStreaming();
  const conversationId = useConversationId();
  const setConversationId = useSetConversationId();

  const createConversationMutation = useCreateConversation();

  const submitMessage = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const value = input.trim();
      if (!value || isStreaming) return;

      const userMessageId = createId();
      const assistantMessageId = createId();
      const payloadMessages = [
        ...messages,
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

        // Guardar mensaje del usuario en Supabase
        if (currentConversationId) {
          try {
            await fetch(`/api/conversations/${currentConversationId}/messages`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: userMessageId,
                role: 'user',
                content: value,
              }),
            });
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
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error('No se pudo contactar con el asistente.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let assistantContent = '';

        const processBuffer = () => {
          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            const chunk = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const event = parseSSEChunk(chunk);
            if (event) {
              if (event.event === 'response.output_text.delta') {
                const delta = event.data?.delta ?? '';
                const snapshot = event.data?.snapshot;
                updateMessage(assistantMessageId, (prev) => {
                  const newContent = snapshot ? snapshot : prev + delta;
                  assistantContent = newContent;
                  return newContent;
                });
              } else if (event.event === 'response.failed') {
                const message =
                  event.data?.response?.error?.message ??
                  'El asistente no pudo completar la respuesta.';
                updateMessage(assistantMessageId, () => message);
                assistantContent = message;
              } else if (event.event === 'error') {
                const message =
                  event.data?.message ??
                  'Ocurrió un problema al procesar la respuesta.';
                updateMessage(assistantMessageId, () => message);
                assistantContent = message;
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

        // Guardar mensaje del asistente en Supabase
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
    ],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  return (
    <form
      onSubmit={submitMessage}
      className="flex flex-row items-center justify-between gap-3 rounded-[2rem] border border-black/5 bg-white px-4 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.08)]"
    >
      <textarea
        ref={textareaRef}
        autoFocus
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Empieza con una idea..."
        disabled={isStreaming}
        className="w-full resize-none bg-transparent text-base text-[#111111] outline-none placeholder:text-[#111111]/40 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!input.trim() || isStreaming}
        className="flex shrink-0 items-center justify-center rounded-full bg-[#00552b] p-2 text-white transition hover:bg-[#00552b]/80 disabled:cursor-not-allowed disabled:bg-[#00552b]/40"
      >
        <ArrowUp className="size-5" />
      </button>
    </form>
  );
});
