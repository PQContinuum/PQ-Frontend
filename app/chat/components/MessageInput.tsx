'use client';

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ArrowUp } from 'lucide-react';

import { useChatStore } from '@/app/chat/store';

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

export function MessageInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  const { messages, addMessage, updateMessage, isStreaming, setStreaming } =
    useChatStore();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

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

      try {
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
                updateMessage(assistantMessageId, (prev) =>
                  snapshot ? snapshot : prev + delta,
                );
              } else if (event.event === 'response.failed') {
                const message =
                  event.data?.response?.error?.message ??
                  'El asistente no pudo completar la respuesta.';
                updateMessage(assistantMessageId, () => message);
              } else if (event.event === 'error') {
                const message =
                  event.data?.message ??
                  'Ocurrió un problema al procesar la respuesta.';
                updateMessage(assistantMessageId, () => message);
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
    [addMessage, input, isStreaming, messages, setStreaming, updateMessage],
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
        className="flex shrink-0 items-center justify-center rounded-full bg-black p-2 text-white transition hover:bg-[#111111]/80 disabled:cursor-not-allowed disabled:bg-black/40"
      >
        <ArrowUp className="size-5" />
      </button>
    </form>
  );
}
